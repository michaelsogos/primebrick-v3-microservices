/**
 * `company_dimension` entity metadata — `GET /api/v1/entities/company_dimension/meta`.
 * `entities_ns: "crm"`; `display_field: "label_key"` — ref-combos resolve
 * row labels through i18n.
 */

import type { EntityMeta } from "@primebrick/sdk";
import { listColumnKeys } from "@primebrick/sdk";
import { withColumnConstraints } from "@primebrick/dal-pg";
import { CompanyDimensionEntity } from "../../domain/entities/company_dimension_entity.js";
import { COMPANY_DIMENSION_DEFAULT_SORT, COMPANY_DIMENSION_LIST_COLUMNS } from "./list-config.js";

export const companyDimensionMeta: EntityMeta = withColumnConstraints({
  entity: "company_dimension",
  translation_key: "company_dimension",
  entities_ns: "crm",
  uid: "uuid",
  display_field: "label_key",
  columns: COMPANY_DIMENSION_LIST_COLUMNS,
  table: {
    default_view: "table",
    default_sort: COMPANY_DIMENSION_DEFAULT_SORT,
    default_page_size: 25,
    page_size_options: [10, 25, 50],
  },
}, CompanyDimensionEntity);

/** Wire key sets derived from the RESOLVED meta — `withColumnConstraints`
 *  injects the system columns the authored list lacks, so the sort_key
 *  enum and the service narrowings mirror the served contract. */
export const {
  sortable: COMPANY_DIMENSION_SORT_KEYS,
  searchable: COMPANY_DIMENSION_SEARCHABLE_KEYS,
  filterable: COMPANY_DIMENSION_FILTERABLE_KEYS,
} = listColumnKeys(companyDimensionMeta.columns);
