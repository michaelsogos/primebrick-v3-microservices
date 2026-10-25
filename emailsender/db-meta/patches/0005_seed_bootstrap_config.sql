-- Seed bootstrap config keys into emailsender.config_entries.
-- be_base_url is REQUIRED by createMicroservice() (configLoader.require —
-- boot crashes without it). service_client_shield_key identifies this
-- service instance on NATS publishes (client shield registry lookup) —
-- generated per environment (never committed, never shared): only its
-- sha256 hash travels to system.client_shield_registry via service.register.

INSERT INTO "emailsender"."config_entries" ("key", "value", "label_key", "description_key", "created_by", "updated_by")
VALUES
  ('be_base_url', 'http://localhost:3001', 'config.be_base_url.label', 'config.be_base_url.description', 'system', 'system'),
  ('service_client_shield_key', encode(gen_random_bytes(32), 'hex'), 'config.service_client_shield_key.label', 'config.service_client_shield_key.description', 'system', 'system')
ON CONFLICT ("key") DO NOTHING;
