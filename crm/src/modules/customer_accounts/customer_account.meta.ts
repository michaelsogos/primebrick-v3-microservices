/**
 * `customer_account` entity metadata —
 * `GET /api/v1/entities/customer_account/meta`.
 * `entities_ns: "crm"`; `display_field: "company_name"`.
 */

import type { EntityMeta } from "@primebrick/sdk";
import { listColumnKeys } from "@primebrick/sdk";
import { withColumnConstraints } from "@primebrick/dal-pg";
import { CustomerAccountEntity } from "../../domain/entities/customer_account_entity.js";
import { CUSTOMER_ACCOUNT_DEFAULT_SORT, CUSTOMER_ACCOUNT_LIST_COLUMNS } from "./list-config.js";

export const customerAccountMeta: EntityMeta = withColumnConstraints({
  entity: "customer_account",
  translation_key: "customer_account",
  entities_ns: "crm",
  uid: "uuid",
  display_field: "company_name",
  columns: CUSTOMER_ACCOUNT_LIST_COLUMNS,
  table: {
    default_view: "table",
    default_sort: CUSTOMER_ACCOUNT_DEFAULT_SORT,
    default_page_size: 25,
    page_size_options: [10, 25, 50],
  },
}, CustomerAccountEntity);

/** Wire key sets derived from the RESOLVED meta — `withColumnConstraints`
 *  injects the system columns the authored list lacks, so the sort_key
 *  enum and the service narrowings mirror the served contract. */
export const {
  sortable: CUSTOMER_ACCOUNT_SORT_KEYS,
  searchable: CUSTOMER_ACCOUNT_SEARCHABLE_KEYS,
  filterable: CUSTOMER_ACCOUNT_FILTERABLE_KEYS,
} = listColumnKeys(customerAccountMeta.columns);
