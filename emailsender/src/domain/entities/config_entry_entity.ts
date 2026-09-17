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

@Entity("config_entries", "emailsender")
export class ConfigEntryEntity implements IAuditableEntity {
  @Key()
  id!: bigint;

  @Unique()
  uuid!: string;

  @Unique()
  @Column({ length: 100, nullable: false })
  key!: string;

  @Column({ nullable: true })
  value: string | null;

  @Column({ length: 50, nullable: false })
  type!: string;

  @Column({ nullable: true })
  type_config?: string;

  @Column({ length: 100, nullable: true })
  label_key?: string;

  @Column({ length: 100, nullable: true })
  description_key?: string;

  @Column({ nullable: false })
  reserved!: boolean;

  @Column({ length: 100, nullable: true })
  group_key?: string;

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
