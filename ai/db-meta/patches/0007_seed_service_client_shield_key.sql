-- Seed service_client_shield_key into ai.config_entries.
-- The key identifies this service instance on NATS publishes (client shield
-- registry lookup) — without it the service registers but its publishes to
-- shielded subjects fail verification. Generated per environment (never
-- committed, never shared): only its sha256 hash travels to
-- system.client_shield_registry via service.register.

INSERT INTO "ai"."config_entries" ("key", "value", "label_key", "description_key", "created_by", "updated_by")
VALUES
  ('service_client_shield_key', encode(gen_random_bytes(32), 'hex'), 'config.service_client_shield_key.label', 'config.service_client_shield_key.description', 'system', 'system')
ON CONFLICT ("key") DO NOTHING;
