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
import type { UUID } from "@primebrick/dal-pg";
import {
  Column,
  Entity,
  Index,
  Key,
  type IAuditableEntity,
  EntityBase,
  Auditable,
  Deletable,
} from "@primebrick/dal-pg";
import { PipelineStats } from "../jsonb-contracts.js";

@Entity("docs_ingest_log")
// "latest ingest runs first" — `created_at` is an Auditable-mixin column
// → class-level spec form.
@Index({ name: "docs_ingest_log_created_idx", columns: [{ name: "created_at", sort: "desc" }] })
export class DocsIngestLogEntity
  extends Deletable(Auditable(EntityBase)) {
  @Key()
  @Column({ pgType: "uuid" })
  uuid: UUID;

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
  @Column({ jsType: PipelineStats, nullable: false, defaultSql: "'{}'::jsonb" })
  stats!: PipelineStats;

  @Column({ nullable: true })
  error?: string;







}
