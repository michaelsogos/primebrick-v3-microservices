import { Entity, Key, Column } from "@primebrick/dal-pg";

/**
 * Entity for `emailsender.sender_log`.
 *
 * The `provider` column was renamed to `provider_uuid` (type uuid, references providers.uuid).
 *
 * This table is NOT auditable (no created_at, updated_at, version, deleted_at columns).
 */
@Entity("sender_log")
export class SenderLogEntity {
  @Key() id!: bigint;

  @Column({ nullable: true }) entity_id?: bigint;
  @Column({ nullable: true }) entity_uuid?: string;
  @Column({ nullable: false }) type!: string;
  @Column({ nullable: true }) provider_message_id?: string;
  @Column({ nullable: true, pgType: "uuid" }) provider_uuid?: string;
  @Column({ length: 50, nullable: false }) status!: string;
  @Column({ nullable: true }) template_uuid?: string;
  @Column({ nullable: false, pgType: "jsonb" }) senders!: object;
  @Column({ nullable: false, pgType: "jsonb" }) recipients!: object;
  @Column({ nullable: true }) interpolated_sent_message?: string;
  @Column({ nullable: true }) error_message?: string;
  @Column({ nullable: true }) sent_at?: Date;
  @Column({ nullable: true }) status_changed_at?: Date;
}
