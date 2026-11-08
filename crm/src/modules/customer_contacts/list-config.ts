import { isColumnFilterable, isColumnSearchable, isColumnSortable, type MetaColumn } from "@primebrick/sdk";

export type CustomerContactListColumn = Omit<MetaColumn, "sticky" | "audited">;

export const CUSTOMER_CONTACT_DEFAULT_SORT = { key: "updated_at", dir: "desc" as const };

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

const F = (c: string) => `crm.entities.customer_contact.fields.${c}`;

const CUSTOMER_CONTACT_RAW_COLUMNS: CustomerContactListColumn[] = [
  { key: "uuid", label_key: "system.common.fields.uuid", type: "text", order: -1, sortable: true, default_visible: false },
  { key: "customer_id", label_key: F("customer_id"), type: "text", order: 0, filterable: true, default_visible: false },
  {
    key: "type_uuid",
    label_key: F("type_uuid"),
    type: "ref",
    order: 1,
    filterable: true,
    ref: { entity: "contact_type" },
  },
  {
    key: "value",
    label_key: F("value"),
    type: "text",
    order: 2,
    sortable: true,
    searchable: true,
    hideable: false,
    filterable: true,
    // The picked contact_type ROW's `value_kind` selects the control
    // (email → EmailInput, phone → PhoneInput, text → TextInput) —
    // disabled until a type is picked, value resets on type change.
    depends_on: { field: "type_uuid", control_prop: "value_kind" },
  },
  { key: "is_default", label_key: F("is_default"), type: "boolean", order: 3, sortable: true, filterable: true },
  { key: "label", label_key: F("label"), type: "text", order: 4, filterable: true, searchable: true },
  { key: "created_at", label_key: "system.common.fields.created_at", type: "datetime", order: 5, sortable: true, default_visible: false },
  { key: "updated_at", label_key: "system.common.fields.updated_at", type: "datetime", order: 6, sortable: true, default_visible: false },
  { key: "created_by", label_key: "system.common.fields.created_by", type: "text", order: 7, default_visible: false },
  { key: "updated_by", label_key: "system.common.fields.updated_by", type: "text", order: 8, default_visible: false },
  { key: "version", label_key: "system.common.fields.version", type: "text", order: 9, default_visible: false },
  { key: "deleted_at", label_key: "system.common.fields.deleted_at", type: "datetime", order: 10, sortable: true, default_visible: false },
  { key: "deleted_by", label_key: "system.common.fields.deleted_by", type: "text", order: 11, default_visible: false },
];

export const CUSTOMER_CONTACT_LIST_COLUMNS: MetaColumn[] = CUSTOMER_CONTACT_RAW_COLUMNS.map((c) => ({
  ...c,
  ...(STICKY_KEYS.has(c.key) ? { sticky: true } : {}),
  ...(AUDITING_KEYS.has(c.key) ? { audited: true } : {}),
}));

export const CUSTOMER_CONTACT_SEARCHABLE_KEYS = CUSTOMER_CONTACT_LIST_COLUMNS.filter(isColumnSearchable).map((c) => c.key);
export const CUSTOMER_CONTACT_SORT_KEYS = CUSTOMER_CONTACT_LIST_COLUMNS.filter(isColumnSortable).map((c) => c.key);
export const CUSTOMER_CONTACT_FILTERABLE_KEYS = CUSTOMER_CONTACT_LIST_COLUMNS.filter(isColumnFilterable).map((c) => c.key);
