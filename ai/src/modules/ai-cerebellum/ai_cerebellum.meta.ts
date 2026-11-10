/**
 * `ai_cerebellum` entity metadata — the JSON returned by
 * `GET /api/v1/entities/ai_cerebellum/meta`.
 */

import type { EntityMeta } from "../shared/entity-meta-types.js";
import { listColumnKeys } from "@primebrick/sdk";
import { withColumnConstraints } from "@primebrick/dal-pg";
import { AiCerebellumEntity } from "../../domain/entities/ai_cerebellum_entity.js";
import {
  AI_CEREBELLUM_DEFAULT_SORT,
  AI_CEREBELLUM_LIST_COLUMNS,
} from "./list-config.js";

export const aiCerebellumMeta: EntityMeta = withColumnConstraints({
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
}, AiCerebellumEntity);

/** Wire key sets derived from the RESOLVED meta — `withColumnConstraints`
 *  injects the system columns the authored list lacks, so the sort_key
 *  enum and the service narrowings mirror the served contract. */
export const {
  sortable: AI_CEREBELLUM_SORT_KEYS,
  searchable: AI_CEREBELLUM_SEARCHABLE_KEYS,
  filterable: AI_CEREBELLUM_FILTERABLE_KEYS,
} = listColumnKeys(aiCerebellumMeta.columns);
