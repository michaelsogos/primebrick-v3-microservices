import { isColumnFilterable, isColumnSearchable, isColumnSortable, type MetaColumn } from "@primebrick/sdk";

/** Raw list column literal — canonical `MetaColumn` shape minus the
 *  flags injected by the normalize step (`sticky`, `audited`). */
export type CustomerTypeListColumn = Omit<MetaColumn, "sticky" | "audited">;

export const CUSTOMER_TYPE_DEFAULT_SORT = { key: "sort", dir: "asc" as const };

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

const F = (c: string) => `crm.entities.customer_type.fields.${c}`;

/** Dictionary list contract: code is the sticky identity column; `label_key`
 *  is the i18n pointer the ref-combo resolves (display_field). */
const CUSTOMER_TYPE_RAW_COLUMNS: CustomerTypeListColumn[] = [
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

export const CUSTOMER_TYPE_LIST_COLUMNS: MetaColumn[] = CUSTOMER_TYPE_RAW_COLUMNS.map((c) => ({
  ...c,
  ...(STICKY_KEYS.has(c.key) ? { sticky: true } : {}),
  ...(AUDITING_KEYS.has(c.key) ? { audited: true } : {}),
}));

export const CUSTOMER_TYPE_SEARCHABLE_KEYS = CUSTOMER_TYPE_LIST_COLUMNS.filter(isColumnSearchable).map((c) => c.key);
export const CUSTOMER_TYPE_SORT_KEYS = CUSTOMER_TYPE_LIST_COLUMNS.filter(isColumnSortable).map((c) => c.key);
export const CUSTOMER_TYPE_FILTERABLE_KEYS = CUSTOMER_TYPE_LIST_COLUMNS.filter(isColumnFilterable).map((c) => c.key);
