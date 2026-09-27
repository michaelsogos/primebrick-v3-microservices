import { getDal } from "../db/dal.js";
import { BrevoClient } from "../providers/brevo.js";
import { SenderLogEntity } from "../domain/entities/sender_log_entity.js";
import { Project, field, Filter } from "@primebrick/dal-pg";

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

export class WebhookService {
  // No BrevoClient instance needed — webhook handling only uses
  // BrevoClient.mapStatus() which is a static pure function.
  // The Brevo API key is not needed for webhook payload processing.

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

    const dal = getDal();

    // Ordering guard — read the current status; a strictly-lower-rank
    // incoming event is out-of-order and must not regress the log.
    const current = await dal.find(
      SenderLogEntity,
      [Project.field(field(SenderLogEntity, "status"))],
      {
        filters: [
          Filter.fieldValue(field(SenderLogEntity, "provider_message_id"), "=", providerMessageId),
        ],
        throwIfNotFound: false,
      },
    ) as { status: string } | null;
    if (current) {
      const incomingRank = STATUS_RANK[status] ?? 0;
      const currentRank = STATUS_RANK[current.status] ?? 0;
      if (incomingRank < currentRank) {
        console.log(
          `Ignored out-of-order event for message ${providerMessageId}: ${status} < ${current.status}`,
        );
        return;
      }
    }

    // Update the communication log by provider_message_id using matchBy.
    // SenderLogEntity is non-auditable (no @AuditableField), so
    // no actor is required. status_changed_at is stamped explicitly.
    await dal.update(
      SenderLogEntity,
      {
        provider_message_id: providerMessageId,
        status,
        status_changed_at: new Date(),
        error_message: errorMessage,
      },
      { matchBy: "provider_message_id" },
    );

    console.log(`Updated communication log for message ${providerMessageId}: ${status}`);
  }
}
