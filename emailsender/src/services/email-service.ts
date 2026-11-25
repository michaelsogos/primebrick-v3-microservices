import Handlebars from "handlebars";
import { logger, runWithSession, NatsClient } from "@primebrick/sdk";
import { BrevoClient, type BrevoEmailRequest } from "../providers/brevo.js";
import type { SendEmailRequest, SendEmailResponse } from "../controllers/nats-sub/types.js";
import { ProviderEntity, EmailTemplateEntity, SenderLogEntity } from "../domain/entities/registry.js";
import { DomainService, Filter, field, NotFoundError } from "@primebrick/dal-pg";
import { actorSession, entityActor } from "../db/entity-repo.js";

/**
 * Email execution reliability — the taken-charge state machine.
 *
 * The durable fire means "taken in charge", NOT "executed": the NATS ack
 * happens after the `pending` sender_log row exists (the row IS the work
 * item, captured verbatim in `request_payload`). Execution against Brevo
 * is asynchronous and owned by THIS service — never by the broker:
 *
 *   pending → sending → sent | failed
 *
 * Recovery: the sweeper (boot + interval) re-dispatches rows stuck in
 * `pending` (crash between accept and dispatch) and rows stuck in
 * `sending` past the staleness bound (crash mid-dispatch). The stale-
 * `sending` re-dispatch accepts a duplicate-risk over silent loss —
 * the platform doctrine ranks a lost email as the worse failure, and
 * no transport mechanism can close the crash-exactly-after-Brevo-accepted
 * window anyway.
 */

/** A row in `sending` older than this is a crashed dispatch — re-dispatch. */
const STALE_SENDING_MS = 10 * 60 * 1000;

export class EmailService extends DomainService<SenderLogEntity & Record<string, unknown>> {
  private brevoClient: BrevoClient | null = null;

  constructor(brevoClient?: BrevoClient) {
    super({
      entity: SenderLogEntity,
      actor: entityActor,
      // No list meta — sender_log is internal telemetry, never served to
      // FE; empty searchableKeys = no search surface.
      list: { searchableKeys: [], filterableKeys: new Set() },
    });
    if (brevoClient) {
      this.brevoClient = brevoClient;
    }
    // No ENV dependency — BrevoClient is constructed per-request from the
    // provider config loaded from the emailsender.providers table.
    // Admin users set up the Brevo provider (api_key, api_endpoint, etc.)
    // via the FE → POST/PUT /api/v1/providers.
  }

  /**
   * Taken-charge write — persist the work item as a `pending` sender_log
   * row carrying the full request verbatim, THEN the handler returns and
   * the durable ack can happen. The UNIQUE(request_id) constraint is the
   * domain-native dedupe backstop: a redelivered fire conflicts on insert
   * and is absorbed as already-queued (the first copy owns the execution).
   */
  async acceptSend(request: SendEmailRequest, actorId?: string): Promise<SendEmailResponse> {
    return runWithSession(actorSession(actorId ?? "system:emailsender"), async () => {
      // Provider resolution at accept time — cheap indexed read, and a
      // missing provider fails the fire visibly (transient: admin may
      // configure it, redelivery then succeeds).
      const config = await this.resolveProvider();
      try {
        const row = await this.svc.create({
          entity_uuid: request.entityUuid ?? null,
          type: "email",
          provider_uuid: config.uuid,
          status: "pending",
          request_id: request.requestId,
          request_payload: request as unknown as Record<string, unknown>,
          senders: {},
          recipients: { to: request.to, cc: request.cc, bcc: request.bcc },
        });
        return { requestId: request.requestId, success: true, logUuid: row.uuid };
      } catch (error) {
        if (error instanceof Error && /request_id_key|duplicate key/i.test(error.message)) {
          logger.info(`Duplicate send request absorbed: ${request.requestId}`, { tags: ["email-service"] });
          return { requestId: request.requestId, success: true };
        }
        throw error;
      }
    });
  }

  /**
   * Asynchronous execution — resolve template, render, dispatch to Brevo,
   * transition the row to its terminal state, publish the async outcome
   * on `emailsender.response.<requestId>`. Idempotent entry: a row not in
   * `pending` is owned elsewhere or done — skipped.
   */
  async dispatchRow(rowUuid: string, actorId?: string): Promise<void> {
    return runWithSession(actorSession(actorId ?? "system:emailsender"), async () => {
      const row = (await this.svc.find(null, {
        filters: [Filter.fieldValue(field(SenderLogEntity, "uuid"), "=", rowUuid)],
      })) as SenderLogEntity | null;
      if (!row || row.status !== "pending" || !row.request_payload) return;

      // Claim before dispatch — single-replica queue semantics make the
      // race theoretical, the sweeper is the only other writer.
      await this.svc.update(rowUuid, { status: "sending", status_changed_at: new Date() });

      const request = row.request_payload as unknown as SendEmailRequest;
      let renderedHtml: string | null = null;
      let renderedText: string | null = null;
      let templateUuid: string | null = null;
      try {
        const config = await this.resolveProvider();
        const client = this.brevoClient ?? new BrevoClient(
          config.api_key,
          config.api_endpoint ?? "https://api.brevo.com/v1",
        );
        const template = await this.resolveTemplate(request);
        templateUuid = template.uuid;
        const subject = Handlebars.compile(template.subject || "")(request.variables || {});
        const htmlContent = Handlebars.compile(template.body_html || "")(request.variables || {});
        const textContent = Handlebars.compile(template.body_text || "")(request.variables || {});
        renderedHtml = htmlContent;
        renderedText = textContent;

        const brevoRequest: BrevoEmailRequest = {
          to: request.to.map((email) => ({ email })),
          cc: request.cc?.map((email) => ({ email })),
          bcc: request.bcc?.map((email) => ({ email })),
          subject,
          htmlContent,
          textContent,
          sender: config.from_email ? { email: config.from_email, name: config.from_name || undefined } : undefined,
          replyTo: config.reply_to ? { email: config.reply_to } : undefined,
        };
        const brevoResponse = await client.sendEmail(brevoRequest);
        await this.svc.update(rowUuid, {
          status: "sent",
          provider_message_id: brevoResponse.messageId,
          template_uuid: templateUuid,
          senders: { from: config.from_email },
          interpolated_sent_message: htmlContent || textContent,
          sent_at: new Date(),
          status_changed_at: new Date(),
        });
        await this.publishOutcome(request, { requestId: request.requestId, success: true, providerMessageId: brevoResponse.messageId, logUuid: rowUuid });
      } catch (error) {
        logger.error("Error dispatching email", { tags: ["email-service"], error });
        // `interpolated_sent_message`/`template_uuid` are populated even on
        // failure (when available) — the log stays debuggable and E2E tests
        // can retrieve the rendered OTP when Brevo is faked/down.
        await this.svc.update(rowUuid, {
          status: "failed",
          template_uuid: templateUuid,
          interpolated_sent_message: renderedHtml || renderedText,
          error_message: error instanceof Error ? error.message : "Unknown error",
          status_changed_at: new Date(),
        }).catch((logError) => logger.error("Error updating failed email row", { tags: ["email-service"], error: logError }));
        await this.publishOutcome(request, {
          requestId: request.requestId,
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    });
  }

  /**
   * Sweeper — the self-reliability loop. Re-dispatches rows stuck in
   * `pending` (crash between accept and dispatch) and rows stuck in
   * `sending` past the staleness bound (crash mid-dispatch: duplicate-risk
   * accepted over silent loss, per doctrine).
   */
  async sweepPending(actorId?: string): Promise<void> {
    try {
      const pending = (await this.svc.query<SenderLogEntity>(null, {
        filters: [Filter.fieldValue(field(SenderLogEntity, "status"), "=", "pending")],
      })) as unknown as SenderLogEntity[];
      const sending = (await this.svc.query<SenderLogEntity>(null, {
        filters: [Filter.fieldValue(field(SenderLogEntity, "status"), "=", "sending")],
      })) as unknown as SenderLogEntity[];
      const staleBefore = Date.now() - STALE_SENDING_MS;
      const rows = [
        ...pending,
        ...sending.filter((r) => {
          const changed = r.status_changed_at ? new Date(r.status_changed_at).getTime() : 0;
          return changed < staleBefore;
        }),
      ];
      for (const row of rows) {
        // Stale-sending rows are reset to pending first so dispatchRow's
        // status gate accepts them.
        if (row.status === "sending") {
          await this.svc.update(row.uuid, { status: "pending" }).catch(() => {});
        }
        await this.dispatchRow(row.uuid, actorId).catch((error) =>
          logger.error("Sweep dispatch failed", { tags: ["email-service"], error }),
        );
      }
      if (rows.length > 0) {
        logger.info(`Sweeper re-dispatched ${rows.length} stuck email(s)`, { tags: ["email-service"] });
      }
    } catch (error) {
      logger.error("Sweeper iteration failed", { tags: ["email-service"], error });
    }
  }

  private async publishOutcome(request: SendEmailRequest, response: SendEmailResponse): Promise<void> {
    // The response subject is an asynchronous outcome notification — the
    // fire is durable, the response is ephemeral correlation for whoever
    // is listening (declared contract: `emailsender.response.<requestId>`).
    await NatsClient.publishEphemeralLossy(`emailsender.response.${request.requestId}`, response).catch((error) =>
      logger.error("Outcome publish failed", { tags: ["email-service"], error }),
    );
  }

  private async resolveProvider(): Promise<ProviderEntity> {
    try {
      return (await this.svcFor(ProviderEntity).find<ProviderEntity>(null, {
        filters: [Filter.fieldValue(field(ProviderEntity, "provider"), "=", "brevo")],
      }))!;
    } catch (err) {
      if (err instanceof NotFoundError) {
        throw new Error("No email configuration found for Brevo — admin must configure the Brevo provider via FE");
      }
      throw err;
    }
  }

  private async resolveTemplate(request: SendEmailRequest): Promise<EmailTemplateEntity> {
    // Request fields are camelCase (NATS contract); entity/DB columns are snake_case.
    try {
      return (await this.svcFor(EmailTemplateEntity).find<EmailTemplateEntity>(null, {
        filters: [
          Filter.fieldValue(field(EmailTemplateEntity, "code"), "=", request.templateCode),
          Filter.fieldValue(field(EmailTemplateEntity, "language_iso"), "=", request.languageIso),
        ],
      }))!;
    } catch (err) {
      if (err instanceof NotFoundError) {
        throw new Error(`Template not found: ${request.templateCode} (${request.languageIso})`);
      }
      throw err;
    }
  }

  /**
   * Legacy synchronous entry — the durable path is acceptSend + dispatchRow;
   * this composes the two for callers/tests that need the terminal outcome.
   */
  async sendEmail(request: SendEmailRequest, actorId?: string): Promise<SendEmailResponse> {
    const accepted = await this.acceptSend(request, actorId);
    if (!accepted.logUuid) return accepted;
    await this.dispatchRow(accepted.logUuid, actorId);
    const row = (await this.svc.find(null, {
      filters: [Filter.fieldValue(field(SenderLogEntity, "uuid"), "=", accepted.logUuid)],
    })) as SenderLogEntity | null;
    if (row?.status === "sent") {
      return { requestId: request.requestId, success: true, providerMessageId: row.provider_message_id, logUuid: row.uuid };
    }
    return { requestId: request.requestId, success: false, error: row?.error_message ?? "Unknown error" };
  }
}
