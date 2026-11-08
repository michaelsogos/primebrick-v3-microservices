import { isColumnFilterable, isColumnSearchable, isColumnSortable, type MetaColumn } from "@primebrick/sdk";

export type CustomerLinkListColumn = Omit<MetaColumn, "sticky" | "audited">;

export const CUSTOMER_LINK_DEFAULT_SORT = { key: "updated_at", dir: "desc" as const };

const STICKY_KEYS = new Set<string>(["uuid"]);
const AUDITING_KEYS = new Set<string>([
  "created_at",
  "created_by",
  "updated_at",
  "updated_by",
  "deleted_at",
  "deleted_by",
  "version",
]);

const F = (c: string) => `crm.entities.customer_link.fields.${c}`;

/** N-N org/relationship graph edge — parent/child carry true bigint FKs
 *  to `crm.customers` (hidden raw ids; link rows are managed from the
 *  customer detail page). */
const CUSTOMER_LINK_RAW_COLUMNS: CustomerLinkListColumn[] = [
  { key: "uuid", label_key: "system.common.fields.uuid", type: "text", order: -1, sortable: true, default_visible: false },
  { key: "parent_customer_id", label_key: F("parent_customer_id"), type: "text", order: 0, filterable: true, default_visible: false },
  { key: "child_customer_id", label_key: F("child_customer_id"), type: "text", order: 1, filterable: true, default_visible: false },
  {
    key: "type_uuid",
    label_key: F("type_uuid"),
    type: "ref",
    order: 2,
    filterable: true,
    ref: { entity: "customer_link_type" },
  },
  { key: "created_at", label_key: "system.common.fields.created_at", type: "datetime", order: 3, sortable: true, default_visible: false },
  { key: "updated_at", label_key: "system.common.fields.updated_at", type: "datetime", order: 4, sortable: true, default_visible: false },
  { key: "created_by", label_key: "system.common.fields.created_by", type: "text", order: 5, default_visible: false },
  { key: "updated_by", label_key: "system.common.fields.updated_by", type: "text", order: 6, default_visible: false },
  { key: "version", label_key: "system.common.fields.version", type: "text", order: 7, default_visible: false },
  { key: "deleted_at", label_key: "system.common.fields.deleted_at", type: "datetime", order: 8, sortable: true, default_visible: false },
  { key: "deleted_by", label_key: "system.common.fields.deleted_by", type: "text", order: 9, default_visible: false },
];

export const CUSTOMER_LINK_LIST_COLUMNS: MetaColumn[] = CUSTOMER_LINK_RAW_COLUMNS.map((c) => ({
  ...c,
  ...(STICKY_KEYS.has(c.key) ? { sticky: true } : {}),
  ...(AUDITING_KEYS.has(c.key) ? { audited: true } : {}),
}));

export const CUSTOMER_LINK_SEARCHABLE_KEYS = CUSTOMER_LINK_LIST_COLUMNS.filter(isColumnSearchable).map((c) => c.key);
export const CUSTOMER_LINK_SORT_KEYS = CUSTOMER_LINK_LIST_COLUMNS.filter(isColumnSortable).map((c) => c.key);
export const CUSTOMER_LINK_FILTERABLE_KEYS = CUSTOMER_LINK_LIST_COLUMNS.filter(isColumnFilterable).map((c) => c.key);
