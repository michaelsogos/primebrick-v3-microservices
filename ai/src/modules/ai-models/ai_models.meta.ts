/**
 * `ai_model` entity metadata — the JSON returned by
 * `GET /api/v1/entities/ai_model/meta`.
 */

import type { EntityMeta } from "../shared/entity-meta-types.js";
import { listColumnKeys } from "@primebrick/sdk";
import { withColumnConstraints } from "@primebrick/dal-pg";
import { AiModelEntity } from "../../domain/entities/ai_model_entity.js";
import {
  AI_MODEL_DEFAULT_SORT,
  AI_MODEL_LIST_COLUMNS,
} from "./list-config.js";

export const aiModelMeta: EntityMeta = withColumnConstraints({
  entity: "ai_model",
  translation_key: "ai_model",
  entities_ns: "ai",
  title_key: "ai.entities.ai_model.title",
  uid: "uuid",
  display_field: "model_id",
  columns: AI_MODEL_LIST_COLUMNS,
  table: {
    default_view: "table",
    default_sort: AI_MODEL_DEFAULT_SORT,
    default_page_size: 25,
    page_size_options: [10, 25, 50, 100],
  },
}, AiModelEntity);

/** Wire key sets derived from the RESOLVED meta — `withColumnConstraints`
 *  injects the system columns the authored list lacks, so the sort_key
 *  enum and the service narrowings mirror the served contract. */
export const {
  sortable: AI_MODEL_SORT_KEYS,
  searchable: AI_MODEL_SEARCHABLE_KEYS,
  filterable: AI_MODEL_FILTERABLE_KEYS,
} = listColumnKeys(aiModelMeta.columns);
