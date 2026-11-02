/**
 * `customer` entity metadata — the JSON returned by
 * `GET /api/v1/entities/customer/meta`.
 *
 * Pure data, no logic. Canonical `EntityMeta` shape (`@primebrick/core`).
 * `display_name` is omitted — the router's `assembleMeta` materializes it as
 * `"${code}"` from `display_field`.
 *
 * `entities_ns: "crm"` — the module OWNS this entity's label keys
 * (`crm.entities.customer.*` in `crm.translations`); export labels and field
 * labels resolve against that dictionary.
 */

import type { EntityMeta } from "@primebrick/sdk";
import {
  CUSTOMER_DEFAULT_SORT,
  CUSTOMER_LIST_COLUMNS,
} from "./list-config.js";

export const customerMeta: EntityMeta = {
  entity: "customer",
  translation_key: "customer",
  entities_ns: "crm",
  uid: "uuid",
  display_field: "code",
  columns: CUSTOMER_LIST_COLUMNS,
  table: {
    default_view: "table",
    default_sort: CUSTOMER_DEFAULT_SORT,
    default_page_size: 25,
    page_size_options: [10, 25, 50, 100],
  },
};
