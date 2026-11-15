import type { MetaColumn } from "@primebrick/sdk";

export type CustomerLinkListColumn = Omit<MetaColumn, "sticky" | "audited">;

export const CUSTOMER_LINK_DEFAULT_SORT = { key: "updated_at", dir: "desc" as const };


const F = (c: string) => `crm.entities.customer_link.fields.${c}`;

/** Directed relation edge — `type:"ref"` derives from the class `@Ref`
 *  (never authored); the served `relation` facet owns the viewpoint-
 *  dependent display, these columns stay served for the facet to
 *  resolve (default_visible:false — no table chrome today). */
const CUSTOMER_LINK_RAW_COLUMNS: CustomerLinkListColumn[] = [
  { key: "parent_customer_uuid", label_key: F("parent_customer_uuid"), type: "ref", order: 0, default_visible: false },
  { key: "child_customer_uuid", label_key: F("child_customer_uuid"), type: "ref", order: 1, default_visible: false },
  { key: "type_uuid", label_key: F("type_uuid"), type: "ref", order: 2, default_visible: false },
];

export const CUSTOMER_LINK_LIST_COLUMNS: MetaColumn[] = CUSTOMER_LINK_RAW_COLUMNS;
