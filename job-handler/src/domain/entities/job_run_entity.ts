/**
 * `job.job_runs` — execution history for every fired job.
 *
 * `created_at` = dispatch/start instant; `updated_at` = finish/last-seen.
 * `duration_ms` is the measured wall time reported by the executor (or the
 * observed delta when it isn't). Terminal auth failures land here too:
 * a user-lane job whose serialized AuthUser expired before the fire is a
 * `failed` run with `error_code` like "401".
 */
import {
  Entity,
  Key,
  Unique,
  Column,
  Calculated,
  Index,
  type UUID,
  EntityBase,
  Auditable,
} from "@primebrick/dal-pg";

@Entity("job_runs")
// "latest runs first" — the only DESC index in the fleet with real scans;
// `created_at` is an Auditable-mixin column → class-level spec form.
@Index({ name: "job_runs_created_idx", columns: [{ name: "created_at", sort: "desc" }] })
export class JobRunEntity
  extends Auditable(EntityBase) {
  @Key()
  @Column({ pgType: "uuid" })
  uuid!: UUID;

  /** Schedule subject that fired this run — null for immediate dispatches. */
  @Column({ nullable: true })
  schedule_subject?: string;

  /** Owning trigger uuid — STAMPED at write time from the armed schedule
   *  row or the trampoline subject tail (`jobs.due.<lane>.job.forward.
   *  <uuid>`), so the lineage survives the schedule's own lifecycle:
   *  schedules are hard-deleted rows, triggers are not. NOT NULL —
   *  every run derives from a trigger; a dispatch that cannot prove its
   *  trigger lineage is never recorded. */
  @Column({ pgType: "uuid", nullable: false })
  trigger_uuid!: string;

  /** Owning trigger display name — the run's job identity, resolved
   *  live through `trigger_uuid` (rename relabels history by design:
   *  name is identity, not provenance; the join survives soft-delete).
   *  A physically-gone trigger surfaces the dead uuid — the
   *  unresolved-ref → uuid convention, never "-". */
  @Calculated(
    `COALESCE(
      (SELECT t.name FROM job.job_triggers t WHERE t.uuid = {self}.trigger_uuid),
      {self}.trigger_uuid::text
    )`,
    { pgType: "text", nullable: true },
  )
  trigger?: string;

  /** Owning schedule uuid — STAMPED at write time from the armed
   *  schedule row (forwarder) or the live subject lookup (own-lane
   *  recorder). Schedules are hard-deleted: a dangling uuid drills to
   *  the not-found hero while `schedule_subject` keeps the raw arrival
   *  truth. NULL for immediate fires (no schedule mirror). */
  @Column({ pgType: "uuid", nullable: true })
  schedule_uuid?: string;

  /** Owning schedule display — the schedule's identity IS its owning
   *  trigger's name (resolved transitively through `js.trigger_uuid` —
   *  schedules carry no name column of their own), joined through the
   *  stamped uuid — never the arrival subject. NULL when the schedule
   *  row is gone. */
  @Calculated(
    `(SELECT jt.name
       FROM job.job_schedules js
       JOIN job.job_triggers jt ON jt.uuid = js.trigger_uuid
      WHERE js.uuid = {self}.schedule_uuid)`,
    { pgType: "text", nullable: true },
  )
  schedule?: string;

  /** Destination subject this run was dispatched to — the governed
   *  callable (`envelope.target`, e.g. `emailsender.send`) or, on own-lane
   *  consumers, the due subject the handler reported consuming
   *  (`data.target`). NULL on pre-column rows that can't be backfilled. */
  @Column({ nullable: true })
  target_subject?: string;

  /** user | system — the identity channel this run fired under. */
  @Column({ length: 10, nullable: false })
  run_as!: string;

  /** dispatched | succeeded | failed | lost (dispatch never reported) |
   *  skipped (the due was suppressed — the run row records the arrival,
   *  no execution ever happened). */
  @Column({ length: 20, nullable: false })
  status!: string;

  /** Stream sequence of the due fire — dedupes result reports per fire. */
  @Column({ jsType: "bigint", nullable: true })
  fire_seq?: bigint;

  /** Failure cause from the CLOSED enum vocabulary — writers normalize
   *  at insert time (unmapped callable codes coerce to EXECUTION_ERROR,
   *  the original code/detail survives in `error_detail`). */
  @Column({ nullable: true })
  error_code?: string;

  @Column({ nullable: true })
  error_detail?: string;

  /** Wall-clock duration reported by the executor. */
  @Column({ jsType: "bigint", nullable: true })
  duration_ms?: bigint;

  /** JetStream redelivery count at execution time. */
  @Column({ pgType: "int4", nullable: true })
  redelivery_count?: number;

  /** Free-form executor report (e.g. partitions dropped) — shape owned by
   *  each handler's `JobResultMessage.report`, folded in verbatim. */
  @Column({ pgType: "jsonb", nullable: true })
  report?: unknown;





}
