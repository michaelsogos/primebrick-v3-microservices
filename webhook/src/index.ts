import "dotenv/config";
import "reflect-metadata";
import { join } from "node:path";
import { createMicroservice, logger, pgServerBanner, composeRouteHandlers, docsPackRouteHandler } from "@primebrick/sdk";
import { initDal, getDal } from "./db/dal.js";
import { ConfigRepositoryAdapter } from "./adapters/config-repository-adapter.js";
import { HealthCheckAdapter } from "./adapters/health-check-adapter.js";
import { WebhookAuthConfigPort } from "./adapters/auth-ports-adapter.js";
import { CachedApiKeyPort } from "./auth/precheck-port.js";
import {
  webhookRouteHandler,
  setWebhookAuthDependencies,
  ensureWebhookStream,
} from "./controllers/http/router.js";
import { startRegistryCache } from "./registry/registry-cache.js";

async function main(): Promise<void> {
  await createMicroservice({
    serviceName: "webhook",
    serviceDisplayName: "Webhook Ingress",
    serviceDescription:
      "Generic registration-driven webhook router — AUTHENTICATED_API precheck, then pass-thru to the target microservice via JetStream",
    icon: "webhook",
    iconType: "icon",

    envSchema: {
      DATABASE_URL: { required: true, description: "PostgreSQL connection string" },
      DB_SCHEMA: { required: false, default: "webhook", description: "Database schema name" },
    },

    initDal,
    dalClose: async () => { await getDal().close(); },
    dbBanner: () => pgServerBanner(getDal().getPool(), process.env.DATABASE_URL!),

    configRepositoryAdapter: () => new ConfigRepositoryAdapter(),
    authConfigPort: (configLoader) => new WebhookAuthConfigPort(configLoader),
    apiKeyPort: () => new CachedApiKeyPort(),
    healthCheckPort: () => new HealthCheckAdapter(getDal().getPool()),

    routeHandler: composeRouteHandlers(webhookRouteHandler, docsPackRouteHandler(join(process.cwd(), "dist", "docs-pack"))),
    endpoints: { webhook: "/webhook" },
    // /webhook is a PUBLIC DMZ ingress — callers are external providers
    // (Brevo, …) with API-key auth, not internal services; they cannot and
    // must not carry our client-identity headers.
    identityExemptPaths: [/^\/webhook(\/|$)/],

    authDependencySetters: [
      (_cfg, apiKeyPort) => {
        if (!apiKeyPort) return;
        setWebhookAuthDependencies(apiKeyPort);
      },
    ],

    onReady: async () => {
      await ensureWebhookStream();
      await startRegistryCache();
    },
  });
}

main().catch((err) => {
  logger.error("fatal", { tags: ["webhook"], error: err });
  process.exit(1);
});
