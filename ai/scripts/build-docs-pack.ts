/**
 * Builds dist/docs-pack for this service — copies docs/user-guide verbatim
 * and writes manifest.json (SDK buildDocsPack). Run via `pnpm generate:docs`.
 */
import { buildDocsPack } from "@primebrick/sdk";
import { aiRouteHandler } from "../src/service-routes.js";

const manifest = await buildDocsPack({
  repo: "ai",
  docsDir: "docs/user-guide",
  outDir: "dist/docs-pack",
  openapi: aiRouteHandler.spec,
});
console.log(`docs pack built: ${manifest.files.length} files${manifest.has_openapi ? " + openapi" : ""} → dist/docs-pack`);
