/**
 * AI OpenAPI spec — generated from the same RpcRoute[] table that
 * makeRpcRouter serves (composite-route.ts). Single source of truth: a route
 * that exists but isn't documented (or vice versa) is impossible.
 */

import { buildOpenApiSpec, makeOpenApiHandler, rpcSpec } from "@primebrick/sdk";
import { AI_ROUTES } from "./controllers/http/composite-route.js";

export const AI_OPENAPI_SPEC = buildOpenApiSpec({
  info: {
    title: "AI Catalog",
    version: "1.0.0",
    description: "AI chat, conversation, feedback, telemetry and embedding microservice",
  },
  serverUrl: "http://localhost:3004",
  tags: [
    { name: "ai", description: "AI assistant endpoints" },
    { name: "conversations", description: "Conversation lifecycle" },
    { name: "feedback", description: "Message feedback" },
    { name: "telemetry", description: "Usage telemetry (admin)" },
    { name: "embeddings", description: "Docs knowledge-base embeddings" },
  ],
  paths: rpcSpec(AI_ROUTES),
});

export const openapiRouteHandler = makeOpenApiHandler(AI_OPENAPI_SPEC);
