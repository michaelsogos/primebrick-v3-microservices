/**
 * `ai.ai_messages` — chat messages inside an `ai_conversations` row.
 *
 * Auditable (`IAuditableEntity`): `created_by` stamps who triggered the
 * write (the session user — assistant replies are written inside the
 * user's request, so the actor is the user, not the model). Append-only
 * by contract — NO @AuditTrail().
 */
import {
  Column,
  Entity,
  Key,
  Unique,
  PartitionChildOf,
  type IAuditableEntity,
  type UUID,
  EntityBase,
  Auditable,
} from "@primebrick/dal-pg";
import { AiConversationEntity } from "./ai_conversation_entity.js";

@Entity("ai_messages", "ai")
@PartitionChildOf({ parent: AiConversationEntity, ref: "conversation_uuid" })
export class AiMessageEntity
  extends Auditable(EntityBase) {
  /** Internal PK — FK/JOIN performance only, never exposed to callers. */
  @Key()
  id!: bigint;

  @Unique()
  @Column({ nullable: false })
  uuid!: UUID;

  @Column({ nullable: false })
  conversation_uuid!: UUID;

  @Column({ nullable: false })
  role!: string;

  @Column({ nullable: false })
  content!: unknown;

  @Column({ pgType: "int4", nullable: true })
  tokens_in?: number;

  @Column({ pgType: "int4", nullable: true })
  tokens_out?: number;





}
