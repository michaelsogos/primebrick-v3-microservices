/**
 * `marketing_qualification` entity metadata —
 * `GET /api/v1/entities/marketing_qualification/meta`.
 * `entities_ns: "crm"`; `display_field: "label_key"`.
 */

import type { EntityMeta } from "@primebrick/sdk";
import { withColumnConstraints } from "@primebrick/dal-pg";
import { MarketingQualificationEntity } from "../../domain/entities/marketing_qualification_entity.js";
import { MARKETING_QUALIFICATION_DEFAULT_SORT, MARKETING_QUALIFICATION_LIST_COLUMNS } from "./list-config.js";

export const marketingQualificationMeta: EntityMeta = withColumnConstraints({
  entity: "marketing_qualification",
  translation_key: "marketing_qualification",
  entities_ns: "crm",
  uid: "uuid",
  display_field: "label_key",
  columns: MARKETING_QUALIFICATION_LIST_COLUMNS,
  table: {
    default_view: "table",
    default_sort: MARKETING_QUALIFICATION_DEFAULT_SORT,
    default_page_size: 25,
    page_size_options: [10, 25, 50],
  },
}, MarketingQualificationEntity);
