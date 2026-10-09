// index-docs script — runs the embedding pipeline to populate docs_kb.
//
// Usage:
//   bun scripts/index-docs.ts [--full]
//   --full  truncate docs_kb first, then re-embed everything (explicit
//           destructive reinit — provider/dimension change, corrupted KB)
//
// Env vars:
//   DATABASE_URL — PostgreSQL connection string (required)
//   DB_SCHEMA — schema name (default: ai)
//   DOCS_PATH — path to docs pages directory (default: ../../primebrick-v3-docs/pages)
//   OPENAPI_PATH — path to OpenAPI specs (default: ../../primebrick-v3-docs/apis)
//   EMBEDDING_PROVIDER — "transformers" (default) | "openai"
//   EMBEDDING_MODEL — model name (default: lmo3/multilingual-e5-large-instruct, 1024-dim)
//
// This script is idempotent: re-running it only re-embeds chunks whose
// content_hash has changed. Unchanged chunks are skipped.
import "dotenv/config";
import "reflect-metadata";
import { join } from "node:path";
import { initDal, getDal } from "../src/db/dal.js";
import { runEmbeddingPipeline } from "../src/services/embedding-pipeline.js";
import { logger } from "@primebrick/sdk";

async function main(): Promise<void> {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set");
  }

  const schema = process.env.DB_SCHEMA || "ai";
  const docsPath = process.env.DOCS_PATH || join(process.cwd(), "..", "..", "primebrick-v3-docs", "pages");
  const openApiPath = process.env.OPENAPI_PATH || join(process.cwd(), "..", "..", "primebrick-v3-docs", "apis");

  logger.info("Initializing DAL...", { tags: ["index-docs"] });
  initDal();

  try {
    const full = process.argv.includes("--full");
    if (full) logger.info("--full: docs_kb will be truncated before re-embed", { tags: ["index-docs"] });
    const stats = await runEmbeddingPipeline(docsPath, openApiPath, { full });
    logger.info("Pipeline complete:", { tags: ["index-docs"], stats });
  } catch (error) {
    logger.error("Pipeline failed", { tags: ["index-docs"], error });
    process.exit(1);
  } finally {
    await getDal().close();
  }
}

main();