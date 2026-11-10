import type { MetaColumn } from "@primebrick/sdk";

export type CustomerContactListColumn = Omit<MetaColumn, "sticky" | "audited">;

export const CUSTOMER_CONTACT_DEFAULT_SORT = { key: "updated_at", dir: "desc" as const };


const F = (c: string) => `crm.entities.customer_contact.fields.${c}`;

const CUSTOMER_CONTACT_RAW_COLUMNS: CustomerContactListColumn[] = [
  { key: "customer_id", label_key: F("customer_id"), type: "text", order: 0, default_visible: false },
  { key: "type_uuid", label_key: F("type_uuid"), type: "ref", order: 1, ref: { entity: "contact_type" } },
  {
    key: "value",
    label_key: F("value"),
    type: "text",
    order: 2,
    hideable: false,
    // The picked contact_type ROW's `value_kind` selects the control
    // (email → EmailInput, phone → PhoneInput, text → TextInput) —
    // disabled until a type is picked, value resets on type change.
    depends_on: { field: "type_uuid", control_prop: "value_kind" },
  },
  { key: "is_default", label_key: F("is_default"), type: "boolean", order: 3 },
  { key: "label", label_key: F("label"), type: "text", order: 4 },
];

export const CUSTOMER_CONTACT_LIST_COLUMNS: MetaColumn[] = CUSTOMER_CONTACT_RAW_COLUMNS;

