/**
 * `job.job_schedules` — registry of every armed NATS JetStream schedule.
 *
 * Written ONLY by primebrick-job (sole writer of `jobs.schedule.*`): each
 * row mirrors one rollup-subject declaration message and is OWNED by a
 * `job_triggers` row (`trigger_uuid`, NOT NULL) — user-made triggers and
 * module-declared system triggers alike. The triggers engine is the only
 * materialization path; a row without an owner is an orphan by
 * definition and the reconcile drops it.
 */
import {
  Entity,
  Key,
  Unique,
  Column,
  Ref,
  Calculated,
  type UUID,
  EntityBase,
  Auditable,
} from "@primebrick/dal-pg";

@Entity("job_schedules", "job")
export class JobScheduleEntity
  extends Auditable(EntityBase) {
  @Key()
  @Column({ pgType: "uuid" })
  uuid!: UUID;

  /** The rollup subject the declaration is stored on — unique per schedule. */
  @Unique()
  @Column({ nullable: false })
  schedule_subject!: string;

  /** user | system — the identity channel the target fires under:
   *  which `jobs.due.<user|system>` lane the due message lands on. */
  @Column({ length: 10, nullable: false })
  run_as!: string;

  /** The schedule spec — "@every 5m" (≥1m floor), "@at …", cron. */
  @Column({ nullable: false })
  schedule_spec!: string;

  /** recurring | once — derived from the spec ("@at"/one-shot vs repeating). */
  @Column({ length: 10, nullable: false })
  schedule_type!: string;

  /** jobs.due.* subject the message is republished to. */
  @Column({ nullable: false })
  target_subject!: string;

  /** armed | disarmed | fired (one-shot dispatched) | expired (TTL elapsed) */
  @Column({ length: 20, nullable: false })
  status!: string;

  /** The trigger this schedule was materialized from — the ONE owner,
   *  by construction (the engine is the only writer). */
  @Ref("job_trigger")
  @Column({ pgType: "uuid", nullable: false })
  trigger_uuid!: UUID;

  /** Latest arm/declaration stamp — overwritten on every re-arm;
   *  distinct from `created_at` (mirror-row creation). */
  @Column({ nullable: true, jsType: "instant" })
  armed_at?: Date;

  @Column({ nullable: true, jsType: "instant" })
  disarmed_at?: Date;

  /** Latest ACTUAL execution — `max(job_runs.created_at)` on this
   *  schedule subject, `skipped` excluded (a suppressed due never
   *  executed). One universal meaning — "Eseguita il" — for recurring
   *  and one-shot schedules, trigger/module/system/user-originated
   *  fires alike. */
  @Calculated(
    `(SELECT max(r.created_at) FROM job.job_runs r WHERE r.schedule_subject = {self}.schedule_subject AND r.status <> 'skipped')`,
    { pgType: "timestamptz", nullable: true },
  )
  fired_at?: Date;

  /** `armed_at + Nats-Schedule-TTL` — when the declaration self-purges. */
  @Column({ nullable: true, jsType: "instant" })
  expires_at?: Date;

  /** Engine-maintained next fire (mirror of NATS truth, never interpreted
   *  by us): computed at arm for `@every`/`@at`, then overwritten per fire
   *  by the server's own `Nats-Schedule-Next` header — cron included.
   *  Internal write target only — the served field is `next_run_at`,
   *  which gates this mirror by status. */
  @Column({ nullable: true, jsType: "instant" })
  next_fire_mirror_at?: Date;

  /** Served next-fire — the NATS mirror gated by executable status.
   *  NULL whenever the schedule cannot run (disarmed/stopped/paused/
   *  fired/expired): a schedule that cannot execute has no next run,
   *  whatever the mirror was left holding. */
  @Calculated(
    `CASE WHEN {self}.status = 'armed' THEN {self}.next_fire_mirror_at END`,
    { pgType: "timestamptz", nullable: true },
  )
  next_run_at?: Date;

  /** The scheduled job's name — the authored job identity. Trigger-owned
   *  mirrors inherit the trigger's display (`job_triggers.name` via
   *  `trigger_uuid`): the job the trigger declares IS what this schedule
   *  runs, and its name survives the trigger's deletion — same contract
   *  as the `trigger_uuid` ref display join (no `deleted_at` filter).
   *  Service-owned rows keep the callable tail of `target_subject`
   *  (`jobs.due.<lane>.<svc>.<name>` → `<name>`; a plain callable subject
   *  stays whole — same parse run-recorder applies). */
  @Calculated(
    `COALESCE(
      (SELECT jt.name FROM job.job_triggers jt WHERE jt.uuid = {self}.trigger_uuid),
      regexp_replace({self}.target_subject, '^jobs\\.due\\.[^.]+\\.[^.]+\\.', '')
    )`,
    { pgType: "text" },
  )
  job_name?: string;

  /** WHO armed this schedule — ownership, never audit. Every row is
   *  trigger-owned (`trigger_uuid` NOT NULL): the armer IS the owning
   *  trigger, resolved live through `trigger_uuid` (rename-proof, and
   *  surviving the trigger's soft-delete — a disarmed orphan keeps the
   *  identity of who armed it, same contract as `job_name`). When the
   *  trigger row is physically gone the dead key surfaces — the
   *  unresolved-ref → uuid convention. `created_by` stays the hidden
   *  audit writer and is never consulted here. */
  @Calculated(
    `COALESCE(
      (SELECT jt.name FROM job.job_triggers jt WHERE jt.uuid = {self}.trigger_uuid),
      {self}.trigger_uuid::text
    )`,
    { pgType: "text", nullable: true },
  )
  armed_by?: string;


}
