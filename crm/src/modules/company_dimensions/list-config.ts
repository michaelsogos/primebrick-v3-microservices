import type { MetaColumn } from "@primebrick/sdk";

export type CompanyDimensionListColumn = Omit<MetaColumn, "sticky" | "audited">;

export const COMPANY_DIMENSION_DEFAULT_SORT = { key: "sort", dir: "asc" as const };

const STICKY_KEYS = new Set<string>(["code"]);

const F = (c: string) => `crm.entities.company_dimension.fields.${c}`;

const COMPANY_DIMENSION_RAW_COLUMNS: CompanyDimensionListColumn[] = [
  { key: "code", label_key: F("code"), type: "text", order: 0, hideable: false, immutable: true, tooltip: "app.entities.dict.hints.code", tooltip_title: "app.entities.dict.hints.code_title", tooltip_priority: "HINT" },
  { key: "label_key", label_key: F("label_key"), type: "text", format: "i18n_key", order: 1 },
  { key: "min_size", label_key: F("min_size"), type: "number", order: 2 },
  { key: "max_size", label_key: F("max_size"), type: "number", order: 3 },
  { key: "sort", label_key: F("sort"), type: "number", order: 4 },
];

export const COMPANY_DIMENSION_LIST_COLUMNS: MetaColumn[] = COMPANY_DIMENSION_RAW_COLUMNS.map((c) => ({
  ...c,
  ...(STICKY_KEYS.has(c.key) ? { sticky: true } : {}),
}));

