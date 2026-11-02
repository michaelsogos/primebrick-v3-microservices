/**
 * generate-page-docs — ai module user-guide pages.
 *
 * Thin service-local wiring over the shared `@primebrick/sdk` docs-gen
 * engine: imports this service's declarations NATIVELY (bun/tsx), loads
 * translations + census options from the platform DB, extracts facts from
 * this service's own `fe/src` remote sources (the PAGES route map in
 * `pages.ts`, the PANELS sheet map in `index.ts`), and renders MDX into
 * `docs/user-guide/generated/` — shipped by `build-docs-pack`.
 *
 * Usage: bun scripts/generate-page-docs.ts
 * Env:   DATABASE_URL (required — .env auto-loaded by bun)
 */
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createRequire } from "node:module";
import {
  assertWithinRoot,
  collectDocRoutes,
  collectCensusOptions,
  extractRemoteFacts,
  generatePageDocs,
  mergeTranslationScopes,
  normalizeEntityContext,
  parseRemoteDispatch,
  reconcileOrder,
  sheetsFromNav,
} from "@primebrick/sdk";
import { AI_NAV } from "../src/nav-declaration.js";
import { aiEntityDecls } from "../src/controllers/http/entities-route.js";
import { AI_EVENTS } from "../src/events-declaration.js";

const SERVICE_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const FE_SRC = join(SERVICE_ROOT, "fe", "src");
const OUT_DIR = join(SERVICE_ROOT, "docs", "user-guide", "generated");
assertWithinRoot(SERVICE_ROOT, OUT_DIR, FE_SRC);

const req = createRequire(join(SERVICE_ROOT, "package.json"));
const ts = req("typescript") as typeof import("typescript");
const { Client } = req("pg") as typeof import("pg");
const svelte = (await import(pathToFileURL(join(SERVICE_ROOT, "node_modules/svelte/compiler/index.js")).href))
  .default as { parse: (s: string, o?: { modern?: boolean }) => unknown };

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) throw new Error("DATABASE_URL is not set");
const pg = new Client({ connectionString: DATABASE_URL });
await pg.connect();

// ── translations: own schema first, then the shared scopes, then every
// other service schema (the option-label lexicon for census sources) ──
const { rows: registry } = await pg.query<{ code: string; schemas: string[]; endpoints: Record<string, unknown> }>(
  `SELECT code, schemas, endpoints FROM service_registry WHERE deleted_at IS NULL`,
);
const ownSchemas = ["ai", "system", "public", "custom"];
const lexiconSchemas = [...new Set(registry.flatMap((r) => r.schemas ?? []))]
  .filter((s) => !ownSchemas.includes(s));
const dicts: Record<string, string>[] = [];
for (const s of [...ownSchemas, ...lexiconSchemas]) {
  try {
    const r = await pg.query<{ key: string; value: string }>(
      `SELECT key, value FROM ${s}.translations WHERE language='en-GB'`,
    );
    dicts.push(Object.fromEntries(r.rows.map((row) => [row.key, row.value])));
  } catch { /* schema without translations */ }
}
const translations = mergeTranslationScopes(...dicts);

const censusOptions = collectCensusOptions(
  registry.map((r) => ({
    service: r.code,
    emits: (r.endpoints?.events as { emits?: [] } | undefined)?.emits ?? [],
    callables: (r.endpoints?.callables as { callables?: [] } | undefined)?.callables ?? [],
  })),
);

let idpName: string | undefined;
try {
  const { rows: [idp] } = await pg.query<{ value: string }>(
    `SELECT value FROM public.config_entries WHERE key='idp_type' LIMIT 1`,
  );
  idpName = idp?.value ? idp.value.replace(/\b\w/g, (c: string) => c.toUpperCase()) : undefined;
} catch { /* absent */ }
await pg.end();

const routes = collectDocRoutes(AI_NAV);
const sheets = sheetsFromNav(AI_NAV);

// ── remote internals: pages.ts carries the route map, index.ts the sheet
// map — merge both dispatch results ──
const dispatch = {
  pages: parseRemoteDispatch(readFileSync(join(FE_SRC, "pages.ts"), "utf8"), {}, ts).pages,
  sheets: parseRemoteDispatch(readFileSync(join(FE_SRC, "index.ts"), "utf8"), {
    sheet_keys: sheets.map((s) => s.key),
  }, ts).sheets,
};
for (const r of routes) {
  const file = dispatch.pages[r.route];
  if (!file) continue;
  assertWithinRoot(FE_SRC, join(FE_SRC, file));
  r.facts = extractRemoteFacts(readFileSync(join(FE_SRC, file), "utf8"), r.route, { svelte, ts });
}
for (const s of sheets) {
  const file = dispatch.sheets[s.key];
  if (!file) continue;
  assertWithinRoot(FE_SRC, join(FE_SRC, file));
  s.facts = extractRemoteFacts(readFileSync(join(FE_SRC, file), "utf8"), `sheet:${s.key}`, { svelte, ts });
}
for (const s of sheets) {
  s.opened_by = routes
    .filter((r) => r.facts?.sheetOpenings?.includes(s.key))
    .map((r) => r.route);
}

const { metaByEntity, capsByEntity } = normalizeEntityContext(aiEntityDecls);
const report = generatePageDocs({
  service_code: "ai",
  routes,
  sheets,
  metaByEntity,
  capsByEntity,
  translations,
  census_options: censusOptions,
  idp_name: idpName,
  access_namespace: AI_NAV.access,
  out_dir: OUT_DIR,
});

console.log(`generated ${report.emitted.length} page(s) → docs/user-guide/generated`);
for (const f of report.emitted) console.log(`  + ${f}`);
if (report.skipped.length) {
  console.warn(`coverage: ${report.skipped.length} declared route(s) produced no document:`);
  for (const s of report.skipped) console.warn(`  - ${s.route} (${s.reason})`);
}
if (report.ghosts_deleted.length) {
  console.log(`ghosts deleted: ${report.ghosts_deleted.join(", ")}`);
}
const ord = reconcileOrder(OUT_DIR);
if (ord.added.length || ord.dropped.length) {
  console.log(`_order.json: +${ord.added.length} -${ord.dropped.length}`);
}
