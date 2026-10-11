/**
 * Builds dist/docs-pack for this service — copies docs/user-guide verbatim
 * and writes manifest.json (SDK buildDocsPack). Run via `pnpm generate:docs`.
 */
import { buildDocsPack } from "@primebrick/sdk";
import { AI_OPENAPI_SPEC } from "../src/openapi.js";

const manifest = await buildDocsPack({
  repo: "ai",
  docsDir: "docs/user-guide",
  outDir: "dist/docs-pack",
  openapi: AI_OPENAPI_SPEC as Record<string, unknown>,
});
console.log(`docs pack built: ${manifest.files.length} files${manifest.has_openapi ? " + openapi" : ""} → dist/docs-pack`);
