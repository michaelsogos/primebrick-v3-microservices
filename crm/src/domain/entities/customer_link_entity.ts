import {
  Column,
  Entity,
  Key,
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
  @Column({ pgType: "uuid" })
  uuid!: UUID;

  /** FK → customers.uuid — edge source. */
  @Column({ pgType: "uuid", nullable: false })
  parent_customer_uuid!: string;

  /** FK → customers.uuid — edge target. */
  @Column({ pgType: "uuid", nullable: false })
  child_customer_uuid!: string;

  /** Lazy meta ref → customer_link_types (subsidiary, employee, …). */
  @Column({ pgType: "uuid", nullable: false })
  type_uuid!: string;
}
