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
 * Shared table in the `public` schema owned by the BE — read-only consumer
 * here (the AI service uses it to discover live services that ship a
 * `docs_pack` capability). The second `@Entity` argument pins the schema so
 * the DAL generates `public.service_registry` regardless of `search_path`.
 *
 * NOTE: A copy of this entity exists in `primebrick-be-v3` and
 * `primebrick-us-v3/emailsender`. When a second microservice needs it,
 * extract to a shared `@primebrick/shared-entities` package.
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

  /** Capability flags, e.g. `["docs_pack"]` — services advertising a docs pack. */
  @Column({ pgType: "jsonb", nullable: false, defaultSql: "'[]'::jsonb" })
  capabilities!: string[];

  @Column({ nullable: true })
  name?: string;

  @Column({ nullable: true })
  description?: string;

  @Column({ nullable: true })
  author?: string;

  @Column({ nullable: true })
  github_repo_url?: string;

  @Column({ nullable: true })
  service_version?: string;

  @Column({ nullable: false, defaultSql: "false" })
  is_behind_scaler!: boolean;

  @Column({ nullable: false, defaultSql: "'unknown'" })
  status!: string;

  @Column({ pgType: "timestamptz", nullable: true })
  last_health_check_at?: Date;

  @Column({ nullable: false, defaultSql: "true" })
  is_enabled!: boolean;

  @Column({ nullable: true })
  icon?: string;

  @Column({ nullable: false, defaultSql: "'icon'" })
  icon_type!: string;

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
