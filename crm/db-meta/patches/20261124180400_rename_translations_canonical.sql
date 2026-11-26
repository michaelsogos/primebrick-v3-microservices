-- Primebrick: canonical (unprefixed) index names — the legacy
-- `<schema>_translations_*` prefixes predate the canonical-name convention.
-- pb:segments

ALTER INDEX "crm"."crm_translations_key_language_uidx" RENAME TO "translations_key_language_uidx";
ALTER INDEX "crm"."crm_translations_language_idx" RENAME TO "translations_language_idx";
ALTER TABLE "crm"."translations" RENAME CONSTRAINT "crm_translations_uuid_uq" TO "translations_uuid_uq";
