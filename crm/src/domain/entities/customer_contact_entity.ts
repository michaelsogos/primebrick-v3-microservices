import type { UUID, IClonableEntity } from "@primebrick/dal-pg";
import {
  Column,
  Entity,
  Key,
  AuditTrail,
  EntityBase,
  Auditable,
  Clonable,
  Deletable,
} from "@primebrick/dal-pg";
import { Cached } from "@primebrick/sdk";

/** Customer contact channel — sub-array of the customer (SMS/VOICE/EMAIL/…).
 *  `value` semantics come from the type's `value_kind`; one default per
 *  (customer,type) — partial unique index in DDL. */
@Entity("customer_contacts")
@AuditTrail()
@Cached(300_000)
export class CustomerContactEntity
  extends Clonable(Deletable(Auditable(EntityBase)))
  implements IClonableEntity {
  @Key()
  @Column({ pgType: "uuid" })
  uuid!: UUID;

  /** FK → customers.uuid — the owning customer. */
  @Column({ pgType: "uuid", nullable: false })
  customer_uuid!: string;

  /** Lazy meta ref → contact_types. */
  @Column({ pgType: "uuid", nullable: false })
  type_uuid!: string;

  @Column({ nullable: false })
  value!: string;

  @Column({ pgType: "boolean", nullable: false, defaultSql: "false" })
  is_default!: boolean;

  @Column({ nullable: true })
  label?: string;
}
