/**
 * `customer_contact` entity metadata —
 * `GET /api/v1/entities/customer_contact/meta`.
 * `entities_ns: "crm"`; `display_field: "value"`.
 */

import type { EntityMeta } from "@primebrick/sdk";
import { listColumnKeys } from "@primebrick/sdk";
import { withColumnConstraints } from "@primebrick/dal-pg";
import { CustomerContactEntity } from "../../domain/entities/customer_contact_entity.js";
import { CUSTOMER_CONTACT_DEFAULT_SORT, CUSTOMER_CONTACT_LIST_COLUMNS } from "./list-config.js";

export const customerContactMeta: EntityMeta = withColumnConstraints({
  entity: "customer_contact",
  translation_key: "customer_contact",
  entities_ns: "crm",
  uid: "uuid",
  display_field: "value",
  columns: CUSTOMER_CONTACT_LIST_COLUMNS,
  table: {
    default_view: "table",
    default_sort: CUSTOMER_CONTACT_DEFAULT_SORT,
    default_page_size: 25,
    page_size_options: [10, 25, 50],
  },
}, CustomerContactEntity);

/** Wire key sets derived from the RESOLVED meta — `withColumnConstraints`
 *  injects the system columns the authored list lacks, so the sort_key
 *  enum and the service narrowings mirror the served contract. */
export const {
  sortable: CUSTOMER_CONTACT_SORT_KEYS,
  searchable: CUSTOMER_CONTACT_SEARCHABLE_KEYS,
  filterable: CUSTOMER_CONTACT_FILTERABLE_KEYS,
} = listColumnKeys(customerContactMeta.columns);
