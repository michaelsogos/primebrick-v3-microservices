// emailsender migration runner — uses @primebrick/sdk's applyPatches.
// The SDK is DB-agnostic; this script provides the DatabaseAdapter that wraps pg.Pool.
import "dotenv/config";
import { Pool } from "pg";
import { join } from "node:path";
import { applyPatches } from "@primebrick/sdk";
import { DatabaseAdapter } from "../src/adapters/database-adapter.js";

const PATCHES_DIR = join(process.cwd(), "db-meta", "patches");

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
