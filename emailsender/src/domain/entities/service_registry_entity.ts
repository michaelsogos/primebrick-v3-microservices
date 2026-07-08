import {
  Entity,
  Key,
  Unique,
  Column,
  AuditableField,
  AuditableFieldType,
  type IAuditableEntity,
} from "@primebrick/dal-pg";

/**
 * Entity for `public.service_registry`.
 *
 * This is a shared table in the `public` schema, not owned by the emailsender
 * microservice. The second argument to `@Entity` overrides the schema so the
 * DAL generates `public.service_registry` in SQL, regardless of the Dal
 * gateway's `search_path` setting.
 *
 * NOTE: A copy of this entity exists in `primebrick-be-v3`. When a second
 * microservice needs it, extract to a shared `@primebrick/shared-entities`
 * package. For now, emailsender is the only US microservice consuming it.
 */
@Entity("service_registry", "public")
export class ServiceRegistryEntity implements IAuditableEntity {
  @Key()
  id!: bigint;

  @Unique()
  uuid!: string;

  @Column({ length: 100, nullable: false })
  code!: string;

  @Column({ nullable: false })
  base_url!: string;

  @Column({ pgType: "jsonb", nullable: false })
  endpoints!: Record<string, unknown>;

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
}
