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
import { MessageContent } from "../jsonb-contracts.js";

@Entity("ai_messages", "ai")
@PartitionChildOf({ parent: AiConversationEntity, ref: "conversation_uuid" })
export class AiMessageEntity
  extends Auditable(EntityBase) {
  /** Internal PK — FK/JOIN performance only, never exposed to callers. */
  @Key()
  id!: bigint;

  @Unique()
  @Column({ pgType: "uuid", nullable: false })
  uuid!: UUID;

  @Column({ pgType: "uuid", nullable: false })
  conversation_uuid!: UUID;

  @Column({ nullable: false })
  role!: string;

  /** Role-keyed vocabulary — `user`→{text}, `assistant`→{text,tool_calls,
   *  tool_results}, `tool`→{tool_call_id,tool_name,output}. */
  @Column({ jsType: MessageContent, nullable: false })
  content!: MessageContent;

  @Column({ pgType: "int4", nullable: true })
  tokens_in?: number;

  @Column({ pgType: "int4", nullable: true })
  tokens_out?: number;





}
