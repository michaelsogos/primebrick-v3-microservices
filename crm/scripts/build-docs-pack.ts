/**
 * Builds dist/docs-pack for this service — the pack carries the runtime
 * OpenAPI spec (`compositeRouteHandler.spec` — the same object the HTTP
 * layer serves at /api/v1/openapi.json) plus the module-owned user-guide
 * pages under `docs/user-guide/` (the customer page moved here with the
 * entity — docs follow entity ownership).
 * Run via `pnpm generate:docs`.
 */
import { buildDocsPack } from "@primebrick/sdk";
import { compositeRouteHandler } from "../src/controllers/http/composite-route.js";

const manifest = await buildDocsPack({
  repo: "crm",
  docsDir: "docs/user-guide",
  outDir: "dist/docs-pack",
  openapi: compositeRouteHandler.spec,
});
console.log(`docs pack built: ${manifest.files.length} files${manifest.has_openapi ? " + openapi" : ""} → dist/docs-pack`);
