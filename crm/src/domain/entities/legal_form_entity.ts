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

/** ISO 20275 Entity Legal Forms (ELF) — seeded from the GLEIF code list.
 *  `code` = `<country>_<elf_code>` (e.g. `it_srl`); no label_key: legal-form
 *  names are authority data, not translated. */
@Entity("legal_forms", "crm")
@AuditTrail()
@Cached(300_000)
export class LegalFormEntity
  extends Deletable(Auditable(EntityBase)) {
  @Key()
  id!: bigint;

  @Unique()
  @Column({ pgType: "uuid" })
  uuid!: UUID;

  @Unique()
  @Column({ length: 50, nullable: false })
  code!: string;

  /** ISO 3166-1 alpha-2 jurisdiction — pivot of the country→legal_form cascade. */
  @Column({ length: 2, nullable: false })
  country!: string;

  /** ISO 20275 ELF code (4 chars). */
  @Column({ length: 4, nullable: false })
  elf_code!: string;

  @Column({ nullable: false })
  name_local!: string;

  @Column({ nullable: true })
  name_transliterated?: string;

  /** Semicolon-separated abbreviation list (GLEIF vocabulary can hold
   *  several equivalent forms — up to ~320 chars — e.g. "Pty Ltd;PTY LTD"). */
  @Column({ nullable: true })
  abbreviation?: string;

  /** ISO 20275 lifecycle status (ACTV/INAC). */
  @Column({ length: 10, nullable: false })
  status!: string;

  @Column({ pgType: "int4", nullable: false })
  sort!: number;
}
