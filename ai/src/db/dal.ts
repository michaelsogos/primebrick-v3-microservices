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
 */
import { getDal } from "@primebrick/dal-pg";

export function initDal(): void {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set");
  }
  const schema = process.env.DB_SCHEMA || "ai";

  getDal({
    connectionString: url,
    schema,
    max: 10,
    statementTimeoutMs: 30000,
    applicationName: "primebrick-ai",
  });
}

export { getDal } from "@primebrick/dal-pg";
