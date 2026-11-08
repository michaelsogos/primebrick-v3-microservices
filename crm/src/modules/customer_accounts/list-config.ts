import { isColumnFilterable, isColumnSearchable, isColumnSortable, type MetaColumn } from "@primebrick/sdk";

export type CustomerAccountListColumn = Omit<MetaColumn, "sticky" | "audited">;

export const CUSTOMER_ACCOUNT_DEFAULT_SORT = { key: "updated_at", dir: "desc" as const };

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

const F = (c: string) => `crm.entities.customer_account.fields.${c}`;

/** The account is the flattened datasheet (company_name + legal_form +
 *  country + chosen LA/contact) — `local_address_id`/`contact_id` are true
 *  bigint FKs rendered as `type:"ref"` pickers via `value_field:"id"`
 *  (the stored value is the surrogate key the FK constrains); their
 *  options are scoped to THIS account's customer (`depends_on
 *  customer_id`) and `route:"list"` gives a truthful cell link — a
 *  non-uid value can't feed `[param]` detail routes. */
const CUSTOMER_ACCOUNT_RAW_COLUMNS: CustomerAccountListColumn[] = [
  { key: "uuid", label_key: "system.common.fields.uuid", type: "text", order: -1, sortable: true, default_visible: false },
  { key: "customer_id", label_key: F("customer_id"), type: "text", order: 0, filterable: true, default_visible: false },
  {
    key: "kind_uuid",
    label_key: F("kind_uuid"),
    type: "ref",
    order: 1,
    filterable: true,
    ref: { entity: "account_kind" },
  },
  { key: "company_name", label_key: F("company_name"), type: "text", order: 2, sortable: true, searchable: true, hideable: false, filterable: true },
  {
    key: "legal_form_uuid",
    label_key: F("legal_form_uuid"),
    type: "ref",
    order: 3,
    filterable: true,
    ref: { entity: "legal_form" },
    // The cascade: legal-form options are scoped to the account's
    // jurisdiction (`filters[country]=<account.country>`) — disabled
    // until a country is picked, value resets when it changes.
    depends_on: { field: "country", filter_field: "country" },
  },
  { key: "country", label_key: F("country"), type: "text", order: 4, sortable: true, filterable: true },
  {
    key: "local_address_id",
    label_key: F("local_address_id"),
    type: "ref",
    order: 5,
    filterable: true,
    default_visible: false,
    ref: { entity: "local_address", value_field: "id", route: "list", filter_field: "id" },
    depends_on: { field: "customer_id", filter_field: "customer_id" },
  },
  {
    key: "contact_id",
    label_key: F("contact_id"),
    type: "ref",
    order: 6,
    filterable: true,
    default_visible: false,
    ref: { entity: "customer_contact", value_field: "id", route: "list", filter_field: "id" },
    depends_on: { field: "customer_id", filter_field: "customer_id" },
  },
  { key: "is_default", label_key: F("is_default"), type: "boolean", order: 7, sortable: true, filterable: true },
  { key: "created_at", label_key: "system.common.fields.created_at", type: "datetime", order: 8, sortable: true, default_visible: false },
  { key: "updated_at", label_key: "system.common.fields.updated_at", type: "datetime", order: 9, sortable: true, default_visible: false },
  { key: "created_by", label_key: "system.common.fields.created_by", type: "text", order: 10, default_visible: false },
  { key: "updated_by", label_key: "system.common.fields.updated_by", type: "text", order: 11, default_visible: false },
  { key: "version", label_key: "system.common.fields.version", type: "text", order: 12, default_visible: false },
  { key: "deleted_at", label_key: "system.common.fields.deleted_at", type: "datetime", order: 13, sortable: true, default_visible: false },
  { key: "deleted_by", label_key: "system.common.fields.deleted_by", type: "text", order: 14, default_visible: false },
];

export const CUSTOMER_ACCOUNT_LIST_COLUMNS: MetaColumn[] = CUSTOMER_ACCOUNT_RAW_COLUMNS.map((c) => ({
  ...c,
  ...(STICKY_KEYS.has(c.key) ? { sticky: true } : {}),
  ...(AUDITING_KEYS.has(c.key) ? { audited: true } : {}),
}));

export const CUSTOMER_ACCOUNT_SEARCHABLE_KEYS = CUSTOMER_ACCOUNT_LIST_COLUMNS.filter(isColumnSearchable).map((c) => c.key);
export const CUSTOMER_ACCOUNT_SORT_KEYS = CUSTOMER_ACCOUNT_LIST_COLUMNS.filter(isColumnSortable).map((c) => c.key);
export const CUSTOMER_ACCOUNT_FILTERABLE_KEYS = CUSTOMER_ACCOUNT_LIST_COLUMNS.filter(isColumnFilterable).map((c) => c.key);
