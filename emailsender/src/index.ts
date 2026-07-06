import os from "node:os";
import "dotenv/config";
import "reflect-metadata";
import { closeNatsConnection, getNatsConnection } from "./nats/client.js";
import { subscribeToEmailSendRequests } from "./nats/handlers.js";
import { EmailService } from "./services/email-service.js";
import { createHttpServer } from "./server/http-server.js";
import { ServiceRegistration } from "./services/service-registration.js";
import { initDal, getDal } from "./db/dal.js";

const emailService = new EmailService();
const serviceRegistration = new ServiceRegistration();

async function main(): Promise<void> {
  console.log("Starting EmailSender microservice...");

  // Initialize the Dal gateway (owns the pg.Pool, registers type parsers,
  // sets search_path/statement_timeout/application_name on every connection).
  initDal();

  // Register service in service registry
  try {
    await serviceRegistration.register();
    console.log("Service registered successfully");
  } catch (error) {
    console.error("Failed to register service:", error);
    // Continue anyway - service can still function
  }

  // Start heartbeat
  const heartbeatInterval = await serviceRegistration.startHeartbeat(60000);
  console.log("Heartbeat started");

  // Connect to NATS
  try {
    await getNatsConnection();
    console.log("NATS connection established");
  } catch (error) {
    console.error("Failed to connect to NATS:", error);
    process.exit(1);
  }

  // Subscribe to email send requests
  subscribeToEmailSendRequests(async (request) => {
    return await emailService.sendEmail(request);
  });

  // Start HTTP server for webhooks
  const httpPort = parseInt(process.env.HTTP_PORT || "3003", 10);
  await createHttpServer(httpPort);

  console.log("EmailSender microservice started successfully");

  // ── graceful shutdown ──────────────────────────────────────────────
  // The CONSUMER owns process lifecycle. The library exposes only
  // close(timeoutMs?) — it does NOT install process.on() handlers.
  // The lib's close() is itself re-entrant + timeout-bounded (protects the
  // pool); this shuttingDown guard protects the WHOLE shutdown sequence
  // (NATS, heartbeat, process.exit) from a second signal re-entering it.
  let shuttingDown = false;

  async function shutdown(reason: string, code: number): Promise<void> {
    if (shuttingDown) return; // re-entrancy guard: second signal is a no-op
    shuttingDown = true;
    console.log(`[emailsender] shutting down (${reason})`);
    clearInterval(heartbeatInterval);
    try {
      // Close ALL long-lived resources — allSettled so one failure
      // doesn't block the others.
      await Promise.allSettled([
        getDal().close(),          // drains pg.Pool (10s internal timeout)
        closeNatsConnection(),     // drains NATS
      ]);
    } finally {
      process.exit(code);          // ALWAYS exit explicitly — never rely on event-loop drain
    }
  }

  // Graceful signals — process.on (not once) so a second signal still
  // reaches the re-entrancy guard.
  const SHUTDOWN_SIGNALS: NodeJS.Signals[] = ["SIGTERM", "SIGINT", "SIGHUP"];
  SHUTDOWN_SIGNALS.forEach(sig =>
    process.on(sig, () =>
      shutdown(sig, 128 + (os.constants.signals[sig as keyof typeof os.constants.signals] ?? 0)),
    ),
  );

  // Crash paths — owned by the consumer (where Sentry/logging/restart policy live).
  // The library does NOT install these (layering violation + test isolation).
  process.on("uncaughtException", (err) => {
    console.error("[emailsender] uncaughtException", err);
    shutdown("uncaughtException", 1);
  });
  process.on("unhandledRejection", (reason) => {
    console.error("[emailsender] unhandledRejection", reason);
    shutdown("unhandledRejection", 1);
  });
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
