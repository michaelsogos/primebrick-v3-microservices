/**
 * system-triggers — the materialize reconcile for module-declared jobs.
 *
 * A module's system jobs are DECLARED in its code and materialized onto
 * `job.job_triggers` at registration (`system_key` = the stable job id).
 * The row is then the declaration of record the triggers engine reads —
 * the user governs `schedule_spec` and `name`, the code owns the
 * interchange contract (source, destination, run_as, payload_map,
 * filter).
 *
 * Reconcile rule ("cosa, non quando" — the declaration wins on the
 * contract, the user wins on the schedule):
 *   - row absent            → insert (the decl seeds schedule_spec + name)
 *   - row soft-deleted      → SKIP, never resurrect — user disablement is
 *                             the same protection the old infra
 *                             suppression gate gave, expressed by the row
 *   - code-owned field drift → update ONLY the drifted fields (delta-only
 *                             writes — never a no-op UPDATE, never an
 *                             audit/version churn for nothing)
 *   - user-owned fields     → never touched after insert
 *
 * `jobs.ctl.triggers.changed` publishes ONLY on an actual write — the
 * engine's existing `refreshTrigger` re-derive does the arm work;
 * reconcile itself never arms or reschedules.
 */

import { newUuidV7, Filter, field } from "@primebrick/dal-pg";
import { logger } from "@primebrick/sdk";
import { getDal } from "../db/dal.js";
import { JobTriggerEntity } from "../domain/entities/job_trigger_entity.js";
import { canonJson } from "../utils/canon-json.js";
import { publishTriggerChanged } from "../modules/jobs/jobs.service.js";

/** Fields the declaration owns — drift on any of them means the release
 *  changed the interchange contract and the row MUST follow. The same
 *  set the form/wire freeze on system rows — ONE ownership matrix. */
export const CODE_OWNED_TRIGGER_FIELDS = [
  "event_subject",
  "target_subject",
  "run_as",
  "payload_map",
  "filter",
] as const;

export interface SystemJobDecl {
  key: string;
  name: string;
  schedule_spec?: string;
  event_subject?: string;
  target_subject: string;
  run_as: "system" | "author" | "originator";
  filter?: unknown;
  payload_map?: unknown;
}

export interface MaterializeResult {
  key: string;
  action: "inserted" | "updated" | "unchanged" | "skipped_deleted";
  uuid?: string;
  changed_fields?: string[];
}

/** Row lookup by the reconcile anchor — deleted rows INCLUDED: a
 *  soft-deleted system trigger is user disablement, never silently
 *  resurrected. */
async function findBySystemKey(key: string): Promise<Record<string, unknown> | undefined> {
  const dal = getDal();
  const rows = await dal.findAll<JobTriggerEntity>(JobTriggerEntity, null, {
    filters: [Filter.fieldValue(field(JobTriggerEntity, "system_key"), "=", key)],
    deletedRecords: "INCLUDED",
  } as never);
  return Array.isArray(rows)
    ? (rows[0] as unknown as Record<string, unknown> | undefined)
    : undefined;
}

/**
 * Reconcile one declared system job against its row. Delta-only writes:
 * code-owned fields update when they differ (canonical compare — a
 * key-reordered jsonb echo is NOT drift), user-owned fields are never
 * written after insert.
 */
async function reconcileOne(caller: string, decl: SystemJobDecl): Promise<MaterializeResult> {
  const dal = getDal();
  const actor = `system:${caller}`;
  const row = await findBySystemKey(decl.key);

  if (!row) {
    const uuid = newUuidV7();
    await dal.add(
      JobTriggerEntity,
      {
        uuid,
        name: decl.name,
        system_key: decl.key,
        event_subject: decl.event_subject ?? null,
        schedule_spec: decl.schedule_spec ?? null,
        target_subject: decl.target_subject,
        payload_map: decl.payload_map ?? null,
        filter: decl.filter ?? null,
        run_as: decl.run_as,
      } as never,
      { actor } as never,
    );
    publishTriggerChanged(uuid);
    return { key: decl.key, action: "inserted", uuid };
  }

  const uuid = row.uuid as string;
  if (row.deleted_at != null) {
    logger.warn(
      `system job "${decl.key}": row ${uuid} is disabled (soft-deleted) — reconcile skips it; restore it or drop the declaration`,
      { tags: ["jobs"] },
    );
    return { key: decl.key, action: "skipped_deleted", uuid };
  }

  const declValues = decl as unknown as Record<string, unknown>;
  const drifted = CODE_OWNED_TRIGGER_FIELDS.filter(
    (f) => canonJson(row[f]) !== canonJson(declValues[f] ?? null),
  );
  if (drifted.length === 0) return { key: decl.key, action: "unchanged", uuid };

  const patch = Object.fromEntries(drifted.map((f) => [f, declValues[f] ?? null]));
  await dal.update(
    JobTriggerEntity,
    // `version` is the auditable write's optimistic-concurrency token —
    // the row read above carries it, so a user edit racing the reconcile
    // fails loudly instead of silently losing either side's write.
    { uuid, version: row.version, ...patch } as never,
    { actor, matchBy: "uuid" } as never,
  );
  publishTriggerChanged(uuid);
  return { key: decl.key, action: "updated", uuid, changed_fields: drifted };
}

/** Reconcile a caller's whole declared job set — the materialize route's
 *  single service call. */
export async function materializeSystemJobs(
  caller: string,
  jobs: SystemJobDecl[],
): Promise<MaterializeResult[]> {
  const results: MaterializeResult[] = [];
  for (const decl of jobs) {
    results.push(await reconcileOne(caller, decl));
  }
  return results;
}
