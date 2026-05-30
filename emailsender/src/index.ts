import "dotenv/config";
import "reflect-metadata";
import { closeNatsConnection, getNatsConnection } from "./nats/client.js";
import { subscribeToEmailSendRequests } from "./nats/handlers.js";
import { EmailService } from "./services/email-service.js";
import { createHttpServer } from "./server/http-server.js";
import { ServiceRegistration } from "./services/service-registration.js";

const emailService = new EmailService();
const serviceRegistration = new ServiceRegistration();

async function main(): Promise<void> {
  console.log("Starting EmailSender microservice...");

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

  // Graceful shutdown
  const shutdown = async () => {
    console.log("Shutting down...");
    clearInterval(heartbeatInterval);
    await closeNatsConnection();
    console.log("Shutdown complete");
    process.exit(0);
  };

  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
