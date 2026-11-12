/**
 * List configuration for the `ai_cerebellum` entity — single source of truth
 * for which fields are exposed in list rows, which columns exist in meta, and
 * which fields are sortable/searchable/filterable.
 *
 * Mirrors `ai-models/list-config.ts` — small reference table.
 */
import type { MetaColumn } from "../shared/entity-meta-types.js";

/** Raw list column literal — canonical `MetaColumn` shape minus the
 *  flags injected by the normalize step (`sticky`, `audited`).
 *  `order` is explicit per column — array position MUST NOT matter. */
export type AiCerebellumListColumn = Omit<MetaColumn, "sticky" | "audited">;

export const AI_CEREBELLUM_DEFAULT_SORT = { key: "name", dir: "asc" as const };

export const AI_CEREBELLUM_STICKY_COLUMN_KEYS = ["assistant_key"] as const;

const AI_CEREBELLUM_RAW_COLUMNS: AiCerebellumListColumn[] = [
  { key: "assistant_key", label_key: "ai.entities.ai_cerebellum.fields.assistant_key", type: "text", order: 0, hideable: false },
  { key: "model_id", label_key: "ai.entities.ai_cerebellum.fields.model_id", type: "text", order: 1 },
  { key: "dtype", label_key: "ai.entities.ai_cerebellum.fields.dtype", type: "text", order: 1.5 },
  { key: "name", label_key: "ai.entities.ai_cerebellum.fields.name", type: "text", order: 2 },
  { key: "description_key", label_key: "ai.entities.ai_cerebellum.fields.description_key", type: "text", order: 3, sortable: false, default_visible: false },
  { key: "enable_thinking", label_key: "ai.entities.ai_cerebellum.fields.enable_thinking", type: "badge", order: 4, default_visible: true, badge: { values: { true: { label_key: "ai.entities.ai_cerebellum.thinking.true", color: "violet-300" }, false: { label_key: "ai.entities.ai_cerebellum.thinking.false", color: "zinc-300" } } } },
  { key: "temperature", label_key: "ai.entities.ai_cerebellum.fields.temperature", type: "text", order: 5, default_visible: true },
  { key: "top_p", label_key: "ai.entities.ai_cerebellum.fields.top_p", type: "text", order: 6, sortable: false, default_visible: true },
  { key: "max_tokens", label_key: "ai.entities.ai_cerebellum.fields.max_tokens", type: "text", order: 7, default_visible: true },
  { key: "repetition_penalty", label_key: "ai.entities.ai_cerebellum.fields.repetition_penalty", type: "text", order: 8, sortable: false, default_visible: false },
];

const stickyKeySet = new Set<string>(AI_CEREBELLUM_STICKY_COLUMN_KEYS);

/** Canonical `MetaColumn[]`: injects `sticky`.
 *  `order` is declared explicitly per column. */
export const AI_CEREBELLUM_LIST_COLUMNS: MetaColumn[] = AI_CEREBELLUM_RAW_COLUMNS.map((c) => ({
  ...c,
  ...(stickyKeySet.has(c.key) ? { sticky: true } : {}),
}));






