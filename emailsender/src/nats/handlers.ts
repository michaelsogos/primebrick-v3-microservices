import { NatsClient } from "@primebrick/sdk";
import type { SendEmailRequest, SendEmailResponse } from "./types.js";

const EMAIL_SEND_SUBJECT = "emailsender.send";
const EMAIL_RESPONSE_SUBJECT = "emailsender.response";

export async function subscribeToEmailSendRequests(
  handleSendEmail: (request: SendEmailRequest) => Promise<SendEmailResponse>,
): Promise<void> {
  console.log(`Subscribed to ${EMAIL_SEND_SUBJECT}`);

  await NatsClient.subscribe<SendEmailRequest>(
    EMAIL_SEND_SUBJECT,
    async (request, msg) => {
      console.log(`Received email send request: ${request.requestId}`);

      try {
        const response = await handleSendEmail(request);
        await NatsClient.publish(
          `${EMAIL_RESPONSE_SUBJECT}.${request.requestId}`,
          response,
        );
        console.log(
          `Processed email send request: ${request.requestId} - ${response.success ? "SUCCESS" : "FAILED"}`,
        );
      } catch (error) {
        console.error("Error processing email send request:", error);

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
