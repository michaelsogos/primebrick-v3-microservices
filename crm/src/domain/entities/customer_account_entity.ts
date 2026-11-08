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

/** Customer account — the flattened fiscal/legal datasheet of a customer:
 *  registered company_name + legal_form (ragione sociale) + jurisdiction
 *  country + the local_address and contact channel that represent it.
 *  Billing flows read ONE row, fully resolved — no relation chasing. */
@Entity("customer_accounts", "crm")
@AuditTrail()
@Cached(300_000)
export class CustomerAccountEntity
  extends Deletable(Auditable(EntityBase)) {
  @Key()
  id!: bigint;

  @Unique()
  uuid!: UUID;

  @Column({ nullable: false })
  customer_id!: bigint;

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

  /** Which LU of the customer represents this account (billing address). */
  @Column({ nullable: true })
  local_address_id?: bigint;

  /** Which contact channel of the customer serves this account. */
  @Column({ nullable: true })
  contact_id?: bigint;

  /** One default account per customer — partial unique index in DDL. */
  @Column({ nullable: false })
  is_default!: boolean;
}
