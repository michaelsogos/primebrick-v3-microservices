/**
 * `job.job_schedules` — registry of every armed NATS JetStream schedule.
 *
 * Written ONLY by primebrick-job (sole writer of `jobs.schedule.*`): each
 * row mirrors one rollup-subject declaration message. `kind` distinguishes
 * the derivation source — `infra_derived` rows come from entity metadata
 * (e.g. @PartitionField retention), `rule` rows from job_rules evaluation,
 * `manual` rows from admin action.
 */
import {
  Entity,
  Key,
  Unique,
  Column,
  AuditableField,
  AuditableFieldType,
  type IAuditableEntity, type UUID } from "@primebrick/dal-pg";

@Entity("job_schedules", "job")
export class JobScheduleEntity implements IAuditableEntity {
  @Key()
  id!: bigint;

  @Unique()
  uuid!: UUID;

  /** The rollup subject the declaration is stored on — unique per schedule. */
  @Unique()
  @Column({ nullable: false })
  schedule_subject!: string;

  /** Owning service code — must match the declarer's identity. */
  @Column({ nullable: false })
  service_code!: string;

  /** Job kind inside the service namespace, e.g. "partition-maintenance". */
  @Column({ nullable: false })
  job_name!: string;

  /** infra_derived | rule | manual */
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

  /** armed | disarmed */
  @Column({ length: 20, nullable: false })
  status!: string;

  /** Who armed it — service code for infra_derived/rule, user for manual. */
  @Column({ nullable: true })
  initiator?: string;

  /** The rule this schedule was materialized from (kind=rule). */
  @Column({ nullable: true })
  rule_uuid?: UUID;

  @Column({ nullable: true })
  armed_at?: Date;

  @Column({ nullable: true })
  disarmed_at?: Date;

  @AuditableField(AuditableFieldType.CREATED_AT)
  created_at!: Date;

  @AuditableField(AuditableFieldType.CREATED_BY)
  created_by!: string;

  @AuditableField(AuditableFieldType.UPDATED_AT)
  updated_at!: Date;

  @AuditableField(AuditableFieldType.UPDATED_BY)
  updated_by!: string;

  @AuditableField(AuditableFieldType.VERSION)
  version!: number;
}
