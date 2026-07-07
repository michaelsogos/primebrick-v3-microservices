import {
  Entity,
  Key,
  Unique,
  Column,
  AuditableField,
  AuditableFieldType,
  DeletableField,
  DeletableFieldType,
  type IAuditableEntity,
} from "@primebrick/dal-pg";

@Entity("config", "emailsender")
export class ConfigEntryEntity implements IAuditableEntity {
  @Key()
  id!: number;

  @Unique()
  uuid!: string;

  @Unique()
  @Column({ length: 50, nullable: false })
  key!: string;

  @Column({ nullable: true })
  value: string | null;

  @Column({ length: 100, nullable: true })
  label_key?: string;

  @Column({ length: 100, nullable: true })
  description_key?: string;

  @AuditableField(AuditableFieldType.CREATED_AT)
  created_at!: Date;

  @AuditableField(AuditableFieldType.CREATED_BY)
  created_by!: string;

  @AuditableField(AuditableFieldType.UPDATED_AT)
  updated_at!: Date;

  @AuditableField(AuditableFieldType.UPDATED_BY)
  updated_by!: string;

  @AuditableField(AuditableFieldType.VERSION)
  version!: number;

  @DeletableField(DeletableFieldType.DELETED_AT)
  deleted_at?: Date;

  @DeletableField(DeletableFieldType.DELETED_BY)
  deleted_by?: string;
}
