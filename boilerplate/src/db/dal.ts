/**
 * Dal gateway bootstrap — the ONLY file allowed to call `getDal`/`initDal`
 * outside adapters (see .devin/check-standards.json → dal-access.allowPaths).
 * The env contract (DATABASE_URL + DATABASE_SCHEMA, nothing else) is
 * enforced by assertDbEnv — the first schema is the owned one.
 */
import { getDal } from "@primebrick/dal-pg";
import { assertDbEnv, wireEntityEventEmission } from "@primebrick/sdk";

export async function initDal(): Promise<void> {
  const { url, schemas } = assertDbEnv();

  getDal({
    connectionString: url,
    schemas,
    max: 10,
    statementTimeoutMs: 30000,
    applicationName: "primebrick-boilerplate",
  });

  await wireEntityEventEmission(getDal(), "boilerplate");
}

export { getDal } from "@primebrick/dal-pg";
