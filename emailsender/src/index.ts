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
import { webhookRouteHandler } from "./server/webhook-route.js";
import {
  ConfigRepositoryAdapter,
  ServiceRegistryAdapter,
  HealthCheckAdapter,
} from "./adapters/index.js";

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
  // The Dal owns the pg.Pool, registers type parsers, sets search_path.
  initDal();

  // ── Config loader (uses ConfigRepositoryPort adapter) ─────────────────
  // Loads config rows from emailsender.config into in-memory cache.
  // The config table is empty for now — load() succeeds with an empty cache.
  const configLoader = new ConfigLoader(new ConfigRepositoryAdapter());
  try {
    await configLoader.load();
    console.log("Config loaded from DB");
  } catch (error) {
    console.error("Failed to load config (non-fatal — table may be empty):", error);
  }

  // ── Service registration (uses ServiceRegistryPort adapter) ───────────
  const baseUrl = env.SERVICE_BASE_URL!;
  const registrar = new ServiceRegistrar(new ServiceRegistryAdapter(), {
    serviceCode: env.SERVICE_CODE!,
    baseUrl,
    endpoints: {
      webhook: `${baseUrl}/webhook`,
      health: `${baseUrl}/health`,
    },
  });

  try {
    await registrar.register();
    console.log("Service registered successfully");
  } catch (error) {
    console.error("Failed to register service:", error);
    // Continue anyway - service can still function
  }

  registrar.startHeartbeat();
  console.log("Heartbeat started");

  // ── Connect to NATS (uses SDK NatsClient) ─────────────────────────────
  try {
    await NatsClient.getConnection();
    console.log("NATS connection established");
  } catch (error) {
    console.error("Failed to connect to NATS:", error);
    process.exit(1);
  }

  // ── Subscribe to email send requests ──────────────────────────────────
  const emailService = new EmailService();
  subscribeToEmailSendRequests(async (request) => {
    return await emailService.sendEmail(request);
  });

  // ── HTTP server + health check (uses SDK createHttpServer + HealthCheck)
  const pool = getDal().getPool();
  const healthCheck = new HealthCheck(new HealthCheckAdapter(pool));
  const httpPort = parseInt(env.HTTP_PORT || "3003", 10);
  const server = await createHttpServer({
    port: httpPort,
    healthCheck,
    serviceName: "emailsender",
    routeHandler: webhookRouteHandler,
  });

  console.log("EmailSender microservice started successfully");

  // ── Graceful shutdown (uses SDK GracefulShutdown) ─────────────────────
  const shutdown = new GracefulShutdown("emailsender");
  shutdown.addCleanup(async () => { registrar.stopHeartbeat(); });
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
