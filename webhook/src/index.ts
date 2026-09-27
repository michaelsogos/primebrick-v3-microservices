import "dotenv/config";
import { createMicroservice } from "@primebrick/sdk";
import {
  EnvConfigPort,
  EnvAuthConfigPort,
  NoopHealthCheckPort,
} from "./adapters/env-ports.js";
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
      SERVICE_BASE_URL: {
        required: false,
        default: "http://localhost:3004",
        description: "Exposed URL (public webhook ingress)",
      },
    },

    initDal: () => {},
    dalClose: async () => {},
    configRepositoryAdapter: () => new EnvConfigPort(),
    authConfigPort: () => new EnvAuthConfigPort(),
    apiKeyPort: () => new CachedApiKeyPort(),
    healthCheckPort: () => new NoopHealthCheckPort(),

    routeHandler: webhookRouteHandler,
    endpoints: { webhook: "/webhook" },

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
  console.error("[webhook] fatal:", err);
  process.exit(1);
});
