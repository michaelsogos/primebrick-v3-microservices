import { NatsClient, makeNatsRoutes, Permission, logger } from "@primebrick/sdk";
import {
  SendEmailSchema,
  SEND_EMAIL_PAYLOAD_SCHEMA,
  type SendEmailRequest,
  type SendEmailResponse,
} from "./types.js";

const EMAIL_SEND_SUBJECT = "emailsender.send";
const EMAIL_RESPONSE_SUBJECT = "emailsender.response";

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
          const response = await handleSendEmail(request, request.initiatedBy);
          await NatsClient.publish(`${EMAIL_RESPONSE_SUBJECT}.${request.requestId}`, response);
          logger.debug(
            `Processed email send request: ${request.requestId} - ${response.success ? "SUCCESS" : "FAILED"}`,
            { tags: ["nats-sub"] },
          );
        },
      },
    ],
    { serviceCode: "emailsender" },
  );
}
