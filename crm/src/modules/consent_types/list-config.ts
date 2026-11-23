import type { MetaColumn } from "@primebrick/sdk";

export type ConsentTypeListColumn = Omit<MetaColumn, "sticky" | "audited">;

export const CONSENT_TYPE_DEFAULT_SORT = { key: "sort", dir: "asc" as const };

const STICKY_KEYS = new Set<string>(["code"]);

const F = (c: string) => `crm.entities.consent_type.fields.${c}`;

const CONSENT_TYPE_RAW_COLUMNS: ConsentTypeListColumn[] = [
  { key: "code", label_key: F("code"), type: "text", order: 0, hideable: false, immutable: true, tooltip: "app.entities.dict.hints.code", tooltip_title: "app.entities.dict.hints.code_title", tooltip_priority: "HINT" },
  { key: "label_key", label_key: F("label_key"), type: "text", format: "i18n_key", order: 1 },
  { key: "sort", label_key: F("sort"), type: "number", order: 2 },
];

export const CONSENT_TYPE_LIST_COLUMNS: MetaColumn[] = CONSENT_TYPE_RAW_COLUMNS.map((c) => ({
  ...c,
  ...(STICKY_KEYS.has(c.key) ? { sticky: true } : {}),
}));

