import type { MetaColumn } from "@primebrick/sdk";

/** Raw list column literal — canonical `MetaColumn` shape minus the
 *  flags injected by the normalize step (`sticky`, `audited`).
 *  `order` is explicit per column — array position MUST NOT matter. */
export type CustomerListColumn = Omit<MetaColumn, "sticky" | "audited">;

export const CUSTOMER_DEFAULT_SORT = { key: "updated_at", dir: "desc" as const };

/**
 * Sticky columns: always visible and pinned to the left.
 * These are derived from the entity keys, not from column flags.
 */
export const CUSTOMER_STICKY_COLUMN_KEYS = ["code"] as const;

/**
 * Single source of truth for the customers list:
 * - Which fields are exposed in list rows (DTO projection)
 * - Which columns exist in meta (UI columns, visible picker, search scope)
 * - Which fields are sortable/searchable/filterable
 *
 * Label keys are module-owned: `crm.entities.customer.*` resolved from
 * `crm.translations` (`entities_ns: "crm"` on the meta).
 */
const CUSTOMER_RAW_COLUMNS: CustomerListColumn[] = [
  { key: "code", label_key: "crm.entities.customer.fields.code", type: "text", order: 0, hideable: false, immutable: true },
  { key: "display_name", label_key: "crm.entities.customer.fields.display_name", type: "text", order: 1 },
  { key: "status", label_key: "crm.entities.customer.fields.status", type: "badge", order: 6, searchable: false, hideable: false, badge: { values: { ACTIVE: { label_key: "crm.entities.customer.status.active", color: "emerald-300" }, INACTIVE: { label_key: "crm.entities.customer.status.inactive", color: "zinc-300" } } } },
  { key: "onboarding_at", label_key: "crm.entities.customer.fields.onboarding_at", type: "datetime", order: 7, default_visible: true, datetime_iana_toggle: { record_iana_field: "onboarding_time_zone" } },

  // Extra DTO-exposed fields (hidden by default)
  { key: "status_reason", label_key: "crm.entities.customer.fields.status_reason", type: "text", order: 8, sortable: false, default_visible: false },
  { key: "onboarding_time_zone", label_key: "crm.entities.customer.fields.onboarding_time_zone", type: "text", order: 14, searchable: false, default_visible: false },
  { key: "preferred_locale", label_key: "crm.entities.customer.fields.preferred_locale", type: "text", order: 15, searchable: false, default_visible: false },
  // New model columns — dictionary refs (the customer row carries no
  // flat channels/addresses: contacts, LA and accounts are children).
  { key: "customer_type_uuid", label_key: "crm.entities.customer.fields.customer_type_uuid", type: "ref", order: 24, default_visible: false, ref: { entity: "customer_type" } },
  { key: "qualification_uuid", label_key: "crm.entities.customer.fields.qualification_uuid", type: "ref", order: 25, default_visible: false, ref: { entity: "qualification" } },
  { key: "marketing_qualification_uuid", label_key: "crm.entities.customer.fields.marketing_qualification_uuid", type: "ref", order: 26, default_visible: false, ref: { entity: "marketing_qualification" } },
  {
    key: "company_dimension_uuid",
    label_key: "crm.entities.customer.fields.company_dimension_uuid",
    type: "ref",
    order: 27,
    default_visible: false,
    ref: { entity: "company_dimension" },
    // A private person has no company dimension — gate on the picked
    // customer_type ROW's `code` (uuid values are env-specific data).
    depends_on: {
      field: "customer_type_uuid",
      disabled_when: { prop: "code", equals: "private" },
    },
  },
];

const stickyKeySet = new Set<string>(CUSTOMER_STICKY_COLUMN_KEYS);

/**
 * Canonical `MetaColumn[]`: injects `sticky` and `audited` flags so the
 * served meta is a single columns dictionary — no duplicated sticky/auditing
 * column arrays. `order` is declared explicitly per column.
 */
export const CUSTOMER_LIST_COLUMNS: MetaColumn[] = CUSTOMER_RAW_COLUMNS.map((c) => ({
  ...c,
  ...(stickyKeySet.has(c.key) ? { sticky: true } : {}),
}));
