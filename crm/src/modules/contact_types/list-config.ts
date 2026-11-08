import { isColumnFilterable, isColumnSearchable, isColumnSortable, type MetaColumn } from "@primebrick/sdk";

export type ContactTypeListColumn = Omit<MetaColumn, "sticky" | "audited">;

export const CONTACT_TYPE_DEFAULT_SORT = { key: "sort", dir: "asc" as const };

const STICKY_KEYS = new Set<string>(["uuid", "code"]);
const AUDITING_KEYS = new Set<string>([
  "created_at",
  "created_by",
  "updated_at",
  "updated_by",
  "deleted_at",
  "deleted_by",
  "version",
]);

const F = (c: string) => `crm.entities.contact_type.fields.${c}`;

/** `value_kind` drives the contact `value` renderer/validation
 *  (`email`→EmailInput+email rule, `phone`→PhoneInput+E.164 rule). */
const CONTACT_TYPE_RAW_COLUMNS: ContactTypeListColumn[] = [
  { key: "uuid", label_key: "system.common.fields.uuid", type: "text", order: -1, sortable: true, default_visible: false },
  { key: "code", label_key: F("code"), type: "text", order: 0, sortable: true, hideable: false, filterable: true, searchable: true },
  { key: "label_key", label_key: F("label_key"), type: "text", order: 1, filterable: true },
  {
    key: "value_kind",
    label_key: F("value_kind"),
    type: "badge",
    order: 2,
    sortable: true,
    filterable: true,
    badge: {
      values: {
        email: { label_key: "crm.entities.contact_type.value_kind.email", color: "emerald-300" },
        phone: { label_key: "crm.entities.contact_type.value_kind.phone", color: "sky-300" },
        text: { label_key: "crm.entities.contact_type.value_kind.text", color: "zinc-300" },
      },
    },
  },
  { key: "sort", label_key: F("sort"), type: "number", order: 3, sortable: true, filterable: true },
  { key: "created_at", label_key: "system.common.fields.created_at", type: "datetime", order: 4, sortable: true, default_visible: false },
  { key: "updated_at", label_key: "system.common.fields.updated_at", type: "datetime", order: 5, sortable: true, default_visible: false },
  { key: "created_by", label_key: "system.common.fields.created_by", type: "text", order: 6, default_visible: false },
  { key: "updated_by", label_key: "system.common.fields.updated_by", type: "text", order: 7, default_visible: false },
  { key: "version", label_key: "system.common.fields.version", type: "text", order: 8, default_visible: false },
  { key: "deleted_at", label_key: "system.common.fields.deleted_at", type: "datetime", order: 9, sortable: true, default_visible: false },
  { key: "deleted_by", label_key: "system.common.fields.deleted_by", type: "text", order: 10, default_visible: false },
];

export const CONTACT_TYPE_LIST_COLUMNS: MetaColumn[] = CONTACT_TYPE_RAW_COLUMNS.map((c) => ({
  ...c,
  ...(STICKY_KEYS.has(c.key) ? { sticky: true } : {}),
  ...(AUDITING_KEYS.has(c.key) ? { audited: true } : {}),
}));

export const CONTACT_TYPE_SEARCHABLE_KEYS = CONTACT_TYPE_LIST_COLUMNS.filter(isColumnSearchable).map((c) => c.key);
export const CONTACT_TYPE_SORT_KEYS = CONTACT_TYPE_LIST_COLUMNS.filter(isColumnSortable).map((c) => c.key);
export const CONTACT_TYPE_FILTERABLE_KEYS = CONTACT_TYPE_LIST_COLUMNS.filter(isColumnFilterable).map((c) => c.key);
