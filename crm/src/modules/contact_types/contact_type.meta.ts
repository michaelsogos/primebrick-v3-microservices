/**
 * `contact_type` entity metadata — `GET /api/v1/entities/contact_type/meta`.
 * `entities_ns: "crm"`; `display_field: "label_key"`.
 * `value_kind` is the renderer/validation discriminator for `contact.value`.
 */

import type { EntityMeta } from "@primebrick/sdk";
import { withColumnConstraints } from "@primebrick/dal-pg";
import { ContactTypeEntity } from "../../domain/entities/contact_type_entity.js";
import { CONTACT_TYPE_DEFAULT_SORT, CONTACT_TYPE_LIST_COLUMNS } from "./list-config.js";

export const contactTypeMeta: EntityMeta = withColumnConstraints({
  entity: "contact_type",
  translation_key: "contact_type",
  entities_ns: "crm",
  uid: "uuid",
  display_field: "label_key",
  columns: CONTACT_TYPE_LIST_COLUMNS,
  table: {
    default_view: "table",
    default_sort: CONTACT_TYPE_DEFAULT_SORT,
    default_page_size: 25,
    page_size_options: [10, 25, 50],
  },
}, ContactTypeEntity);
