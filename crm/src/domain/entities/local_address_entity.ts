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

/** Local Unit address — true FK `customer_id` (bigint REFERENCES
 *  crm.customers(id)); `type_uuid` is a lazy meta ref → local_address_types. */
@Entity("local_addresses", "crm")
@AuditTrail()
@Cached(300_000)
export class LocalAddressEntity
  extends Deletable(Auditable(EntityBase)) {
  @Key()
  id!: bigint;

  @Unique()
  uuid!: UUID;

  @Column({ nullable: false })
  customer_id!: bigint;

  @Column({ pgType: "uuid", nullable: false })
  type_uuid!: string;

  /** Street line 1 — civic number INCLUDED (international convention:
   *  providers return `housenumber` structured but we compose it into
   *  street at fill time). */
  @Column({ nullable: false })
  street!: string;

  /** Street line 2 — the two-line address cases (UK-style flat/unit,
   *  "c/o", internal notes). */
  @Column({ nullable: true })
  street2?: string;

  @Column({ length: 20, nullable: false })
  postal_code!: string;

  @Column({ nullable: false })
  city!: string;

  @Column({ nullable: true })
  province?: string;

  /** ISO 3166-1 alpha-2. */
  @Column({ length: 2, nullable: false })
  country!: string;

  @Column({ nullable: true })
  lat?: number;

  @Column({ nullable: true })
  lng?: number;

  /** POI display name when the address is a point of interest. */
  @Column({ nullable: true })
  poi_name?: string;
}
