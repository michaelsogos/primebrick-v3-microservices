import {
  Column,
  Entity,
  DictEntityBase,
} from "@primebrick/dal-pg";
import { Cached } from "@primebrick/sdk";

@Entity("customer_types")
@Cached(300_000) // 5 min TTL — reference data, rarely changes
export class CustomerTypeEntity extends DictEntityBase {
  @Column({ length: 100, nullable: false })
  label_key!: string;
}
