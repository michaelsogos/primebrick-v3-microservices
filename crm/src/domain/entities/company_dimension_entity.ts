import {
  Column,
  Entity,
  DictEntityBase,
} from "@primebrick/dal-pg";
import { Cached } from "@primebrick/sdk";

@Entity("company_dimensions")
@Cached(300_000)
export class CompanyDimensionEntity extends DictEntityBase {
  @Column({ length: 100, nullable: false })
  label_key!: string;

  @Column({ pgType: "int4", nullable: false })
  min_size!: number;

  /** Inclusive upper bound; null = unbounded (e.g. "500+"). */
  @Column({ pgType: "int4", nullable: true })
  max_size?: number;
}
