import type { MetaColumn } from "@primebrick/sdk";

export type CustomerConsentListColumn = Omit<MetaColumn, "sticky" | "audited">;

export const CUSTOMER_CONSENT_DEFAULT_SORT = { key: "granted_at", dir: "desc" as const };


const F = (c: string) => `crm.entities.customer_consent.fields.${c}`;

/** Tamper-evident consent records — read/audit surface only (rows are
 *  written by domain flows that compute `seal` server-side). */
const CUSTOMER_CONSENT_RAW_COLUMNS: CustomerConsentListColumn[] = [
  { key: "customer_uuid", label_key: F("customer_uuid"), type: "text", order: 0, default_visible: false },
  { key: "type_uuid", label_key: F("type_uuid"), type: "ref", order: 1, ref: { entity: "consent_type" } },
  { key: "doc_version", label_key: F("doc_version"), type: "text", order: 2 },
  { key: "granted_at", label_key: F("granted_at"), type: "datetime", order: 3 },
  { key: "revoked_at", label_key: F("revoked_at"), type: "datetime", order: 4 },
  { key: "channel", label_key: F("channel"), type: "text", order: 5, default_visible: false },
  { key: "ip", label_key: F("ip"), type: "text", order: 6, default_visible: false },
  { key: "user_agent", label_key: F("user_agent"), type: "text", order: 7, default_visible: false },
  { key: "seal", label_key: F("seal"), type: "text", order: 8, default_visible: false },
];

export const CUSTOMER_CONSENT_LIST_COLUMNS: MetaColumn[] = CUSTOMER_CONSENT_RAW_COLUMNS;

