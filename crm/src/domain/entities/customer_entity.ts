/**
 * CustomerEntity — CRM-owned `customer` domain entity.
 *
 * Every declared property is a column with the same SQL name (e.g.
 * `display_name` → `display_name`). `@Column` is only for overrides
 * (`pgType`, `sqlName`, `nullable`).
 *
 * The `!` suffix is required by TypeScript (`strictPropertyInitialization`):
 * values are assigned by the hydration / DAL layer, not at class declaration.
 *
 * Schema = module boundary: the entity lives in the `crm` schema and is
 * registered in `ENTITY_REGISTRY` — `assertEntitySchemaDomain` and the drift
 * check enforce it at boot.
 */

import type { UUID, IExposableEntity, IClonableEntity } from "@primebrick/dal-pg";
import {
  Column,
  Entity,
  Key,
  Unique,
  CloneField,
  AuditTrail,
  EntityBase,
  Auditable,
  Deletable,
} from "@primebrick/dal-pg";
import { Cached } from "@primebrick/sdk";

export type CustomerStatus = "ACTIVE" | "INACTIVE";

@Entity("customers", "crm")
@AuditTrail()
@Cached(300_000) // 5 min TTL — mutable business data
export class CustomerEntity
  extends Deletable(Auditable(EntityBase))
  implements IExposableEntity, IClonableEntity {
  @Key()
  id: bigint;

  @Unique()
  uuid: UUID;

  @Column({ length: 20, nullable: false })
  code: string;

  /** Informal display name — may be a pseudonym, not verified. The fiscal
   *  registered name lives on `customer_accounts.company_name`; contact
   *  channels live on `customer_contacts`; LU addresses on
   *  `local_addresses`. */
  @Column({ nullable: true })
  display_name?: string;

  /** Lazy meta ref → customer_types (private, company, pa, charity, …). */
  @Column({ pgType: "uuid", nullable: true })
  customer_type_uuid?: string;

  /** Lazy meta ref → qualifications (LEAD→… lifecycle). */
  @Column({ pgType: "uuid", nullable: true })
  qualification_uuid?: string;

  /** Lazy meta ref → marketing_qualifications (MQL/SAL/SQL/PQL). */
  @Column({ pgType: "uuid", nullable: true })
  marketing_qualification_uuid?: string;

  /** Lazy meta ref → company_dimensions; n/a when type=private. */
  @Column({ pgType: "uuid", nullable: true })
  company_dimension_uuid?: string;

  /** Union alias — NOT NULL esplicito per DDL */
  @Column({ nullable: false })
  status: CustomerStatus;

  @Column({ nullable: true })
  status_reason?: string;

  /**
   * Customer onboarding instant, stored as `timestamptz` (UTC in PostgreSQL).
   * Pair with {@link onboarding_time_zone} so the UI can format in the creator IANA zone (incl. DST).
   */
  @Column({ nullable: true })
  onboarding_at?: Date;

  /** IANA time zone id (e.g. `Europe/Rome`) captured when onboarding was recorded. */
  @Column({ length: 100, nullable: true })
  onboarding_time_zone?: string;

  /** Preferred communication locale — BCP-47 tag (e.g. `it-IT`, `en-US`).
   *  User-configured; rides the CRM event customer snapshot so rule
   *  payload maps can resolve `languageIso` for localizable callables. */
  @Column({ length: 35, nullable: true })
  preferred_locale?: string;

  @Column({ pgType: "uuid", nullable: true })
  @CloneField()
  cloned_from?: string;
}
