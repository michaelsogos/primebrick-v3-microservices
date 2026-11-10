/**
 * `account_kind` entity metadata — `GET /api/v1/entities/account_kind/meta`.
 * `entities_ns: "crm"`; `display_field: "label_key"`.
 */

import type { EntityMeta } from "@primebrick/sdk";
import { listColumnKeys } from "@primebrick/sdk";
import { withColumnConstraints } from "@primebrick/dal-pg";
import { AccountKindEntity } from "../../domain/entities/account_kind_entity.js";
import { ACCOUNT_KIND_DEFAULT_SORT, ACCOUNT_KIND_LIST_COLUMNS } from "./list-config.js";

export const accountKindMeta: EntityMeta = withColumnConstraints({
  entity: "account_kind",
  translation_key: "account_kind",
  entities_ns: "crm",
  uid: "uuid",
  display_field: "label_key",
  columns: ACCOUNT_KIND_LIST_COLUMNS,
  table: {
    default_view: "table",
    default_sort: ACCOUNT_KIND_DEFAULT_SORT,
    default_page_size: 25,
    page_size_options: [10, 25, 50],
  },
}, AccountKindEntity);

/** Wire key sets derived from the RESOLVED meta — `withColumnConstraints`
 *  injects the system columns the authored list lacks, so the sort_key
 *  enum and the service narrowings mirror the served contract. */
export const {
  sortable: ACCOUNT_KIND_SORT_KEYS,
  searchable: ACCOUNT_KIND_SEARCHABLE_KEYS,
  filterable: ACCOUNT_KIND_FILTERABLE_KEYS,
} = listColumnKeys(accountKindMeta.columns);
