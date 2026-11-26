/**
 * Dal gateway bootstrap for the crm microservice.
 * The env contract (DATABASE_URL only) is
 * enforced by assertDbEnv — the owned schema list is OWNED_SCHEMAS (`crm`).
 */
import { getDal, type Dal } from "@primebrick/dal-pg";
import { assertDbEnv, wireEntityEventEmission } from "@primebrick/sdk";

/**
 * Owned PG schemas — [0] = the primary/owned schema. The single source
 * for initDal, createMicroservice({ schemas }), db:check tooling and
 * migration scripts. Add a schema ONLY when the service genuinely owns
 * more than one.
 */
export const OWNED_SCHEMAS = ["crm"] as const;

export async function initDal(): Promise<void> {
  const { url } = assertDbEnv();

  getDal({
    connectionString: url,
    schemas: [...OWNED_SCHEMAS],
    max: 10,
    statementTimeoutMs: 30000,
    applicationName: "primebrick-crm",
  });

  await wireEntityEventEmission(getDal(), "crm");
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
