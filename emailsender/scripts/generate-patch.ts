import "dotenv/config";
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { buildDatabaseSnapshot } from "../src/db/build-database-snapshot.js";
import { buildEntitySnapshot } from "../src/db/build-entity-snapshot.js";
import { buildPatchFilename, patchIdFromFilename, sha256Hex } from "../src/db/database-patch-naming.js";
import { buildSqlPatchFromMetaDiff } from "../src/db/database-patch-to-sql.js";
import { compareSnapshots } from "../src/db/schema-snapshot.js";
import { getEntityPersistenceMeta, type EntityClass } from "../src/domain/entities/entity-decorators.js";
import { ENTITY_REGISTRY } from "../src/domain/entities/registry.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const microserviceRoot = join(__dirname, "..");

function tryLoadDatabaseUrlFromEnvFile() {
  if (process.env.DATABASE_URL) return;
  try {
    const raw = readFileSync(join(microserviceRoot, ".env"), "utf8");
    for (const line of raw.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const k = trimmed.slice(0, eq).trim();
      if (k !== "DATABASE_URL") continue;
      let v = trimmed.slice(eq + 1).trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
        v = v.slice(1, -1);
      }
      process.env.DATABASE_URL = v;
      return;
    }
  } catch {
    /* no .env */
  }
}

tryLoadDatabaseUrlFromEnvFile();

const outDir = join(microserviceRoot, "db-meta");
const patchesDir = join(outDir, "patches");
mkdirSync(outDir, { recursive: true });
mkdirSync(patchesDir, { recursive: true });

const entitySnap = buildEntitySnapshot();

const url = process.env.DATABASE_URL;
if (!url) {
  writeFileSync(join(outDir, "snapshot-entities.json"), JSON.stringify(entitySnap, null, 2));
  console.warn("DATABASE_URL not set: wrote snapshot-entities.json only (no database snapshot / diff).");
  process.exit(0);
}

const tables = ENTITY_REGISTRY.map((c) => {
  const m = getEntityPersistenceMeta(c as EntityClass, "emailsender");
  return { schema: m.tableSchema, name: m.tableName };
});

const dbSnap = await buildDatabaseSnapshot(url, tables);
const diff = compareSnapshots(entitySnap, dbSnap);
const sqlPatch = buildSqlPatchFromMetaDiff(entitySnap, diff);
const bodySha = sha256Hex(sqlPatch);

writeFileSync(join(outDir, "snapshot-entities.json"), JSON.stringify(entitySnap, null, 2));
writeFileSync(join(outDir, "snapshot-database.json"), JSON.stringify(dbSnap, null, 2));
writeFileSync(join(outDir, "diff-entities-vs-database.json"), JSON.stringify(diff, null, 2));

const patchFilename = buildPatchFilename(diff);
const patchId = patchIdFromFilename(patchFilename);
const escId = patchId.replace(/'/g, "''");
const footer = `

-- === database patch registry (repeatable runs) ===
-- Create once on TARGET: see backend/src/db/database-patch-registry.ts (PATCH_REGISTRY_DDL).
-- patch_id: ${patchId}
-- content_sha256: ${bodySha}
-- After apply:
-- INSERT INTO public.primebrick_database_patch (patch_id, content_sha256)
-- VALUES ('${escId}', '${bodySha}')
-- ON CONFLICT (patch_id) DO NOTHING;
`;
const patchPath = join(patchesDir, patchFilename);
writeFileSync(patchPath, sqlPatch + footer);

if (diff.renameHeuristicUserReviewRequired) {
  console.warn(
    "renameHeuristicUserReviewRequired: ambiguous rename heuristic — do not apply likelyRenames SQL without asking the user. See diff.renameHeuristicAgentInstruction."
  );
}

console.log(`Database patch snapshots written to ${outDir}`);
console.log(`SQL patch: ${patchPath}`);
