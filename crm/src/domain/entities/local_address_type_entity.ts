import {
  Column,
  Entity,
  DictEntityBase,
} from "@primebrick/dal-pg";
import { Cached } from "@primebrick/sdk";

@Entity("local_address_types")
@Cached(300_000)
export class LocalAddressTypeEntity extends DictEntityBase {
  @Column({ length: 100, nullable: false })
  label_key!: string;
}
