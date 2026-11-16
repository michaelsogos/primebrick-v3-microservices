/**
 * entity-repo — shared helpers for entity services.
 *
 * Entity services draw their Repository from `getDal()` (the DAL gateway
 * owns the pool + schema-domain guard) — no ad-hoc `new Repository(pool)`
 * and no `dal.repository()` leak into consumers. `getDal()` only resolves
 * after `getDal()` ran inside `createMicroservice`, so services call it
 * inside their constructor/first use, never at module import time.
 */
import { requireActor, type Session } from "@primebrick/sdk";

/** Actor supplier for entity-service audit stamping. */
export function entityActor(): string {
  return requireActor();
}

/** Minimal session carrying an explicit caller identity — forwarded actors
 *  (HTTP user uuid, NATS envelopes) and `"system:<code>"` fallbacks ride
 *  the same ALS slot an HTTP request resolves, so svc writes get the real
 *  actor through the normal `requireActor` pipeline. */
export const actorSession = (actor: string): Session => ({
  actor,
  roles: [],
  idpCode: null,
  idpOrg: null,
  idpUsername: null,
});
