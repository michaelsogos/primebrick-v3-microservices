/**
 * `customer` entity metadata — the JSON returned by
 * `GET /api/v1/entities/customer/meta`.
 *
 * Pure data, no logic. Canonical `EntityMeta` shape (`@primebrick/core`).
 * `display_name` is authored — `"${display_name} (${code})"` resolves the
 * customer's full identity (title, ref combos, `cloned_from_name` cell).
 *
 * `entities_ns: "crm"` — the module OWNS this entity's label keys
 * (`crm.entities.customer.*` in `crm.translations`); export labels and field
 * labels resolve against that dictionary.
 */

import type { EntityMeta } from "@primebrick/sdk";
import { listColumnKeys } from "@primebrick/sdk";
import { withColumnConstraints } from "@primebrick/dal-pg";
import { CustomerEntity } from "../../domain/entities/customer_entity.js";
import {
  CUSTOMER_DEFAULT_SORT,
  CUSTOMER_LIST_COLUMNS,
} from "./list-config.js";

export const customerMeta: EntityMeta = withColumnConstraints({
  entity: "customer",
  translation_key: "customer",
  entities_ns: "crm",
  uid: "uuid",
  display_field: "code",
  display_name: "${display_name} (${code})",
  columns: CUSTOMER_LIST_COLUMNS,
  table: {
    default_view: "table",
    default_sort: CUSTOMER_DEFAULT_SORT,
    default_page_size: 25,
    page_size_options: [10, 25, 50, 100],
  },
}, CustomerEntity);

/** Wire key sets derived from the RESOLVED meta — `withColumnConstraints`
 *  injects the system columns the authored list lacks, so the sort_key
 *  enum and the service narrowings mirror the served contract. */
export const {
  sortable: CUSTOMER_SORT_KEYS,
  searchable: CUSTOMER_SEARCHABLE_KEYS,
  filterable: CUSTOMER_FILTERABLE_KEYS,
} = listColumnKeys(customerMeta.columns);
