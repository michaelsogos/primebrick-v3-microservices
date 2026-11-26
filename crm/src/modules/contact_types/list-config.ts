import type { MetaColumn } from "@primebrick/sdk";

export type ContactTypeListColumn = Omit<MetaColumn, "sticky" | "audited">;

export const CONTACT_TYPE_DEFAULT_SORT = { key: "sort", dir: "asc" as const };

const STICKY_KEYS = new Set<string>(["code"]);

const F = (c: string) => `crm.entities.contact_type.fields.${c}`;

/** `value_kind` drives the contact `value` renderer/validation
 *  (`email`→EmailInput+email rule, `phone`→PhoneInput+E.164 rule). */
const CONTACT_TYPE_RAW_COLUMNS: ContactTypeListColumn[] = [
  { key: "code", label_key: F("code"), type: "text", order: 0, hideable: false, immutable: true, tooltip: "app.entities.dict.hints.code", tooltip_title: "app.entities.dict.hints.code_title", tooltip_priority: "HINT" },
  { key: "label_key", label_key: F("label_key"), type: "text", format: "i18n_key", order: 1 },
  { key: "value_kind", label_key: F("value_kind"), type: "badge", order: 2, badge: { values: { email: { label_key: "crm.entities.contact_type.value_kind.email", color: "emerald-300" }, phone: { label_key: "crm.entities.contact_type.value_kind.phone", color: "sky-300" }, text: { label_key: "crm.entities.contact_type.value_kind.text", color: "zinc-300" } } } },
  { key: "sort", label_key: F("sort"), type: "number", order: 3 },
];

export const CONTACT_TYPE_LIST_COLUMNS: MetaColumn[] = CONTACT_TYPE_RAW_COLUMNS.map((c) => ({
  ...c,
  ...(STICKY_KEYS.has(c.key) ? { sticky: true } : {}),
}));

