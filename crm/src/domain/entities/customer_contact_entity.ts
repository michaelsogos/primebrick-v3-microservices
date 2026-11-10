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

/** Customer contact channel — sub-array of the customer (SMS/VOICE/EMAIL/…).
 *  `value` semantics come from the type's `value_kind`; one default per
 *  (customer,type) — partial unique index in DDL. */
@Entity("customer_contacts", "crm")
@AuditTrail()
@Cached(300_000)
export class CustomerContactEntity
  extends Deletable(Auditable(EntityBase)) {
  @Key()
  id!: bigint;

  @Unique()
  uuid!: UUID;

  @Column({ jsType: "bigint", nullable: false })
  customer_id!: bigint;

  /** Lazy meta ref → contact_types. */
  @Column({ pgType: "uuid", nullable: false })
  type_uuid!: string;

  @Column({ nullable: false })
  value!: string;

  @Column({ nullable: false })
  is_default!: boolean;

  @Column({ nullable: true })
  label?: string;
}
