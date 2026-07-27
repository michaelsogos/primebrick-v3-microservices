import Handlebars from "handlebars";
import { getDal } from "../db/dal.js";
import { BrevoClient, type BrevoEmailRequest } from "../providers/brevo.js";
import type { SendEmailRequest, SendEmailResponse } from "../nats/types.js";
import { ProviderEntity, EmailTemplateEntity, SenderLogEntity } from "../domain/entities/registry.js";
import { Filter, field, NotFoundError } from "@primebrick/dal-pg";

export class EmailService {
  private brevoClient: BrevoClient | null = null;

  constructor(brevoClient?: BrevoClient) {
    if (brevoClient) {
      this.brevoClient = brevoClient;
    }
    // No ENV dependency — BrevoClient is constructed per-request from the
    // provider config loaded from the emailsender.providers table.
    // Admin users set up the Brevo provider (api_key, api_endpoint, etc.)
    // via the FE → POST/PUT /api/v1/providers.
  }

  async sendEmail(request: SendEmailRequest, actorId?: string): Promise<SendEmailResponse> {
    const dal = getDal();
    let configUuid: string | null = null;
    // Hoist rendered content + template uuid outside the try block so they are
    // available in the catch block for the failure-path sender_log row. Without
    // this, a failed Brevo send logs a row with no `interpolated_sent_message`,
    // making it impossible to debug what was actually rendered (and impossible
    // for E2E tests to retrieve the OTP from the log when Brevo is faked/down).
    let renderedHtml: string | null = null;
    let renderedText: string | null = null;
    let templateUuid: string | null = null;

    try {
      // Get email configuration from the providers table.
      // dal.find defaults to throwIfNotFound: true, so a missing config
      // throws NotFoundError — caught and re-thrown as the service's
      // existing error shape.
      let config: ProviderEntity;
      try {
        config = await dal.find(ProviderEntity, null, {
          filters: [Filter.fieldValue(field(ProviderEntity, "provider"), "=", "brevo")],
        }) as ProviderEntity;
        configUuid = config.uuid;
      } catch (err) {
        if (err instanceof NotFoundError) {
          throw new Error("No email configuration found for Brevo — admin must configure the Brevo provider via FE");
        }
        throw err;
      }

      // Construct BrevoClient from the DB-loaded provider config.
      // If a pre-configured client was injected via constructor, use it (for tests).
      const client = this.brevoClient ?? new BrevoClient(
        config.api_key,
        config.api_endpoint ?? "https://api.brevo.com/v1",
      );

      // Get email template — request fields are camelCase (NATS contract);
      // entity/DB columns are snake_case.
      let template: EmailTemplateEntity;
      try {
        template = await dal.find(EmailTemplateEntity, null, {
          filters: [
            Filter.fieldValue(field(EmailTemplateEntity, "code"), "=", request.templateCode),
            Filter.fieldValue(field(EmailTemplateEntity, "language_iso"), "=", request.languageIso),
          ],
        }) as EmailTemplateEntity;
      } catch (err) {
        if (err instanceof NotFoundError) {
          throw new Error(`Template not found: ${request.templateCode} (${request.languageIso})`);
        }
        throw err;
      }

      // Render template with variables
      const compiledSubject = Handlebars.compile(template.subject || "");
      const compiledHtml = Handlebars.compile(template.body_html || "");
      const compiledText = Handlebars.compile(template.body_text || "");

      const subject = compiledSubject(request.variables || {});
      const htmlContent = compiledHtml(request.variables || {});
      const textContent = compiledText(request.variables || {});

      // Capture rendered content + template uuid for the failure-path log.
      renderedHtml = htmlContent;
      renderedText = textContent;
      templateUuid = template.uuid;

      // Prepare Brevo request
      const brevoRequest: BrevoEmailRequest = {
        to: request.to.map(email => ({ email })),
        cc: request.cc?.map(email => ({ email })),
        bcc: request.bcc?.map(email => ({ email })),
        subject,
        htmlContent,
        textContent,
        sender: config.from_email ? { email: config.from_email, name: config.from_name || undefined } : undefined,
        replyTo: config.reply_to ? { email: config.reply_to } : undefined,
      };

      // Send email via Brevo
      const brevoResponse = await client.sendEmail(brevoRequest);

      // Log the communication (success)
      const logRow = await dal.add<SenderLogEntity>(
        SenderLogEntity,
        {
          entity_id: request.entityId ?? null,
          entity_uuid: request.entityUuid ?? null,
          type: "email",
          provider_message_id: brevoResponse.messageId,
          provider_uuid: config.uuid,
          status: "sent",
          template_uuid: template.uuid,
          senders: { from: config.from_email },
          recipients: { to: request.to, cc: request.cc, bcc: request.bcc },
          interpolated_sent_message: htmlContent || textContent,
          sent_at: new Date(),
          status_changed_at: new Date(),
        },
        {},
      );

      return {
        requestId: request.requestId,
        success: true,
        providerMessageId: brevoResponse.messageId,
        logId: logRow.id,
      };
    } catch (error) {
      console.error("Error sending email:", error);

      // Log the failed communication
      // NOTE: `interpolated_sent_message` and `template_uuid` are populated
      // even on failure (when available) so the log is useful for debugging
      // and so E2E tests can retrieve the rendered OTP from the log when
      // Brevo is faked/down. They stay null only if the failure happened
      // before rendering (e.g. provider/template not found).
      try {
        await dal.add<SenderLogEntity>(
          SenderLogEntity,
          {
            entity_id: request.entityId ?? null,
            entity_uuid: request.entityUuid ?? null,
            type: "email",
            provider_uuid: configUuid,
            status: "failed",
            template_uuid: templateUuid,
            senders: {},
            recipients: { to: request.to },
            interpolated_sent_message: renderedHtml || renderedText,
            error_message: error instanceof Error ? error.message : "Unknown error",
            status_changed_at: new Date(),
          },
          {},
        );
      } catch (logError) {
        console.error("Error logging failed email:", logError);
      }

      return {
        requestId: request.requestId,
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
}
