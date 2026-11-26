import {
  Entity,
  Key,
  Unique,
  Column,
  type UUID,
  EntityBase,
  Auditable,
  Deletable,
} from "@primebrick/dal-pg";

/**
 * config_entries — the module's own key/value config table. Every service
 * owns one: ConfigLoader reads it at boot (via ConfigRepositoryAdapter)
 * and `ConfigEntriesService` governs its writes. Rename the schema token
 * on clone — everything else is boilerplate-stable.
 */
@Entity("config_entries")
export class ConfigEntryEntity
  extends Deletable(Auditable(EntityBase)) {
  @Key()
  @Column({ pgType: "uuid" })
  uuid!: UUID;

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

  @Column({ pgType: "boolean", nullable: false })
  reserved!: boolean;

  @Column({ length: 100, nullable: true })
  group_key?: string;
}
