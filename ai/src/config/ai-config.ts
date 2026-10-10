/**
 * Runtime config holder for the ai microservice.
 *
 * env-policy: the ONLY env var is DATABASE_URL — every other value lives in
 * ai.config_entries, loaded once at startup by createMicroservice's
 * ConfigLoader. Request-time modules (llm-provider, embedding-provider,
 * rate-limiter, redaction, routes) read from here instead of process.env.
 *
 * Set once in index.ts onReady via initAiConfig(ctx.configLoader).
 */
import type { ConfigLoader } from "@primebrick/sdk";

let loader: ConfigLoader | null = null;

export function initAiConfig(configLoader: ConfigLoader): void {
  loader = configLoader;
}

/** Config value or null when the key is absent (or config not initialized). */
export function aiConfig(key: string): string | null {
  return loader?.get(key) ?? null;
}
