/**
 * `ai.docs_ingest_log` — append-only log of docs-pack ingest runs.
 *
 * One row per `pullAndIngest` execution, across every trigger source
 * (`startup` | `register` | `gateway_online` | `manual` | `dev_script`).
 * Powers the admin "perché, da chi, quando" ingestion history on the
 * docs-index page.
 *
 * Auditable (`IAuditableEntity`) so the standard DAL `add(..., { actor })`
 * stamps created_at/created_by — `created_by` IS the "chi" (session user
 * UUID for manual reindex, "system" for lifecycle triggers). Deliberately
 * NO @AuditTrail(): log rows are append-only, never updated or deleted —
 * trailing an immutable log would duplicate information already on the row.
 */
import {
  Column,
  Entity,
  Key,
  AuditableField,
  AuditableFieldType,
  DeletableField,
  DeletableFieldType,
  type IAuditableEntity,
} from "@primebrick/dal-pg";

@Entity("docs_ingest_log", "ai")
export class DocsIngestLogEntity implements IAuditableEntity {
  @Key()
  id: bigint;

  /** Source repository id inside the pack (null = service-level failure before pack parse). */
  @Column({ length: 100, nullable: true })
  repo?: string;

  @Column({ length: 100, nullable: false })
  service_code: string;

  @Column({ length: 20, nullable: false })
  trigger_source: string;

  @Column({ pgType: "boolean", nullable: false })
  ok: boolean;

  /** PipelineStats snapshot: docs, chunks embedded/skipped/deleted, ms, etc. */
  @Column({ pgType: "jsonb", nullable: false, defaultSql: "'{}'::jsonb" })
  stats: Record<string, unknown>;

  @Column({ nullable: true })
  error?: string;

  @AuditableField(AuditableFieldType.CREATED_AT)
  created_at: Date;

  @AuditableField(AuditableFieldType.CREATED_BY)
  created_by: string;

  @AuditableField(AuditableFieldType.UPDATED_AT)
  updated_at: Date;

  @AuditableField(AuditableFieldType.UPDATED_BY)
  updated_by: string;

  @AuditableField(AuditableFieldType.VERSION)
  version: number;

  @DeletableField(DeletableFieldType.DELETED_AT)
  deleted_at?: Date;

  @DeletableField(DeletableFieldType.DELETED_BY)
  deleted_by?: string;
}
