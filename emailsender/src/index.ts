import "dotenv/config";
import "reflect-metadata";
import { join } from "node:path";
import { createMicroservice, logger, pgServerBanner, composeRouteHandlers, docsPackRouteHandler } from "@primebrick/sdk";
import { initDal, getDal } from "./db/dal.js";
import { subscribeToEmailSendRequests } from "./controllers/nats-sub/email-send.js";
import { EmailService } from "./services/email-service.js";
import { subscribeToWebhooks, setWebhookApiKeyPort } from "./controllers/nats-sub/webhook-subscriber.js";
import { compositeRouteHandler } from "./controllers/http/composite-route.js";
import { EmailSenderAuthConfigPort, EmailSenderApiKeyPort } from "./adapters/auth-ports-adapter.js";
import {
  ConfigRepositoryAdapter,
  HealthCheckAdapter,
} from "./adapters/index.js";

async function main(): Promise<void> {
  await createMicroservice({
    serviceName: "emailsender",
    serviceDisplayName: "Email Sender",
    serviceDescription: "Email sending microservice",
    icon: "mail",
    iconType: "icon",

    envSchema: {
      DATABASE_URL: { required: true, description: "PostgreSQL connection string" },
      DB_SCHEMA: { required: false, default: "emailsender", description: "Database schema name" },
    },

    initDal,
    dalClose: async () => { await getDal().close(); },
    dbBanner: () => pgServerBanner(getDal().getPool(), process.env.DATABASE_URL!),

    configRepositoryAdapter: () => new ConfigRepositoryAdapter(),
    authConfigPort: (configLoader) => new EmailSenderAuthConfigPort(configLoader),
    apiKeyPort: () => new EmailSenderApiKeyPort(),
    healthCheckPort: () => new HealthCheckAdapter(getDal().getPool()),

    routeHandler: composeRouteHandlers(compositeRouteHandler, docsPackRouteHandler(join(process.cwd(), "dist", "docs-pack"))),
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
