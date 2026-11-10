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

@Entity("company_dimensions", "crm")
@AuditTrail()
@Cached(300_000)
export class CompanyDimensionEntity
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

  @Column({ nullable: false })
  min_size!: number;

  /** Inclusive upper bound; null = unbounded (e.g. "500+"). */
  @Column({ nullable: true })
  max_size?: number;

  @Column({ nullable: false })
  sort!: number;
}
