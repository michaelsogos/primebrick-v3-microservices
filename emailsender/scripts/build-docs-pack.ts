/**
 * Builds dist/docs-pack for this service — the pack carries the runtime
 * OpenAPI spec (generated from entity-CRUD metadata via entityCrudSpec).
 * This service is dev-only for docs, so the pack is openapi-only.
 * Run via `pnpm generate:docs`.
 */
import { buildDocsPack } from "@primebrick/sdk";
import { OPENAPI_SPEC } from "../src/controllers/http/openapi-route.js";

const manifest = await buildDocsPack({
  repo: "emailsender",
  outDir: "dist/docs-pack",
  openapi: OPENAPI_SPEC as Record<string, unknown>,
});
console.log(`docs pack built: ${manifest.files.length} files${manifest.has_openapi ? " + openapi" : ""} → dist/docs-pack`);
