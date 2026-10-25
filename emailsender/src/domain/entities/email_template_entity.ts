import {
  Column,
  Entity,
  Key,
  Unique,
  type UUID,
  EntityBase,
  Auditable,
  Deletable,
} from "@primebrick/dal-pg";

@Entity("email_templates", "emailsender")
export class EmailTemplateEntity
  extends Deletable(Auditable(EntityBase)) {
  @Key()
  id: bigint;

  @Unique()
  uuid: UUID;

  @Column({ length: 100, nullable: false })
  code: string;

  @Column({ length: 10, nullable: false })
  language_iso: string;

  @Column({ nullable: true })
  subject?: string;

  @Column({ nullable: true })
  body_html?: string;

  @Column({ nullable: true })
  body_text?: string;

  @Column({ nullable: true })
  mjml_source?: string;

  @Column({ nullable: true })
  variables?: Record<string, unknown>;





}
