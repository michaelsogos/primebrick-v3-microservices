-- be_base_url — API gateway endpoint. Required by the service registrar
-- (log tag on register/heartbeat) and any internal call targeting the BE.
INSERT INTO "emailsender"."config_entries" ("key", "value", "label_key", "description_key", "created_by", "updated_by")
VALUES
  ('be_base_url', 'http://localhost:3001', 'config.be_base_url.label', 'config.be_base_url.description', 'system', 'system')
ON CONFLICT ("key") DO NOTHING;
