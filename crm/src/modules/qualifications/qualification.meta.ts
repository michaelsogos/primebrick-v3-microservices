/**
 * `qualification` entity metadata — `GET /api/v1/entities/qualification/meta`.
 * `entities_ns: "crm"`; `display_field: "label_key"`.
 */

import type { EntityMeta } from "@primebrick/sdk";
import { withColumnConstraints } from "@primebrick/dal-pg";
import { QualificationEntity } from "../../domain/entities/qualification_entity.js";
import { QUALIFICATION_DEFAULT_SORT, QUALIFICATION_LIST_COLUMNS } from "./list-config.js";

export const qualificationMeta: EntityMeta = withColumnConstraints({
  entity: "qualification",
  translation_key: "qualification",
  entities_ns: "crm",
  uid: "uuid",
  display_field: "label_key",
  columns: QUALIFICATION_LIST_COLUMNS,
  table: {
    default_view: "table",
    default_sort: QUALIFICATION_DEFAULT_SORT,
    default_page_size: 25,
    page_size_options: [10, 25, 50],
  },
}, QualificationEntity);
