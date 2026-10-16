/**
 * `ai.ai_telemetry` — per-request metrics for the AI orchestrator.
 *
 * Plain (non-auditable) entity: append-only metrics rows, `created_at` is
 * a server-default timestamp, `user_uuid` is a domain column (not the
 * audit `created_by`). No updates/deletes by design.
 */
import { Column, Entity, Key, Unique,
  type UUID,
} from "@primebrick/dal-pg";

@Entity("ai_telemetry", "ai")
export class AiTelemetryEntity {
  @Key()
  id!: bigint;

  @Unique("ai_telemetry_uuid_uq", 0)
  @Column({ nullable: false })
  uuid!: UUID;

  @Column({ nullable: true })
  conversation_uuid?: UUID | null;

  @Column({ nullable: false })
  user_uuid!: UUID;

  @Column({ nullable: false })
  model!: string;

  @Column({ pgType: "int4", nullable: false })
  tokens_in!: number;

  @Column({ pgType: "int4", nullable: false })
  tokens_out!: number;

  @Column({ pgType: "int4", nullable: false })
  steps!: number;

  @Column({ pgType: "int4", nullable: false })
  tool_calls!: number;

  @Column({ pgType: "int4", nullable: false })
  rag_hits!: number;

  @Column({ pgType: "int4", nullable: false })
  latency_ms!: number;

  @Column({ nullable: false })
  success!: boolean;

  @Column({ nullable: true })
  error?: string | null;

  @Column({ nullable: false })
  created_at!: Date;
}
