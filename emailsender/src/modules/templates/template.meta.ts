/**
 * Entity metadata for `email_template` — returned by
 * `GET /api/v1/entities/email_template/meta`.
 * Default sort `updated_at desc` comes from HERE (metadata), never
 * hardcoded in the FE.
 *
 * Contract: `EntityMeta`/`MetaColumn` come from `@primebrick/sdk`
 * (re-exported from `@primebrick/core`) — service metas MUST NOT
 * re-declare the shared contract locally.
 *
 * Convention: every label key lives in THIS module's namespace —
 * `emailsender.entities.email_template.fields.<column>`. `entities_ns:
 * "emailsender"` declares the ownership so the FE composes
 * `emailsender.entities.*` (never `system.entities.*`) for this entity.
 * Keys are written by the module's own `emailsender.translations`
 * patches — the namespace write boundary rejects anything outside
 * `emailsender.*`.
 *
 * No `title_key`: list/create/edit titles reuse the canonical
 * `system.entities.page_title.*` templates interpolated with
 * `emailsender.entities.email_template.{plural|singular}`.
 *
 * `subject` is the default `display_field`: it is the human-meaningful
 * identifier in list rows and references; `code` stays the technical key
 * used by `send` callers.
 */
import type { EntityMeta } from "@primebrick/sdk";

const UPDATED_DESC = { key: "updated_at", dir: "desc" as const };
const F = (c: string) => `emailsender.entities.email_template.fields.${c}`;

export const templateMeta: EntityMeta = {
  entity: "email_template",
  translation_key: "email_template",
  entities_ns: "emailsender",
  uid: "uuid",
  display_field: "subject",
  columns: [
    { key: "code", label_key: F("code"), type: "text", order: 10, sortable: true, filterable: true, searchable: true },
    { key: "language_iso", label_key: F("language_iso"), type: "text", order: 20, sortable: true, filterable: true, searchable: true },
    { key: "subject", label_key: F("subject"), type: "text", order: 30, filterable: true, searchable: true },
    { key: "updated_at", label_key: F("updated_at"), type: "datetime", order: 40, sortable: true, audited: true },
    { key: "created_at", label_key: F("created_at"), type: "datetime", order: 50, sortable: true, default_visible: false, audited: true },
  ],
  table: { default_view: "table", default_sort: UPDATED_DESC, default_page_size: 25, page_size_options: [10, 25, 50] },
};
