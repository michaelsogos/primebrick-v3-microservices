/**
 * `customer_type` entity metadata — `GET /api/v1/entities/customer_type/meta`.
 * Pure data, no logic. `entities_ns: "crm"` — the module OWNS this entity's
 * label keys (`crm.entities.customer_type.*` in `crm.translations`).
 *
 * `display_field: "label_key"` — ref-combos resolve row labels through i18n:
 * the cell value is the key, the renderer translates it (the ref-option
 * label resolution contract).
 */

import type { EntityMeta } from "@primebrick/sdk";
import { listColumnKeys } from "@primebrick/sdk";
import { withColumnConstraints } from "@primebrick/dal-pg";
import { CustomerTypeEntity } from "../../domain/entities/customer_type_entity.js";
import { CUSTOMER_TYPE_DEFAULT_SORT, CUSTOMER_TYPE_LIST_COLUMNS } from "./list-config.js";

export const customerTypeMeta: EntityMeta = withColumnConstraints({
  entity: "customer_type",
  translation_key: "customer_type",
  entities_ns: "crm",
  uid: "uuid",
  display_field: "label_key",
  columns: CUSTOMER_TYPE_LIST_COLUMNS,
  table: {
    default_view: "table",
    default_sort: CUSTOMER_TYPE_DEFAULT_SORT,
    default_page_size: 25,
    page_size_options: [10, 25, 50],
  },
}, CustomerTypeEntity);

/** Wire key sets derived from the RESOLVED meta — `withColumnConstraints`
 *  injects the system columns the authored list lacks, so the sort_key
 *  enum and the service narrowings mirror the served contract. */
export const {
  sortable: CUSTOMER_TYPE_SORT_KEYS,
  searchable: CUSTOMER_TYPE_SEARCHABLE_KEYS,
  filterable: CUSTOMER_TYPE_FILTERABLE_KEYS,
} = listColumnKeys(customerTypeMeta.columns);
