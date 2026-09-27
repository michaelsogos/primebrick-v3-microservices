/**
 * NATS JetStream subscriber — durable consumer for inbound webhooks.
 *
 * Consumes `webhook.emailsender.received` from the WEBHOOK stream
 * (published by the `webhook` ingress service). For each message:
 *
 *   1. auth — `verifyApiKey` on the forwarded `authorization` header
 *      (same mechanism as the old HTTP route, transported via NATS)
 *   2. RBAC — `EMAILSENDER_LOG_CREATE_SINGLE` enforced here, in the
 *      target service (the ingress only does a validity precheck)
 *   3. intent dispatch — the envelope `intent` selects the handler
 *   4. ack — auto-ack on success, nak+redelivery on throw
 *
 * Auth failures are terminal (nak'ing would loop forever on a bad key)
 * — the message is ack'd after logging so it is not redelivered.
 */

import {
  NatsClient,
  verifyApiKey,
  enforceNatsRbac,
  Permission,
  AuthError,
  RbacDeniedError,
  type ApiKeyPort,
  type HeaderProvider,
} from "@primebrick/sdk";
import type { MsgHdrs } from "nats";
import { WebhookService } from "../../services/webhook-service.js";

const WEBHOOK_STREAM = "WEBHOOK";
const DURABLE = "webhook-emailsender-received";
const FILTER_SUBJECT = "webhook.emailsender.received";

interface WebhookEnvelope {
  service_code: string;
  intent: string;
  received_at: string;
  body: unknown;
}

let apiKeyPort: ApiKeyPort | null = null;

export function setWebhookApiKeyPort(port: ApiKeyPort): void {
  apiKeyPort = port;
}

function headerProvider(headers?: MsgHdrs): HeaderProvider {
  return {
    getHeader: (name: string) => headers?.get(name) || undefined,
  };
}

const webhookService = new WebhookService();

export async function subscribeToWebhooks(): Promise<void> {
  if (!apiKeyPort) {
    throw new Error("webhook subscriber: apiKeyPort not initialized");
  }

  await NatsClient.jetstreamSubscribe<WebhookEnvelope>({
    stream: WEBHOOK_STREAM,
    durable: DURABLE,
    filterSubject: FILTER_SUBJECT,
    handler: async (envelope, msg) => {
      try {
        const user = await verifyApiKey(headerProvider(msg.headers), apiKeyPort!);
        enforceNatsRbac(user, [Permission.EMAILSENDER_LOG_CREATE_SINGLE]);

        // Intent dispatch — the envelope intent is the provider for
        // emailsender webhooks (e.g. /webhook/emailsender/brevo).
        await webhookService.handleWebhook(envelope.intent, envelope.body, user.id);
      } catch (error) {
        if (error instanceof AuthError || error instanceof RbacDeniedError) {
          // Terminal — do not redeliver auth failures.
          console.error(`[nats-sub] webhook auth/rbac failed (${envelope?.intent}):`,
            error instanceof Error ? error.message : error);
          return;
        }
        throw error; // nak → redelivery
      }
    },
  });
  console.log(`Subscribed to ${FILTER_SUBJECT} (durable: ${DURABLE}, stream: ${WEBHOOK_STREAM})`);
}
