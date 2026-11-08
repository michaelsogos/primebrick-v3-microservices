import { isColumnFilterable, isColumnSearchable, isColumnSortable, type MetaColumn } from "@primebrick/sdk";

export type LocalAddressListColumn = Omit<MetaColumn, "sticky" | "audited">;

export const LOCAL_ADDRESS_DEFAULT_SORT = { key: "updated_at", dir: "desc" as const };

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

const F = (c: string) => `crm.entities.local_address.fields.${c}`;

/** Local Unit rows — `customer_id` is the children-list filter pivot
 *  (hidden raw bigint); `type_uuid` renders via ref → local_address_type. */
const LOCAL_ADDRESS_RAW_COLUMNS: LocalAddressListColumn[] = [
  { key: "uuid", label_key: "system.common.fields.uuid", type: "text", order: -1, sortable: true, default_visible: false },
  { key: "customer_id", label_key: F("customer_id"), type: "text", order: 0, filterable: true, default_visible: false },
  {
    key: "type_uuid",
    label_key: F("type_uuid"),
    type: "ref",
    order: 1,
    filterable: true,
    ref: { entity: "local_address_type" },
  },
  { key: "street", label_key: F("street"), type: "text", order: 2, sortable: true, searchable: true, hideable: false },
  { key: "street2", label_key: F("street2"), type: "text", order: 3, default_visible: false },
  { key: "postal_code", label_key: F("postal_code"), type: "text", order: 4, sortable: true, filterable: true, searchable: true },
  { key: "city", label_key: F("city"), type: "text", order: 5, sortable: true, filterable: true, searchable: true },
  { key: "province", label_key: F("province"), type: "text", order: 6, sortable: true, filterable: true },
  { key: "country", label_key: F("country"), type: "text", order: 7, sortable: true, filterable: true },
  { key: "lat", label_key: F("lat"), type: "number", order: 8, default_visible: false },
  { key: "lng", label_key: F("lng"), type: "number", order: 9, default_visible: false },
  { key: "poi_name", label_key: F("poi_name"), type: "text", order: 10, searchable: true, default_visible: false },
  { key: "created_at", label_key: "system.common.fields.created_at", type: "datetime", order: 11, sortable: true, default_visible: false },
  { key: "updated_at", label_key: "system.common.fields.updated_at", type: "datetime", order: 12, sortable: true, default_visible: false },
  { key: "created_by", label_key: "system.common.fields.created_by", type: "text", order: 13, default_visible: false },
  { key: "updated_by", label_key: "system.common.fields.updated_by", type: "text", order: 14, default_visible: false },
  { key: "version", label_key: "system.common.fields.version", type: "text", order: 15, default_visible: false },
  { key: "deleted_at", label_key: "system.common.fields.deleted_at", type: "datetime", order: 16, sortable: true, default_visible: false },
  { key: "deleted_by", label_key: "system.common.fields.deleted_by", type: "text", order: 17, default_visible: false },
];

export const LOCAL_ADDRESS_LIST_COLUMNS: MetaColumn[] = LOCAL_ADDRESS_RAW_COLUMNS.map((c) => ({
  ...c,
  ...(STICKY_KEYS.has(c.key) ? { sticky: true } : {}),
  ...(AUDITING_KEYS.has(c.key) ? { audited: true } : {}),
}));

export const LOCAL_ADDRESS_SEARCHABLE_KEYS = LOCAL_ADDRESS_LIST_COLUMNS.filter(isColumnSearchable).map((c) => c.key);
export const LOCAL_ADDRESS_SORT_KEYS = LOCAL_ADDRESS_LIST_COLUMNS.filter(isColumnSortable).map((c) => c.key);
export const LOCAL_ADDRESS_FILTERABLE_KEYS = LOCAL_ADDRESS_LIST_COLUMNS.filter(isColumnFilterable).map((c) => c.key);
