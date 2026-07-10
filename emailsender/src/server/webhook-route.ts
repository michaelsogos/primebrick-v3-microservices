/**
 * Webhook route handler for the SDK's createHttpServer routeHandler option.
 * Handles POST /webhook with API key authentication via SDK verifyApiKey + RBAC.
 * All errors are returned as RFC 7807 Problem Details JSON.
 * Returns true if the request was handled, false otherwise.
 */

import type { IncomingMessage, ServerResponse } from "http";
import { WebhookService } from "../services/webhook-service.js";
import { extJsonStringify } from "@primebrick/sdk";
import {
  verifyApiKey,
  enforceHttpRbac,
  Permission,
  HttpHeaderProvider,
  type ApiKeyPort,
  type AuthConfig,
  AuthError,
  RbacDeniedError,
} from "@primebrick/sdk";

const webhookService = new WebhookService();

let apiKeyPort: ApiKeyPort | null = null;
let authConfig: AuthConfig | null = null;

export function setWebhookAuthDependencies(config: AuthConfig, apiKey: ApiKeyPort): void {
  authConfig = config;
  apiKeyPort = apiKey;
}

function sendRfcError(
  res: ServerResponse,
  status: number,
  title: string,
  detail: string,
  internalCode: string,
  severity: string = status >= 500 ? "HIGH" : "MEDIUM",
): void {
  const body = {
    type: `https://primebrick.io/errors/${internalCode}`,
    title,
    status,
    detail,
    internal_code: internalCode,
    severity,
  };
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(extJsonStringify(body));
}

export async function webhookRouteHandler(
  req: IncomingMessage,
  res: ServerResponse,
  url: URL,
): Promise<boolean> {
  if (url.pathname !== "/webhook" || req.method !== "POST") {
    return false;
  }

  try {
    if (!apiKeyPort || !authConfig) {
      sendRfcError(res, 500, "Auth Not Initialized", "Auth dependencies not initialized", "AUTH_NOT_INITIALIZED");
      return true;
    }

    // Verify API key + enforce RBAC (EMAILSENDER_LOG_CREATE)
    const headers = new HttpHeaderProvider(req);
    const user = await verifyApiKey(headers, apiKeyPort);
    enforceHttpRbac(user, [Permission.EMAILSENDER_LOG_CREATE]);

    const provider = url.searchParams.get("provider") || "brevo";

    // Read request body
    const chunks: Buffer[] = [];
    for await (const chunk of req) {
      chunks.push(chunk as Buffer);
    }
    const body = Buffer.concat(chunks).toString();
    const payload = JSON.parse(body);

    await webhookService.handleWebhook(provider, payload, user.id);

    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("OK");
  } catch (error) {
    if (error instanceof AuthError) {
      sendRfcError(res, 401, "Unauthorized", error.message, error.internal_code, "MEDIUM");
      return true;
    }
    if (error instanceof RbacDeniedError) {
      sendRfcError(res, 403, "Forbidden", "Insufficient permissions", "RBAC_PERMISSION_DENIED", "MEDIUM");
      return true;
    }
    console.error("[emailsender] Webhook error:", {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined,
    });
    sendRfcError(
      res,
      500,
      "Internal Server Error",
      error instanceof Error ? error.message : "Internal server error",
      "internal-error",
    );
  }

  return true;
}
