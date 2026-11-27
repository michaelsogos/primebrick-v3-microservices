import {
  Column,
  Entity,
  DictEntityBase,
} from "@primebrick/dal-pg";
import { Cached } from "@primebrick/sdk";

@Entity("marketing_qualifications")
@Cached(300_000)
export class MarketingQualificationEntity extends DictEntityBase {
  @Column({ length: 100, nullable: false })
  label_key!: string;
}
