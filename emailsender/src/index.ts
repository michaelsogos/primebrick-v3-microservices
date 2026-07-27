import "dotenv/config";
import "reflect-metadata";
import { createMicroservice } from "@primebrick/sdk";
import { initDal, getDal } from "./db/dal.js";
import { subscribeToEmailSendRequests } from "./nats/handlers.js";
import { EmailService } from "./services/email-service.js";
import { webhookRouteHandler, setWebhookAuthDependencies } from "./server/webhook-route.js";
import { compositeRouteHandler } from "./server/composite-route.js";
import { providersRouteHandler, setAuthDependencies } from "./server/providers-route.js";
import { configRouteHandler, setAuthDependencies as setConfigAuthDependencies } from "./server/config-route.js";
import { setNatsAuthConfig } from "./nats/handlers.js";
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
      SERVICE_BASE_URL: { required: false, default: "http://localhost:3003", description: "Exposed URL for BE proxy routing (dynamic host port in Docker)" },
    },

    initDal,
    dalClose: async () => { await getDal().close(); },

    configRepositoryAdapter: () => new ConfigRepositoryAdapter(),
    authConfigPort: (configLoader) => new EmailSenderAuthConfigPort(configLoader),
    apiKeyPort: () => new EmailSenderApiKeyPort(),
    healthCheckPort: () => new HealthCheckAdapter(getDal().getPool()),

    routeHandler: compositeRouteHandler,
    endpoints: { webhook: "/webhook" },

    authDependencySetters: [
      (cfg, apiKeyPort) => {
        if (!apiKeyPort) return;
        setAuthDependencies(cfg, apiKeyPort);
        setConfigAuthDependencies(cfg, apiKeyPort);
        setWebhookAuthDependencies(cfg, apiKeyPort);
        setNatsAuthConfig(cfg);
      },
    ],

    onReady: async () => {
      const emailService = new EmailService();
      subscribeToEmailSendRequests(async (request, actorId) => {
        return await emailService.sendEmail(request, actorId);
      });
    },
  });
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
