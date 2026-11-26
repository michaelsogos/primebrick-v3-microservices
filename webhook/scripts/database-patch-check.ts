/**
 * Thin wrapper over `primebrick-db check` (the canonical implementation in
 * @primebrick/dal-pg): delegates the entity-declaration vs committed-snapshot
 * gate. The schema domain comes from OWNED_SCHEMAS — the single source of
 * truth (src/db/dal.ts), never from env.
 *
 * Snapshot mode needs no database: it is the CI/build gate — "entities
 * changed without a committed patch" exits non-zero.
 */
import { spawnSync } from "node:child_process";
import { join } from "node:path";
import { OWNED_SCHEMAS } from "../src/db/dal.js";

const cli = join(process.cwd(), "node_modules", "@primebrick", "dal-pg", "dist", "cli", "primebrick-db.js");
// Under bun the CLI imports the .ts entity registry directly — no loader
// shim needed (bun resolves TS in imported modules).
const res = spawnSync(
  "bun",
  [
    cli,
    "check",
    "--registry", "src/domain/entities/registry.ts",
    "--snapshot", "db-meta/snapshot-entities.json",
    "--schema", OWNED_SCHEMAS.join(","),
  ],
  { stdio: "inherit" },
);
process.exit(res.status ?? 1);
