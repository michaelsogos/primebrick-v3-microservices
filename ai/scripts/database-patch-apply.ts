// Service migration runner — thin wrapper over the dal-pg engine.
// The SAME code path runs at service boot (createMicroservice dbPatches);
// this script exists for manual/dev runs only. Pass --first-boot to
// materialize a schema that has no patch registry yet (the boot guard
// otherwise refuses — anti-bifurcation).
import "dotenv/config";
import { Pool } from "pg";
import { join } from "node:path";
import { runMigrations } from "@primebrick/dal-pg";
import { logger, assertDbEnv } from "@primebrick/sdk";
import { OWNED_SCHEMAS } from "../src/db/dal.js";

const PATCHES_DIR = join(process.cwd(), "db-meta", "patches");

async function main() {
  const { url } = assertDbEnv();
  const schema = OWNED_SCHEMAS[0];

  const pool = new Pool({ connectionString: url, max: 4 });
  try {
    const result = await runMigrations({
      pool,
      schema,
      patchesDir: PATCHES_DIR,
      allowedTrust: ["dev", "release"],
      firstBoot: process.argv.includes("--first-boot"),
      actor: `cli:${process.pid}`,
      logger,
    });
    logger.info(
      `db-migration: ${result.applied.length} applied, ${result.skipped.length} skipped, ${result.failed.length} failed`,
      { tags: ["db-patches"] },
    );
    if (result.degraded || result.failed.length || result.securityEvents.length) {
      process.exit(1);
    }
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
