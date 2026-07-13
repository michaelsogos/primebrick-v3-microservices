import type { Pool } from "pg";
import type { HealthCheckPort } from "@primebrick/sdk";
import { NatsClient } from "@primebrick/sdk";
import type { HealthCheckResult } from "@primebrick/sdk";

/**
 * Adapts pg.Pool to the SDK's HealthCheckPort interface.
 * Used by HealthCheck to verify DB connectivity via `SELECT 1`.
 *
 * Also provides a NATS connectivity check that can be used as a custom
 * health check in the HealthCheck constructor.
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

  /**
   * NATS connectivity check — used as a custom health check.
   * Returns ok=true if the NATS connection is alive.
   */
  async checkNats(): Promise<HealthCheckResult> {
    const ok = NatsClient.isConnected();
    return { ok, ...(ok ? {} : { error: "NATS connection is not alive" }) };
  }
}
