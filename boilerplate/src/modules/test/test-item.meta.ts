/**
 * Entity metadata for `test_item` — returned by
 * `GET /api/v1/entities/test_item/meta`.
 * Default sort `updated_at desc` comes from HERE (metadata), never
 * hardcoded in the FE.
 *
 * Contract: `EntityMeta`/`MetaColumn` come from `@primebrick/sdk`
 * (re-exported from `@primebrick/core`) — service metas MUST NOT
 * re-declare the shared contract locally.
 *
 * Convention: every label key lives in THIS module's namespace —
 * `boilerplate.entities.test_item.fields.<column>`. `entities_ns:
 * "boilerplate"` declares the ownership so the FE composes
 * `boilerplate.entities.*` (never `system.entities.*`) for this entity.
 * Keys are written by the module's own `boilerplate.translations`
 * patches — the namespace write boundary rejects anything outside
 * `boilerplate.*`.
 *
 * No `title_key`: list/create/edit titles reuse the canonical
 * `system.entities.page_title.*` templates interpolated with
 * `boilerplate.entities.test_item.{plural|singular}`.
 */
import type { EntityMeta } from "@primebrick/sdk";
import { withColumnConstraints } from "@primebrick/dal-pg";
import { TestItemEntity } from "../../domain/entities/registry.js";

const UPDATED_DESC = { key: "updated_at", dir: "desc" as const };
const F = (c: string) => `boilerplate.entities.test_item.fields.${c}`;

export const testItemMeta: EntityMeta = withColumnConstraints({
  entity: "test_item",
  translation_key: "test_item",
  entities_ns: "boilerplate",
  uid: "uuid",
  display_field: "name",
  columns: [
    { key: "name", label_key: F("name"), type: "text", order: 10 },
    { key: "note", label_key: F("note"), type: "text", order: 20 },
    { key: "enabled", label_key: F("enabled"), type: "boolean", order: 30 },
    // updated_at is NOT declared — auto-derived like every other entity:
    // audited + canonical band order 2130, toggleable in the picker.
  ],
  table: { default_view: "table", default_sort: UPDATED_DESC, default_page_size: 25, page_size_options: [10, 25, 50] },
}, TestItemEntity);
