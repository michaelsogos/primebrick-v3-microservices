import "dotenv/config";
import "reflect-metadata";
import { join } from "node:path";
import { createMicroservice, logger, pgServerBanner, assertDbEnv, CachingApiKeyPort, NatsApiKeyPort } from "@primebrick/sdk";
import * as dalMigrations from "@primebrick/dal-pg";
import { initDal, getDal } from "./db/dal.js";
import { ENTITY_REGISTRY } from "./domain/entities/registry.js";
import { ConfigRepositoryAdapter } from "./adapters/config-repository-adapter.js";
import { HealthCheckAdapter } from "./adapters/health-check-adapter.js";
import { WebhookAuthConfigPort } from "./adapters/auth-ports-adapter.js";
import {
  webhookRouteHandler,
  setWebhookAuthDependencies,
  ensureWebhookStream,
} from "./controllers/http/router.js";
import { WEBHOOK_EVENTS } from "./events-declaration.js";
import { startRegistryCache } from "./registry/registry-cache.js";

async function main(): Promise<void> {
  await createMicroservice({
    serviceName: "webhook",
    serviceDisplayName: "Webhook Ingress",
    serviceDescription:
      "Generic registration-driven webhook router — AUTHENTICATED_API precheck, then pass-thru to the target microservice via JetStream",
    icon: "webhook",
    iconType: "icon",

    // Root level — system module: route prefix /system/webhook.
    partOf: "system",

    // Headless service — no nav, but it OWNS the inbound-webhook event
    // vocabulary: webhook.<service>.received is the domain signal other
    // modules (job rules, triggers) subscribe to.
    events: WEBHOOK_EVENTS,

    // Closed-set env contract (DATABASE_URL + DATABASE_SCHEMA only) is
    // enforced by assertDbEnv() inside createMicroservice — envSchema has
    // no keys left to declare.
    envSchema: {},

    initDal,
    dalClose: async () => { await getDal().close(); },
    dbBanner: () => pgServerBanner(getDal(), process.env.DATABASE_URL!),

    // Step 2.5 — own-schema migrations BEFORE ConfigLoader/registration.
    // Mode lives in webhook.config_entries (key db_migration.mode).
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
    authConfigPort: (configLoader) => new WebhookAuthConfigPort(configLoader),
    // No CachePort here — webhook is a public DMZ ingress without Redis;
    // CachingApiKeyPort falls back to the bounded in-memory mode
    // (60s positive / 10s negative / max 1000 entries).
    apiKeyPort: () => new CachingApiKeyPort(new NatsApiKeyPort(3000)),
    healthCheckPort: () => new HealthCheckAdapter(getDal()),

    routeHandler: webhookRouteHandler,
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
