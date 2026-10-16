/**
 * AI Orchestrator — inference only. The agentic loop is CALLER-DRIVEN (B3):
 * caller-supplied tool definitions are exposed to the model as client-side
 * tools (no execute) — their calls end the step and are emitted as
 * `client-tool-call` events; the caller executes them (FE → POST
 * /api/v1/system/mcp/call on the BE, where RBAC is enforced) and resubmits
 * the updated history.
 *
 * Responsibilities:
 * 1. Build the system prompt (role, tone, RAG instructions, tool guidelines)
 * 2. Create the `search_docs` tool (pgvector cosine search — server-side,
 *    AI-domain data)
 * 3. Create the `navigate` tool (client-side signal, never executed here)
 * 4. Wrap caller-supplied tool defs as non-executing tools
 * 5. Call `streamText` with stopWhen for multi-turn LOCAL tool use
 * 6. Persist messages and tool calls via onStepFinish
 */
import { streamText, tool, stepCountIs, jsonSchema, type ModelMessage, type JSONSchema7 } from "ai";
import { z } from "zod";
import { getLlmModel } from "./llm-provider.js";
import { aiConfig } from "../config/ai-config.js";
import { getEmbeddingProvider } from "./embedding-provider.js";
import { vectorSearch } from "./docs-kb-repository.js";
import { buildSystemPrompt } from "./system-prompt.js";
import {
  insertMessage,
} from "./conversation-repository.js";
import { insertTelemetry } from "./telemetry-repository.js";
import { isRedactionEnabled, redactPii } from "./redaction.js";
import { logger } from "@primebrick/sdk";

/** Caller-supplied tool definition (from GET /api/v1/system/mcp/tools). */
export interface CallerToolDef {
  name: string;
  description: string;
  input_schema: unknown;
}

export interface OrchestratorConfig {
  /** User UUID (for conversation ownership) */
  userUuid: string;
  /** User locale (e.g. "en", "it") */
  userLocale: string;
  /** Optional conversation UUID for existing conversations */
  conversationUuid?: string;
  /** Caller-supplied tool defs — exposed to the model as client-side tools. */
  callerTools?: CallerToolDef[];
}

export interface StreamCallbacks {
  /** Called for each text-delta chunk */
  onTextDelta?: (text: string) => void;
  /** Called when a tool is invoked (server-side tools only) */
  onToolCall?: (toolName: string, args: unknown) => void;
  /** Called when a tool returns a result */
  onToolResult?: (toolName: string, result: unknown) => void;
  /** Called for client-side tool calls (caller tools + navigate) — the
   *  caller must execute them and resubmit the updated history. */
  onClientToolCall?: (toolCallId: string, toolName: string, args: unknown) => void;
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
      const embedding = await provider.embedQuery(query);
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
 * Wrap a caller-supplied tool definition as a NON-executing tool — the
 * model may call it, the call ends the step, and the caller executes it
 * out-of-band (FE → BE /system/mcp/call, RBAC-enforced).
 */
function createCallerTool(def: CallerToolDef) {
  return tool({
    description: def.description,
    inputSchema: jsonSchema(def.input_schema as JSONSchema7),
  });
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
  const startTime = Date.now();

  // Telemetry counters — tracked across all steps.
  let toolCallCount = 0;
  let ragHitCount = 0;

  // Tools without `execute` — calls end the step and surface to the caller.
  const clientToolNames = new Set(["navigate", ...(config.callerTools ?? []).map((t) => t.name)]);

  try {
    // 1. Get the LLM model
    const model = getLlmModel();
    const modelName = aiConfig("llm_model") || "unknown";

    // 2. Merge tools: caller-supplied defs first, local tools win on name
    //    conflicts (search_docs is the AI-owned RAG tool — a caller-supplied
    //    tool with the same name must not shadow it).
    const allTools = {
      ...Object.fromEntries((config.callerTools ?? []).map((d) => [d.name, createCallerTool(d)])),
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
            actor: config.userUuid,
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
            // Client tools (caller tools + navigate) get a separate
            // callback carrying the toolCallId so the caller can echo the
            // result back in the next request's history.
            if (clientToolNames.has(tc.toolName)) {
              callbacks.onClientToolCall?.(tc.toolCallId, tc.toolName, tc.input);
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
    }).catch((err) => logger.error("Telemetry insert failed", { tags: ["orchestrator"], error: err }));
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    callbacks.onError?.(err);

    // Insert telemetry record for failed requests too.
    void insertTelemetry({
      conversation_uuid: config.conversationUuid,
      user_uuid: config.userUuid,
      model: aiConfig("llm_model") || "unknown",
      tokens_in: 0,
      tokens_out: 0,
      steps: 0,
      tool_calls: toolCallCount,
      rag_hits: ragHitCount,
      latency_ms: Date.now() - startTime,
      success: false,
      error: err.message,
    }).catch((telemetryErr) => logger.error("Telemetry insert failed", { tags: ["orchestrator"], error: telemetryErr }));
  }
}