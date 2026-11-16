import {
  Entity,
  Key,
  Unique,
  Column,
  type UUID,
  EntityBase,
  Auditable,
  Deletable,
} from "@primebrick/dal-pg";

/**
 * test_item — the boilerplate's example entity. Replace with your domain
 * entities on clone (and delete this file).
 *
 * Canonical shape:
 *  - `EntityBase`            — uuid PK (v7), `id` identity column
 *  - `Auditable(...)`        — created_at/by, updated_at/by, version
 *    columns, stamped by the governed write path (`svc`), never by hand
 *  - `Deletable(...)`        — deleted_at/deleted_by soft delete
 *
 * Audit trail opt-in: add `@AuditTrail()` (import from dal-pg) — the
 * entity-service then writes `<table>_audit` rows on every write and
 * `partitionMaintenance` (wired in index.ts) materializes the retention
 * job automatically. Ship the audit table through `pnpm db:meta:compare`.
 */
@Entity("test_items", "boilerplate")
export class TestItemEntity
  extends Deletable(Auditable(EntityBase)) {
  @Key()
  @Column({ pgType: "uuid" })
  uuid!: UUID;

  @Unique()
  @Column({ length: 120, nullable: false })
  name!: string;

  @Column({ nullable: true })
  note?: string;

  @Column({ pgType: "boolean", nullable: false })
  enabled!: boolean;
}
