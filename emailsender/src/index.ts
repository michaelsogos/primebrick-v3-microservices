import "dotenv/config";
import "reflect-metadata";
import {
  ConfigLoader,
  ServiceRegistrar,
  GracefulShutdown,
  NatsClient,
  createHttpServer,
  HealthCheck,
  requireEnv,
} from "@primebrick/sdk";
import { initDal, getDal } from "./db/dal.js";
import { subscribeToEmailSendRequests } from "./nats/handlers.js";
import { EmailService } from "./services/email-service.js";
import { webhookRouteHandler, setWebhookAuthDependencies } from "./server/webhook-route.js";
import { compositeRouteHandler } from "./server/composite-route.js";
import { providersRouteHandler, setAuthDependencies } from "./server/providers-route.js";
import { setNatsAuthConfig } from "./nats/handlers.js";
import { EmailSenderAuthConfigPort, EmailSenderApiKeyPort } from "./adapters/auth-ports-adapter.js";
import { initAuthConfig, loadAuthConfig, getAuthConfig } from "@primebrick/sdk";
import {
  ConfigRepositoryAdapter,
  HealthCheckAdapter,
} from "./adapters/index.js";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

function readServiceVersion(): string {
  const here = dirname(fileURLToPath(import.meta.url)); // emailsender/src
  const pkgPath = resolve(here, "..", "package.json");
  const pkg = JSON.parse(readFileSync(pkgPath, "utf-8")) as { version?: string };
  return pkg.version ?? "0.0.0";
}

async function main(): Promise<void> {
  console.log("Starting EmailSender microservice...");

  // ── Environment validation (centralized via SDK) ──────────────────────
  const env = requireEnv({
    DATABASE_URL: { required: true, description: "PostgreSQL connection string" },
    BREVO_API_KEY: { required: true, description: "Brevo API key for sending emails" },
    WEBHOOK_API_KEY: { required: true, description: "API key for webhook authentication" },
    DB_SCHEMA: { required: false, default: "emailsender" },
    NATS_URL: { required: false, default: "nats://127.0.0.1:4222" },
    BREVO_API_ENDPOINT: { required: false, default: "https://api.brevo.com/v1" },
    SERVICE_CODE: { required: false, default: "EMAILSENDER" },
    SERVICE_BASE_URL: { required: false, default: "http://localhost:3003" },
    HTTP_PORT: { required: false, default: "3003" },
  });

  // ── Initialize the Dal gateway ────────────────────────────────────────
  initDal();

  // ── Config loader (uses ConfigRepositoryPort adapter) ─────────────────
  const configLoader = new ConfigLoader(new ConfigRepositoryAdapter());
  try {
    await configLoader.load();
    console.log("Config loaded from DB");
  } catch (error) {
    console.error("Failed to load config (non-fatal — table may be empty):", error);
  }

  // ── Auth config initialization (GATEWAY-RESOLVED mode) ────────────────
  const authConfigPort = new EmailSenderAuthConfigPort(configLoader);
  initAuthConfig(authConfigPort);
  try {
    await loadAuthConfig();
    console.log("Auth config loaded");
  } catch (error) {
    console.error("Failed to load auth config (non-fatal — config table may be empty):", error);
  }

  // Initialize API key port for webhook auth
  const apiKeyPort = new EmailSenderApiKeyPort();

  // Wire auth dependencies into route handlers
  try {
    const cfg = getAuthConfig();
    setAuthDependencies(cfg, apiKeyPort);
    setWebhookAuthDependencies(cfg, apiKeyPort);
    setNatsAuthConfig(cfg);
  } catch (error) {
    console.error("Failed to wire auth dependencies (non-fatal):", error);
  }

  // ── Connect to NATS (uses SDK NatsClient) ─────────────────────────────
  try {
    await NatsClient.getConnection();
    console.log("NATS connection established");
  } catch (error) {
    console.error("Failed to connect to NATS:", error);
    process.exit(1);
  }

  // ── Service registration via NATS ─────────────────────────────────────
  // The registrar publishes lifecycle events (register, heartbeat, unregister)
  // via NATS. The BE subscribes and persists to the service_registry table.
  const baseUrl = env.SERVICE_BASE_URL!;
  const serviceVersion = readServiceVersion();
  const healthCheckAdapter = new HealthCheckAdapter(getDal().getPool());

  const registrar = new ServiceRegistrar(
    NatsClient,
    {
      serviceCode: env.SERVICE_CODE!,
      baseUrl,
      endpoints: {
        webhook: `${baseUrl}/webhook`,
        health: `${baseUrl}/health`,
      },
      service_version: serviceVersion,
      name: "Email Sender",
      description: "Email sending microservice",
      is_behind_scaler: false,
    },
    async () => {
      // Health check function — runs local checks and returns status
      const dbOk = await healthCheckAdapter.ping();
      const natsOk = NatsClient.isConnected();
      return {
        http_healthy: dbOk,
        checks: {
          db: { ok: dbOk },
          nats: { ok: natsOk },
        },
      };
    },
  );

  try {
    await registrar.register();
    console.log("Service registered via NATS");
  } catch (error) {
    console.error("Failed to register service:", error);
  }

  registrar.startHeartbeat();
  console.log("Heartbeat started");

  // ── Subscribe to email send requests ──────────────────────────────────
  const emailService = new EmailService();
  subscribeToEmailSendRequests(async (request, actorId) => {
    return await emailService.sendEmail(request, actorId);
  });

  // ── HTTP server + health check (uses SDK createHttpServer + HealthCheck)
  const pool = getDal().getPool();
  const healthCheck = new HealthCheck(
    healthCheckAdapter,
    { nats: () => healthCheckAdapter.checkNats() },
  );
  const httpPort = parseInt(env.HTTP_PORT || "3003", 10);
  const server = await createHttpServer({
    port: httpPort,
    healthCheck,
    serviceName: "emailsender",
    routeHandler: compositeRouteHandler,
  });

  console.log("EmailSender microservice started successfully");

  // ── Graceful shutdown (uses SDK GracefulShutdown) ─────────────────────
  const shutdown = new GracefulShutdown("emailsender");
  shutdown.addCleanup(async () => { registrar.stopHeartbeat(); });
  shutdown.addCleanup(async () => { await registrar.unregister(); });
  shutdown.addCleanup(async () => { await NatsClient.close(); });
  shutdown.addCleanup(async () => { await getDal().close(); });
  shutdown.addCleanup(async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });
  shutdown.install();
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
