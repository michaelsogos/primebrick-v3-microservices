/**
 * entity-repo — shared helpers for entity services.
 *
 * Entity services draw their Repository from `getDal()` (the DAL gateway
 * owns the pool + schema-domain guard) — no ad-hoc `new Repository(pool)`
 * and no `dal.repository()` leak into consumers. `getDal()` only resolves
 * after `getDal()` ran inside `createMicroservice`, so services call it
 * inside their constructor/first use, never at module import time.
 */
import { requireActor } from "@primebrick/sdk";

/** Actor supplier for entity-service audit stamping. */
export function entityActor(): string {
  return requireActor();
}
