import type { Pool } from "pg";
import type { DatabasePort } from "@primebrick/sdk";

/**
 * Adapts pg.Pool to the SDK's DatabasePort interface.
 * Used by the migration runner (applyPatches) for raw SQL execution.
 */
export class DatabaseAdapter implements DatabasePort {
  constructor(private readonly pool: Pool) {}

  async query<T = unknown>(text: string, params?: unknown[]): Promise<{ rows: T[] }> {
    const result = await this.pool.query(text, params as never[]);
    return { rows: result.rows as T[] };
  }
}
