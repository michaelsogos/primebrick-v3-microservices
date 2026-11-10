import type { MetaColumn } from "@primebrick/sdk";

export type CustomerLinkTypeListColumn = Omit<MetaColumn, "sticky" | "audited">;

export const CUSTOMER_LINK_TYPE_DEFAULT_SORT = { key: "sort", dir: "asc" as const };

const STICKY_KEYS = new Set<string>(["code"]);

const F = (c: string) => `crm.entities.customer_link_type.fields.${c}`;

const CUSTOMER_LINK_TYPE_RAW_COLUMNS: CustomerLinkTypeListColumn[] = [
  { key: "code", label_key: F("code"), type: "text", order: 0, hideable: false },
  { key: "label_key", label_key: F("label_key"), type: "text", order: 1 },
  { key: "sort", label_key: F("sort"), type: "number", order: 2 },
];

export const CUSTOMER_LINK_TYPE_LIST_COLUMNS: MetaColumn[] = CUSTOMER_LINK_TYPE_RAW_COLUMNS.map((c) => ({
  ...c,
  ...(STICKY_KEYS.has(c.key) ? { sticky: true } : {}),
}));

