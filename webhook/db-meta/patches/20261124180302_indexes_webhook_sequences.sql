-- Primebrick: entity → database patch
-- pb:segments
-- generatedAt: 2026-11-24T18:03:02.628Z

-- Handwritten: canonical (unprefixed) index names.
ALTER INDEX "webhook"."webhook_translations_key_language_uidx" RENAME TO "translations_key_language_uidx";
ALTER INDEX "webhook"."webhook_translations_language_idx" RENAME TO "translations_language_idx";
ALTER TABLE "webhook"."translations" RENAME CONSTRAINT "translations_uuid_key" TO "translations_uuid_uq";

-- pb:begin-no-transaction
CREATE INDEX CONCURRENTLY IF NOT EXISTS "sequences_binding_key_default_from_idx" ON "webhook"."sequences" ("binding_key", "default_from" DESC NULLS LAST) WHERE deleted_at IS NULL;
-- pb:end-no-transaction
