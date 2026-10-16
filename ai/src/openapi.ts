/**
 * AI OpenAPI spec — generated from the same RpcRoute[] table that
 * makeRpcRouter serves (composite-route.ts) plus the canonical entity CRUD
 * blocks emitted by `entityCrudSpec` for `ai_model` and `ai_cerebellum`.
 * Single source of truth: a route that exists but isn't documented (or
 * vice versa) is impossible.
 */

import {
  buildOpenApiSpec,
  entityCrudSpec,
  makeOpenApiHandler,
  rpcSpec,
  type EntityCrudOp,
} from "@primebrick/sdk";
import { AI_ROUTES } from "./controllers/http/composite-route.js";
import { DOCS_SEARCH_ROUTES } from "./controllers/http/docs-search-route.js";

const ENTITY_OPS: EntityCrudOp[] = [
  "meta",
  "list",
  "get",
  "create",
  "update",
  "delete",
  "restore",
  "audit",
];

export const AI_OPENAPI_SPEC = buildOpenApiSpec({
  info: {
    title: "AI Catalog",
    version: "1.0.0",
    description:
      "AI chat, conversation, feedback, telemetry, embedding, ai_model/ai_cerebellum entity catalog and docs knowledge-base search microservice",
  },
  serverUrl: "http://localhost:3004",
  tags: [
    { name: "ai", description: "AI assistant endpoints" },
    { name: "conversations", description: "Conversation lifecycle" },
    { name: "feedback", description: "Message feedback" },
    { name: "telemetry", description: "Usage telemetry (admin)" },
    { name: "embeddings", description: "Docs knowledge-base embeddings" },
    { name: "ai_models", description: "AI model catalog entity" },
    { name: "ai_cerebellum", description: "Per-assistant tuning presets" },
    { name: "docs", description: "Docs knowledge-base search" },
  ],
  paths: {
    ...rpcSpec(AI_ROUTES),
    ...entityCrudSpec("ai_model", { ops: ENTITY_OPS, tag: "ai_models" }),
    ...entityCrudSpec("ai_cerebellum", { ops: ENTITY_OPS, tag: "ai_cerebellum" }),
    ...rpcSpec(DOCS_SEARCH_ROUTES),
  },
});

export const openapiRouteHandler = makeOpenApiHandler(AI_OPENAPI_SPEC);
