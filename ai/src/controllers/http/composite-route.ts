import type { IncomingMessage, ServerResponse } from "node:http";
import { join } from "node:path";
import { createSseWriter, mapDalError, makeRpcRouter, Permission, type RpcRoute } from "@primebrick/sdk";
import { aiConfig } from "../../config/ai-config.js";
import { HealthCheckAdapter } from "../../adapters/health-check-adapter.js";
import { getDal } from "../../db/dal.js";
import { orchestrate } from "../../services/orchestrator.js";
import type { ModelMessage } from "ai";
import {
  createConversation,
  getConversation,
  listConversations,
  listMessages,
  deleteConversation,
  updateConversationTitle,
  insertMessage,
} from "../../services/conversation-repository.js";
import {
  insertFeedback,
  listFeedbackByUser,
  getFeedbackStats,
} from "../../services/feedback-repository.js";
import {
  getTelemetryStats,
  listRecentTelemetry,
} from "../../services/telemetry-repository.js";
import { runEmbeddingPipeline } from "../../services/embedding-pipeline.js";
import { getEmbeddingProvider } from "../../services/embedding-provider.js";
import { checkRateLimit } from "../../services/rate-limiter.js";

// API gateway base URL — from module config `be_base_url` (never env).
// Set once at startup by index.ts via setBeBaseUrl(); the MCP client call
// below is the only consumer (slated for removal in B3).
let beBaseUrl: string | undefined;
export function setBeBaseUrl(url: string): void {
  beBaseUrl = url;
}

/**
 * AI routes — the ONLY shape allowed by createMicroservice: declared once as
 * RpcRoute[] and served exclusively through makeRpcRouter (auth → RBAC →
 * validation → handler → RFC 7807 baked in). The same table feeds rpcSpec()
 * in openapi.ts, so the published spec can never drift from what is served.
 *
 *   GET  /api/v1/ai/health                          — AI-specific health (LLM connectivity + model info)
 *   POST /api/v1/ai/chat                             — chat endpoint (streaming via SSE)
 *   GET  /api/v1/ai/conversations                    — list user's conversations
 *   POST /api/v1/ai/conversations                    — create a new conversation
 *   GET  /api/v1/ai/conversations/:uuid              — get a conversation with its messages
 *   PATCH /api/v1/ai/conversations/:uuid             — update conversation title
 *   DELETE /api/v1/ai/conversations/:uuid            — delete a conversation
 *   POST /api/v1/ai/feedback                         — thumbs up/down on a message
 *   GET  /api/v1/ai/feedback                         — list feedback + stats
 *   GET  /api/v1/ai/telemetry                        — admin telemetry
 *   POST /api/v1/ai/embed                            — server-side embedding for BE docs/search
 *   POST /api/v1/ai/reindex                          — admin: run the embedding pipeline
 */

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Extract JWT from Authorization header (needed by the MCP client call). */
function extractJwt(req: IncomingMessage): string | null {
  const auth = req.headers["authorization"];
  if (!auth || typeof auth !== "string") return null;
  const match = auth.match(/^Bearer\s+(.+)$/i);
  return match ? match[1] : null;
}

/** Send a manual JSON error response (non-standard statuses the router doesn't own, e.g. 429). */
function sendError(res: ServerResponse, status: number, title: string, detail: string): void {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ type: "https://primebrick.io/errors/" + title.toLowerCase().replace(/\s+/g, "-"), title, status, detail }));
}

// ─── Route declarations ─────────────────────────────────────────────────────

export const AI_ROUTES: RpcRoute[] = [
  {
    method: "GET",
    path: "/api/v1/ai/health",
    auth: "user",
    permissions: [Permission.AUTHENTICATED_USER],
    openapi: { summary: "AI service health", description: "LLM connectivity + model info.", tags: ["ai"] },
    handler: async () => {
      const llmBaseUrl = aiConfig("llm_base_url") ?? "http://localhost:8080/v1";
      const adapter = new HealthCheckAdapter(getDal().getPool());
      const llmHealth = await adapter.checkLlm(llmBaseUrl);
      return { ok: true, service: "ai", llm: llmHealth };
    },
  },

  {
    method: "POST",
    path: "/api/v1/ai/chat",
    auth: "user",
    permissions: [Permission.AUTHENTICATED_USER],
    streaming: "sse",
    body: (raw) => {
      const b = raw as { message?: unknown };
      if (!b?.message || typeof b.message !== "string") {
        throw new Error("Missing 'message' field in request body.");
      }
      return b as { message: string; conversation_uuid?: string; history?: ModelMessage[] };
    },
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
    handler: async (ctx) => {
      const { res, req, sse, user } = ctx;
      const body = ctx.body as { message: string; conversation_uuid?: string; history?: ModelMessage[] };
      const userUuid = user!.id;
      const jwt = extractJwt(req);

      if (!jwt) {
        sendError(res, 401, "Unauthorized", "Missing Authorization Bearer token — required for MCP server access.");
        return;
      }

      const rateLimit = await checkRateLimit(userUuid);
      if (!rateLimit.allowed) {
        res.writeHead(429, {
          "Content-Type": "application/json",
          "Retry-After": String(rateLimit.retryAfter ?? 60),
        });
        res.end(JSON.stringify({
          type: "https://primebrick.io/errors/rate-limited",
          title: "Rate Limited",
          status: 429,
          detail: "Too many AI chat requests. Please try again later.",
          retry_after: rateLimit.retryAfter ?? 60,
        }));
        return;
      }

      if (!beBaseUrl) {
        sendError(res, 503, "Service Unavailable", "Module config 'be_base_url' is not set.");
        return;
      }

      // Get or create conversation
      let conversationUuid = body.conversation_uuid;
      if (!conversationUuid) {
        // Create a new conversation with the first message as title
        const title = body.message.slice(0, 80) + (body.message.length > 80 ? "…" : "");
        const conv = await createConversation({ user_uuid: userUuid, title });
        conversationUuid = conv.uuid;
      } else {
        // Verify conversation ownership
        const conv = await getConversation(conversationUuid, userUuid);
        if (!conv) {
          sendError(res, 404, "Not Found", "Conversation not found or does not belong to this user.");
          return;
        }
      }

      // Persist the user's message
      await insertMessage({
        conversation_uuid: conversationUuid,
        role: "user",
        content: { text: body.message },
      });

      // Build the message history for the LLM
      const messages: ModelMessage[] = body.history ?? [];
      messages.push({ role: "user", content: body.message });

      // The lazy ctx.sse writeHeads on first send — setHeader is still legal here.
      res.setHeader("X-Conversation-UUID", conversationUuid);

      const writer = sse!;

      // Handle client abort
      const abortController = new AbortController();
      req.on("close", () => {
        if (!res.writableEnded) {
          abortController.abort();
        }
      });

      // Stream the response via the orchestrator
      await orchestrate(
        {
          beBaseUrl,
          userJwt: jwt,
          userUuid,
          userLocale: "en",
          conversationUuid,
        },
        messages,
        {
          onTextDelta: (text) => {
            writer.send({ event: "text-delta", data: { text } });
          },
          onToolCall: (toolName, args) => {
            writer.send({ event: "tool-call", data: { tool: toolName, args } });
          },
          onToolResult: (toolName, result) => {
            writer.send({ event: "tool-result", data: { tool: toolName, result } });
          },
          onClientToolCall: (toolName, args) => {
            writer.send({ event: "client-tool-call", data: { tool: toolName, args } });
          },
          onFinish: ({ text, tokensIn, tokensOut, steps }) => {
            writer.send({ event: "finish", data: { text, tokens_in: tokensIn, tokens_out: tokensOut, steps } });
            writer.close();
          },
          onError: (error) => {
            writer.send({ event: "error", data: { message: error.message } });
            writer.close();
          },
        },
      );
    },
  },

  {
    method: "GET",
    path: "/api/v1/ai/conversations",
    auth: "user",
    permissions: [Permission.AUTHENTICATED_USER],
    openapi: { summary: "List user conversations", tags: ["ai", "conversations"] },
    handler: async ({ user }) => ({ conversations: await listConversations(user!.id) }),
  },

  {
    method: "POST",
    path: "/api/v1/ai/conversations",
    auth: "user",
    permissions: [Permission.AUTHENTICATED_USER],
    body: (raw) => raw as { title?: string },
    openapi: { summary: "Create a conversation", tags: ["ai", "conversations"], requestSchema: { type: "object", properties: { title: { type: "string" } } } },
    handler: async ({ user, body, res }) => {
      const conv = await createConversation({ user_uuid: user!.id, title: (body as { title?: string }).title });
      res.writeHead(201, { "Content-Type": "application/json" });
      res.end(JSON.stringify(conv));
    },
  },

  {
    method: "GET",
    path: "/api/v1/ai/conversations/:uuid",
    auth: "user",
    permissions: [Permission.AUTHENTICATED_USER],
    openapi: { summary: "Get a conversation with its messages", tags: ["ai", "conversations"], paramSchema: { uuid: { type: "string", format: "uuid" } } },
    handler: async ({ user, params, res }) => {
      const conv = await getConversation(params.uuid, user!.id);
      if (!conv) {
        sendError(res, 404, "Not Found", "Conversation not found or does not belong to this user.");
        return;
      }
      const messages = await listMessages(params.uuid);
      return { conversation: conv, messages };
    },
  },

  {
    method: "PATCH",
    path: "/api/v1/ai/conversations/:uuid",
    auth: "user",
    permissions: [Permission.AUTHENTICATED_USER],
    body: (raw) => {
      const b = raw as { title?: unknown };
      if (!b?.title) throw new Error("Missing 'title' field.");
      return b as { title: string };
    },
    openapi: { summary: "Update conversation title", tags: ["ai", "conversations"], requestSchema: { type: "object", required: ["title"], properties: { title: { type: "string" } } } },
    handler: async ({ user, params, body, res }) => {
      const conv = await getConversation(params.uuid, user!.id);
      if (!conv) {
        sendError(res, 404, "Not Found", "Conversation not found or does not belong to this user.");
        return;
      }
      await updateConversationTitle(params.uuid, (body as { title: string }).title);
      return { ...conv, title: (body as { title: string }).title };
    },
  },

  {
    method: "DELETE",
    path: "/api/v1/ai/conversations/:uuid",
    auth: "user",
    permissions: [Permission.AUTHENTICATED_USER],
    openapi: { summary: "Delete a conversation", tags: ["ai", "conversations"], paramSchema: { uuid: { type: "string", format: "uuid" } } },
    handler: async ({ user, params, res }) => {
      const conv = await getConversation(params.uuid, user!.id);
      if (!conv) {
        sendError(res, 404, "Not Found", "Conversation not found or does not belong to this user.");
        return;
      }
      await deleteConversation(params.uuid, user!.id);
      res.writeHead(204);
      res.end();
    },
  },

  {
    method: "POST",
    path: "/api/v1/ai/feedback",
    auth: "user",
    permissions: [Permission.AUTHENTICATED_USER],
    body: (raw) => {
      const b = raw as { message_uuid?: unknown; rating?: unknown };
      if (!b?.message_uuid) throw new Error("Missing 'message_uuid' field.");
      if (b.rating !== "up" && b.rating !== "down") throw new Error("'rating' must be 'up' or 'down'.");
      return b as { message_uuid: string; conversation_uuid?: string; rating: "up" | "down"; comment?: string };
    },
    openapi: { summary: "Submit message feedback", tags: ["ai", "feedback"], requestSchema: { type: "object", required: ["message_uuid", "rating"], properties: { message_uuid: { type: "string", format: "uuid" }, rating: { type: "string", enum: ["up", "down"] }, comment: { type: "string" } } } },
    handler: async ({ user, body, res }) => {
      const b = body as { message_uuid: string; conversation_uuid?: string; rating: "up" | "down"; comment?: string };
      const feedback = await insertFeedback({
        message_uuid: b.message_uuid,
        conversation_uuid: b.conversation_uuid,
        user_uuid: user!.id,
        rating: b.rating,
        comment: b.comment,
      });
      res.writeHead(201, { "Content-Type": "application/json" });
      res.end(JSON.stringify(feedback));
    },
  },

  {
    method: "GET",
    path: "/api/v1/ai/feedback",
    auth: "user",
    permissions: [Permission.AUTHENTICATED_USER],
    openapi: { summary: "List feedback + stats", tags: ["ai", "feedback"] },
    handler: async ({ user }) => {
      const [items, stats] = await Promise.all([
        listFeedbackByUser(user!.id),
        getFeedbackStats(),
      ]);
      return { feedback: items, stats };
    },
  },

  {
    method: "GET",
    path: "/api/v1/ai/telemetry",
    auth: "user",
    permissions: [Permission.AUTHENTICATED_ADMIN],
    openapi: { summary: "AI telemetry stats (admin)", tags: ["ai", "telemetry"] },
    handler: async () => {
      const [stats, recent] = await Promise.all([
        getTelemetryStats(),
        listRecentTelemetry(50),
      ]);
      return { stats, recent };
    },
  },

  {
    method: "POST",
    path: "/api/v1/ai/embed",
    auth: "user",
    permissions: [Permission.AUTHENTICATED_USER],
    body: (raw) => {
      const b = raw as { text?: unknown };
      if (!b?.text || typeof b.text !== "string") throw new Error("Missing 'text' field in request body.");
      return b as { text: string; kind?: string };
    },
    openapi: {
      summary: "Embed query text", tags: ["ai", "embeddings"],
      description: "Server-side embedding for BE docs/search. kind=\"query\" uses the instruct query prefix; anything else embeds as a passage.",
      requestSchema: { type: "object", required: ["text"], properties: { text: { type: "string" }, kind: { type: "string", enum: ["query", "passage"] } } },
      responseSchema: { type: "object", properties: { embedding: { type: "array", items: { type: "number" } }, model: { type: "string" }, dim: { type: "integer" } } },
    },
    handler: async ({ body, res }) => {
      const b = body as { text: string; kind?: string };
      try {
        const provider = await getEmbeddingProvider();
        // kind="query" uses the instruct-style query prefix (asymmetric
        // retrieval); anything else is embedded as a passage.
        const embedding = b.kind === "query" ? await provider.embedQuery(b.text) : await provider.embed(b.text);
        return { embedding, model: provider.name, dim: provider.dimension };
      } catch (err) {
        sendError(res, 500, "Embedding Failed", err instanceof Error ? err.message : String(err));
      }
    },
  },

  {
    method: "POST",
    path: "/api/v1/ai/reindex",
    auth: "user",
    permissions: [Permission.AUTHENTICATED_ADMIN],
    openapi: { summary: "Trigger embedding re-index (admin)", tags: ["ai", "embeddings"] },
    handler: async ({ res }) => {
      const docsPath = aiConfig("docs_path") ?? join(process.cwd(), "..", "..", "primebrick-v3-docs", "pages");
      const openApiPath = aiConfig("openapi_path") ?? join(process.cwd(), "..", "..", "primebrick-v3-docs", "apis");
      try {
        return await runEmbeddingPipeline(docsPath, openApiPath);
      } catch (err) {
        const mapped = mapDalError(err, "/api/v1/actions/reindex");
        if (mapped) {
          res.writeHead(mapped.status, { "Content-Type": "application/json" });
          res.end(JSON.stringify(mapped.body));
          return;
        }
        const message = err instanceof Error ? err.message : String(err);
        sendError(res, 500, "Reindex Failed", message);
      }
    },
  },
];

export const compositeRouteHandler = makeRpcRouter(AI_ROUTES);
