/**
 * `local_address_type` entity metadata — `GET /api/v1/entities/local_address_type/meta`.
 * `entities_ns: "crm"`; `display_field: "label_key"`.
 */

import type { EntityMeta } from "@primebrick/sdk";
import { listColumnKeys } from "@primebrick/sdk";
import { withColumnConstraints } from "@primebrick/dal-pg";
import { LocalAddressTypeEntity } from "../../domain/entities/local_address_type_entity.js";
import { LOCAL_ADDRESS_TYPE_DEFAULT_SORT, LOCAL_ADDRESS_TYPE_LIST_COLUMNS } from "./list-config.js";

export const localAddressTypeMeta: EntityMeta = withColumnConstraints({
  entity: "local_address_type",
  translation_key: "local_address_type",
  entities_ns: "crm",
  uid: "uuid",
  display_field: "label_key",
  columns: LOCAL_ADDRESS_TYPE_LIST_COLUMNS,
  table: {
    default_view: "table",
    default_sort: LOCAL_ADDRESS_TYPE_DEFAULT_SORT,
    default_page_size: 25,
    page_size_options: [10, 25, 50],
  },
}, LocalAddressTypeEntity);

/** Wire key sets derived from the RESOLVED meta — `withColumnConstraints`
 *  injects the system columns the authored list lacks, so the sort_key
 *  enum and the service narrowings mirror the served contract. */
export const {
  sortable: LOCAL_ADDRESS_TYPE_SORT_KEYS,
  searchable: LOCAL_ADDRESS_TYPE_SEARCHABLE_KEYS,
  filterable: LOCAL_ADDRESS_TYPE_FILTERABLE_KEYS,
} = listColumnKeys(localAddressTypeMeta.columns);
