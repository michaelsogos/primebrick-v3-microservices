/**
 * `ai.ai_feedback` — user thumbs up/down (+ optional comment) on AI
 * assistant messages.
 *
 * Auditable (`IAuditableEntity`): `created_by` replaced the former
 * `user_uuid` domain column — same actor, standard stamping. Append-only
 * by contract — NO @AuditTrail().
 */
import {
  Column,
  Entity,
  Key,
  Unique,
  PartitionChildOf,
  AuditableField,
  AuditableFieldType,
  type IAuditableEntity, type UUID,
} from "@primebrick/dal-pg";
import { AiConversationEntity } from "./ai_conversation_entity.js";

@Entity("ai_feedback", "ai")
@PartitionChildOf({ parent: AiConversationEntity, ref: "conversation_uuid" })
export class AiFeedbackEntity implements IAuditableEntity {
  @Key()
  id!: bigint;

  @Unique()
  @Column({ nullable: false })
  uuid!: UUID;

  @Column({ nullable: false })
  message_uuid!: UUID;

  @Column({ nullable: true })
  conversation_uuid?: UUID;

  @Column({ nullable: false })
  rating!: string;

  @Column({ nullable: true })
  comment?: string;

  @AuditableField(AuditableFieldType.CREATED_AT)
  created_at!: Date;

  /** Voter = actor (session user uuid). Replaces the old `user_uuid`
   *  domain column. */
  @AuditableField(AuditableFieldType.CREATED_BY)
  created_by!: string;

  @AuditableField(AuditableFieldType.UPDATED_AT)
  updated_at!: Date;

  @AuditableField(AuditableFieldType.UPDATED_BY)
  updated_by!: string;

  @AuditableField(AuditableFieldType.VERSION)
  version!: number;
}
