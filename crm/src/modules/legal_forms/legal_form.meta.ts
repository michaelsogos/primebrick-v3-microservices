/**
 * `legal_form` entity metadata — `GET /api/v1/entities/legal_form/meta`.
 * `entities_ns: "crm"`; `display_field: "name_local"` — ISO 20275 rows are
 * authoritative data, shown in their local name (never translated).
 */

import type { EntityMeta } from "@primebrick/sdk";
import { withColumnConstraints } from "@primebrick/dal-pg";
import { LegalFormEntity } from "../../domain/entities/legal_form_entity.js";
import { LEGAL_FORM_DEFAULT_SORT, LEGAL_FORM_LIST_COLUMNS } from "./list-config.js";

export const legalFormMeta: EntityMeta = withColumnConstraints({
  entity: "legal_form",
  translation_key: "legal_form",
  entities_ns: "crm",
  uid: "uuid",
  display_field: "name_local",
  columns: LEGAL_FORM_LIST_COLUMNS,
  table: {
    default_view: "table",
    default_sort: LEGAL_FORM_DEFAULT_SORT,
    default_page_size: 25,
    page_size_options: [10, 25, 50, 100],
  },
}, LegalFormEntity);
