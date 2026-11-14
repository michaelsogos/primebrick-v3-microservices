import {
  Column,
  Entity,
  Dict,
  DictEntityBase,
} from "@primebrick/dal-pg";
import { Cached } from "@primebrick/sdk";

/** Directional relation-type vocabulary for `customer_link` edges —
 *  the same physical row reads `label_key` parent-side ("the child IS
 *  a ‹subsidiary›") and `inverse_label_key` child-side ("the parent IS
 *  a ‹holding›"). NULL inverse = self-inverse type (same vocabulary
 *  both directions — by construction, not configuration). */
@Entity("customer_link_types", "crm")
@Cached(300_000)
@Dict({
  directional: {
    forward_label_field: "label_key",
    inverse_label_field: "inverse_label_key",
  },
})
export class CustomerLinkTypeEntity extends DictEntityBase {
  /** Forward label — parent-side reading of the edge. */
  @Column({ length: 100, nullable: false })
  label_key!: string;

  /** Inverse label — child-side reading; NULL ⇒ self-inverse type. */
  @Column({ length: 100, nullable: true })
  inverse_label_key?: string;
}
