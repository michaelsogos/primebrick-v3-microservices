import type { Msg } from "nats";
import { getNatsConnection } from "./client.js";
import type { SendEmailRequest, SendEmailResponse } from "./types.js";

const EMAIL_SEND_SUBJECT = "emailsender.send";
const EMAIL_RESPONSE_SUBJECT = "emailsender.response";

export async function subscribeToEmailSendRequests(handleSendEmail: (request: SendEmailRequest) => Promise<SendEmailResponse>): Promise<void> {
  const nc = await getNatsConnection();
  
  // Subscribe to email send requests
  const sub = nc.subscribe(EMAIL_SEND_SUBJECT);
  
  console.log(`Subscribed to ${EMAIL_SEND_SUBJECT}`);
  
  for await (const msg of sub) {
    try {
      const request: SendEmailRequest = JSON.parse(new TextDecoder().decode(msg.data));
      console.log(`Received email send request: ${request.requestId}`);
      
      const response = await handleSendEmail(request);
      
      // Publish response to response subject
      await nc.publish(
        `${EMAIL_RESPONSE_SUBJECT}.${request.requestId}`,
        new TextEncoder().encode(JSON.stringify(response))
      );
      
      console.log(`Processed email send request: ${request.requestId} - ${response.success ? 'SUCCESS' : 'FAILED'}`);
    } catch (error) {
      console.error("Error processing email send request:", error);
      
      // Send error response
      const errorResponse: SendEmailResponse = {
        requestId: "unknown",
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
      
      // Try to extract requestId from the failed message
      try {
        const request: SendEmailRequest = JSON.parse(new TextDecoder().decode(msg.data));
        errorResponse.requestId = request.requestId;
        await nc.publish(
          `${EMAIL_RESPONSE_SUBJECT}.${request.requestId}`,
          new TextEncoder().encode(JSON.stringify(errorResponse))
        );
      } catch {
        // If we can't parse the request, we can't send a targeted response
      }
    }
  }
}

export async function publishEmailResponse(requestId: string, response: SendEmailResponse): Promise<void> {
  const nc = await getNatsConnection();
  await nc.publish(
    `${EMAIL_RESPONSE_SUBJECT}.${requestId}`,
    new TextEncoder().encode(JSON.stringify(response))
  );
}
