/**
 * HTTP controller — the ONLY route of the webhook service:
 *
 *   POST /webhook/{service_code}/{intent...}
 *
 * Flow (pass-thru, zero business logic):
 *   1. AUTHENTICATED_API wall — verifyApiKey; missing/invalid → 401
 *   2. Registry lookup — service known + enabled + online → routable
 *   3. JetStream publish to `webhook.<code>.received` (envelope + intent,
 *      original auth material forwarded via NATS headers)
 *   4. PubAck → 200; publish failure → 502 (provider retries)
 *
 * The service knows NOTHING about providers — `{intent...}` and the body
 * are forwarded verbatim; meaning belongs to the target microservice.
 */

import type { IncomingMessage, ServerResponse } from "http";
import {
  extJsonStringify,
  verifyApiKey,
  HttpHeaderProvider,
  NatsClient,
  AuthError,
  type ApiKeyPort,
} from "@primebrick/sdk";
import { lookupService } from "../../registry/registry-cache.js";
import { CachedApiKeyPort } from "../../auth/precheck-port.js";

const WEBHOOK_STREAM = "WEBHOOK";
const SUBJECT_PREFIX = "webhook";
const SUBJECT_SUFFIX = "received";

let apiKeyPort: ApiKeyPort | null = null;

export function setWebhookAuthDependencies(apiKey: ApiKeyPort): void {
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

async function readBody(req: IncomingMessage): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(chunk as Buffer);
  }
  return Buffer.concat(chunks).toString();
}

export async function webhookRouteHandler(
  req: IncomingMessage,
  res: ServerResponse,
  url: URL,
): Promise<boolean> {
  // Match POST /webhook/{service_code}/{intent...} — intent is optional.
  const match = /^\/webhook\/([A-Za-z0-9_-]+)(?:\/(.*))?$/.exec(url.pathname);
  if (!match || req.method !== "POST") return false;

  const serviceCode = match[1];
  const intent = match[2] ?? "";

  try {
    if (!apiKeyPort) {
      sendRfcError(res, 500, "Auth Not Initialized", "Auth dependencies not initialized", "AUTH_NOT_INITIALIZED");
      return true;
    }

    // 1. AUTHENTICATED_API wall — 401 on missing/invalid/inactive/expired.
    const headers = new HttpHeaderProvider(req);
    await verifyApiKey(headers, apiKeyPort);

    // 2. Registration-driven routing decision.
    const lookup = await lookupService(serviceCode);
    if (!lookup.routable) {
      const status = lookup.code ? 502 : 404;
      sendRfcError(
        res,
        status,
        status === 404 ? "Unknown Service" : "Service Unavailable",
        lookup.reason ?? `service "${serviceCode}" is not routable`,
        "WEBHOOK_SERVICE_NOT_ROUTABLE",
      );
      return true;
    }

    // 3. Forward verbatim — envelope carries service/intent/body; NATS
    //    headers carry the original auth material for the target US.
    const rawBody = await readBody(req);
    const envelope = {
      service_code: serviceCode,
      intent,
      received_at: new Date().toISOString(),
      body: rawBody ? JSON.parse(rawBody) : null,
    };
    const forwardHeaders: Record<string, string> = {};
    const auth = headers.getHeader("authorization");
    if (auth) forwardHeaders["authorization"] = auth;

    const seq = await NatsClient.jetstreamPublish(
      `${SUBJECT_PREFIX}.${serviceCode}.${SUBJECT_SUFFIX}`,
      envelope,
      forwardHeaders,
    );

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(extJsonStringify({ received: true, seq: seq.toString() }));
  } catch (error) {
    if (error instanceof AuthError) {
      sendRfcError(res, 401, "Unauthorized", error.message, error.internal_code, "MEDIUM");
      return true;
    }
    if (error instanceof SyntaxError) {
      sendRfcError(res, 400, "Invalid JSON", "Request body is not valid JSON", "WEBHOOK_INVALID_BODY", "LOW");
      return true;
    }
    console.error("[webhook] publish error:", {
      message: error instanceof Error ? error.message : String(error),
      service: serviceCode,
      intent,
    });
    // JetStream publish failed or NATS down — provider must retry.
    sendRfcError(
      res,
      502,
      "Delivery Failed",
      error instanceof Error ? error.message : "failed to queue webhook",
      "WEBHOOK_DELIVERY_FAILED",
    );
  }
  return true;
}

/** Idempotent stream setup — called once at boot. */
export async function ensureWebhookStream(): Promise<void> {
  await NatsClient.ensureStream(WEBHOOK_STREAM, [`${SUBJECT_PREFIX}.>`]);
  console.log(`[webhook] JetStream stream ${WEBHOOK_STREAM} ensured`);
}
