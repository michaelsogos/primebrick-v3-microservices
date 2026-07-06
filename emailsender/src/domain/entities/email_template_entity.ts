import {
  Column,
  Entity,
  Key,
  Unique,
  AuditableField,
  AuditableFieldType,
  type IAuditableEntity,
} from "@primebrick/dal-pg";

@Entity("email_templates")
export class EmailTemplateEntity implements IAuditableEntity {
  @Key()
  id: number;

  @Unique()
  uuid: string;

  @Column({ length: 100, nullable: false })
  code: string;

  @Column({ length: 10, nullable: false })
  language_iso: string;

  @Column({ nullable: true })
  subject: string;

  @Column({ nullable: true })
  body_html: string;

  @Column({ nullable: true })
  body_text: string;

  @Column({ nullable: true })
  mjml_source: string;

  @Column({ pgType: "jsonb", nullable: true })
  variables: Record<string, unknown>;

  @AuditableField(AuditableFieldType.CREATED_AT)
  created_at: Date;

  @AuditableField(AuditableFieldType.CREATED_BY)
  created_by: string;

  @AuditableField(AuditableFieldType.UPDATED_AT)
  updated_at: Date;

  @AuditableField(AuditableFieldType.UPDATED_BY)
  updated_by: string;

  @AuditableField(AuditableFieldType.VERSION)
  version: number;
}
