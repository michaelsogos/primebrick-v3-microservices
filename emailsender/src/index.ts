import "dotenv/config";
import "reflect-metadata";
import { join } from "node:path";
import { createMicroservice, logger, pgServerBanner, assertDbEnv, CachingApiKeyPort, NatsApiKeyPort, getSdkCachePort } from "@primebrick/sdk";
import * as dalMigrations from "@primebrick/dal-pg";
import { initDal, getDal } from "./db/dal.js";
import { ENTITY_REGISTRY } from "./domain/entities/registry.js";
import { subscribeToEmailSendRequests } from "./controllers/nats-sub/email-send.js";
import { EmailService } from "./services/email-service.js";
import { subscribeToWebhooks, setWebhookApiKeyPort } from "./controllers/nats-sub/webhook-subscriber.js";
import { compositeRouteHandler } from "./controllers/http/composite-route.js";
import { EMAILSENDER_NAV } from "./nav-declaration.js";
import { EMAILSENDER_EVENTS } from "./events-declaration.js";
import { EmailSenderAuthConfigPort } from "./adapters/auth-ports-adapter.js";
import {
  ConfigRepositoryAdapter,
  HealthCheckAdapter,
} from "./adapters/index.js";

async function main(): Promise<void> {
  await createMicroservice({
    serviceName: "emailsender",
    serviceDisplayName: "Email Manager",
    labelKey: "emailsender.module.name",
    serviceDescription: "Email sending microservice",
    icon: "mail",
    iconType: "icon",

    // Root level — system module: route prefix /system/emailsender.
    partOf: "system",

    // Module self-declaration — persisted in service_registry.endpoints.nav.
    // The providers list is host-rendered; create/edit are remote chunks
    // owned by this service (fe/ → emailsender-pages.js).
    nav: EMAILSENDER_NAV,
    events: EMAILSENDER_EVENTS,

    // Closed-set env contract (DATABASE_URL + DATABASE_SCHEMA only) is
    // enforced by assertDbEnv() inside createMicroservice — envSchema has
    // no keys left to declare.
    envSchema: {},

    initDal,
    dalClose: async () => { await getDal().close(); },
    dbBanner: () => pgServerBanner(getDal(), process.env.DATABASE_URL!),

    // Step 2.5 — own-schema migrations BEFORE ConfigLoader/registration.
    // Mode lives in emailsender.config_entries (key db_migration.mode).
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
    authConfigPort: (configLoader) => new EmailSenderAuthConfigPort(configLoader),
    apiKeyPort: () =>
      new CachingApiKeyPort(new NatsApiKeyPort(3000), () => getSdkCachePort()),
    healthCheckPort: () => new HealthCheckAdapter(getDal()),

    routeHandler: compositeRouteHandler,
    endpoints: {
      // fire-and-forget: publisher never waits for a processing result
      nats_send: "nats://emailsender.send (fire-and-forget)",
      // inbound webhooks arrive via the `webhook` ingress service →
      // JetStream durable consumer (see controllers/nats-sub/)
      nats_webhook: "nats://webhook.emailsender.received (durable)",
    },

    authDependencySetters: [
      (cfg, apiKeyPort) => {
        if (!apiKeyPort) return;
        setWebhookApiKeyPort(apiKeyPort);
      },
    ],

    onReady: async () => {
      const emailService = new EmailService();
      subscribeToEmailSendRequests(async (request, actorId) => {
        return await emailService.sendEmail(request, actorId);
      });
      await subscribeToWebhooks();
    },
  });
}

main().catch((error) => {
  logger.error("Fatal error", { tags: ["core"], error });
  process.exit(1);
});
