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
  AuditableField,
  AuditableFieldType,
  type IAuditableEntity, type UUID } from "@primebrick/dal-pg";

@Entity("job_runs", "job")
export class JobRunEntity implements IAuditableEntity {
  @Key()
  id!: bigint;

  @Unique()
  uuid!: UUID;

  /** Schedule subject that fired this run (links to job_schedules). */
  @Column({ nullable: false })
  schedule_subject!: string;

  @Column({ nullable: false })
  service_code!: string;

  @Column({ nullable: false })
  job_name!: string;

  /** user | system */
  @Column({ length: 10, nullable: false })
  lane!: string;

  /** running | succeeded | failed | skipped */
  @Column({ length: 20, nullable: false })
  status!: string;

  /** RFC-style error code on failure (e.g. "401", "RBAC_PERMISSION_DENIED"). */
  @Column({ nullable: true })
  error_code?: string;

  @Column({ nullable: true })
  error_detail?: string;

  /** Wall-clock duration reported by the executor. */
  @Column({ nullable: true })
  duration_ms?: bigint;

  /** JetStream redelivery count at execution time. */
  @Column({ pgType: "int4", nullable: true })
  redelivery_count?: number;

  /** Originating user (user lane) or declaring service (system lane). */
  @Column({ nullable: true })
  initiator?: string;

  /** Free-form executor report (e.g. partitions dropped). */
  @Column({ nullable: true })
  report?: unknown;

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
