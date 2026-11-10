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

/** `value_kind` selects the value validation + input control for contacts
 *  of this type (`email` → zod email + EmailInput; `phone` → E.164 +
 *  PhoneInput; `text` → free). Declared per row so user-added types pick
 *  their semantics explicitly. */
@Entity("contact_types", "crm")
@AuditTrail()
@Cached(300_000)
export class ContactTypeEntity
  extends Deletable(Auditable(EntityBase)) {
  @Key()
  id!: bigint;

  @Unique()
  @Column({ pgType: "uuid" })
  uuid!: UUID;

  @Unique()
  @Column({ length: 50, nullable: false })
  code!: string;

  @Column({ length: 100, nullable: false })
  label_key!: string;

  @Column({ length: 20, nullable: false })
  value_kind!: string;

  @Column({ pgType: "int4", nullable: false })
  sort!: number;
}
