import { Column, Entity, Key, Unique } from "@primebrick/dal-pg";

/**
 * Entity for `public.config_entries` — the BE-owned global config table.
 *
 * Read-only consumer projection (key/value only) used by dev tooling that
 * needs shared values like `redis_url`. The AI-owned mirror lives in
 * `ConfigEntryEntity` (`ai.config_entries`).
 */
@Entity("config_entries", "public")
export class PublicConfigEntryEntity {
  @Key()
  id!: bigint;

  @Unique()
  @Column({ length: 100, nullable: false })
  key!: string;

  @Column({ nullable: true })
  value: string | null;
}
