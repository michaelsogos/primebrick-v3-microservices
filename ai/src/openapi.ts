/**
 * AI OpenAPI spec — generated from the same route declarations that drive
 * discovery. Routes still served by the legacy compositeRouteHandler are
 * documented here as OpenApiRouteDoc entries; when a route migrates to
 * makeRpcRouter it moves from this table into the router's `openapi` field
 * and the spec keeps working unchanged.
 */

import { buildOpenApiSpec, makeOpenApiHandler, rpcSpec, type OpenApiRouteDoc } from "@primebrick/sdk";

const AI_ROUTES: OpenApiRouteDoc[] = [
  {
    method: "GET", path: "/api/v1/ai/health", auth: "user",
    openapi: { summary: "AI service health", description: "LLM connectivity + model info.", tags: ["ai"] },
  },
  {
    method: "POST", path: "/api/v1/ai/chat", auth: "user", streaming: "sse", body: (r) => r,
    openapi: {
      summary: "Chat with AI (SSE streaming)",
      description: "Streams tokens via Server-Sent Events: text-delta, tool-call, tool-result, client-tool-call, finish, error. Returns X-Conversation-UUID header.",
      tags: ["ai"],
      requestSchema: {
        type: "object", required: ["message"],
        properties: {
          message: { type: "string" },
          conversation_uuid: { type: "string", format: "uuid" },
          history: { type: "array", items: { type: "object" } },
        },
      },
    },
  },
  {
    method: "GET", path: "/api/v1/ai/conversations", auth: "user",
    openapi: { summary: "List user conversations", tags: ["ai", "conversations"] },
  },
  {
    method: "POST", path: "/api/v1/ai/conversations", auth: "user", body: (r) => r,
    openapi: { summary: "Create a conversation", tags: ["ai", "conversations"], requestSchema: { type: "object", properties: { title: { type: "string" } } } },
  },
  {
    method: "GET", path: "/api/v1/ai/conversations/:uuid", auth: "user",
    openapi: { summary: "Get a conversation with its messages", tags: ["ai", "conversations"], paramSchema: { uuid: { type: "string", format: "uuid" } } },
  },
  {
    method: "PATCH", path: "/api/v1/ai/conversations/:uuid", auth: "user", body: (r) => r,
    openapi: { summary: "Update conversation title", tags: ["ai", "conversations"], requestSchema: { type: "object", required: ["title"], properties: { title: { type: "string" } } } },
  },
  {
    method: "DELETE", path: "/api/v1/ai/conversations/:uuid", auth: "user",
    openapi: { summary: "Delete a conversation", tags: ["ai", "conversations"], paramSchema: { uuid: { type: "string", format: "uuid" } } },
  },
  {
    method: "POST", path: "/api/v1/ai/feedback", auth: "user", body: (r) => r,
    openapi: { summary: "Submit message feedback", tags: ["ai", "feedback"], requestSchema: { type: "object", required: ["message_uuid", "rating"], properties: { message_uuid: { type: "string", format: "uuid" }, rating: { type: "string", enum: ["up", "down"] }, comment: { type: "string" } } } },
  },
  {
    method: "GET", path: "/api/v1/ai/feedback", auth: "user",
    openapi: { summary: "List feedback + stats", tags: ["ai", "feedback"] },
  },
  {
    method: "GET", path: "/api/v1/ai/telemetry", auth: "user",
    openapi: { summary: "AI telemetry stats (admin)", tags: ["ai", "telemetry"] },
  },
  {
    method: "POST", path: "/api/v1/ai/embed", auth: "user", body: (r) => r,
    openapi: {
      summary: "Embed query text", tags: ["ai", "embeddings"],
      description: "Server-side embedding for BE docs/search. kind=\"query\" uses the instruct query prefix; anything else embeds as a passage.",
      requestSchema: { type: "object", required: ["text"], properties: { text: { type: "string" }, kind: { type: "string", enum: ["query", "passage"] } } },
      responseSchema: { type: "object", properties: { embedding: { type: "array", items: { type: "number" } }, model: { type: "string" }, dim: { type: "integer" } } },
    },
  },
  {
    method: "POST", path: "/api/v1/ai/reindex", auth: "user",
    openapi: { summary: "Trigger embedding re-index (admin)", tags: ["ai", "embeddings"] },
  },
];

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
