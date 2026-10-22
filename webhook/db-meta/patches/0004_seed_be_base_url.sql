-- Seed be_base_url into webhook.config_entries.
-- REQUIRED by createMicroservice() (configLoader.require — boot crashes
-- without it): the BE base URL the service registers against.

INSERT INTO "webhook"."config_entries" ("key", "value", "label_key", "description_key", "created_by", "updated_by")
VALUES
  ('be_base_url', 'http://localhost:3001', 'config.be_base_url.label', 'config.be_base_url.description', 'system', 'system')
ON CONFLICT ("key") DO NOTHING;
