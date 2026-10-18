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

@Entity("providers", "emailsender")
export class ProviderEntity
  extends Deletable(Auditable(EntityBase)) {
  @Key()
  id: bigint;

  @Unique()
  uuid: UUID;

  @Column({ length: 50, nullable: false })
  provider: string;

  @Column({ nullable: false })
  api_key: string;

  @Column({ nullable: true })
  api_endpoint?: string;

  @Column({ nullable: true })
  from_email?: string;

  @Column({ nullable: true })
  from_name?: string;

  @Column({ nullable: true })
  reply_to?: string;







}
