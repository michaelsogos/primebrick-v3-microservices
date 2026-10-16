/**
 * Webhook OpenAPI spec — generated from the same RpcRoute[] table that
 * makeRpcRouter serves (controllers/http/router.ts). Single source of
 * truth: a route that exists but isn't documented (or vice versa) is
 * impossible.
 */

import { buildOpenApiSpec, rpcSpec } from "@primebrick/sdk";
import { webhookRoutes } from "./controllers/http/router.js";

export const WEBHOOK_OPENAPI_SPEC = buildOpenApiSpec({
  info: {
    title: "Webhook Catalog",
    version: "1.0.0",
    description:
      "Inbound webhook ingress microservice — api-key gated pass-thru that publishes requests to JetStream for the target microservice",
  },
  serverUrl: "http://localhost:3005",
  tags: [{ name: "webhook", description: "Inbound webhook ingress" }],
  paths: rpcSpec(webhookRoutes),
});
