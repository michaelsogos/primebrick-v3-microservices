import type { Pool } from "pg";
import type { HealthCheckPort, HealthCheckResult } from "@primebrick/sdk";
import { NatsClient } from "@primebrick/sdk";

/**
 * Adapts pg.Pool to the SDK's HealthCheckPort interface.
 * Used by HealthCheck to verify DB connectivity via `SELECT 1`.
 */
export class HealthCheckAdapter implements HealthCheckPort {
  constructor(private readonly pool: Pool) {}

  async ping(): Promise<boolean> {
    try {
      await this.pool.query("SELECT 1");
      return true;
    } catch {
      return false;
    }
  }

  async checkNats(): Promise<HealthCheckResult> {
    const ok = NatsClient.isConnected();
    return { ok, ...(ok ? {} : { error: "NATS connection is not alive" }) };
  }

  /**
   * LLM connectivity check — verifies the LLM endpoint is reachable and
   * extracts model name + mistral.rs version for the version panel.
   *
   * Calls the OpenAI-compatible /v1/models endpoint (works for mistral.rs,
   * llama.cpp, OpenAI, and any compatible provider).
   * Also calls /health to get the mistral.rs version (mistral.rs-specific).
   *
   * Returns: { ok, version, model } for the BE health endpoint aggregation.
   */
  async checkLlm(llmBaseUrl: string): Promise<LlmHealthResult> {
    try {
      const baseUrl = llmBaseUrl.replace(/\/v1\/?$/, "").replace(/\/$/, "");
      const v1Url = llmBaseUrl.endsWith("/v1") ? llmBaseUrl : `${baseUrl}/v1`;

      // 1. Get model info from /v1/models (OpenAI-compatible)
      const modelsRes = await fetch(`${v1Url}/models`, { signal: AbortSignal.timeout(3000) });
      if (!modelsRes.ok) {
        return { ok: false, error: `LLM /v1/models failed: HTTP ${modelsRes.status}` };
      }
      const modelsJson = (await modelsRes.json()) as { data?: Array<{ id: string; status?: string }> };
      const loadedModel = modelsJson.data?.find((m) => m.status === "loaded") ?? modelsJson.data?.[0];
      const model = loadedModel?.id ?? "unknown";

      // 2. Get mistral.rs version from /health (best-effort, may not exist for other providers)
      let version: string | undefined;
      try {
        const healthRes = await fetch(`${baseUrl}/health`, { signal: AbortSignal.timeout(2000) });
        if (healthRes.ok) {
          const healthText = await healthRes.text();
          // mistral.rs /health returns plain text version or JSON
          try {
            const healthJson = JSON.parse(healthText);
            version = healthJson.version ?? healthJson.mistralrs_version;
          } catch {
            version = healthText.trim() || undefined;
          }
        }
      } catch {
        // Version is optional — other providers may not expose /health
      }

      return { ok: true, model, ...(version ? { version } : {}) };
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : "LLM unreachable" };
    }
  }
}

export interface LlmHealthResult extends HealthCheckResult {
  model?: string;
  version?: string;
}
