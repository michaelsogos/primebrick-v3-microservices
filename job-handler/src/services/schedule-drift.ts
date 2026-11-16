/**
 * schedule-drift — pure mirror-vs-NATS drift logic. NO dal, NO nats, NO
 * service dependencies: a leaf module so the owning entity service
 * (`JobSchedulesService.decorate`) can import it without creating a
 * circular dependency through `schedule-service.ts` (which imports the
 * service instance for its own mirror writes).
 */

import type { JobScheduleEntity } from "../domain/entities/job_schedule_entity.js";

/** The instant a `@at <ts>` spec fires, or null when not a one-shot. */
export function atInstant(spec: string): Date | null {
  if (!spec.trim().startsWith("@at")) return null;
  const at = new Date(spec.trim().slice(3).trim());
  return Number.isNaN(at.getTime()) ? null : at;
}

/**
 * Expected absence: does the mirror allow the declaration to be gone
 * without drift? `once` whose `@at` already passed (self-purges after
 * firing), or a recurring spec past its `expires_at` (TTL self-purge).
 */
export function expectedDeclarationGone(row: JobScheduleEntity, now = new Date()): "fired" | "expired" | null {
  if (row.schedule_type === "once") {
    const at = atInstant(row.schedule_spec);
    if (at && at.getTime() <= now.getTime()) return "fired";
    return null;
  }
  if (row.expires_at && row.expires_at.getTime() <= now.getTime()) return "expired";
  return null;
}

/**
 * Expected-gone statuses — a live declaration on one of these is `stale`
 * drift (dangerous); absent is healthy. `stopped`/`paused`/`disarmed` are
 * deliberate absences; `fired`/`expired` are terminal lifecycle ends.
 */
export const TERMINAL_STATUSES = new Set(["disarmed", "stopped", "paused", "fired", "expired"]);

export type ScheduleDrift = "stale" | "missing" | null;

/**
 * Compute the live/drift decoration for one mirror row against the set of
 * live declaration subjects. `live === undefined` = enumeration failed —
 * drift is then unknown (left null, never guessed).
 */
export function scheduleDrift(
  row: { schedule_subject: string; status: string; schedule_type?: string; schedule_spec?: string; expires_at?: Date | null },
  live: boolean | undefined,
): { live: boolean | undefined; drift: ScheduleDrift } {
  if (live === undefined) return { live: undefined, drift: null };
  if (TERMINAL_STATUSES.has(row.status)) {
    // Mirror says it must not fire; NATS still can — the dangerous drift.
    return { live, drift: live ? "stale" : null };
  }
  if (row.status === "armed") {
    if (live) return { live, drift: null };
    // Armed with no declaration: real drift unless the absence is expected
    // (past one-shot self-purged after firing / TTL expiry).
    const gone = expectedDeclarationGone(row as JobScheduleEntity);
    return { live, drift: gone === null ? "missing" : null };
  }
  return { live, drift: null };
}
