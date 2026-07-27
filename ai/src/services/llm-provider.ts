/**
 * LLM provider abstraction.
 *
 * Default: OpenAI-compatible runtime (mistral.rs container, Qwen3-4B-Instruct).
 * Pluggable: any OpenAI-compatible provider (OpenAI, Anthropic via proxy,
 * Zhipu GLM, DeepSeek, Groq, etc.) by changing baseURL + apiKey + model.
 *
 * Uses Vercel AI SDK 7's `createOpenAICompatible` factory.
 */
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import type { LanguageModel } from "ai";

export interface LlmProviderConfig {
  base_url: string;
  api_key: string;
  model: string;
}

let cachedModel: LanguageModel | null = null;
let cachedConfigKey: string | null = null;

/**
 * Get the configured LLM chat model.
 *
 * Config (env vars or ai.config table):
 * - LLM_BASE_URL: OpenAI-compatible base URL (default: http://localhost:8080)
 * - LLM_API_KEY: API key (default: "not-required" for local mistral.rs)
 * - LLM_MODEL: model name (default: Qwen3-4B-Instruct-2507)
 */
export function getLlmModel(config?: Partial<LlmProviderConfig>): LanguageModel {
  const baseUrl = config?.base_url ?? process.env.LLM_BASE_URL ?? "http://localhost:8080/v1";
  const apiKey = config?.api_key ?? process.env.LLM_API_KEY ?? "not-required";
  const model = config?.model ?? process.env.LLM_MODEL ?? "Qwen3-4B-Instruct-2507";

  const configKey = `${baseUrl}|${apiKey}|${model}`;
  if (cachedModel && cachedConfigKey === configKey) return cachedModel;

  const provider = createOpenAICompatible({
    name: "primebrick-llm",
    baseURL: baseUrl,
    apiKey,
  });

  cachedModel = provider.chatModel(model);
  cachedConfigKey = configKey;
  return cachedModel;
}

/**
 * Reset the cached model — used when config changes at runtime.
 */
export function resetLlmModel(): void {
  cachedModel = null;
  cachedConfigKey = null;
}
