/**
 * `ai_cerebellum` entity metadata — the JSON returned by
 * `GET /api/v1/entities/ai_cerebellum/meta`.
 */

import type { EntityMeta } from "../shared/entity-meta-types.js";
import {
  AI_CEREBELLUM_DEFAULT_SORT,
  AI_CEREBELLUM_LIST_COLUMNS,
} from "./list-config.js";

export const aiCerebellumMeta: EntityMeta = {
  entity: "ai_cerebellum",
  translation_key: "ai_cerebellum",
  entities_ns: "ai",
  title_key: "ai.entities.ai_cerebellum.title",
  uid: "uuid",
  display_field: "assistant_key",
  columns: AI_CEREBELLUM_LIST_COLUMNS,
  table: {
    default_view: "table",
    default_sort: AI_CEREBELLUM_DEFAULT_SORT,
    default_page_size: 25,
    page_size_options: [10, 25, 50, 100],
  },
};
