import type { Pool } from "pg";
import type { HealthCheckPort } from "@primebrick/sdk";

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
}
