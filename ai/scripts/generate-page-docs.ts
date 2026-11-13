/**
 * generate-page-docs — ai module user-guide pages.
 *
 * Thin service-local wiring over the shared `@primebrick/sdk` docs-gen
 * engine: imports this service's declarations NATIVELY (bun/tsx), loads
 * translations + census options from the platform DB via the shared
 * `loadDocsDbContext`, extracts facts from this service's own `fe/src`
 * remote sources (the PAGES route map in `pages.ts`, the PANELS sheet map
 * in `index.ts`) via `applyRemoteFacts`, and renders MDX into
 * `docs/user-guide/generated/` — shipped by `build-docs-pack`.
 *
 * Usage: bun scripts/generate-page-docs.ts
 * Env:   DATABASE_URL (required — .env auto-loaded by bun)
 */
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  applyRemoteFacts,
  assertWithinRoot,
  collectDocRoutes,
  foreignEntitiesFromRegistry,
  generatePageDocs,
  loadDocsCompilers,
  loadDocsDbContext,
  normalizeEntityContext,
  printDocsReport,
  sheetsFromNav,
} from "@primebrick/sdk";
import { AI_NAV } from "../src/nav-declaration.js";
import { aiEntityDecls } from "../src/controllers/http/entities-route.js";

const SERVICE_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const FE_SRC = join(SERVICE_ROOT, "fe", "src");
const OUT_DIR = join(SERVICE_ROOT, "docs", "user-guide", "generated");
assertWithinRoot(SERVICE_ROOT, OUT_DIR, FE_SRC);

const { ts, PgClient, svelte } = await loadDocsCompilers(SERVICE_ROOT);

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) throw new Error("DATABASE_URL is not set");
const pg = new PgClient({ connectionString: DATABASE_URL });
await pg.connect();
const { registry, translations, census_options, idp_name } = await loadDocsDbContext(pg, [
  "ai",
  "system",
  "public",
  "custom",
]);
await pg.end();

const routes = collectDocRoutes(AI_NAV);
const sheets = sheetsFromNav(AI_NAV);

// ── remote internals: pages.ts carries the route map, index.ts the sheet
// map — applyRemoteFacts merges both dispatch results ──
applyRemoteFacts(
  {
    mode: "remote",
    src_dir: FE_SRC,
    dispatch: [
      { file: "pages.ts", pages: true, sheets: false },
      { file: "index.ts", pages: false, sheets: true },
    ],
    assertWithinRoot,
  },
  routes,
  sheets,
  { svelte, ts },
);

const { meta_by_entity, caps_by_entity } = normalizeEntityContext(aiEntityDecls);
const report = generatePageDocs({
  service_code: "ai",
  routes,
  sheets,
  meta_by_entity,
  caps_by_entity,
  translations,
  census_options,
  foreign_entities: foreignEntitiesFromRegistry(registry, "ai"),
  idp_name,
  access_namespace: AI_NAV.access,
  out_dir: OUT_DIR,
});

printDocsReport(report, OUT_DIR);
