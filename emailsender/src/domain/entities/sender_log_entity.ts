import { Entity, Key, Column, Unique, type UUID } from "@primebrick/dal-pg";
import { RecipientEnvelope, SenderEnvelope, SendRequestPayload } from "../jsonb-contracts.js";

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
  /** Transport-level request correlation — UNIQUE: the domain-native dedupe
   *  backstop of the durable send work item (taken-charge key). */
  @Unique()
  @Column({ length: 100, nullable: true }) request_id?: string;
  /** The original send request verbatim — the taken-charge write captures
   *  everything the asynchronous dispatch needs. */
  @Column({ jsType: SendRequestPayload, nullable: true }) request_payload?: SendRequestPayload;
  @Column({ pgType: "uuid", nullable: false }) provider_uuid!: UUID;
  @Column({ length: 50, nullable: false }) status!: string;
  @Column({ pgType: "uuid", nullable: true }) template_uuid?: UUID;
  @Column({ jsType: SenderEnvelope, nullable: false }) senders!: SenderEnvelope;
  @Column({ jsType: RecipientEnvelope, nullable: false }) recipients!: RecipientEnvelope;
  @Column({ nullable: true }) interpolated_sent_message?: string;
  @Column({ nullable: true }) error_message?: string;
  @Column({ nullable: true, jsType: "instant", defaultSql: "clock_timestamp()" }) sent_at?: Date;
  @Column({ nullable: true, jsType: "instant", defaultSql: "clock_timestamp()" }) status_changed_at?: Date;
}
