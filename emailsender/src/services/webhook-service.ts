import { getDal } from "../db/dal.js";
import { BrevoClient } from "../providers/brevo.js";
import { SenderLogEntity } from "../domain/entities/sender_log_entity.js";

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
