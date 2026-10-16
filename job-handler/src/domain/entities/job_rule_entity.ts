/**
 * `job.job_rules` — admin-managed business event→schedule rules.
 *
 * Only BUSINESS rules live here: infrastructure jobs (partition
 * maintenance) are derived from entity metadata, never duplicated in this
 * table. When an event matching `event_subject` (+ `filter`) arrives, the
 * rules engine materializes a schedule on `target_subject`.
 *
 * `execution_context` decides the due lane: "user" (default — fires on
 * jobs.due.user.* with the originator's AuthUser) or "system" (opt-in,
 * declared super-partes business process on jobs.due.system.*).
 */
import {
  Entity,
  Key,
  Unique,
  Column,
  AuditableField,
  AuditableFieldType,
  DeletableField,
  DeletableFieldType,
  type IAuditableEntity,
  type IDeletableEntity, type UUID } from "@primebrick/dal-pg";

@Entity("job_rules", "job")
export class JobRuleEntity implements IAuditableEntity, IDeletableEntity {
  @Key()
  id!: bigint;

  @Unique()
  uuid!: UUID;

  @Unique()
  @Column({ length: 200, nullable: false })
  name!: string;

  /** Event subject to subscribe, e.g. "customer.updated". */
  @Column({ nullable: false })
  event_subject!: string;

  /** JSON filter — array of { field, op, value } evaluated on the event payload. */
  @Column({ nullable: true })
  filter?: unknown;

  /** Schedule spec materialized on match — "@every 1d", "@at …", cron. */
  @Column({ nullable: false })
  schedule_spec!: string;

  /** Due target — must match jobs.due.<lane>.* for the declared context. */
  @Column({ nullable: false })
  target_subject!: string;

  /** user (default) | system — explicit opt-in, never inferred. */
  @Column({ length: 10, nullable: false })
  execution_context!: string;

  /** Optional Nats-Schedule-Source subject — fire-time state indirection. */
  @Column({ nullable: true })
  source_subject?: string;

  @Column({ nullable: false })
  enabled!: boolean;

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

  @DeletableField(DeletableFieldType.DELETED_AT)
  deleted_at?: Date;

  @DeletableField(DeletableFieldType.DELETED_BY)
  deleted_by?: string;
}
