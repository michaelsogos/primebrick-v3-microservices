/**
 * Dal gateway bootstrap — the ONLY file allowed to call `getDal`/`initDal`
 * outside adapters (see .devin/check-standards.json → dal-access.allowPaths).
 * The env contract (DATABASE_URL only) is enforced by assertDbEnv; the
 * owned schema list is service identity declared as CODE in OWNED_SCHEMAS
 * — deliberately not env-configurable.
 */
import { getDal } from "@primebrick/dal-pg";
import { assertDbEnv, wireEntityEventEmission } from "@primebrick/sdk";

/**
 * Owned PG schemas — [0] = the primary/owned schema. The single source
 * for initDal, `createMicroservice({ schemas })`, db:check tooling and
 * migration scripts. Add a schema ONLY when the service genuinely owns
 * more than one.
 */
export const OWNED_SCHEMAS = ["boilerplate"] as const;

export async function initDal(): Promise<void> {
  const { url } = assertDbEnv();

  getDal({
    connectionString: url,
    schemas: [...OWNED_SCHEMAS],
    max: 10,
    statementTimeoutMs: 30000,
    applicationName: "primebrick-boilerplate",
  });

  await wireEntityEventEmission(getDal(), "boilerplate");
}

export { getDal } from "@primebrick/dal-pg";
