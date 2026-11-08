/**
 * `local_address` entity metadata — `GET /api/v1/entities/local_address/meta`.
 * `entities_ns: "crm"`; `display_field: "street"`.
 */

import type { EntityMeta } from "@primebrick/sdk";
import { withColumnConstraints } from "@primebrick/dal-pg";
import { LocalAddressEntity } from "../../domain/entities/local_address_entity.js";
import { LOCAL_ADDRESS_DEFAULT_SORT, LOCAL_ADDRESS_LIST_COLUMNS } from "./list-config.js";

export const localAddressMeta: EntityMeta = withColumnConstraints({
  entity: "local_address",
  translation_key: "local_address",
  entities_ns: "crm",
  uid: "uuid",
  display_field: "street",
  columns: LOCAL_ADDRESS_LIST_COLUMNS,
  table: {
    default_view: "table",
    default_sort: LOCAL_ADDRESS_DEFAULT_SORT,
    default_page_size: 25,
    page_size_options: [10, 25, 50],
  },
}, LocalAddressEntity);
