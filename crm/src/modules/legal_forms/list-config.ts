import type { MetaColumn } from "@primebrick/sdk";

export type LegalFormListColumn = Omit<MetaColumn, "sticky" | "audited">;

export const LEGAL_FORM_DEFAULT_SORT = { key: "country", dir: "asc" as const };

const STICKY_KEYS = new Set<string>(["code"]);

const F = (c: string) => `crm.entities.legal_form.fields.${c}`;

/** ISO 20275 legal-form dictionary — `country` is the cascade pivot
 *  (`depends_on` target for the account form); `status` mirrors the GLEIF
 *  ACTV/INAC vocabulary. `display_field` is `name_local` (authoritative
 *  data, not translated). */
const LEGAL_FORM_RAW_COLUMNS: LegalFormListColumn[] = [
  { key: "code", label_key: F("code"), type: "text", order: 0, hideable: false },
  { key: "country", label_key: F("country"), type: "text", order: 1 },
  { key: "elf_code", label_key: F("elf_code"), type: "text", order: 2 },
  { key: "name_local", label_key: F("name_local"), type: "text", order: 3 },
  { key: "name_transliterated", label_key: F("name_transliterated"), type: "text", order: 4, default_visible: false },
  { key: "abbreviation", label_key: F("abbreviation"), type: "text", order: 5 },
  { key: "status", label_key: F("status"), type: "badge", order: 6, badge: { values: { ACTV: { label_key: "crm.entities.legal_form.status.actv", color: "emerald-300" }, INAC: { label_key: "crm.entities.legal_form.status.inac", color: "zinc-300" } } } },
  { key: "sort", label_key: F("sort"), type: "number", order: 7, default_visible: false },
];

export const LEGAL_FORM_LIST_COLUMNS: MetaColumn[] = LEGAL_FORM_RAW_COLUMNS.map((c) => ({
  ...c,
  ...(STICKY_KEYS.has(c.key) ? { sticky: true } : {}),
}));

