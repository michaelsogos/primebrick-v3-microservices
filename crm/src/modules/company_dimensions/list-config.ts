import { isColumnFilterable, isColumnSearchable, isColumnSortable, type MetaColumn } from "@primebrick/sdk";

export type CompanyDimensionListColumn = Omit<MetaColumn, "sticky" | "audited">;

export const COMPANY_DIMENSION_DEFAULT_SORT = { key: "sort", dir: "asc" as const };

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

const F = (c: string) => `crm.entities.company_dimension.fields.${c}`;

const COMPANY_DIMENSION_RAW_COLUMNS: CompanyDimensionListColumn[] = [
  { key: "uuid", label_key: "system.common.fields.uuid", type: "text", order: -1, sortable: true, default_visible: false },
  { key: "code", label_key: F("code"), type: "text", order: 0, sortable: true, hideable: false, filterable: true, searchable: true },
  { key: "label_key", label_key: F("label_key"), type: "text", order: 1, filterable: true },
  { key: "min_size", label_key: F("min_size"), type: "number", order: 2, sortable: true, filterable: true },
  { key: "max_size", label_key: F("max_size"), type: "number", order: 3, sortable: true, filterable: true },
  { key: "sort", label_key: F("sort"), type: "number", order: 4, sortable: true, filterable: true },
  { key: "created_at", label_key: "system.common.fields.created_at", type: "datetime", order: 5, sortable: true, default_visible: false },
  { key: "updated_at", label_key: "system.common.fields.updated_at", type: "datetime", order: 6, sortable: true, default_visible: false },
  { key: "created_by", label_key: "system.common.fields.created_by", type: "text", order: 7, default_visible: false },
  { key: "updated_by", label_key: "system.common.fields.updated_by", type: "text", order: 8, default_visible: false },
  { key: "version", label_key: "system.common.fields.version", type: "text", order: 9, default_visible: false },
  { key: "deleted_at", label_key: "system.common.fields.deleted_at", type: "datetime", order: 10, sortable: true, default_visible: false },
  { key: "deleted_by", label_key: "system.common.fields.deleted_by", type: "text", order: 11, default_visible: false },
];

export const COMPANY_DIMENSION_LIST_COLUMNS: MetaColumn[] = COMPANY_DIMENSION_RAW_COLUMNS.map((c) => ({
  ...c,
  ...(STICKY_KEYS.has(c.key) ? { sticky: true } : {}),
  ...(AUDITING_KEYS.has(c.key) ? { audited: true } : {}),
}));

export const COMPANY_DIMENSION_SEARCHABLE_KEYS = COMPANY_DIMENSION_LIST_COLUMNS.filter(isColumnSearchable).map((c) => c.key);
export const COMPANY_DIMENSION_SORT_KEYS = COMPANY_DIMENSION_LIST_COLUMNS.filter(isColumnSortable).map((c) => c.key);
export const COMPANY_DIMENSION_FILTERABLE_KEYS = COMPANY_DIMENSION_LIST_COLUMNS.filter(isColumnFilterable).map((c) => c.key);
