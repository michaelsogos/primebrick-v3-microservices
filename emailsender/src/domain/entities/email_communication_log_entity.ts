import { Entity, Key, Column } from "@primebrick/dal-pg";

/**
 * Entity for `emailsender.email_templates_communication_log`.
 *
 * Column set verified from the actual INSERT/UPDATE SQL in `email-service.ts`
 * (success + failure paths) and `webhook-service.ts` (update by
 * `provider_message_id`).
 *
 * This table is NOT auditable (no `created_at`/`updated_*`/`version`/`deleted_*`
 * columns in the observed SQL). The success INSERT sets `sent_at` +
 * `status_changed_at` + `provider_message_id` + `interpolated_sent_message`;
 * the failure INSERT sets `error_message` + `status_changed_at` and leaves
 * `provider_message_id`/`interpolated_sent_message`/`sent_at` NULL (omitted
 * from the payload → not in the DAL's INSERT → DB default applies).
 */
@Entity("email_templates_communication_log")
export class EmailCommunicationLogEntity {
  @Key() id!: number;

  @Column({ nullable: true }) entity_id?: number;
  @Column({ nullable: true }) entity_uuid?: string;
  @Column({ nullable: false }) type!: string;
  @Column({ nullable: true }) provider_message_id?: string;
  @Column({ nullable: false }) provider!: string;
  @Column({ length: 50, nullable: false }) status!: string;
  @Column({ nullable: true }) template_uuid?: string;
  @Column({ nullable: false, pgType: "jsonb" }) senders!: object;
  @Column({ nullable: false, pgType: "jsonb" }) recipients!: object;
  @Column({ nullable: true }) interpolated_sent_message?: string;
  @Column({ nullable: true }) error_message?: string;
  @Column({ nullable: true }) sent_at?: Date;
  @Column({ nullable: true }) status_changed_at?: Date;
}
