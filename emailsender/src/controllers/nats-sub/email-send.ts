import { NatsClient, makeNatsRoutes, Permission, logger } from "@primebrick/sdk";
import type { SendEmailRequest, SendEmailResponse } from "./types.js";

const EMAIL_SEND_SUBJECT = "emailsender.send";
const EMAIL_RESPONSE_SUBJECT = "emailsender.response";

/**
 * Inbound email work item. Two-layer inbound model enforced by the SDK
 * factory: FIRST the publisher's client shield (UA+key vs client_shield_registry —
 * "BE may talk to emailsender"), THEN the user layer ("is this actor allowed
 * to send email"): gateway secret + AuthUser + RBAC EMAILSENDER_SEND.
 * A valid shield with missing/insufficient user context is denied — service
 * identity never authorizes a user-context operation.
 */
export async function subscribeToEmailSendRequests(
  handleSendEmail: (request: SendEmailRequest, actorId: string) => Promise<SendEmailResponse>,
): Promise<void> {
  logger.info(`Subscribed to ${EMAIL_SEND_SUBJECT}`, { tags: ["nats-sub"] });

  await makeNatsRoutes(
    [
      {
        subject: EMAIL_SEND_SUBJECT,
        // Work item: exactly one emailsender replica processes each request.
        queue: "emailsender",
        permissions: [Permission.EMAILSENDER_SEND],
        handler: async ({ request, user }) => {
          const req = request as SendEmailRequest;
          logger.debug(`Received email send request: ${req.requestId}`, { tags: ["nats-sub"] });
          const response = await handleSendEmail(req, req.initiatedBy ?? user!.id);
          await NatsClient.publish(`${EMAIL_RESPONSE_SUBJECT}.${req.requestId}`, response);
          logger.debug(
            `Processed email send request: ${req.requestId} - ${response.success ? "SUCCESS" : "FAILED"}`,
            { tags: ["nats-sub"] },
          );
        },
      },
    ],
    { serviceCode: "emailsender" },
  );
}
