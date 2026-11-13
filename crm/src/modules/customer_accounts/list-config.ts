import type { MetaColumn } from "@primebrick/sdk";

export type CustomerAccountListColumn = Omit<MetaColumn, "sticky" | "audited">;

export const CUSTOMER_ACCOUNT_DEFAULT_SORT = { key: "updated_at", dir: "desc" as const };


const F = (c: string) => `crm.entities.customer_account.fields.${c}`;

/** The account is the flattened datasheet (company_name + legal_form +
 *  country + chosen LA/contact) — `local_address_uuid`/`contact_uuid`
 *  render as `type:"ref"` pickers (uuid-keyed, `filter_field:"uuid"`);
 *  their options are scoped to THIS account's customer (`depends_on
 *  customer_uuid`) and `route:"list"` gives a truthful cell link. */
const CUSTOMER_ACCOUNT_RAW_COLUMNS: CustomerAccountListColumn[] = [
  { key: "customer_uuid", label_key: F("customer_uuid"), type: "text", order: 0, default_visible: false },
  { key: "kind_uuid", label_key: F("kind_uuid"), type: "ref", order: 1, ref: { entity: "account_kind" } },
  { key: "company_name", label_key: F("company_name"), type: "text", order: 2, hideable: false },
  {
    key: "legal_form_uuid",
    label_key: F("legal_form_uuid"),
    type: "ref",
    order: 3,
    ref: { entity: "legal_form" },
    // The cascade: legal-form options are scoped to the account's
    // jurisdiction (`filters[country]=<account.country>`) — disabled
    // until a country is picked, value resets when it changes.
    depends_on: { field: "country", filter_field: "country" },
  },
  { key: "country", label_key: F("country"), type: "text", order: 4 },
  { key: "local_address_uuid", label_key: F("local_address_uuid"), type: "ref", order: 5, default_visible: false, ref: { entity: "local_address", route: "list", filter_field: "uuid" }, depends_on: { field: "customer_uuid", filter_field: "customer_uuid" } },
  { key: "contact_uuid", label_key: F("contact_uuid"), type: "ref", order: 6, default_visible: false, ref: { entity: "customer_contact", route: "list", filter_field: "uuid" }, depends_on: { field: "customer_uuid", filter_field: "customer_uuid" } },
  { key: "is_default", label_key: F("is_default"), type: "boolean", order: 7 },
];

export const CUSTOMER_ACCOUNT_LIST_COLUMNS: MetaColumn[] = CUSTOMER_ACCOUNT_RAW_COLUMNS;

