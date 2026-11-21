import type { MetaColumn } from "@primebrick/sdk";

/** Raw list column literal — canonical `MetaColumn` shape minus the
 *  flags injected by the normalize step (`sticky`, `audited`). */
export type CustomerTypeListColumn = Omit<MetaColumn, "sticky" | "audited">;

export const CUSTOMER_TYPE_DEFAULT_SORT = { key: "sort", dir: "asc" as const };

const STICKY_KEYS = new Set<string>(["code"]);

const F = (c: string) => `crm.entities.customer_type.fields.${c}`;

/** Dictionary list contract: code is the sticky identity column; `label_key`
 *  is the i18n pointer the ref-combo resolves (display_field). */
const CUSTOMER_TYPE_RAW_COLUMNS: CustomerTypeListColumn[] = [
  { key: "code", label_key: F("code"), type: "text", order: 0, hideable: false, immutable: true, tooltip: "system.entities.dict.hints.code", tooltip_title: "system.entities.dict.hints.code_title", tooltip_priority: "HINT" },
  { key: "label_key", label_key: F("label_key"), type: "text", format: "i18n_key", order: 1 },
  { key: "sort", label_key: F("sort"), type: "number", order: 2 },
];

export const CUSTOMER_TYPE_LIST_COLUMNS: MetaColumn[] = CUSTOMER_TYPE_RAW_COLUMNS.map((c) => ({
  ...c,
  ...(STICKY_KEYS.has(c.key) ? { sticky: true } : {}),
}));

