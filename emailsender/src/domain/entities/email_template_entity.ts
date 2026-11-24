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

@Entity("email_templates")
export class EmailTemplateEntity
  extends Deletable(Auditable(EntityBase)) {
  @Key()
  @Column({ pgType: "uuid" })
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

  /** Declared template placeholders as `{name: descriptor}` — the keys are
   *  the interpolation vocabulary the `variables` payload feeds at send
   *  time (the payload_map `x_map_keys` hint reads them for suggestions).
   *  Free-form by design (the FE editor is a raw JSON textarea). */
  @Column({ pgType: "jsonb", nullable: true })
  variables?: Record<string, unknown>;





}
