/**
 * Dal gateway bootstrap for the webhook microservice.
 * Same pattern as every other microservice: DATABASE_URL is the only
 * connection-related env; the schema defaults to `webhook` (DB_SCHEMA).
 */
import { getDal } from "@primebrick/dal-pg";

export function initDal(): void {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set");
  }
  const schema = process.env.DB_SCHEMA || "webhook";

  getDal({
    connectionString: url,
    schema,
    max: 10,
    statementTimeoutMs: 30000,
    applicationName: "primebrick-webhook",
  });
}

export { getDal } from "@primebrick/dal-pg";
