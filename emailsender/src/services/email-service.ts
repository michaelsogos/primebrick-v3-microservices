import Handlebars from "handlebars";
import { getDal } from "../db/dal.js";
import { BrevoClient, type BrevoEmailRequest } from "../providers/brevo.js";
import type { SendEmailRequest, SendEmailResponse } from "../nats/types.js";
import { ProviderEntity, EmailTemplateEntity, SenderLogEntity } from "../domain/entities/registry.js";
import { Filter, field, NotFoundError } from "@primebrick/dal-pg";

export class EmailService {
  private brevoClient: BrevoClient;

  constructor(brevoClient?: BrevoClient) {
    if (brevoClient) {
      this.brevoClient = brevoClient;
      return;
    }

    const apiKey = process.env.BREVO_API_KEY;
    const apiEndpoint = process.env.BREVO_API_ENDPOINT || "https://api.brevo.com/v1";

    if (!apiKey) {
      throw new Error("BREVO_API_KEY is not set");
    }

    this.brevoClient = new BrevoClient(apiKey, apiEndpoint);
  }

  async sendEmail(request: SendEmailRequest, actorId?: string): Promise<SendEmailResponse> {
    const dal = getDal();
    let configUuid: string | null = null;

    try {
      // Get email configuration. dal.find defaults to throwIfNotFound: true,
      // so a missing config throws NotFoundError — caught and re-thrown as the
      // service's existing error shape.
      let config: ProviderEntity;
      try {
        config = await dal.find(ProviderEntity, null, {
          filters: [Filter.fieldValue(field(ProviderEntity, "provider"), "=", "brevo")],
        }) as ProviderEntity;
        configUuid = config.uuid;
      } catch (err) {
        if (err instanceof NotFoundError) {
          throw new Error("No email configuration found for Brevo");
        }
        throw err;
      }

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
      try {
        await dal.add<SenderLogEntity>(
          SenderLogEntity,
          {
            entity_id: request.entityId ?? null,
            entity_uuid: request.entityUuid ?? null,
            type: "email",
            provider_uuid: configUuid,
            status: "failed",
            template_uuid: null,
            senders: {},
            recipients: { to: request.to },
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
