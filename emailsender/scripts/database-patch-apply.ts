// emailsender migration runner — uses @primebrick/sdk's applyPatches.
// The SDK is DB-agnostic; this script provides the DatabaseAdapter that wraps pg.Pool.
import "dotenv/config";
import { Pool } from "pg";
import { join } from "node:path";
import { applyPatches, logger } from "@primebrick/sdk";
import { DatabaseAdapter } from "../src/adapters/database-adapter.js";

const PATCHES_DIR = join(process.cwd(), "db-meta", "patches");

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");

  const pool = new Pool({ connectionString: url, max: 1 });
  const db = new DatabaseAdapter(pool);

  try {
    const result = await applyPatches(PATCHES_DIR, db);
    logger.info(`Migration complete: ${result.appliedOrRegistered} applied/registered, ${result.skipped} skipped.`, { tags: ["db-patches"] });
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  logger.error("Migration failed", { tags: ["db-patches"], error: err });
  process.exit(1);
});
