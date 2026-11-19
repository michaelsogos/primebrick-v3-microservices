-- Seed boilerplate.translations — the test_item entity labels.
-- Key convention: `<code>.entities.<entity>.{singular|plural|fields.<col>}`
-- (the same namespace testItemMeta declares via entities_ns:"boilerplate").
-- English is the seeded language; other locales are BE-managed at runtime.

INSERT INTO boilerplate.translations (key, language, value, created_by, updated_by)
VALUES
  ('boilerplate.entities.test_item.singular', 'en-GB', 'Test item', 'system', 'system'),
  ('boilerplate.entities.test_item.plural', 'en-GB', 'Test items', 'system', 'system'),
  ('boilerplate.entities.test_item.fields.name', 'en-GB', 'Name', 'system', 'system'),
  ('boilerplate.entities.test_item.fields.note', 'en-GB', 'Note', 'system', 'system'),
  ('boilerplate.entities.test_item.fields.enabled', 'en-GB', 'Enabled', 'system', 'system'),
  ('boilerplate.entities.test_item.fields.updated_at', 'en-GB', 'Updated', 'system', 'system')
ON CONFLICT DO NOTHING;
