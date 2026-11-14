/**
 * `job.job_schedules` — registry of every armed NATS JetStream schedule.
 *
 * Written ONLY by primebrick-job (sole writer of `jobs.schedule.*`): each
 * row mirrors one rollup-subject declaration message. `kind` distinguishes
 * the derivation source — `infra_derived` rows come from a service
 * self-declaring via `jobs.ctl.schedule.request` (e.g. AI partition
 * retention), `trigger` rows are materialized by the triggers engine.
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

  /** Owning service code — must match the declarer's identity. */
  @Column({ nullable: false })
  service_code!: string;

  /** infra_derived | trigger */
  @Column({ length: 30, nullable: false })
  kind!: string;

  /** user | system — which due lane the target lives on. */
  @Column({ length: 10, nullable: false })
  lane!: string;

  /** The schedule spec — "@every 30s", "@at …", cron. */
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

  /** The trigger this schedule was materialized from (kind=trigger). */
  @Ref("job_trigger")
  @Column({ pgType: "uuid", nullable: true })
  trigger_uuid?: UUID;

  @Column({ nullable: true, jsType: "instant" })
  armed_at?: Date;

  @Column({ nullable: true, jsType: "instant" })
  disarmed_at?: Date;

  /** When a `once` schedule actually dispatched (status → fired). */
  @Column({ nullable: true, jsType: "instant" })
  fired_at?: Date;

  /** `armed_at + Nats-Schedule-TTL` — when the declaration self-purges. */
  @Column({ nullable: true, jsType: "instant" })
  expires_at?: Date;

  /** Engine-maintained next fire (mirror of NATS truth, never interpreted
   *  by us): computed at arm for `@every`/`@at`, then overwritten per fire
   *  by the server's own `Nats-Schedule-Next` header — cron included.
   *  NULL while disarmed/terminal and for cron specs before their first
   *  fire (NATS owns cron evaluation — no second interpreter). */
  @Column({ nullable: true, jsType: "instant" })
  next_run_at?: Date;

  /** Who armed the schedule — resolved projection: the owning trigger's
   *  fresh name for kind=trigger mirrors (rename-proof), the arming
   *  user's display_name for manual schedules (created_by carries the
   *  bare user uuid), else the owning service code. */
  @Calculated(
    `COALESCE(
      (SELECT jt.name FROM job.job_triggers jt WHERE jt.uuid = {self}.trigger_uuid AND jt.deleted_at IS NULL),
      (SELECT up.display_name FROM public.user_profiles up WHERE up.uuid::text = {self}.created_by),
      {self}.service_code
    )`,
    { pgType: "text" },
  )
  armed_by?: string;


}
