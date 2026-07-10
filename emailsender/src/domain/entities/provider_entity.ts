import {
  Column,
  Entity,
  Key,
  Unique,
  AuditableField,
  AuditableFieldType,
  DeletableField,
  DeletableFieldType,
  type IAuditableEntity,
  type IDeletableEntity,
} from "@primebrick/dal-pg";

@Entity("providers", "emailsender")
export class ProviderEntity implements IAuditableEntity, IDeletableEntity {
  @Key()
  id: bigint;

  @Unique()
  uuid: string;

  @Column({ length: 50, nullable: false })
  provider: string;

  @Column({ nullable: false })
  api_key: string;

  @Column({ nullable: true })
  api_endpoint: string;

  @Column({ nullable: true })
  from_email: string;

  @Column({ nullable: true })
  from_name: string;

  @Column({ nullable: true })
  reply_to: string;

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

  @DeletableField(DeletableFieldType.DELETED_AT)
  deleted_at?: Date;

  @DeletableField(DeletableFieldType.DELETED_BY)
  deleted_by?: string;
}
