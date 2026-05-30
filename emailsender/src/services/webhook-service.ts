import { getPool } from "../db/pool.js";
import { BrevoClient } from "../providers/brevo.js";

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

    const pool = getPool();

    // Update the communication log
    await pool.query(
      `UPDATE emailsender.email_templates_communication_log
       SET status = $1, status_changed_at = NOW(), error_message = $2
       WHERE provider_message_id = $3`,
      [status, errorMessage, providerMessageId]
    );

    console.log(`Updated communication log for message ${providerMessageId}: ${status}`);
  }
}
