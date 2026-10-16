import type { Dal } from "@primebrick/dal-pg";
import type { HealthCheckPort } from "@primebrick/sdk";

/**
 * Adapts dal-pg to the SDK's HealthCheckPort interface.
 * Used by HealthCheck to verify DB connectivity.
 */
export class HealthCheckAdapter implements HealthCheckPort {
  constructor(private readonly dal: Dal) {}

  async ping(): Promise<boolean> {
    try {
      await this.dal.serverVersion();
      return true;
    } catch {
      return false;
    }
  }
}
