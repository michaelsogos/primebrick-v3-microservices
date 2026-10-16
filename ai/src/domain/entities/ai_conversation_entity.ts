/**
 * `ai.ai_conversations` — chat sessions of the assistant/Guide feature.
 *
 * Auditable (`IAuditableEntity`): `created_by` IS the owner — it replaced
 * the former `user_uuid` domain column (same value, stamped by the standard
 * `add/update { actor }` path). NO @AuditTrail(): conversations are
 * user-owned operational state, not compliance data — `updated_at`/
 * `updated_by`/`version` stamping is enough.
 *
 * The table is `PARTITION BY RANGE (last_seen_at)` (pg_partman, monthly).
 * Because PostgreSQL requires a partition key inside every unique
 * constraint, child tables CANNOT keep a foreign key to this table —
 * referential integrity is application-level: `deleteConversation`
 * hard-deletes children + parent in one transaction, and the retention
 * job purges children of expiring partitions set-based before the drop.
 */
import {
  Column,
  Entity,
  Key,
  Unique,
  PartitionField,
  AuditableField,
  AuditableFieldType,
  type IAuditableEntity, type UUID,
} from "@primebrick/dal-pg";

@Entity("ai_conversations", "ai")
export class AiConversationEntity implements IAuditableEntity {
  /** Internal PK — FK/JOIN performance only, never exposed to callers. */
  @Key()
  id!: bigint;

  @Unique("ai_conversations_uuid_uq", 0)
  @Column({ nullable: false })
  uuid!: UUID;

  @Column({ nullable: true })
  title?: string;

  /**
   * Activity watermark — `max(created_at)` of every child event
   * (message, feedback). Stamped by `touch` (GREATEST, monotonic, no
   * version contention) inside the child-write transaction; never a
   * client-editable field. This is the PARTITION KEY: retention drops
   * partitions older than the inactivity window, and the retention job
   * purges the partition's child rows set-based before the drop.
   */
  @Unique("ai_conversations_uuid_uq", 1)
  @PartitionField({ interval: "1 month", retention: "6 months" })
  @Column({ nullable: false })
  last_seen_at!: Date;

  @AuditableField(AuditableFieldType.CREATED_AT)
  created_at!: Date;

  /** Owner = actor (session user uuid). Replaces the old `user_uuid`
   *  domain column — identical information, standard stamping. */
  @AuditableField(AuditableFieldType.CREATED_BY)
  created_by!: string;

  @AuditableField(AuditableFieldType.UPDATED_AT)
  updated_at!: Date;

  @AuditableField(AuditableFieldType.UPDATED_BY)
  updated_by!: string;

  @AuditableField(AuditableFieldType.VERSION)
  version!: number;
}
