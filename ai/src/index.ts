import "dotenv/config";
import "reflect-metadata";
import { join } from "node:path";
import { createMicroservice, logger, composeRouteHandlers, pgServerBanner } from "@primebrick/sdk";
import { runEmbeddingPipeline } from "./services/embedding-pipeline.js";
import { initDal, getDal } from "./db/dal.js";
import { compositeRouteHandler } from "./controllers/http/composite-route.js";
import { aiEntityRouteHandler } from "./controllers/http/entities-route.js";
import { docsSearchRouteHandler } from "./controllers/http/docs-search-route.js";
import { openapiRouteHandler } from "./openapi.js";
import {
  ConfigRepositoryAdapter,
  HealthCheckAdapter,
  AiAuthConfigPort,
} from "./adapters/index.js";
import { initAiConfig, aiConfig } from "./config/ai-config.js";

async function main(): Promise<void> {
  await createMicroservice({
    serviceName: "ai",
    serviceDisplayName: "AI Assistant",
    serviceDescription: "AI chat microservice with RAG knowledge base",
    icon: "sparkles",
    iconType: "icon",

    envSchema: {
      DATABASE_URL: { required: true, description: "PostgreSQL connection string" },
      DB_SCHEMA: { required: false, default: "ai", description: "Database schema name" },
    },

    initDal,
    dalClose: async () => { await getDal().close(); },
    dbBanner: () => pgServerBanner(getDal().getPool(), process.env.DATABASE_URL!),

    configRepositoryAdapter: () => new ConfigRepositoryAdapter(),
    authConfigPort: (configLoader) => new AiAuthConfigPort(configLoader),
    // Lazy: getDal() only works after initDal ran inside createMicroservice.
    healthCheckPort: () => new HealthCheckAdapter(getDal().getPool()),

    routeHandler: composeRouteHandlers(openapiRouteHandler, compositeRouteHandler, aiEntityRouteHandler, docsSearchRouteHandler),

    customHealthChecks: {
      llm: async () => new HealthCheckAdapter(getDal().getPool()).checkLlm(aiConfig("llm_base_url") ?? "http://localhost:8080/v1"),
    },

    onReady: async (ctx) => {
      // Runtime config holder — every module reads ai.config_entries via
      // aiConfig() from here on. env-policy: only DATABASE_URL is env.
      initAiConfig(ctx.configLoader);

      // Startup reconcile: incremental docs_kb reindex in background.
      // Hash-diff makes unchanged chunks free; the service stays usable
      // while indexing catches up (fire-and-forget by design).
      const docsPath = aiConfig("docs_path") ?? join(process.cwd(), "..", "..", "primebrick-v3-docs", "pages");
      const openApiPath = aiConfig("openapi_path") ?? join(process.cwd(), "..", "..", "primebrick-v3-docs", "apis");
      void runEmbeddingPipeline(docsPath, openApiPath)
        .then((s) => logger.info(`done: ${s.chunks_embedded} embedded, ${s.chunks_skipped} skipped, ${s.chunks_deleted} deleted (${s.duration_ms}ms)`, { tags: ["docs-reconcile"] }))
        .catch((err) => logger.error("failed", { tags: ["docs-reconcile"], error: err instanceof Error ? err.message : err }));
    },
  });
}

main().catch((error) => {
  logger.error("Fatal error", { tags: ["core"], error });
  process.exit(1);
});