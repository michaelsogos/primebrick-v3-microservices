/**
 * `customer_link` entity metadata — `GET /api/v1/entities/customer_link/meta`.
 * `entities_ns: "crm"`.
 */

import type { EntityMeta } from "@primebrick/sdk";
import { withColumnConstraints } from "@primebrick/dal-pg";
import { CustomerLinkEntity } from "../../domain/entities/customer_link_entity.js";
import { CUSTOMER_LINK_DEFAULT_SORT, CUSTOMER_LINK_LIST_COLUMNS } from "./list-config.js";

export const customerLinkMeta: EntityMeta = withColumnConstraints({
  entity: "customer_link",
  translation_key: "customer_link",
  entities_ns: "crm",
  uid: "uuid",
  display_field: "uuid",
  columns: CUSTOMER_LINK_LIST_COLUMNS,
  table: {
    default_view: "table",
    default_sort: CUSTOMER_LINK_DEFAULT_SORT,
    default_page_size: 25,
    page_size_options: [10, 25, 50],
  },
}, CustomerLinkEntity);
