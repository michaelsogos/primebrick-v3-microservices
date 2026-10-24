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

const UPDATED_DESC = { key: "updated_at", dir: "desc" as const };
const F = (c: string) => `emailsender.entities.provider.fields.${c}`;

export const providerMeta: EntityMeta = {
  entity: "provider",
  translation_key: "provider",
  entities_ns: "emailsender",
  uid: "uuid",
  display_field: "provider",
  columns: [
    { key: "provider", label_key: F("provider"), type: "text", order: 10, sortable: true, filterable: true, searchable: true },
    { key: "api_endpoint", label_key: F("api_endpoint"), type: "text", order: 20, filterable: true, searchable: true },
    { key: "from_email", label_key: F("from_email"), type: "text", order: 30, filterable: true, searchable: true },
    { key: "from_name", label_key: F("from_name"), type: "text", order: 40, searchable: true },
    { key: "reply_to", label_key: F("reply_to"), type: "text", order: 50, default_visible: false },
    { key: "updated_at", label_key: F("updated_at"), type: "datetime", order: 60, sortable: true, audited: true },
    { key: "created_at", label_key: F("created_at"), type: "datetime", order: 70, sortable: true, default_visible: false, audited: true },
  ],
  table: { default_view: "table", default_sort: UPDATED_DESC, default_page_size: 25, page_size_options: [10, 25, 50] },
};
