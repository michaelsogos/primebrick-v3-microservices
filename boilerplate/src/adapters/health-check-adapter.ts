import type { Dal } from "@primebrick/dal-pg";
import type { HealthCheckPort } from "@primebrick/sdk";

/**
 * Adapts dal-pg to the SDK's HealthCheckPort interface.
 * Used by HealthCheck to verify DB connectivity. `Dal` arrives by
 * constructor injection (wired in index.ts) — the type is exported
 * type-only, the class itself is not constructible by consumers.
 */
export class HealthCheckAdapter implements HealthCheckPort {
  constructor(private readonly db: Dal) {}

  async ping(): Promise<boolean> {
    try {
      await this.db.serverVersion();
      return true;
    } catch {
      return false;
    }
  }
}
