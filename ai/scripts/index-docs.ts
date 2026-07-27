// index-docs script — runs the embedding pipeline to populate docs_kb.
//
// Usage:
//   bun scripts/index-docs.ts
//
// Env vars:
//   DATABASE_URL — PostgreSQL connection string (required)
//   DB_SCHEMA — schema name (default: ai)
//   DOCS_PATH — path to docs pages directory (default: ../../primebrick-v3-docs/pages)
//   OPENAPI_PATH — path to OpenAPI specs (default: ../../primebrick-v3-docs/apis)
//   EMBEDDING_PROVIDER — "transformers" (default) | "openai"
//   EMBEDDING_MODEL — model name (default: Xenova/all-MiniLM-L6-v2)
//
// This script is idempotent: re-running it only re-embeds chunks whose
// content_hash has changed. Unchanged chunks are skipped.
import "dotenv/config";
import "reflect-metadata";
import { join } from "node:path";
import { initDal, getDal } from "../src/db/dal.js";
import { runEmbeddingPipeline } from "../src/services/embedding-pipeline.js";

async function main(): Promise<void> {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set");
  }

  const schema = process.env.DB_SCHEMA || "ai";
  const docsPath = process.env.DOCS_PATH || join(process.cwd(), "..", "..", "primebrick-v3-docs", "pages");
  const openApiPath = process.env.OPENAPI_PATH || join(process.cwd(), "..", "..", "primebrick-v3-docs", "apis");

  console.log("[index-docs] Initializing DAL...");
  initDal();

  try {
    const stats = await runEmbeddingPipeline(docsPath, openApiPath);
    console.log("\n[index-docs] Pipeline complete:");
    console.log(`  Docs loaded:     ${stats.docs_loaded}`);
    console.log(`  Chunks created:  ${stats.chunks_created}`);
    console.log(`  Chunks embedded: ${stats.chunks_embedded}`);
    console.log(`  Chunks skipped:  ${stats.chunks_skipped} (unchanged)`);
    console.log(`  Chunks deleted:  ${stats.chunks_deleted} (stale)`);
    console.log(`  Errors:          ${stats.errors}`);
    console.log(`  Total in DB:     ${stats.total_in_db}`);
    console.log(`  Duration:        ${(stats.duration_ms / 1000).toFixed(1)}s`);
  } catch (error) {
    console.error("[index-docs] Pipeline failed:", error);
    process.exit(1);
  } finally {
    await getDal().close();
  }
}

main();
