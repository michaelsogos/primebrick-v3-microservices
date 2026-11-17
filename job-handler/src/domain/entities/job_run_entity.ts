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
  type UUID,
  EntityBase,
  Auditable,
} from "@primebrick/dal-pg";

@Entity("job_runs", "job")
export class JobRunEntity
  extends Auditable(EntityBase) {
  @Key()
  @Column({ pgType: "uuid" })
  uuid!: UUID;

  /** Schedule subject that fired this run — null for immediate dispatches. */
  @Column({ nullable: true })
  schedule_subject?: string;

  /** Owning trigger uuid — STAMPED at write time from the armed schedule
   *  row (or its subject lookup), so the lineage survives the schedule's
   *  own lifecycle: schedules are hard-deleted rows, triggers are not.
   *  NULL for manual/immediate runs and own-lane consumers whose mirror
   *  never touched a `job_trigger`. */
  @Column({ pgType: "uuid", nullable: true })
  trigger_uuid?: string;

  /** Owning trigger display name — joins `job_triggers` on the stamped
   *  uuid (NOT through the ephemeral schedule mirror). NULL on manual
   *  runs. */
  @Calculated(
    `(SELECT t.name FROM job.job_triggers t WHERE t.uuid = {self}.trigger_uuid)`,
    { pgType: "text", nullable: true },
  )
  trigger?: string;

  /** Owning schedule identity for the record drill — the schedule's
   *  business key IS the subject (schedules carry no name field);
   *  alias of `schedule_subject` so the meta can declare a `ref` column
   *  without colliding with the `nats_subject` source column. */
  @Calculated(`({self}.schedule_subject)`, { pgType: "text", nullable: true })
  schedule?: string;

  @Column({ nullable: false })
  job_name!: string;

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
