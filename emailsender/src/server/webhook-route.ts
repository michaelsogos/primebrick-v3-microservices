import type { IncomingMessage, ServerResponse } from "http";
import { WebhookService } from "../services/webhook-service.js";

const webhookService = new WebhookService();

/**
 * Webhook route handler for the SDK's createHttpServer routeHandler option.
 * Handles POST /webhook with API key authentication, delegates to WebhookService.
 * Returns true if the request was handled, false otherwise.
 */
export async function webhookRouteHandler(
  req: IncomingMessage,
  res: ServerResponse,
  url: URL,
): Promise<boolean> {
  if (url.pathname !== "/webhook" || req.method !== "POST") {
    return false;
  }

  const webhookApiKey = process.env.WEBHOOK_API_KEY;
  if (!webhookApiKey) {
    res.writeHead(500, { "Content-Type": "text/plain" });
    res.end("WEBHOOK_API_KEY is not set");
    return true;
  }

  // Check API key authentication
  const authHeader = req.headers["authorization"];
  const providedKey = authHeader?.replace("Bearer ", "") || authHeader?.replace("ApiKey ", "");

  if (providedKey !== webhookApiKey) {
    res.writeHead(401, { "Content-Type": "text/plain" });
    res.end("Unauthorized");
    return true;
  }

  try {
    const provider = url.searchParams.get("provider") || "brevo";

    // Read request body
    const chunks: Buffer[] = [];
    for await (const chunk of req) {
      chunks.push(chunk as Buffer);
    }
    const body = Buffer.concat(chunks).toString();
    const payload = JSON.parse(body);

    await webhookService.handleWebhook(provider, payload);

    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("OK");
  } catch (error) {
    console.error("Webhook error:", error);
    res.writeHead(500, { "Content-Type": "text/plain" });
    res.end(error instanceof Error ? error.message : "Internal server error");
  }

  return true;
}
