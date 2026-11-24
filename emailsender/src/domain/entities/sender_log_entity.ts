import { Entity, Key, Column, Unique, type UUID } from "@primebrick/dal-pg";
import { RecipientEnvelope, SenderEnvelope } from "../jsonb-contracts.js";

/**
 * Entity for `emailsender.sender_log`.
 *
 * The `provider` column was renamed to `provider_uuid` (type uuid, references providers.uuid).
 *
 * This table is NOT auditable (no created_at, updated_at, version, deleted_at columns).
 */
@Entity("sender_log")
export class SenderLogEntity {
  @Key()
  @Column({ pgType: "uuid" })
  uuid!: UUID;

  @Column({ pgType: "uuid", nullable: true }) entity_uuid?: UUID;
  @Column({ nullable: false }) type!: string;
  /** Provider-assigned message id (Brevo `message-id`) — unique correlation key for webhook events. */
  @Unique()
  @Column({ nullable: true }) provider_message_id?: string;
  @Column({ pgType: "uuid", nullable: false }) provider_uuid!: UUID;
  @Column({ length: 50, nullable: false }) status!: string;
  @Column({ pgType: "uuid", nullable: true }) template_uuid?: UUID;
  @Column({ jsType: SenderEnvelope, nullable: false }) senders!: SenderEnvelope;
  @Column({ jsType: RecipientEnvelope, nullable: false }) recipients!: RecipientEnvelope;
  @Column({ nullable: true }) interpolated_sent_message?: string;
  @Column({ nullable: true }) error_message?: string;
  @Column({ nullable: true, jsType: "instant" }) sent_at?: Date;
  @Column({ nullable: true, jsType: "instant" }) status_changed_at?: Date;
}
