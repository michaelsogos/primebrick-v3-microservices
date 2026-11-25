import { makeNatsRoutes, Permission, logger } from "@primebrick/sdk";
import {
  SendEmailSchema,
  SEND_EMAIL_PAYLOAD_SCHEMA,
  type SendEmailRequest,
  type SendEmailResponse,
} from "./types.js";

const EMAIL_SEND_SUBJECT = "emailsender.send";

/**
 * Inbound email work item. Two-layer inbound model enforced by the SDK
 * factory: FIRST the publisher's client shield (UA+key vs client_shield_registry —
 * "BE may talk to emailsender"), THEN the user layer ("is this actor allowed
 * to send email"): gateway secret + AuthUser + RBAC EMAILSENDER_SEND.
 * A valid shield with missing/insufficient user context is denied — service
 * identity never authorizes a user-context operation.
 *
 * The payload contract is `SendEmailSchema` (types.ts) — `{schema, parse}`
 * lists the route in `endpoints.callables` AND wires mandatory runtime
 * validation; an unvalidated callable is undeclarable.
 */
export async function subscribeToEmailSendRequests(
  handleSendEmail: (request: SendEmailRequest, actorId?: string) => Promise<SendEmailResponse>,
): Promise<void> {
  logger.info(`Subscribed to ${EMAIL_SEND_SUBJECT}`, { tags: ["nats-sub"] });

  await makeNatsRoutes<SendEmailRequest>(
    [
      {
        subject: EMAIL_SEND_SUBJECT,
        // Durable work-item — JetStream at-least-once + systemic dedupe;
        // the stream/consumer wiring is owned by the factory.
        durable: true,
        // Work item: exactly one emailsender replica processes each request.
        queue: "emailsender",
        permissions: [Permission.EMAILSENDER_SEND],
        payload_schema: {
          schema: SEND_EMAIL_PAYLOAD_SCHEMA,
          parse: (raw) => SendEmailSchema.parse(raw),
        },
        label_key: "emailsender.callable.send.label",
        description_key: "emailsender.callable.send.desc",
        handler: async ({ request }) => {
          logger.debug(`Received email send request: ${request.requestId}`, { tags: ["nats-sub"] });
          // Taken-charge first — the ack after this handler means the work
          // item is durably persisted, NOT executed. Execution is the
          // service's own asynchronous responsibility (sweeper-backed);
          // the outcome is published on `emailsender.response.<requestId>`
          // when the dispatch actually finishes.
          return await handleSendEmail(request, request.initiatedBy);
        },
      },
    ],
    { serviceCode: "emailsender" },
  );
}
