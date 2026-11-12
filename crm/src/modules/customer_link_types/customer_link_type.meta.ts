/**
 * `customer_link_type` entity metadata —
 * `GET /api/v1/entities/customer_link_type/meta`.
 * `entities_ns: "crm"`; `display_field: "label_key"`.
 */

import type { EntityMeta } from "@primebrick/sdk";
import { listColumnKeys } from "@primebrick/sdk";
import { withColumnConstraints } from "@primebrick/dal-pg";
import { CustomerLinkTypeEntity } from "../../domain/entities/customer_link_type_entity.js";
import { CUSTOMER_LINK_TYPE_DEFAULT_SORT, CUSTOMER_LINK_TYPE_LIST_COLUMNS } from "./list-config.js";

export const customerLinkTypeMeta: EntityMeta = withColumnConstraints({
  entity: "customer_link_type",
  translation_key: "customer_link_type",
  entities_ns: "crm",
  uid: "uuid",
  display_field: "label_key",
  columns: CUSTOMER_LINK_TYPE_LIST_COLUMNS,
  table: {
    default_view: "table",
    default_sort: CUSTOMER_LINK_TYPE_DEFAULT_SORT,
    default_page_size: 25,
    page_size_options: [10, 25, 50],
  },
}, CustomerLinkTypeEntity);

/** Wire key sets derived from the RESOLVED meta — `withColumnConstraints`
 *  injects the system columns the authored list lacks, so the sort_key
 *  enum and the service narrowings mirror the served contract. */
export const {
  sortable: CUSTOMER_LINK_TYPE_SORT_KEYS,
  searchable: CUSTOMER_LINK_TYPE_SEARCHABLE_KEYS,
  filterable: CUSTOMER_LINK_TYPE_FILTERABLE_KEYS,
} = listColumnKeys(customerLinkTypeMeta.columns);
