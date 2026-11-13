/**
 * `local_address` entity metadata — `GET /api/v1/entities/local_address/meta`.
 * `entities_ns: "crm"`; `display_field: "street"`.
 */

import type { EntityMeta } from "@primebrick/sdk";
import { listColumnKeys } from "@primebrick/sdk";
import { withColumnConstraints } from "@primebrick/dal-pg";
import { LocalAddressEntity } from "../../domain/entities/local_address_entity.js";
import { LOCAL_ADDRESS_DEFAULT_SORT, LOCAL_ADDRESS_LIST_COLUMNS } from "./list-config.js";

export const localAddressMeta: EntityMeta = withColumnConstraints({
  entity: "local_address",
  translation_key: "local_address",
  entities_ns: "crm",
  uid: "uuid",
  display_field: "street",
  display_name: "${street} (${city})",
  columns: LOCAL_ADDRESS_LIST_COLUMNS,
  table: {
    default_view: "table",
    default_sort: LOCAL_ADDRESS_DEFAULT_SORT,
    default_page_size: 25,
    page_size_options: [10, 25, 50],
  },
}, LocalAddressEntity);

/** Wire key sets derived from the RESOLVED meta — `withColumnConstraints`
 *  injects the system columns the authored list lacks, so the sort_key
 *  enum and the service narrowings mirror the served contract. */
export const {
  sortable: LOCAL_ADDRESS_SORT_KEYS,
  searchable: LOCAL_ADDRESS_SEARCHABLE_KEYS,
  filterable: LOCAL_ADDRESS_FILTERABLE_KEYS,
} = listColumnKeys(localAddressMeta.columns);
