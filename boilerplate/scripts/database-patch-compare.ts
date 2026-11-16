/**
 * Thin wrapper over `primebrick-db compare` (the canonical implementation in
 * @primebrick/dal-pg): loads DATABASE_URL from .env and delegates.
 *
 * The CLI performs static annotation extraction on the entity registry —
 * deterministic column types with NO `design:type` dependence. Do NOT
 * reimplement snapshot building here: the runtime-only path silently
 * degrades every column to `text` and emits catastrophic drift patches.
 *
 * SQL patches: `db-meta/patches/<UTC_yyyyMMddHHmmss>_<slug>.sql`
 * After generation: `primebrick-db sign --db-meta db-meta ...` seals the
 * manifest — unsigned manifests are refused by the apply engine (fail-closed).
 */
import "dotenv/config";
import { spawnSync } from "node:child_process";
import { join } from "node:path";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is not set");

const cli = join(process.cwd(), "node_modules", "@primebrick", "dal-pg", "dist", "cli", "primebrick-db.js");
// Under bun the CLI imports the .ts entity registry directly — no loader
// shim needed (bun resolves TS in imported modules).
const res = spawnSync(
  "bun",
  [
    cli,
    "compare",
    "--registry", "src/domain/entities/registry.ts",
    "--url", url,
    "--out", "db-meta",
  ],
  { stdio: "inherit" },
);
process.exit(res.status ?? 1);
