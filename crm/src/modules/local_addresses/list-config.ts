import type { MetaColumn } from "@primebrick/sdk";

export type LocalAddressListColumn = Omit<MetaColumn, "sticky" | "audited">;

export const LOCAL_ADDRESS_DEFAULT_SORT = { key: "updated_at", dir: "desc" as const };


const F = (c: string) => `crm.entities.local_address.fields.${c}`;

/** Local Unit rows — `customer_id` is the children-list filter pivot
 *  (hidden raw bigint); `type_uuid` renders via ref → local_address_type. */
const LOCAL_ADDRESS_RAW_COLUMNS: LocalAddressListColumn[] = [
  { key: "customer_id", label_key: F("customer_id"), type: "text", order: 0, default_visible: false },
  { key: "type_uuid", label_key: F("type_uuid"), type: "ref", order: 1, ref: { entity: "local_address_type" } },
  { key: "street", label_key: F("street"), type: "text", order: 2, hideable: false },
  { key: "street2", label_key: F("street2"), type: "text", order: 3, default_visible: false },
  { key: "postal_code", label_key: F("postal_code"), type: "text", order: 4 },
  { key: "city", label_key: F("city"), type: "text", order: 5 },
  { key: "province", label_key: F("province"), type: "text", order: 6 },
  { key: "country", label_key: F("country"), type: "text", order: 7 },
  { key: "lat", label_key: F("lat"), type: "number", order: 8, default_visible: false },
  { key: "lng", label_key: F("lng"), type: "number", order: 9, default_visible: false },
  { key: "poi_name", label_key: F("poi_name"), type: "text", order: 10, default_visible: false },
];

export const LOCAL_ADDRESS_LIST_COLUMNS: MetaColumn[] = LOCAL_ADDRESS_RAW_COLUMNS;

