import { logger, runWithSession } from "@primebrick/sdk";
import { BrevoClient } from "../providers/brevo.js";
import { SenderLogEntity } from "../domain/entities/sender_log_entity.js";
import { DomainService, NotFoundError, Project, field, Filter } from "@primebrick/dal-pg";
import { actorSession, entityActor } from "../db/entity-repo.js";

/**
 * Monotonic status rank — Brevo events arrive out-of-order, so a
 * lower-rank event received after a higher-rank one must not regress
 * `sender_log.status` (blind overwrite = stale "sent" after "delivered").
 * Equal or higher rank always applies (equal covers same-event dedupe).
 */
const STATUS_RANK: Record<string, number> = {
  sent: 1,
  deferred: 1,
  delivered: 2,
  opened: 3,
  clicked: 4,
  bounced: 5,
  spam: 5,
  blocked: 5,
  failed: 5,
};

export class WebhookService extends DomainService<SenderLogEntity & Record<string, unknown>> {
  // No BrevoClient instance needed — webhook handling only uses
  // BrevoClient.mapStatus() which is a static pure function.
  // The Brevo API key is not needed for webhook payload processing.

  constructor() {
    super({
      entity: SenderLogEntity,
      actor: entityActor,
      // No list meta — sender_log is internal telemetry, never served to
      // FE; empty searchableKeys = no search surface.
      list: { searchableKeys: [], filterableKeys: new Set() },
    });
  }

  async handleWebhook(provider: string, payload: unknown, actorId?: string): Promise<void> {
    if (provider !== "brevo") {
      throw new Error(`Unsupported provider: ${provider}`);
    }

    const data = payload as {
      event?: string;
      "message-id"?: string;
      email?: string;
      reason?: string;
      "X-Mailer"?: string;
    };

    const providerMessageId = data["message-id"];
    if (!providerMessageId) {
      throw new Error("Missing message-id in webhook payload");
    }

    const event = data.event;
    if (!event) {
      throw new Error("Missing event in webhook payload");
    }

    // Map Brevo event to our status (static method — no API key needed)
    const status = BrevoClient.mapStatus(event);
    const errorMessage = data.reason || undefined;

    const dal = this.dal;

    // Ordering guard — read the current status (+uuid for the follow-up
    // svc.update match); a strictly-lower-rank incoming event is
    // out-of-order and must not regress the log.
    const current = await dal.find(
      SenderLogEntity,
      [Project.field(field(SenderLogEntity, "uuid")), Project.field(field(SenderLogEntity, "status"))],
      {
        filters: [
          Filter.fieldValue(field(SenderLogEntity, "provider_message_id"), "=", providerMessageId),
        ],
        throwIfNotFound: false,
      },
    ) as { uuid: string; status: string } | null;
    if (!current) {
      // Same contract as the old matchBy update: a webhook for an unknown
      // message-id surfaces as NotFoundError instead of silently passing.
      throw new NotFoundError(`sender_log row not found for provider_message_id ${providerMessageId}`);
    }
    {
      const incomingRank = STATUS_RANK[status] ?? 0;
      const currentRank = STATUS_RANK[current.status] ?? 0;
      if (incomingRank < currentRank) {
        logger.debug(
          `Ignored out-of-order event for message ${providerMessageId}: ${status} < ${current.status}`,
          { tags: ["webhook-service"] },
        );
        return;
      }

      // Update the communication log through svc — SenderLogEntity is
      // non-auditable so no version is required; the caller identity
      // (actorId, api-key caller) or the system fallback rides ALS.
      await runWithSession(actorSession(actorId ?? "system:emailsender"), async () => {
        await this.svc.update(current.uuid, {
          status,
          status_changed_at: new Date(),
          error_message: errorMessage,
        });
      });
    }

    logger.debug(`Updated communication log for message ${providerMessageId}: ${status}`, { tags: ["webhook-service"] });
  }
}
