// emailsender migration runner — uses @primebrick/sdk's applyPatches.
// The SDK is DB-agnostic; this script provides the DatabaseAdapter that wraps pg.Pool.
import "dotenv/config";
import { Pool } from "pg";
import { join } from "node:path";
import { applyPatches, type DatabasePort } from "@primebrick/sdk";

const PATCHES_DIR = join(process.cwd(), "db-meta", "patches");

// DatabaseAdapter — adapts pg.Pool to the SDK's DatabasePort interface.
class DatabaseAdapter implements DatabasePort {
  constructor(private readonly pool: Pool) {}

  async query<T = unknown>(text: string, params?: unknown[]): Promise<{ rows: T[] }> {
    return this.pool.query(text, params) as Promise<{ rows: T[] }>;
  }
}

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");

  const pool = new Pool({ connectionString: url, max: 1 });
  const db = new DatabaseAdapter(pool);

  try {
    const result = await applyPatches(PATCHES_DIR, db);
    console.log(`Migration complete: ${result.appliedOrRegistered} applied/registered, ${result.skipped} skipped.`);
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
