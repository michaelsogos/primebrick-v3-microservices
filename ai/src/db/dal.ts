/**
 * Dal gateway bootstrap for the AI microservice.
 *
 * The `Dal` gateway (from `@primebrick/dal-pg`) owns the `pg.Pool`, registers
 * type parsers (INT8 → bigint, NUMERIC → number), and sets `search_path` /
 * `statement_timeout` / `application_name` on every connection.
 *
 * `initDal()` is called once from `index.ts` at startup. Services call
 * `getDal()` (no args) wherever they need DB access — zero per-request
 * allocation, the singleton is reused.
 *
 * The env contract (DATABASE_URL + DATABASE_SCHEMA, nothing else) is
 * enforced by assertDbEnv — the first schema is the owned one (`ai`).
 */
import { getDal, type Dal } from "@primebrick/dal-pg";
import { assertDbEnv, wireEntityEventEmission } from "@primebrick/sdk";

export async function initDal(): Promise<void> {
  const { url, schemas } = assertDbEnv();

  getDal({
    connectionString: url,
    schemas,
    max: 10,
    statementTimeoutMs: 30000,
    applicationName: "primebrick-ai",
  });

  await wireEntityEventEmission(getDal(), "ai");
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
