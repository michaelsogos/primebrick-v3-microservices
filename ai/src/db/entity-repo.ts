/**
 * entity-repo — lazily-created `Repository` + audit port for entity services.
 *
 * `getDal()` only resolves after `initDal()` ran inside `createMicroservice`,
 * so the Repository cannot be built at module import time (route handlers
 * are constructed eagerly in `index.ts`). This holder defers construction to
 * the first call — same lazy pattern as `healthCheckPort`.
 */
import { Repository, makeTableAuditPort, type AuditPort } from "@primebrick/dal-pg";
import { requireActor } from "@primebrick/sdk";
import { getDal } from "./dal.js";

let repo: Repository | null = null;
let auditPort: AuditPort | null = null;

export function entityRepo(): Repository {
  return (repo ??= new Repository(getDal().getPool()));
}

export function entityAuditPort(): AuditPort {
  return (auditPort ??= makeTableAuditPort(entityRepo()));
}

/** Actor supplier for entity-service audit stamping. */
export function entityActor(): string {
  return requireActor();
}
