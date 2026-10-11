/**
 * HTTP controller — the ONLY route of the webhook service, declared as an
 * RpcRoute and served through makeRpcRouter:
 *
 *   POST /webhook/{service_code}/{intent...}
 *
 * Flow (pass-thru, zero business logic):
 *   1. api_key wall — verifyApiKey via the wired ApiKeyPort; missing/
 *      invalid → 401 (router-baked)
 *   2. Registry lookup — service known + enabled + online → routable
 *   3. JetStream publish to `webhook.<code>.received` (envelope + intent,
 *      original auth material forwarded via NATS headers)
 *   4. PubAck → 200; publish failure → 502 (provider retries)
 *
 * The service knows NOTHING about providers — `{intent...}` and the body
 * are forwarded verbatim; meaning belongs to the target microservice.
 */

import {
  extJsonStringify,
  verifyApiKey,
  HttpHeaderProvider,
  NatsClient,
  AuthError,
  makeRpcRouter,
  Permission,
  type ApiKeyPort,
  type RpcRoute,
  logger,
} from "@primebrick/sdk";
import { lookupService } from "../../registry/registry-cache.js";

const WEBHOOK_STREAM = "WEBHOOK";
const SUBJECT_PREFIX = "webhook";
const SUBJECT_SUFFIX = "received";

let apiKeyPort: ApiKeyPort | null = null;

export function setWebhookAuthDependencies(apiKey: ApiKeyPort): void {
  apiKeyPort = apiKey;
}

function sendRfcError(
  res: Parameters<RpcRoute["handler"]>[0]["res"],
  status: number,
  title: string,
  detail: string,
  internalCode: string,
  severity: string = status >= 500 ? "HIGH" : "MEDIUM",
): void {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(extJsonStringify({
    type: `https://primebrick.io/errors/${internalCode}`,
    title,
    status,
    detail,
    internal_code: internalCode,
    severity,
  }));
}

export const webhookRoutes: RpcRoute[] = [
  {
    method: "POST",
    path: "/webhook/:service_code/:intent*",
    auth: "api_key",
    openapi: {
      summary: "Inbound webhook ingress — forwards the request verbatim to the target microservice via JetStream",
      tags: ["webhook"],
    },
    permissions: [Permission.AUTHENTICATED_USER],
    rawBody: true,
    handler: async ({ params, body, req, res }) => {
      const serviceCode = params.service_code;
      const intent = params.intent ?? "";

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
        return;
      }

      // 3. Forward verbatim — envelope carries service/intent/body; NATS
      //    headers carry the original auth material for the target US.
      const rawBody = body as string;
      let parsed: unknown = null;
      if (rawBody) {
        try {
          parsed = JSON.parse(rawBody);
        } catch {
          sendRfcError(res, 400, "Invalid JSON", "Request body is not valid JSON", "WEBHOOK_INVALID_BODY", "LOW");
          return;
        }
      }
      const envelope = {
        service_code: serviceCode,
        intent,
        received_at: new Date().toISOString(),
        body: parsed,
      };
      const forwardHeaders: Record<string, string> = {};
      const auth = req.headers["authorization"];
      if (auth) forwardHeaders["authorization"] = Array.isArray(auth) ? auth[0] : auth;

      try {
        const seq = await NatsClient.jetstreamPublish(
          `${SUBJECT_PREFIX}.${serviceCode}.${SUBJECT_SUFFIX}`,
          envelope,
          forwardHeaders,
        );
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(extJsonStringify({ received: true, seq: seq.toString() }));
      } catch (error) {
        logger.error("publish error", {
          tags: ["webhook"],
          error: {
            message: error instanceof Error ? error.message : String(error),
            service: serviceCode,
            intent,
          },
        });
        // JetStream publish failed or NATS down — provider must retry.
        sendRfcError(
          res, 502, "Delivery Failed", error instanceof Error ? error.message : "failed to queue webhook", "WEBHOOK_DELIVERY_FAILED",
        );
      }
    },
  },
];

/** Factory-produced webhook router — the only legal handler shape. */
export const webhookRouteHandler = makeRpcRouter(webhookRoutes, {
  apiKeyPort: () => apiKeyPort,
});

/** Idempotent stream setup — called once at boot. */
export async function ensureWebhookStream(): Promise<void> {
  await NatsClient.ensureStream(WEBHOOK_STREAM, [`${SUBJECT_PREFIX}.>`]);
  logger.info(`JetStream stream ${WEBHOOK_STREAM} ensured`, { tags: ["webhook"] });
}
