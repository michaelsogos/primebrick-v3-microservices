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

/** Customer account — the flattened fiscal/legal datasheet of a customer:
 *  registered company_name + legal_form (ragione sociale) + jurisdiction
 *  country + the local_address and contact channel that represent it.
 *  Billing flows read ONE row, fully resolved — no relation chasing. */
@Entity("customer_accounts")
@AuditTrail()
@Cached(300_000)
export class CustomerAccountEntity
  extends Clonable(Deletable(Auditable(EntityBase)))
  implements IClonableEntity {
  @Key()
  @Column({ pgType: "uuid" })
  uuid!: UUID;

  /** FK → customers.uuid — the owning customer. */
  @Column({ pgType: "uuid", nullable: false })
  customer_uuid!: string;

  /** Lazy meta ref → account_kinds (invoice, legal, …). */
  @Column({ pgType: "uuid", nullable: false })
  kind_uuid!: string;

  /** Registered (fiscal) company name — clean data, unlike display_name. */
  @Column({ nullable: false })
  company_name!: string;

  /** Lazy meta ref → legal_forms; pivot cascade = `country`. */
  @Column({ pgType: "uuid", nullable: true })
  legal_form_uuid?: string;

  /** ISO 3166-1 alpha-2 — the account's fiscal jurisdiction. */
  @Column({ length: 2, nullable: false })
  country!: string;

  /** FK → local_addresses.uuid — the represented LU. */
  @Column({ pgType: "uuid", nullable: true })
  local_address_uuid?: string;

  /** FK → customer_contacts.uuid — the serving contact channel. */
  @Column({ pgType: "uuid", nullable: true })
  contact_uuid?: string;

  /** One default account per customer — partial unique index in DDL. */
  @Column({ pgType: "boolean", nullable: false, defaultSql: "false" })
  is_default!: boolean;
}
