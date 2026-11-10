import {
  Column,
  Entity,
  Key,
  Unique,
  AuditTrail,
  EntityBase,
  Auditable,
  Deletable,
  type UUID,
} from "@primebrick/dal-pg";
import { Cached } from "@primebrick/sdk";

@Entity("customer_link_types", "crm")
@AuditTrail()
@Cached(300_000)
export class CustomerLinkTypeEntity
  extends Deletable(Auditable(EntityBase)) {
  @Key()
  id!: bigint;

  @Unique()
  @Column({ pgType: "uuid" })
  uuid!: UUID;

  @Unique()
  @Column({ length: 50, nullable: false })
  code!: string;

  @Column({ length: 100, nullable: false })
  label_key!: string;

  @Column({ pgType: "int4", nullable: false })
  sort!: number;
}
