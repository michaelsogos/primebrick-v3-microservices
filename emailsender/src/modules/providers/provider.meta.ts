/**
 * Entity metadata for `provider` — returned by
 * `GET /api/v1/entities/provider/meta`.
 * Default sort `updated_at desc` comes from HERE (metadata), never
 * hardcoded in the FE.
 *
 * Contract: `EntityMeta`/`MetaColumn` come from `@primebrick/sdk`
 * (re-exported from `@primebrick/core`) — service metas MUST NOT
 * re-declare the shared contract locally.
 *
 * Convention: every label key lives in THIS module's namespace —
 * `emailsender.entities.provider.fields.<column>`. `entities_ns:
 * "emailsender"` declares the ownership so the FE composes
 * `emailsender.entities.*` (never `system.entities.*`) for this entity.
 * Keys are written by the module's own `emailsender.translations`
 * patches — the namespace write boundary rejects anything outside
 * `emailsender.*`.
 *
 * No `title_key`: list/create/edit titles reuse the canonical
 * `system.entities.page_title.*` templates interpolated with
 * `emailsender.entities.provider.{plural|singular}`.
 */
import type { EntityMeta } from "@primebrick/sdk";
import { withColumnConstraints } from "@primebrick/dal-pg";
import { ProviderEntity } from "../../domain/entities/registry.js";

const UPDATED_DESC = { key: "updated_at", dir: "desc" as const };
const F = (c: string) => `emailsender.entities.provider.fields.${c}`;

export const providerMeta: EntityMeta = withColumnConstraints({
  entity: "provider",
  translation_key: "provider",
  entities_ns: "emailsender",
  uid: "uuid",
  display_field: "provider",
  columns: [
    { key: "provider", label_key: F("provider"), type: "text", order: 10 },
    { key: "api_endpoint", label_key: F("api_endpoint"), type: "text", order: 20 },
    { key: "from_email", label_key: F("from_email"), type: "text", order: 30 },
    { key: "from_name", label_key: F("from_name"), type: "text", order: 40 },
    { key: "reply_to", label_key: F("reply_to"), type: "text", order: 50, default_visible: false },
    // updated_at stays declared only to keep it visible by default (derived default is false)
    { key: "updated_at", label_key: "system.common.fields.updated_at", type: "datetime", order: 60, default_visible: true },
  ],
  table: { default_view: "table", default_sort: UPDATED_DESC, default_page_size: 25, page_size_options: [10, 25, 50] },
}, ProviderEntity);
