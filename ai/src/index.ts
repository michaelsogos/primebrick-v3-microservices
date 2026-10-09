import "dotenv/config";
import "reflect-metadata";
import { join } from "node:path";
import { createMicroservice, logger } from "@primebrick/sdk";
import { runEmbeddingPipeline } from "./services/embedding-pipeline.js";
import { initDal, getDal } from "./db/dal.js";
import { compositeRouteHandler } from "./controllers/http/composite-route.js";
import {
  ConfigRepositoryAdapter,
  HealthCheckAdapter,
  AiAuthConfigPort,
} from "./adapters/index.js";

async function main(): Promise<void> {
  const llmBaseUrl = process.env.LLM_BASE_URL || "http://localhost:8080/v1";

  await createMicroservice({
    serviceName: "ai",
    serviceDisplayName: "AI Assistant",
    serviceDescription: "AI chat microservice with RAG knowledge base",
    icon: "sparkles",
    iconType: "icon",

    envSchema: {
      DATABASE_URL: { required: true, description: "PostgreSQL connection string" },
      DB_SCHEMA: { required: false, default: "ai", description: "Database schema name" },
      SERVICE_BASE_URL: { required: false, default: "http://localhost:3004", description: "Exposed URL for BE proxy routing" },
      LLM_BASE_URL: { required: false, default: "http://localhost:8080/v1", description: "LLM inference endpoint (mistral.rs container, OpenAI-compatible /v1)" },
      LLM_MODEL: { required: false, default: "Qwen3-4B-Instruct-2507", description: "LLM model name (must match a model id from /v1/models)" },
      LLM_API_KEY: { required: false, default: "not-required", description: "LLM API key (not required for local mistral.rs)" },
      EMBEDDING_MODEL: { required: false, default: "lmo3/multilingual-e5-large-instruct", description: "Embedding model (HF id with ONNX weights; instruct models auto-get query/passage prefixes)" },
      EMBEDDING_QUERY_PREFIX: { required: false, description: "Query-side prefix override (auto: 'Instruct: …\\nQuery: ' for e5-instruct, 'query: ' for bge/qwen3-embedding)" },
      EMBEDDING_PASSAGE_PREFIX: { required: false, description: "Passage-side prefix override (auto: '' for e5-instruct, 'passage: ' for bge/qwen3-embedding)" },
      BE_BASE_URL: { required: false, default: "http://localhost:3001", description: "Backend base URL for MCP client" },
      REDIS_URL: { required: false, description: "Redis URL for distributed rate limiting (optional, falls back to in-memory)" },
      AI_RATE_LIMIT_CAPACITY: { required: false, default: "10", description: "Rate limit: max tokens in bucket per user" },
      AI_RATE_LIMIT_REFILL_RATE: { required: false, default: "1", description: "Rate limit: tokens refilled per second" },
      AI_RATE_LIMIT_TOKEN_COST: { required: false, default: "1", description: "Rate limit: tokens consumed per chat request" },
    },

    initDal,
    dalClose: async () => { await getDal().close(); },

    configRepositoryAdapter: () => new ConfigRepositoryAdapter(),
    authConfigPort: (configLoader) => new AiAuthConfigPort(configLoader),
    // Lazy: getDal() only works after initDal ran inside createMicroservice.
    healthCheckPort: () => new HealthCheckAdapter(getDal().getPool()),

    routeHandler: compositeRouteHandler,

    customHealthChecks: {
      llm: async () => new HealthCheckAdapter(getDal().getPool()).checkLlm(llmBaseUrl),
    },

    onReady: async () => {
      // Phase 2.3 scaffold — NATS subscriptions will be added in later phases
      logger.info("AI microservice scaffold ready", { tags: ["core"] });

      // Startup reconcile: incremental docs_kb reindex in background.
      // Hash-diff makes unchanged chunks free; the service stays usable
      // while indexing catches up (fire-and-forget by design).
      const docsPath = process.env.DOCS_PATH ?? join(process.cwd(), "..", "..", "primebrick-v3-docs", "pages");
      const openApiPath = process.env.OPENAPI_PATH ?? join(process.cwd(), "..", "..", "primebrick-v3-docs", "apis");
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