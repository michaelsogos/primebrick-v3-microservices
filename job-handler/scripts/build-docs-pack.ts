/**
 * Builds dist/docs-pack for this service — the pack carries the runtime
 * OpenAPI spec (`jobServiceRouteHandler.spec` — the same object the HTTP
 * layer serves at /api/v1/openapi.json). Run via `pnpm generate:docs`.
 */
import { buildDocsPack } from "@primebrick/sdk";
import { jobServiceRouteHandler } from "../src/service-routes.js";

const manifest = await buildDocsPack({
  repo: "job-handler",
  outDir: "dist/docs-pack",
  openapi: jobServiceRouteHandler.spec,
});
console.log(`docs pack built: ${manifest.files.length} files${manifest.has_openapi ? " + openapi" : ""} → dist/docs-pack`);
