/**
 * `job.job_triggers` — admin-managed business trigger declarations.
 *
 * Only BUSINESS triggers live here: infrastructure jobs (partition
 * maintenance) are derived from entity metadata, never duplicated in this
 * table. A trigger binds an optional event source and/or an optional
 * schedule to a callable target:
 *
 *   event + schedule → event-gated timer (match arms, non-match disarms)
 *   event only       → immediate dispatch on match (no JetStream schedule)
 *   schedule only    → pure timer, always armed (absorbs ex-"manual")
 *
 * `event_subject`/`schedule_spec` are mutually mandatory — at least one
 * must be set (enforced in code, both nullable at rest).
 *
 * `target_subject` is a service-owned callable subject (e.g.
 * `emailsender.send`) picked from `census.callables`; `payload_map`
 * (PayloadMap DST) builds its request payload from the event.
 *
 * `run_as` decides the identity the fire runs under: "originator"
 * (the originator's AuthUser rides the event's forwarded headers — only
 * meaningful when an event source exists), "author" (the trigger author's
 * AuthUser, resolved via `auth.ctl.resolve_user` at dispatch time) or
 * "system" (opt-in, declared super-partes business process with no user
 * context — a permissioned callable will deny it). Both user-context
 * values materialize on the `jobs.due.user.*` lane.
 */
import {
  Entity,
  Key,
  Unique,
  Column,
  Calculated,
  type UUID,
  EntityBase,
  Auditable,
  AuditTrail,
  Deletable,
} from "@primebrick/dal-pg";
import { type PayloadMap } from "@primebrick/sdk";
import { RuleFilter } from "../jsonb-contracts.js";

/**
 * The schedule-mirror rollup subject for a trigger — `jobs.schedule.job.<uuid>`.
 * The triggers engine materializes its JetStream declaration on this subject
 * and `job_run.schedule_subject` records it, so the `runs` reverse_ref on
 * the trigger meta filters runs by `<prefix>{uuid}`. Single source for the
 * convention: engine + meta share it.
 */
export const TRIGGER_SCHEDULE_SUBJECT_PREFIX = "jobs.schedule.job.";

@Entity("job_triggers", "job")
@AuditTrail()
export class JobTriggerEntity
  extends Deletable(Auditable(EntityBase)) {
  @Key()
  @Column({ pgType: "uuid" })
  uuid!: UUID;

  @Unique()
  @Column({ length: 200, nullable: false })
  name!: string;

  /** Event subject to subscribe, e.g. "customer.updated". NULL when the
   *  trigger is schedule-only. */
  @Column({ nullable: true })
  event_subject?: string;

  /** JSON filter — array of { field, op, value } evaluated on the event payload. */
  @Column({ jsType: RuleFilter, nullable: true })
  filter?: RuleFilter[];

  /** Schedule spec — "@every 1d", "@at …", cron. On event+schedule
   *  triggers it is materialized on match; on schedule-only triggers it
   *  arms directly. NULL for immediate (event-only) triggers. */
  @Column({ nullable: true })
  schedule_spec?: string;

  /** Due target — a callable subject from census.callables (e.g.
   *  emailsender.send), or a legacy jobs.due.<lane>.* subject. */
  @Column({ nullable: false })
  target_subject!: string;

  /** Trigger-owned payload map — `PayloadMap` DST from @primebrick/core:
   *  per target field, a {kind:"const"|"path"|"meta"} entry resolved
   *  against the event payload at arm/fire time. NULL/{} = verbatim forward. */
  @Column({ pgType: "jsonb", nullable: true })
  payload_map?: PayloadMap;

  /** originator | author | system — explicit opt-in, never inferred. */
  @Column({ length: 20, nullable: false })
  run_as!: string;
  // No `enabled` flag — DISABLE IS SOFT-DELETE (`deleted_at` via the
  // `Deletable` mixin). Doctrine: enable fields are a design error; the
  // soft-delete machinery gives disable + restore + audit + ELT deleted-row
  // UX for free.

  /** Run count on this trigger's mirror subject — SQL projection
   *  (`job_runs.schedule_subject = 'jobs.schedule.job.' || uuid`). */
  @Calculated(
    `(SELECT count(*)::int FROM job.job_runs jr WHERE jr.schedule_subject = '${TRIGGER_SCHEDULE_SUBJECT_PREFIX}' || {self}.uuid::text)`,
    { pgType: "int4" },
  )
  runs?: number;

  /** Latest run start on the mirror subject — `max(job_runs.created_at)`. */
  @Calculated(
    `(SELECT max(jr.created_at) FROM job.job_runs jr WHERE jr.schedule_subject = '${TRIGGER_SCHEDULE_SUBJECT_PREFIX}' || {self}.uuid::text)`,
    { pgType: "timestamptz", nullable: true },
  )
  last_run?: Date;

  /** Next fire of the armed mirror — `job_schedules.next_fire_mirror_at`
   *  gated to `status='armed'` (the same gate the served `next_run_at`
   *  column applies). The engine mirrors NATS truth into that column:
   *  `Nats-Schedule-Next` header per fire + deterministic arm-time
   *  computation for `@every`/`@at`. NULL for disabled triggers,
   *  event-only triggers and cron specs before their first fire. */
  @Calculated(
    `CASE WHEN {self}.deleted_at IS NULL THEN (SELECT js.next_fire_mirror_at FROM job.job_schedules js WHERE js.schedule_subject = '${TRIGGER_SCHEDULE_SUBJECT_PREFIX}' || {self}.uuid::text AND js.status = 'armed') END`,
    { pgType: "timestamptz", nullable: true },
  )
  next_run?: Date;
}
