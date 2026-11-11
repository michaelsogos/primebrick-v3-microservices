import type { MetaColumn } from "@primebrick/sdk";

export type CustomerLinkListColumn = Omit<MetaColumn, "sticky" | "audited">;

export const CUSTOMER_LINK_DEFAULT_SORT = { key: "updated_at", dir: "desc" as const };


const F = (c: string) => `crm.entities.customer_link.fields.${c}`;

/** N-N org/relationship graph edge — parent/child carry uuid FKs
 *  to `crm.customers` (hidden; link rows are managed from the
 *  customer detail page). */
const CUSTOMER_LINK_RAW_COLUMNS: CustomerLinkListColumn[] = [
  { key: "parent_customer_uuid", label_key: F("parent_customer_uuid"), type: "text", order: 0, default_visible: false },
  { key: "child_customer_uuid", label_key: F("child_customer_uuid"), type: "text", order: 1, default_visible: false },
  { key: "type_uuid", label_key: F("type_uuid"), type: "ref", order: 2, ref: { entity: "customer_link_type" } },
];

export const CUSTOMER_LINK_LIST_COLUMNS: MetaColumn[] = CUSTOMER_LINK_RAW_COLUMNS;

