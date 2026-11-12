-- i18n key snake_case cleanup — webhook own-schema renames + CHECK
-- tx:
-- === webhook.translations renames ===
ALTER TABLE webhook.translations ADD CONSTRAINT translations_key_shape CHECK ("key" ~ '^webhook(\.[a-z0-9_]+)+$');
-- /tx
