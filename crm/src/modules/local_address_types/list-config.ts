import type { MetaColumn } from "@primebrick/sdk";

export type LocalAddressTypeListColumn = Omit<MetaColumn, "sticky" | "audited">;

export const LOCAL_ADDRESS_TYPE_DEFAULT_SORT = { key: "sort", dir: "asc" as const };

const STICKY_KEYS = new Set<string>(["code"]);

const F = (c: string) => `crm.entities.local_address_type.fields.${c}`;

const LOCAL_ADDRESS_TYPE_RAW_COLUMNS: LocalAddressTypeListColumn[] = [
  { key: "code", label_key: F("code"), type: "text", order: 0, hideable: false, immutable: true, tooltip: "system.entities.dict.hints.code", tooltip_title: "system.entities.dict.hints.code_title", tooltip_priority: "HINT" },
  { key: "label_key", label_key: F("label_key"), type: "text", format: "i18n_key", order: 1 },
  { key: "sort", label_key: F("sort"), type: "number", order: 2 },
];

export const LOCAL_ADDRESS_TYPE_LIST_COLUMNS: MetaColumn[] = LOCAL_ADDRESS_TYPE_RAW_COLUMNS.map((c) => ({
  ...c,
  ...(STICKY_KEYS.has(c.key) ? { sticky: true } : {}),
}));

