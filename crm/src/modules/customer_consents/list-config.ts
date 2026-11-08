import { isColumnFilterable, isColumnSearchable, isColumnSortable, type MetaColumn } from "@primebrick/sdk";

export type CustomerConsentListColumn = Omit<MetaColumn, "sticky" | "audited">;

export const CUSTOMER_CONSENT_DEFAULT_SORT = { key: "granted_at", dir: "desc" as const };

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

const F = (c: string) => `crm.entities.customer_consent.fields.${c}`;

/** Tamper-evident consent records — read/audit surface only (rows are
 *  written by domain flows that compute `seal` server-side). */
const CUSTOMER_CONSENT_RAW_COLUMNS: CustomerConsentListColumn[] = [
  { key: "uuid", label_key: "system.common.fields.uuid", type: "text", order: -1, sortable: true, default_visible: false },
  { key: "customer_id", label_key: F("customer_id"), type: "text", order: 0, filterable: true, default_visible: false },
  {
    key: "type_uuid",
    label_key: F("type_uuid"),
    type: "ref",
    order: 1,
    filterable: true,
    ref: { entity: "consent_type" },
  },
  { key: "doc_version", label_key: F("doc_version"), type: "text", order: 2, sortable: true, filterable: true },
  { key: "granted_at", label_key: F("granted_at"), type: "datetime", order: 3, sortable: true, filterable: true },
  { key: "revoked_at", label_key: F("revoked_at"), type: "datetime", order: 4, sortable: true, filterable: true },
  { key: "channel", label_key: F("channel"), type: "text", order: 5, filterable: true, default_visible: false },
  { key: "ip", label_key: F("ip"), type: "text", order: 6, default_visible: false },
  { key: "user_agent", label_key: F("user_agent"), type: "text", order: 7, default_visible: false },
  { key: "seal", label_key: F("seal"), type: "text", order: 8, default_visible: false },
  { key: "created_at", label_key: "system.common.fields.created_at", type: "datetime", order: 9, sortable: true, default_visible: false },
  { key: "updated_at", label_key: "system.common.fields.updated_at", type: "datetime", order: 10, sortable: true, default_visible: false },
  { key: "created_by", label_key: "system.common.fields.created_by", type: "text", order: 11, default_visible: false },
  { key: "updated_by", label_key: "system.common.fields.updated_by", type: "text", order: 12, default_visible: false },
  { key: "version", label_key: "system.common.fields.version", type: "text", order: 13, default_visible: false },
  { key: "deleted_at", label_key: "system.common.fields.deleted_at", type: "datetime", order: 14, sortable: true, default_visible: false },
  { key: "deleted_by", label_key: "system.common.fields.deleted_by", type: "text", order: 15, default_visible: false },
];

export const CUSTOMER_CONSENT_LIST_COLUMNS: MetaColumn[] = CUSTOMER_CONSENT_RAW_COLUMNS.map((c) => ({
  ...c,
  ...(STICKY_KEYS.has(c.key) ? { sticky: true } : {}),
  ...(AUDITING_KEYS.has(c.key) ? { audited: true } : {}),
}));

export const CUSTOMER_CONSENT_SEARCHABLE_KEYS = CUSTOMER_CONSENT_LIST_COLUMNS.filter(isColumnSearchable).map((c) => c.key);
export const CUSTOMER_CONSENT_SORT_KEYS = CUSTOMER_CONSENT_LIST_COLUMNS.filter(isColumnSortable).map((c) => c.key);
export const CUSTOMER_CONSENT_FILTERABLE_KEYS = CUSTOMER_CONSENT_LIST_COLUMNS.filter(isColumnFilterable).map((c) => c.key);
