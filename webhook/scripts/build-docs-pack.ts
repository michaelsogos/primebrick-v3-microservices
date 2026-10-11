/**
 * Builds dist/docs-pack for this service — the pack carries the runtime
 * OpenAPI spec (generated from the route table via buildOpenApiSpec).
 * This service is dev-only for docs, so the pack is openapi-only.
 * Run via `pnpm generate:docs`.
 */
import { buildDocsPack } from "@primebrick/sdk";
import { WEBHOOK_OPENAPI_SPEC } from "../src/openapi.js";

const manifest = await buildDocsPack({
  repo: "webhook",
  outDir: "dist/docs-pack",
  openapi: WEBHOOK_OPENAPI_SPEC as Record<string, unknown>,
});
console.log(`docs pack built: ${manifest.files.length} files${manifest.has_openapi ? " + openapi" : ""} → dist/docs-pack`);
