-- Primebrick: translations.language — CHECK constraint against the
-- canonical supported-language vocabulary (SUPPORTED_LANGUAGES in
-- @primebrick/core — literal list MUST mirror it; enforced by the
-- `i18n-language-literal` check-standards rule).

ALTER TABLE "emailsender"."translations"
  ADD CONSTRAINT translations_language_supported_chk
  CHECK (language IN ('en-GB','en-US','it-IT','fr-FR','es-ES','de-DE','pt-PT'));
