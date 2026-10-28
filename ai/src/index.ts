import "dotenv/config";
import "reflect-metadata";
import { join } from "node:path";
import { createMicroservice, logger, pgServerBanner, assertDbEnv } from "@primebrick/sdk";
import * as dalMigrations from "@primebrick/dal-pg";
import { ENTITY_REGISTRY } from "./domain/entities/registry.js";
import { runEmbeddingPipeline } from "./services/embedding-pipeline.js";
import { initDal, getDal } from "./db/dal.js";

import { startDocsPackSubscriber } from "./controllers/nats-sub/docs-pack-subscriber.js";
import { startPartitionMaintenanceJob } from "./controllers/nats-sub/partition-jobs.js";
import { aiRouteHandler } from "./service-routes.js";
import {
  ConfigRepositoryAdapter,
  HealthCheckAdapter,
  AiAuthConfigPort,
} from "./adapters/index.js";
import { initAiConfig, aiConfig } from "./config/ai-config.js";
import { AI_NAV } from "./nav-declaration.js";
import { AI_EVENTS } from "./events-declaration.js";

async function main(): Promise<void> {
  await createMicroservice({
    serviceName: "ai",
    serviceDisplayName: "AI Assistants Manager",
    labelKey: "ai.module.name",
    serviceDescription: "AI chat microservice with RAG knowledge base",
    icon: "sparkles",
    iconType: "icon",

    // Root level — system module: route prefix /system/ai.
    partOf: "system",

    // Module self-declaration — persisted in service_registry.endpoints.nav.
    // The ai module OWNS its sheet panels (`ai.*`): the host sheet engine
    // mounts the content chunk at runtime, exactly like remote pages.
    nav: AI_NAV,
    events: AI_EVENTS,

    // Closed-set env contract (DATABASE_URL + DATABASE_SCHEMA only) is
    // enforced by assertDbEnv() inside createMicroservice — envSchema has
    // no keys left to declare.
    envSchema: {},

    initDal,
    dalClose: async () => { await getDal().close(); },
    dbBanner: () => pgServerBanner(getDal(), process.env.DATABASE_URL!),

    // Step 2.5 — own-schema migrations BEFORE ConfigLoader/registration.
    // Mode lives in ai.config_entries (key db_migration.mode) — never env.
    dbPatches: {
      engine: dalMigrations,
      // standards-exempt: getPool — dbPatches migration engine needs the raw pool (sanctioned seam)
      pool: () => getDal().getPool(),
      schema: () => assertDbEnv().schemas[0],
      patchesDir: join(process.cwd(), "db-meta", "patches"),
      entityRegistry: [...ENTITY_REGISTRY],
      allowedTrust:
        process.env.NODE_ENV === "production" ? ["release"] : ["dev", "release"],
    },

    configRepositoryAdapter: () => new ConfigRepositoryAdapter(),
    authConfigPort: (configLoader) => new AiAuthConfigPort(configLoader),
    // Lazy: getDal() only works after initDal ran inside createMicroservice.
    healthCheckPort: () => new HealthCheckAdapter(getDal()),

    routeHandler: aiRouteHandler,

    customHealthChecks: {
      llm: async () => new HealthCheckAdapter(getDal()).checkLlm(aiConfig("llm_base_url") ?? "http://localhost:8080/v1"),
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

      // Infrastructure jobs derived from entity metadata — arms the
      // partition-maintenance schedule + durable executor when any
      // @PartitionField entity carries a retention. No-op otherwise.
      await startPartitionMaintenanceJob();
    },
  });
}

main().catch((error) => {
  logger.error("Fatal error", { tags: ["core"], error });
  process.exit(1);
});