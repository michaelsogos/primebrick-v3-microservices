import Handlebars from "handlebars";
import { getPool } from "../db/pool.js";
import { BrevoClient, type BrevoEmailRequest } from "../providers/brevo.js";
import type { SendEmailRequest, SendEmailResponse } from "../nats/types.js";

export class EmailService {
  private brevoClient: BrevoClient;

  constructor() {
    const apiKey = process.env.BREVO_API_KEY;
    const apiEndpoint = process.env.BREVO_API_ENDPOINT || "https://api.brevo.com/v1";
    
    if (!apiKey) {
      throw new Error("BREVO_API_KEY is not set");
    }
    
    this.brevoClient = new BrevoClient(apiKey, apiEndpoint);
  }

  async sendEmail(request: SendEmailRequest): Promise<SendEmailResponse> {
    const pool = getPool();
    
    try {
      // Get email configuration
      const configResult = await pool.query(
        "SELECT * FROM emailsender.email_config WHERE provider = 'brevo' LIMIT 1"
      );
      
      if (configResult.rows.length === 0) {
        throw new Error("No email configuration found for Brevo");
      }
      
      const config = configResult.rows[0];
      
      // Get email template
      const templateResult = await pool.query(
        "SELECT * FROM emailsender.email_templates WHERE code = $1 AND language_iso = $2 LIMIT 1",
        [request.templateCode, request.languageIso]
      );
      
      if (templateResult.rows.length === 0) {
        throw new Error(`Template not found: ${request.templateCode} (${request.languageIso})`);
      }
      
      const template = templateResult.rows[0];
      
      // Render template with variables
      const compiledSubject = Handlebars.compile(template.subject || "");
      const compiledHtml = Handlebars.compile(template.body_html || "");
      const compiledText = Handlebars.compile(template.body_text || "");
      
      const subject = compiledSubject(request.variables || {});
      const htmlContent = compiledHtml(request.variables || {});
      const textContent = compiledText(request.variables || {});
      
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
      const brevoResponse = await this.brevoClient.sendEmail(brevoRequest);
      
      // Log the communication
      const logResult = await pool.query(
        `INSERT INTO emailsender.email_templates_communication_log 
         (entity_id, entity_uuid, type, provider_message_id, provider, status, template_uuid, senders, recipients, interpolated_sent_message, sent_at, status_changed_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
         RETURNING id`,
        [
          request.entityId || null,
          request.entityUuid || null,
          "email",
          brevoResponse.messageId,
          "brevo",
          "sent",
          template.uuid,
          JSON.stringify({ from: config.from_email }),
          JSON.stringify({ to: request.to, cc: request.cc, bcc: request.bcc }),
          htmlContent || textContent,
        ]
      );
      
      return {
        requestId: request.requestId,
        success: true,
        providerMessageId: brevoResponse.messageId,
        logId: logResult.rows[0].id,
      };
    } catch (error) {
      console.error("Error sending email:", error);
      
      // Log the failed communication
      try {
        await pool.query(
          `INSERT INTO emailsender.email_templates_communication_log 
           (entity_id, entity_uuid, type, provider, status, template_uuid, senders, recipients, error_message, status_changed_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())`,
          [
            request.entityId || null,
            request.entityUuid || null,
            "email",
            "brevo",
            "failed",
            null,
            JSON.stringify({}),
            JSON.stringify({ to: request.to }),
            error instanceof Error ? error.message : "Unknown error",
          ]
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
