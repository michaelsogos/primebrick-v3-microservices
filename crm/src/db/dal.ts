/**
 * Dal gateway bootstrap for the crm microservice.
 * The env contract (DATABASE_URL + DATABASE_SCHEMA, nothing else) is
 * enforced by assertDbEnv — the first schema is the owned one (`crm`).
 */
import { getDal } from "@primebrick/dal-pg";
import { assertDbEnv } from "@primebrick/sdk";

export function initDal(): void {
  const { url, schemas } = assertDbEnv();

  getDal({
    connectionString: url,
    schemas,
    max: 10,
    statementTimeoutMs: 30000,
    applicationName: "primebrick-crm",
  });
}

export { getDal } from "@primebrick/dal-pg";
