import { NatsClient, verifyNatsMessage, enforceNatsRbac, Permission, type AuthConfig, AuthError, RbacDeniedError } from "@primebrick/sdk";
import type { SendEmailRequest, SendEmailResponse } from "./types.js";

const EMAIL_SEND_SUBJECT = "emailsender.send";
const EMAIL_RESPONSE_SUBJECT = "emailsender.response";

let authConfig: AuthConfig | null = null;

export function setNatsAuthConfig(config: AuthConfig): void {
  authConfig = config;
}

export async function subscribeToEmailSendRequests(
  handleSendEmail: (request: SendEmailRequest, actorId: string) => Promise<SendEmailResponse>,
): Promise<void> {
  console.log(`Subscribed to ${EMAIL_SEND_SUBJECT}`);

  await NatsClient.subscribe<SendEmailRequest>(
    EMAIL_SEND_SUBJECT,
    async (request, msg) => {
      console.log(`Received email send request: ${request.requestId}`);

      try {
        // Verify auth via NATS headers (GATEWAY-RESOLVED mode)
        if (!authConfig) {
          throw new Error("NATS auth config not initialized");
        }
        const user = await verifyNatsMessage(msg, authConfig);

        // Enforce RBAC (EMAILSENDER_SEND) — system API keys bypass this
        enforceNatsRbac(user, [Permission.EMAILSENDER_SEND]);

        const response = await handleSendEmail(request, user.id);
        await NatsClient.publish(
          `${EMAIL_RESPONSE_SUBJECT}.${request.requestId}`,
          response,
        );
        console.log(
          `Processed email send request: ${request.requestId} - ${response.success ? "SUCCESS" : "FAILED"}`,
        );
      } catch (error) {
        if (error instanceof AuthError) {
          console.error(`[NATS] Auth failed for ${request.requestId}: ${error.message}`);
        } else if (error instanceof RbacDeniedError) {
          console.error(`[NATS] RBAC denied for ${request.requestId}: ${error.message}`);
        } else {
          console.error("Error processing email send request:", error);
        }

        const errorResponse: SendEmailResponse = {
          requestId: request.requestId,
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };

        await NatsClient.publish(
          `${EMAIL_RESPONSE_SUBJECT}.${request.requestId}`,
          errorResponse,
        );
      }
    },
  );
}

export async function publishEmailResponse(
  requestId: string,
  response: SendEmailResponse,
): Promise<void> {
  await NatsClient.publish(`${EMAIL_RESPONSE_SUBJECT}.${requestId}`, response);
}
