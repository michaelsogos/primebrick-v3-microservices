import type { IncomingMessage, ServerResponse } from "node:http";
import { HealthCheckAdapter } from "../adapters/health-check-adapter.js";
import { getDal } from "../db/dal.js";

/**
 * Composite route handler for the AI microservice.
 *
 * Routes:
 *   GET  /api/v1/ai/health        — AI-specific health (LLM connectivity + model info)
 *   POST /api/v1/ai/chat           — chat endpoint (streaming via SSE) [Phase 3]
 *   GET  /api/v1/ai/conversations  — list conversations [Phase 4]
 *   POST /api/v1/ai/conversations  — create conversation [Phase 4]
 *   GET  /api/v1/ai/conversations/:uuid/messages — list messages [Phase 4]
 */
export async function compositeRouteHandler(
  req: IncomingMessage,
  res: ServerResponse,
  url: URL,
): Promise<boolean> {
  // AI-specific health endpoint (extends the base /health with LLM info)
  if (url.pathname === "/api/v1/ai/health" && req.method === "GET") {
    const llmBaseUrl = process.env.LLM_BASE_URL || "http://localhost:8080";
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

  // All other AI routes — 501 Not Implemented (scaffold phase)
  if (url.pathname.startsWith("/api/v1/ai/")) {
    res.writeHead(501, { "Content-Type": "application/json" });
    res.end(JSON.stringify({
      type: "https://primebrick.io/errors/not-implemented",
      title: "Not Implemented",
      status: 501,
      detail: "AI microservice is in scaffold phase. This endpoint will be implemented in a later phase.",
    }));
    return true;
  }

  return false;
}
