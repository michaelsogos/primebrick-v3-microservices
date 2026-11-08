/**
 * `consent_type` entity metadata — `GET /api/v1/entities/consent_type/meta`.
 * `entities_ns: "crm"`; `display_field: "label_key"`.
 */

import type { EntityMeta } from "@primebrick/sdk";
import { withColumnConstraints } from "@primebrick/dal-pg";
import { ConsentTypeEntity } from "../../domain/entities/consent_type_entity.js";
import { CONSENT_TYPE_DEFAULT_SORT, CONSENT_TYPE_LIST_COLUMNS } from "./list-config.js";

export const consentTypeMeta: EntityMeta = withColumnConstraints({
  entity: "consent_type",
  translation_key: "consent_type",
  entities_ns: "crm",
  uid: "uuid",
  display_field: "label_key",
  columns: CONSENT_TYPE_LIST_COLUMNS,
  table: {
    default_view: "table",
    default_sort: CONSENT_TYPE_DEFAULT_SORT,
    default_page_size: 25,
    page_size_options: [10, 25, 50],
  },
}, ConsentTypeEntity);
