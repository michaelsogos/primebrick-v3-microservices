/**
 * Builds dist/docs-pack for this service — the pack carries the runtime
 * OpenAPI spec (`webhookRouteHandler.spec` — the same object the HTTP
 * layer serves at /api/v1/openapi.json).
 * This service is dev-only for docs, so the pack is openapi-only.
 * Run via `pnpm generate:docs`.
 */
import { buildDocsPack } from "@primebrick/sdk";
import { webhookRouteHandler } from "../src/controllers/http/router.js";

const manifest = await buildDocsPack({
  repo: "webhook",
  outDir: "dist/docs-pack",
  openapi: webhookRouteHandler.spec,
});
console.log(`docs pack built: ${manifest.files.length} files${manifest.has_openapi ? " + openapi" : ""} → dist/docs-pack`);
