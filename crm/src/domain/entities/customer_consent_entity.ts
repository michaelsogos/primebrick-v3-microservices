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

/** GDPR consent record — historical rows, never updated-in-place:
 *  grant inserts, revoke sets revoked_at on the latest grant.
 *  `seal` is server-generated tamper evidence (see plan). */
@Entity("customer_consents")
@AuditTrail()
@Cached(300_000)
export class CustomerConsentEntity
  extends Deletable(Auditable(EntityBase)) {
  @Key()
  @Column({ pgType: "uuid" })
  uuid!: UUID;

  /** FK → customers.uuid — the owning customer. */
  @Column({ pgType: "uuid", nullable: false })
  customer_uuid!: string;

  /** Lazy meta ref → consent_types. */
  @Column({ pgType: "uuid", nullable: false })
  type_uuid!: string;

  /** Version of the policy document that was signed. */
  @Column({ length: 50, nullable: false })
  doc_version!: string;

  @Column({ nullable: false, jsType: "instant" })
  granted_at!: Date;

  @Column({ nullable: true, jsType: "instant" })
  revoked_at?: Date;

  /** Grant channel (web form, paper, import, …). */
  @Column({ length: 50, nullable: true })
  channel?: string;

  /** Client IP captured at grant time — proof context. */
  @Column({ length: 45, nullable: true })
  ip?: string;

  @Column({ nullable: true })
  user_agent?: string;

  /** Server-generated sha256 seal over canonical consent fields. */
  @Column({ length: 64, nullable: false })
  seal!: string;
}
