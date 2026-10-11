import "dotenv/config";
import "reflect-metadata";
import { join } from "node:path";
import { createMicroservice, logger, composeRouteHandlers, pgServerBanner, docsPackRouteHandler } from "@primebrick/sdk";
import { runEmbeddingPipeline } from "./services/embedding-pipeline.js";
import { initDal, getDal } from "./db/dal.js";
import { compositeRouteHandler } from "./controllers/http/composite-route.js";
import { aiEntityRouteHandler } from "./controllers/http/entities-route.js";
import { docsSearchRouteHandler } from "./controllers/http/docs-search-route.js";
import { startDocsPackSubscriber } from "./controllers/nats-sub/docs-pack-subscriber.js";
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

    routeHandler: composeRouteHandlers(openapiRouteHandler, compositeRouteHandler, aiEntityRouteHandler, docsSearchRouteHandler, docsPackRouteHandler(join(process.cwd(), "dist", "docs-pack"))),

    customHealthChecks: {
      llm: async () => new HealthCheckAdapter(getDal().getPool()).checkLlm(aiConfig("llm_base_url") ?? "http://localhost:8080/v1"),
    },

    onReady: async (ctx) => {
      // Runtime config holder — every module reads ai.config_entries via
      // aiConfig() from here on. env-policy: only DATABASE_URL is env.
      initAiConfig(ctx.configLoader);

      // Filesystem pipeline — DEV FALLBACK ONLY. In production the KB is
      // fed by service docs packs (lifecycle pull below); the FS pipeline
      // couples the service to the v3-docs repo layout and is opt-in via
      // the `docs_fs_pipeline` config key.
      if (aiConfig("docs_fs_pipeline") === "true") {
        const docsPath = aiConfig("docs_path") ?? join(process.cwd(), "..", "..", "primebrick-v3-docs", "pages");
        void runEmbeddingPipeline(docsPath)
          .then((s) => logger.info(`done: ${s.chunks_embedded} embedded, ${s.chunks_skipped} skipped, ${s.chunks_deleted} deleted (${s.duration_ms}ms)`, { tags: ["docs-reconcile"] }))
          .catch((err) => logger.error("failed", { tags: ["docs-reconcile"], error: err instanceof Error ? err.message : err }));
      }

      // Docs-pack lifecycle ingestion: pull packs on service.register
      // (docs_pack capability), drop repo docs on unregister, and pull the
      // BE pack once at startup (the BE never registers via NATS).
      await startDocsPackSubscriber(aiConfig("be_base_url") ?? "http://localhost:3001");
    },
  });
}

main().catch((error) => {
  logger.error("Fatal error", { tags: ["core"], error });
  process.exit(1);
});