import { getDal } from "../db/dal.js";
import { BrevoClient } from "../providers/brevo.js";
import { EmailCommunicationLogEntity } from "../domain/entities/email_communication_log_entity.js";

export class WebhookService {
  private brevoClient: BrevoClient;

  constructor() {
    const apiKey = process.env.BREVO_API_KEY;
    const apiEndpoint = process.env.BREVO_API_ENDPOINT || "https://api.brevo.com/v1";

    if (!apiKey) {
      throw new Error("BREVO_API_KEY is not set");
    }

    this.brevoClient = new BrevoClient(apiKey, apiEndpoint);
  }

  async handleWebhook(provider: string, payload: unknown): Promise<void> {
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

    // Map Brevo event to our status
    const status = this.brevoClient.mapStatus(event);
    const errorMessage = data.reason || undefined;

    const dal = getDal();

    // Update the communication log by provider_message_id using matchBy.
    // EmailCommunicationLogEntity is non-auditable (no @AuditableField), so
    // no actor is required. status_changed_at is stamped explicitly.
    await dal.update(
      EmailCommunicationLogEntity,
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
