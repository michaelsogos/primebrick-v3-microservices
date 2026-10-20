/**
 * Builds dist/docs-pack for this service — manifest-only for now (no
 * user-guide docs dir, no OpenAPI spec file yet). Run via `pnpm generate:docs`.
 */
import { buildDocsPack } from "@primebrick/sdk";

const manifest = await buildDocsPack({
  repo: "job-handler",
  outDir: "dist/docs-pack",
});
console.log(`docs pack built: ${manifest.files.length} files${manifest.has_openapi ? " + openapi" : ""} → dist/docs-pack`);
