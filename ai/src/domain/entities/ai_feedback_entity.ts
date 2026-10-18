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
  type IAuditableEntity,
  type UUID,
  EntityBase,
  Auditable,
} from "@primebrick/dal-pg";
import { AiConversationEntity } from "./ai_conversation_entity.js";

@Entity("ai_feedback", "ai")
@PartitionChildOf({ parent: AiConversationEntity, ref: "conversation_uuid" })
export class AiFeedbackEntity
  extends Auditable(EntityBase) {
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


  /** Voter = actor (session user uuid). Replaces the old `user_uuid`
   *  domain column. */



}
