import { isColumnFilterable, isColumnSearchable, isColumnSortable, type MetaColumn } from "@primebrick/sdk";

export type LegalFormListColumn = Omit<MetaColumn, "sticky" | "audited">;

export const LEGAL_FORM_DEFAULT_SORT = { key: "country", dir: "asc" as const };

const STICKY_KEYS = new Set<string>(["uuid", "code"]);
const AUDITING_KEYS = new Set<string>([
  "created_at",
  "created_by",
  "updated_at",
  "updated_by",
  "deleted_at",
  "deleted_by",
  "version",
]);

const F = (c: string) => `crm.entities.legal_form.fields.${c}`;

/** ISO 20275 legal-form dictionary — `country` is the cascade pivot
 *  (`depends_on` target for the account form); `status` mirrors the GLEIF
 *  ACTV/INAC vocabulary. `display_field` is `name_local` (authoritative
 *  data, not translated). */
const LEGAL_FORM_RAW_COLUMNS: LegalFormListColumn[] = [
  { key: "uuid", label_key: "system.common.fields.uuid", type: "text", order: -1, sortable: true, default_visible: false },
  { key: "code", label_key: F("code"), type: "text", order: 0, sortable: true, hideable: false, filterable: true, searchable: true },
  { key: "country", label_key: F("country"), type: "text", order: 1, sortable: true, filterable: true, searchable: true },
  { key: "elf_code", label_key: F("elf_code"), type: "text", order: 2, sortable: true, filterable: true, searchable: true },
  { key: "name_local", label_key: F("name_local"), type: "text", order: 3, sortable: true, searchable: true, filterable: true },
  { key: "name_transliterated", label_key: F("name_transliterated"), type: "text", order: 4, searchable: true, default_visible: false },
  { key: "abbreviation", label_key: F("abbreviation"), type: "text", order: 5, filterable: true, searchable: true },
  {
    key: "status",
    label_key: F("status"),
    type: "badge",
    order: 6,
    sortable: true,
    filterable: true,
    badge: {
      values: {
        ACTV: { label_key: "crm.entities.legal_form.status.actv", color: "emerald-300" },
        INAC: { label_key: "crm.entities.legal_form.status.inac", color: "zinc-300" },
      },
    },
  },
  { key: "sort", label_key: F("sort"), type: "number", order: 7, sortable: true, default_visible: false },
  { key: "created_at", label_key: "system.common.fields.created_at", type: "datetime", order: 8, sortable: true, default_visible: false },
  { key: "updated_at", label_key: "system.common.fields.updated_at", type: "datetime", order: 9, sortable: true, default_visible: false },
  { key: "created_by", label_key: "system.common.fields.created_by", type: "text", order: 10, default_visible: false },
  { key: "updated_by", label_key: "system.common.fields.updated_by", type: "text", order: 11, default_visible: false },
  { key: "version", label_key: "system.common.fields.version", type: "text", order: 12, default_visible: false },
  { key: "deleted_at", label_key: "system.common.fields.deleted_at", type: "datetime", order: 13, sortable: true, default_visible: false },
  { key: "deleted_by", label_key: "system.common.fields.deleted_by", type: "text", order: 14, default_visible: false },
];

export const LEGAL_FORM_LIST_COLUMNS: MetaColumn[] = LEGAL_FORM_RAW_COLUMNS.map((c) => ({
  ...c,
  ...(STICKY_KEYS.has(c.key) ? { sticky: true } : {}),
  ...(AUDITING_KEYS.has(c.key) ? { audited: true } : {}),
}));

export const LEGAL_FORM_SEARCHABLE_KEYS = LEGAL_FORM_LIST_COLUMNS.filter(isColumnSearchable).map((c) => c.key);
export const LEGAL_FORM_SORT_KEYS = LEGAL_FORM_LIST_COLUMNS.filter(isColumnSortable).map((c) => c.key);
export const LEGAL_FORM_FILTERABLE_KEYS = LEGAL_FORM_LIST_COLUMNS.filter(isColumnFilterable).map((c) => c.key);
