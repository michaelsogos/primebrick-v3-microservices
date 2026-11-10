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

/** Directed N-N customer graph edge — holding→subsidiary→leaf, or
 *  company→private-contact (employee/consultant/referent) depending on
 *  `type_uuid`. Adjacency model: moves = edge updates; subtree queries via
 *  recursive CTE; a closure table may be derived later if hot. */
@Entity("customer_links", "crm")
@AuditTrail()
@Cached(300_000)
export class CustomerLinkEntity
  extends Deletable(Auditable(EntityBase)) {
  @Key()
  id!: bigint;

  @Unique()
  @Column({ pgType: "uuid" })
  uuid!: UUID;

  /** Edge source — true FK → crm.customers(id). */
  @Column({ jsType: "bigint", nullable: false })
  parent_customer_id!: bigint;

  /** Edge target — true FK → crm.customers(id). */
  @Column({ jsType: "bigint", nullable: false })
  child_customer_id!: bigint;

  /** Lazy meta ref → customer_link_types (subsidiary, employee, …). */
  @Column({ pgType: "uuid", nullable: false })
  type_uuid!: string;
}
