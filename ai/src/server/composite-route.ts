import type { IncomingMessage, ServerResponse } from "node:http";
import { createSseWriter } from "@primebrick/sdk";
import { HealthCheckAdapter } from "../adapters/health-check-adapter.js";
import { getDal } from "../db/dal.js";
import { orchestrate } from "../services/orchestrator.js";
import type { ModelMessage } from "ai";
import {
  createConversation,
  getConversation,
  listConversations,
  listMessages,
  deleteConversation,
  updateConversationTitle,
  insertMessage,
} from "../services/conversation-repository.js";
import {
  insertFeedback,
  listFeedbackByUser,
  getFeedbackStats,
} from "../services/feedback-repository.js";
import {
  getTelemetryStats,
  listRecentTelemetry,
} from "../services/telemetry-repository.js";
import { runEmbeddingPipeline } from "../services/embedding-pipeline.js";
import { checkRateLimit } from "../services/rate-limiter.js";

/**
 * Composite route handler for the AI microservice.
 *
 * Routes:
 *   GET  /api/v1/ai/health                          — AI-specific health (LLM connectivity + model info)
 *   POST /api/v1/ai/chat                             — chat endpoint (streaming via SSE)
 *   GET  /api/v1/ai/conversations                    — list user's conversations
 *   POST /api/v1/ai/conversations                    — create a new conversation
 *   GET  /api/v1/ai/conversations/:uuid              — get a conversation with its messages
 *   PATCH /api/v1/ai/conversations/:uuid             — update conversation title
 *   DELETE /api/v1/ai/conversations/:uuid            — delete a conversation
 */
export async function compositeRouteHandler(
  req: IncomingMessage,
  res: ServerResponse,
  url: URL,
): Promise<boolean> {

  // ─── AI health endpoint ─────────────────────────────────────────────────────
  if (url.pathname === "/api/v1/ai/health" && req.method === "GET") {
    const llmBaseUrl = process.env.LLM_BASE_URL || "http://localhost:8080/v1";
    const adapter = new HealthCheckAdapter(getDal().getPool());
    const llmHealth = await adapter.checkLlm(llmBaseUrl);
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({
      ok: true,
      service: "ai",
      llm: llmHealth,
    }));
    return true;
  }

  // ─── Chat endpoint (SSE streaming) ──────────────────────────────────────────
  if (url.pathname === "/api/v1/ai/chat" && req.method === "POST") {
    return handleChat(req, res);
  }

  // ─── Conversations endpoints ────────────────────────────────────────────────
  if (url.pathname === "/api/v1/ai/conversations" && req.method === "GET") {
    return handleListConversations(req, res);
  }

  if (url.pathname === "/api/v1/ai/conversations" && req.method === "POST") {
    return handleCreateConversation(req, res);
  }

  // Conversation by UUID: /api/v1/ai/conversations/:uuid
  const conversationMatch = url.pathname.match(/^\/api\/v1\/ai\/conversations\/([^/]+)$/);
  if (conversationMatch) {
    const conversationUuid = conversationMatch[1];
    if (req.method === "GET") {
      return handleGetConversation(req, res, conversationUuid);
    }
    if (req.method === "PATCH") {
      return handleUpdateConversation(req, res, conversationUuid);
    }
    if (req.method === "DELETE") {
      return handleDeleteConversation(req, res, conversationUuid);
    }
  }

  // ─── Feedback endpoint (thumbs up/down on assistant messages) ───────────────
  if (url.pathname === "/api/v1/ai/feedback" && req.method === "POST") {
    return handlePostFeedback(req, res);
  }

  if (url.pathname === "/api/v1/ai/feedback" && req.method === "GET") {
    return handleListFeedback(req, res);
  }

  // ─── Telemetry endpoint (admin only — aggregate stats + recent requests) ────
  if (url.pathname === "/api/v1/ai/telemetry" && req.method === "GET") {
    return handleGetTelemetry(req, res);
  }

  // ─── Re-index endpoint (admin only — triggers the embedding pipeline) ───────
  if (url.pathname === "/api/v1/ai/reindex" && req.method === "POST") {
    return handleReindex(req, res);
  }

  // All other AI routes — 501 Not Implemented
  if (url.pathname.startsWith("/api/v1/ai/")) {
    res.writeHead(501, { "Content-Type": "application/json" });
    res.end(JSON.stringify({
      type: "https://primebrick.io/errors/not-implemented",
      title: "Not Implemented",
      status: 501,
      detail: "This AI endpoint is not yet implemented.",
    }));
    return true;
  }

  return false;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Extract user info from GATEWAY-RESOLVED headers. */
function getUserInfo(req: IncomingMessage): {
  userUuid: string;
  email: string;
  name: string;
  jwt: string | null;
} {
  return {
    userUuid: req.headers["x-user-id"] as string,
    email: (req.headers["x-user-email"] as string) ?? "",
    name: (req.headers["x-user-name"] as string) ?? "",
    jwt: extractJwt(req),
  };
}

/** Extract JWT from Authorization header. */
function extractJwt(req: IncomingMessage): string | null {
  const auth = req.headers["authorization"];
  if (!auth || typeof auth !== "string") return null;
  const match = auth.match(/^Bearer\s+(.+)$/i);
  return match ? match[1] : null;
}

/** Read request body as JSON. */
function readJsonBody(req: IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => { body += chunk; });
    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        reject(e);
      }
    });
    req.on("error", reject);
  });
}

/** Send a JSON error response. */
function sendError(res: ServerResponse, status: number, title: string, detail: string): void {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ type: "https://primebrick.io/errors/" + title.toLowerCase().replace(/\s+/g, "-"), title, status, detail }));
}

// ─── Chat handler ────────────────────────────────────────────────────────────

async function handleChat(req: IncomingMessage, res: ServerResponse): Promise<boolean> {
  const { userUuid, jwt } = getUserInfo(req);

  if (!userUuid) {
    sendError(res, 401, "Unauthorized", "Missing x-user-id header — not authenticated via gateway.");
    return true;
  }

  if (!jwt) {
    sendError(res, 401, "Unauthorized", "Missing Authorization Bearer token — required for MCP server access.");
    return true;
  }

  // Rate limit check
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
    return true;
  }

  const body = await readJsonBody(req) as {
    message?: string;
    conversation_uuid?: string;
    history?: ModelMessage[];
  };

  if (!body.message || typeof body.message !== "string") {
    sendError(res, 400, "Bad Request", "Missing 'message' field in request body.");
    return true;
  }

  // Determine BE base URL for MCP client
  const beBaseUrl = process.env.BE_BASE_URL || "http://localhost:3001";

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
      return true;
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

  // Set the conversation UUID as a response header BEFORE creating the SseWriter.
  // createSseWriter calls res.writeHead(200, SSE_HEADERS) internally, which merges
  // with any previously-set headers via res.setHeader. This is the cleanest way
  // to add an extra header alongside the standard SSE headers.
  res.setHeader("X-Conversation-UUID", conversationUuid);

  // Use the SDK's SseWriter for W3C EventSource-compliant writes with
  // BigInt-safe serialization (extJsonStringify). This replaces raw res.write()
  // and ensures the AI microservice follows the same SSE standard as the BE.
  const writer = createSseWriter(res);

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

  return true;
}

// ─── Conversation handlers ───────────────────────────────────────────────────

async function handleListConversations(req: IncomingMessage, res: ServerResponse): Promise<boolean> {
  const { userUuid } = getUserInfo(req);
  if (!userUuid) {
    sendError(res, 401, "Unauthorized", "Missing x-user-id header.");
    return true;
  }
  const conversations = await listConversations(userUuid);
  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ conversations }));
  return true;
}

async function handleCreateConversation(req: IncomingMessage, res: ServerResponse): Promise<boolean> {
  const { userUuid } = getUserInfo(req);
  if (!userUuid) {
    sendError(res, 401, "Unauthorized", "Missing x-user-id header.");
    return true;
  }
  const body = await readJsonBody(req) as { title?: string };
  const conv = await createConversation({ user_uuid: userUuid, title: body.title });
  res.writeHead(201, { "Content-Type": "application/json" });
  res.end(JSON.stringify(conv));
  return true;
}

async function handleGetConversation(req: IncomingMessage, res: ServerResponse, uuid: string): Promise<boolean> {
  const { userUuid } = getUserInfo(req);
  if (!userUuid) {
    sendError(res, 401, "Unauthorized", "Missing x-user-id header.");
    return true;
  }
  const conv = await getConversation(uuid, userUuid);
  if (!conv) {
    sendError(res, 404, "Not Found", "Conversation not found or does not belong to this user.");
    return true;
  }
  const messages = await listMessages(uuid);
  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ conversation: conv, messages }));
  return true;
}

async function handleUpdateConversation(req: IncomingMessage, res: ServerResponse, uuid: string): Promise<boolean> {
  const { userUuid } = getUserInfo(req);
  if (!userUuid) {
    sendError(res, 401, "Unauthorized", "Missing x-user-id header.");
    return true;
  }
  const conv = await getConversation(uuid, userUuid);
  if (!conv) {
    sendError(res, 404, "Not Found", "Conversation not found or does not belong to this user.");
    return true;
  }
  const body = await readJsonBody(req) as { title?: string };
  if (!body.title) {
    sendError(res, 400, "Bad Request", "Missing 'title' field.");
    return true;
  }
  await updateConversationTitle(uuid, body.title);
  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ ...conv, title: body.title }));
  return true;
}

async function handleDeleteConversation(req: IncomingMessage, res: ServerResponse, uuid: string): Promise<boolean> {
  const { userUuid } = getUserInfo(req);
  if (!userUuid) {
    sendError(res, 401, "Unauthorized", "Missing x-user-id header.");
    return true;
  }
  const conv = await getConversation(uuid, userUuid);
  if (!conv) {
    sendError(res, 404, "Not Found", "Conversation not found or does not belong to this user.");
    return true;
  }
  await deleteConversation(uuid, userUuid);
  res.writeHead(204);
  res.end();
  return true;
}

// ─── Feedback handlers ──────────────────────────────────────────────────────

async function handlePostFeedback(req: IncomingMessage, res: ServerResponse): Promise<boolean> {
  const { userUuid } = getUserInfo(req);
  if (!userUuid) {
    sendError(res, 401, "Unauthorized", "Missing x-user-id header.");
    return true;
  }
  const body = await readJsonBody(req) as {
    message_uuid?: string;
    conversation_uuid?: string;
    rating?: string;
    comment?: string;
  };
  if (!body.message_uuid) {
    sendError(res, 400, "Bad Request", "Missing 'message_uuid' field.");
    return true;
  }
  if (body.rating !== "up" && body.rating !== "down") {
    sendError(res, 400, "Bad Request", "'rating' must be 'up' or 'down'.");
    return true;
  }
  const feedback = await insertFeedback({
    message_uuid: body.message_uuid,
    conversation_uuid: body.conversation_uuid,
    user_uuid: userUuid,
    rating: body.rating as "up" | "down",
    comment: body.comment,
  });
  res.writeHead(201, { "Content-Type": "application/json" });
  res.end(JSON.stringify(feedback));
  return true;
}

async function handleListFeedback(req: IncomingMessage, res: ServerResponse): Promise<boolean> {
  const { userUuid } = getUserInfo(req);
  if (!userUuid) {
    sendError(res, 401, "Unauthorized", "Missing x-user-id header.");
    return true;
  }
  const [items, stats] = await Promise.all([
    listFeedbackByUser(userUuid),
    getFeedbackStats(),
  ]);
  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ feedback: items, stats }));
  return true;
}

// ─── Telemetry handler (admin only) ─────────────────────────────────────────

async function handleGetTelemetry(req: IncomingMessage, res: ServerResponse): Promise<boolean> {
  const { userUuid } = getUserInfo(req);
  if (!userUuid) {
    sendError(res, 401, "Unauthorized", "Missing x-user-id header.");
    return true;
  }
  // Admin-only: the gateway sets x-user-is-admin for administrators.
  const isAdmin = req.headers["x-user-is-admin"] === "true";
  if (!isAdmin) {
    sendError(res, 403, "Forbidden", "Telemetry access requires administrator privileges.");
    return true;
  }
  const [stats, recent] = await Promise.all([
    getTelemetryStats(),
    listRecentTelemetry(50),
  ]);
  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ stats, recent }));
  return true;
}

// ─── Re-index handler (admin only) ──────────────────────────────────────────

async function handleReindex(req: IncomingMessage, res: ServerResponse): Promise<boolean> {
  const { userUuid } = getUserInfo(req);
  if (!userUuid) {
    sendError(res, 401, "Unauthorized", "Missing x-user-id header.");
    return true;
  }
  const isAdmin = req.headers["x-user-is-admin"] === "true";
  if (!isAdmin) {
    sendError(res, 403, "Forbidden", "Re-indexing requires administrator privileges.");
    return true;
  }
  const docsPath = process.env.DOCS_PATH || "";
  const openApiPath = process.env.OPENAPI_PATH || "";
  if (!docsPath || !openApiPath) {
    sendError(res, 500, "Config Error", "DOCS_PATH or OPENAPI_PATH env vars are not set.");
    return true;
  }
  try {
    const stats = await runEmbeddingPipeline(docsPath, openApiPath);
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(stats));
    return true;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    sendError(res, 500, "Reindex Failed", message);
    return true;
  }
}
