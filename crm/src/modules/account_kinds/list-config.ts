import { isColumnFilterable, isColumnSearchable, isColumnSortable, type MetaColumn } from "@primebrick/sdk";

export type AccountKindListColumn = Omit<MetaColumn, "sticky" | "audited">;

export const ACCOUNT_KIND_DEFAULT_SORT = { key: "sort", dir: "asc" as const };

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

const F = (c: string) => `crm.entities.account_kind.fields.${c}`;

const ACCOUNT_KIND_RAW_COLUMNS: AccountKindListColumn[] = [
  { key: "uuid", label_key: "system.common.fields.uuid", type: "text", order: -1, sortable: true, default_visible: false },
  { key: "code", label_key: F("code"), type: "text", order: 0, sortable: true, hideable: false, filterable: true, searchable: true },
  { key: "label_key", label_key: F("label_key"), type: "text", order: 1, filterable: true },
  { key: "sort", label_key: F("sort"), type: "number", order: 2, sortable: true, filterable: true },
  { key: "created_at", label_key: "system.common.fields.created_at", type: "datetime", order: 3, sortable: true, default_visible: false },
  { key: "updated_at", label_key: "system.common.fields.updated_at", type: "datetime", order: 4, sortable: true, default_visible: false },
  { key: "created_by", label_key: "system.common.fields.created_by", type: "text", order: 5, default_visible: false },
  { key: "updated_by", label_key: "system.common.fields.updated_by", type: "text", order: 6, default_visible: false },
  { key: "version", label_key: "system.common.fields.version", type: "text", order: 7, default_visible: false },
  { key: "deleted_at", label_key: "system.common.fields.deleted_at", type: "datetime", order: 8, sortable: true, default_visible: false },
  { key: "deleted_by", label_key: "system.common.fields.deleted_by", type: "text", order: 9, default_visible: false },
];

export const ACCOUNT_KIND_LIST_COLUMNS: MetaColumn[] = ACCOUNT_KIND_RAW_COLUMNS.map((c) => ({
  ...c,
  ...(STICKY_KEYS.has(c.key) ? { sticky: true } : {}),
  ...(AUDITING_KEYS.has(c.key) ? { audited: true } : {}),
}));

export const ACCOUNT_KIND_SEARCHABLE_KEYS = ACCOUNT_KIND_LIST_COLUMNS.filter(isColumnSearchable).map((c) => c.key);
export const ACCOUNT_KIND_SORT_KEYS = ACCOUNT_KIND_LIST_COLUMNS.filter(isColumnSortable).map((c) => c.key);
export const ACCOUNT_KIND_FILTERABLE_KEYS = ACCOUNT_KIND_LIST_COLUMNS.filter(isColumnFilterable).map((c) => c.key);
