import {
  Column,
  Entity,
  Key,
  AuditTrail,
  Relation,
  Ref,
  EntityBase,
  Auditable,
  Deletable,
  type UUID,
} from "@primebrick/dal-pg";
import { Cached } from "@primebrick/sdk";

/** Directed customer graph edge — holding→subsidiary→leaf, or
 *  company→private-contact (employee/consultant/referent) depending on
 *  `type_uuid`. Adjacency model: moves = edge updates; subtree queries via
 *  recursive CTE; a closure table may be derived later if hot.
 *
 *  `@Relation` declares the edge contract: no display_field, no pinned
 *  column — the identity is the composite (parent, type, child), the
 *  display is viewpoint-dependent (the `relation` facet owns it). The
 *  DAL derives the unordered-pair unique index
 *  `UNIQUE(LEAST(parent,child), GREATEST(parent,child), type)` — atomic
 *  rejection of both exact and direction-reversed duplicates (a reversed
 *  row is a circular reference in the hierarchy). Ends are create-set /
 *  frozen afterwards: repointing an edge is delete+create. */
@Entity("customer_links")
@AuditTrail()
@Cached(300_000)
@Relation({
  parent_field: "parent_customer_uuid",
  child_field: "child_customer_uuid",
  type_field: "type_uuid",
})
export class CustomerLinkEntity
  extends Deletable(Auditable(EntityBase)) {
  @Key()
  @Column({ pgType: "uuid" })
  uuid!: UUID;

  /** FK → customers.uuid — edge source (relation parent end). */
  @Ref("customer")
  @Column({ pgType: "uuid", nullable: false })
  parent_customer_uuid!: string;

  /** FK → customers.uuid — edge target (relation child end). */
  @Ref("customer")
  @Column({ pgType: "uuid", nullable: false })
  child_customer_uuid!: string;

  /** Directional vocabulary → customer_link_types (subsidiary, employee, …). */
  @Ref("customer_link_type")
  @Column({ pgType: "uuid", nullable: false })
  type_uuid!: string;
}
