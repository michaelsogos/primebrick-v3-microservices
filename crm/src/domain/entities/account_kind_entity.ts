import {
  Column,
  Entity,
  DictEntityBase,
} from "@primebrick/dal-pg";
import { Cached } from "@primebrick/sdk";

@Entity("account_kinds")
@Cached(300_000)
export class AccountKindEntity extends DictEntityBase {
  @Column({ length: 100, nullable: false })
  label_key!: string;
}
