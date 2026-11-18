/**
 * Dal gateway bootstrap for the webhook microservice.
 * The env contract (DATABASE_URL + DATABASE_SCHEMA, nothing else) is
 * enforced by assertDbEnv — the first schema is the owned one (`webhook`).
 */
import { getDal, type Dal } from "@primebrick/dal-pg";
import { assertDbEnv } from "@primebrick/sdk";

export function initDal(): void {
  const { url, schemas } = assertDbEnv();

  getDal({
    connectionString: url,
    schemas,
    max: 10,
    statementTimeoutMs: 30000,
    applicationName: "primebrick-webhook",
  });
}

export { getDal } from "@primebrick/dal-pg";

/**
 * `dalInfra()` — the canonical infra-only door to the Dal singleton
 * (health probes, config adapters, boot wiring). Same instance as
 * `getDal()` — named for role so lint can pin `getDal|initDal|resetDal`
 * to db/ + index.ts alone: a consumer calling getDal() directly is a
 * `dal-access` violation, a seam calling dalInfra() is declared infra.
 */
export function dalInfra(): Dal {
  return getDal();
}
