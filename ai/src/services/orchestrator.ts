/**
 * AI Orchestrator — the core logic that ties together LLM, RAG, and MCP tools.
 *
 * Responsibilities:
 * 1. Build the system prompt (role, tone, RAG instructions, tool guidelines)
 * 2. Create the `search_docs` tool (pgvector cosine search via embedding provider)
 * 3. Connect to the BE MCP server as a client (Streamable HTTP, user's JWT)
 * 4. Merge MCP tools with the local search_docs tool
 * 5. Call `streamText` with stopWhen for multi-turn tool use
 * 6. Persist messages and tool calls via onStepFinish
 */
import { streamText, tool, stepCountIs, type ModelMessage } from "ai";
import { z } from "zod";
import { createMCPClient, type MCPClient } from "@ai-sdk/mcp";
import { getLlmModel } from "./llm-provider.js";
import { getEmbeddingProvider } from "./embedding-provider.js";
import { vectorSearch } from "./docs-kb-repository.js";
import { buildSystemPrompt } from "./system-prompt.js";
import {
  insertMessage,
} from "./conversation-repository.js";
import { insertTelemetry } from "./telemetry-repository.js";
import { isRedactionEnabled, redactPii } from "./redaction.js";

export interface OrchestratorConfig {
  /** BE base URL for MCP client (e.g. http://localhost:3001) */
  beBaseUrl: string;
  /** User's JWT (forwarded to MCP server as Bearer token) */
  userJwt: string;
  /** User UUID (for conversation ownership) */
  userUuid: string;
  /** User locale (e.g. "en", "it") */
  userLocale: string;
  /** Optional conversation UUID for existing conversations */
  conversationUuid?: string;
}

export interface StreamCallbacks {
  /** Called for each text-delta chunk */
  onTextDelta?: (text: string) => void;
  /** Called when a tool is invoked (server-side tools only) */
  onToolCall?: (toolName: string, args: unknown) => void;
  /** Called when a tool returns a result */
  onToolResult?: (toolName: string, result: unknown) => void;
  /** Called for client-side tool calls (e.g. navigate) — the frontend must handle these */
  onClientToolCall?: (toolName: string, args: unknown) => void;
  /** Called when the stream finishes */
  onFinish?: (result: {
    text: string;
    tokensIn: number;
    tokensOut: number;
    steps: number;
  }) => void;
  /** Called on error */
  onError?: (error: Error) => void;
}

/**
 * Create the search_docs tool — searches the RAG knowledge base.
 * This is a local tool (not from MCP) because it uses the embedding provider
 * and pgvector directly.
 */
function createSearchDocsTool() {
  return tool({
    description:
      "Search the Primebrick documentation knowledge base. Use this for ANY question about framework architecture, API endpoints, entity schemas, configuration, deployment, RBAC, or auth flows. Returns relevant documentation chunks with similarity scores.",
    inputSchema: z.object({
      query: z.string().describe("The search query — a natural language question or keywords."),
      repo: z.string().optional().describe("Optional repo filter (e.g. 'backend', 'frontend', 'docs')"),
    }),
    execute: async ({ query, repo }) => {
      const provider = await getEmbeddingProvider();
      const embedding = await provider.embed(query);
      const results = await vectorSearch(embedding, 4, repo);
      return {
        results: results.map((r) => ({
          repo: r.repo,
          path: r.path,
          title: r.title,
          content: r.content,
          similarity: Math.round(r.similarity * 100) / 100,
        })),
      };
    },
  });
}

/**
 * Create the navigate tool — a client-side tool that emits an event for the
 * frontend to handle. The server does NOT execute navigation; it just signals
 * the intent via the SSE stream.
 */
function createNavigateTool() {
  return tool({
    description:
      "Navigate to a page in the backoffice UI. Use this when the user asks to 'go to' or 'open' a specific page, or when the answer involves a UI action. This tool does NOT execute server-side — it signals the frontend to navigate (with user confirmation).",
    inputSchema: z.object({
      route: z.string().describe("The route path to navigate to (e.g. '/customers', '/settings/security')"),
      query: z.record(z.string(), z.string()).optional().describe("Optional query parameters for the route"),
    }),
    execute: async ({ route, query }) => {
      // This return value is sent to the LLM as the tool result.
      // The actual navigation is handled by the frontend via the SSE event.
      return { navigated: true, route, query: query ?? {} };
    },
  });
}

/**
 * Connect to the BE MCP server and retrieve the available tools.
 * The MCP client uses Streamable HTTP transport with the user's JWT.
 */
async function getMcpTools(beBaseUrl: string, userJwt: string): Promise<{
  tools: Record<string, unknown>;
  client: MCPClient;
}> {
  const client = await createMCPClient({
    transport: {
      type: "http",
      url: `${beBaseUrl}/mcp`,
      headers: {
        Authorization: `Bearer ${userJwt}`,
      },
    },
    onUncaughtError: (error) => {
      console.error("[MCP client] Uncaught error:", error);
    },
  });

  const mcpTools = await client.tools();
  return { tools: mcpTools, client };
}

/**
 * Run the AI orchestrator — streams a response to the user's message.
 *
 * @param config Orchestrator configuration
 * @param messages Conversation history (ModelMessage[] from the AI SDK)
 * @param callbacks Stream callbacks for SSE forwarding
 */
export async function orchestrate(
  config: OrchestratorConfig,
  messages: ModelMessage[],
  callbacks: StreamCallbacks,
): Promise<void> {
  let mcpClient: MCPClient | null = null;
  const startTime = Date.now();

  // Telemetry counters — tracked across all steps.
  let toolCallCount = 0;
  let ragHitCount = 0;

  try {
    // 1. Get the LLM model
    const model = getLlmModel();
    const modelName = process.env.LLM_MODEL || "unknown";

    // 2. Connect to MCP server and get tools
    const { tools: mcpTools, client } = await getMcpTools(config.beBaseUrl, config.userJwt);
    mcpClient = client;

    // 3. Merge all tools: MCP tools + local search_docs + client navigate
    const allTools = {
      ...mcpTools,
      search_docs: createSearchDocsTool(),
      navigate: createNavigateTool(),
    };

    // 4. Build system prompt
    const systemPrompt = buildSystemPrompt({
      userLocale: config.userLocale,
    });

    // 5a. Redact PII from the messages if redaction is enabled (cloud LLM only).
    // The redaction is applied to a COPY of the messages — the original messages
    // (with real PII) are persisted to the database unchanged. Only the LLM sees
    // the redacted version.
    let messagesForLlm = messages;
    if (isRedactionEnabled()) {
      messagesForLlm = messages.map((msg) => {
        if (msg.role === "user" && typeof msg.content === "string") {
          const { text } = redactPii(msg.content);
          return { ...msg, content: text };
        }
        return msg;
      });
    }

    // 6. Stream the response
    const result = streamText({
      model,
      system: systemPrompt,
      messages: messagesForLlm,
      tools: allTools,
      stopWhen: stepCountIs(8),
      onStepFinish: async (event) => {
        // Persist the assistant message (text + tool calls) to ai_messages
        if (config.conversationUuid) {
          await insertMessage({
            conversation_uuid: config.conversationUuid,
            role: "assistant",
            content: {
              text: event.text,
              tool_calls: event.toolCalls,
              tool_results: event.toolResults,
            },
            tokens_in: event.usage.inputTokens ?? 0,
            tokens_out: event.usage.outputTokens ?? 0,
          });
        }

        // Forward tool call events
        if (callbacks.onToolCall) {
          for (const tc of event.toolCalls) {
            toolCallCount++;
            // Count RAG hits: search_docs tool calls are RAG queries.
            if (tc.toolName === "search_docs") {
              ragHitCount++;
            }
            callbacks.onToolCall(tc.toolName, tc.input);
            // Client tools (navigate) get a separate callback
            if (tc.toolName === "navigate") {
              callbacks.onClientToolCall?.(tc.toolName, tc.input);
            }
          }
        }
        if (callbacks.onToolResult) {
          for (const tr of event.toolResults) {
            callbacks.onToolResult(tr.toolName, tr.output);
          }
        }
      },
    });

    // 6. Stream text deltas
    for await (const part of result.textStream) {
      callbacks.onTextDelta?.(part);
    }

    // 7. Wait for completion and get final metadata (PromiseLike in v7)
    const finalResult = await result;
    const [text, usage, steps] = await Promise.all([
      finalResult.text,
      finalResult.usage,
      finalResult.steps,
    ]);
    callbacks.onFinish?.({
      text,
      tokensIn: usage.inputTokens ?? 0,
      tokensOut: usage.outputTokens ?? 0,
      steps: steps.length,
    });

    // Insert telemetry record (fire-and-forget — don't block on it).
    void insertTelemetry({
      conversation_uuid: config.conversationUuid,
      user_uuid: config.userUuid,
      model: modelName,
      tokens_in: usage.inputTokens ?? 0,
      tokens_out: usage.outputTokens ?? 0,
      steps: steps.length,
      tool_calls: toolCallCount,
      rag_hits: ragHitCount,
      latency_ms: Date.now() - startTime,
      success: true,
    }).catch((err) => console.error("[orchestrator] Telemetry insert failed:", err));
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    callbacks.onError?.(err);

    // Insert telemetry record for failed requests too.
    void insertTelemetry({
      conversation_uuid: config.conversationUuid,
      user_uuid: config.userUuid,
      model: process.env.LLM_MODEL || "unknown",
      tokens_in: 0,
      tokens_out: 0,
      steps: 0,
      tool_calls: toolCallCount,
      rag_hits: ragHitCount,
      latency_ms: Date.now() - startTime,
      success: false,
      error: err.message,
    }).catch((telemetryErr) => console.error("[orchestrator] Telemetry insert failed:", telemetryErr));
  } finally {
    // Always close the MCP client
    if (mcpClient) {
      try {
        await mcpClient.close();
      } catch {
        // ignore close errors
      }
    }
  }
}
