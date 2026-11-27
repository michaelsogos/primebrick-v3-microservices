import {
  Column,
  Entity,
  DictEntityBase,
} from "@primebrick/dal-pg";
import { Cached } from "@primebrick/sdk";

/** `value_kind` selects the value validation + input control for contacts
 *  of this type (`email` → zod email + EmailInput; `phone` → E.164 +
 *  PhoneInput; `text` → free). Declared per row so user-added types pick
 *  their semantics explicitly. */
@Entity("contact_types")
@Cached(300_000)
export class ContactTypeEntity extends DictEntityBase {
  @Column({ length: 100, nullable: false })
  label_key!: string;

  @Column({ length: 20, nullable: false })
  value_kind!: string;
}
