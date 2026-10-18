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

@Entity("config_entries", "job")
export class ConfigEntryEntity
  extends Deletable(Auditable(EntityBase)) {
  @Key()
  id!: bigint;

  @Unique()
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

  @Column({ nullable: false })
  reserved!: boolean;

  @Column({ length: 100, nullable: true })
  group_key?: string;







}
