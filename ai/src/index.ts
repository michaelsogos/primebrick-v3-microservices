import "dotenv/config";
import "reflect-metadata";
import { createMicroservice } from "@primebrick/sdk";
import { initDal, getDal } from "./db/dal.js";
import { compositeRouteHandler } from "./server/composite-route.js";
import {
  ConfigRepositoryAdapter,
  HealthCheckAdapter,
  AiAuthConfigPort,
} from "./adapters/index.js";

async function main(): Promise<void> {
  const llmBaseUrl = process.env.LLM_BASE_URL || "http://localhost:8080/v1";
  const healthCheckAdapter = new HealthCheckAdapter(getDal().getPool());

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
      EMBEDDING_MODEL: { required: false, default: "all-MiniLM-L6-v2", description: "Embedding model name" },
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
    healthCheckPort: () => healthCheckAdapter,

    routeHandler: compositeRouteHandler,

    customHealthChecks: {
      llm: async () => healthCheckAdapter.checkLlm(llmBaseUrl),
    },

    onReady: async () => {
      // Phase 2.3 scaffold — NATS subscriptions will be added in later phases
      console.log("AI microservice scaffold ready");
    },
  });
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
