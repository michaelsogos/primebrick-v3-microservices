/**
 * `ai.ai_telemetry` — per-request metrics for the AI orchestrator.
 *
 * Plain (non-auditable) entity: append-only metrics rows, `created_at` is
 * a server-default timestamp, `user_uuid` is a domain column (not the
 * audit `created_by`). No updates/deletes by design.
 */
import { Column, Entity, Index, Key,
  type UUID,
} from "@primebrick/dal-pg";

@Entity("ai_telemetry")
// "latest metrics first" list + per-user history — matching the live defs.
@Index({ name: "ai_telemetry_created_at_idx", columns: [{ name: "created_at", sort: "desc" }] })
@Index({
  name: "ai_telemetry_user_uuid_created_at_idx",
  columns: ["user_uuid", { name: "created_at", sort: "desc" }],
})
export class AiTelemetryEntity {
  @Key()
  @Column({ pgType: "uuid", nullable: false })
  uuid!: UUID;

  @Column({ pgType: "uuid", nullable: true })
  conversation_uuid?: UUID | null;

  @Column({ pgType: "uuid", nullable: false })
  user_uuid!: UUID;

  @Column({ nullable: false })
  model!: string;

  @Column({ pgType: "int4", nullable: false, defaultSql: "0" })
  tokens_in!: number;

  @Column({ pgType: "int4", nullable: false, defaultSql: "0" })
  tokens_out!: number;

  @Column({ pgType: "int4", nullable: false, defaultSql: "0" })
  steps!: number;

  @Column({ pgType: "int4", nullable: false, defaultSql: "0" })
  tool_calls!: number;

  @Column({ pgType: "int4", nullable: false, defaultSql: "0" })
  rag_hits!: number;

  @Column({ pgType: "int4", nullable: false, defaultSql: "0" })
  latency_ms!: number;

  @Column({ pgType: "boolean", nullable: false, defaultSql: "false" })
  success!: boolean;

  @Column({ nullable: true })
  error?: string | null;

  @Column({ nullable: false, jsType: "instant", defaultSql: "now()" })
  created_at!: Date;
}
