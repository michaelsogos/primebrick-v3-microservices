import {
  Column,
  Entity,
  DictEntityBase,
} from "@primebrick/dal-pg";
import { Cached } from "@primebrick/sdk";

@Entity("qualifications")
@Cached(300_000)
export class QualificationEntity extends DictEntityBase {
  @Column({ length: 100, nullable: false })
  label_key!: string;
}
