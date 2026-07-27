-- Seed microservice config keys into ai.config table.
-- These replace ENV vars that were previously passed to the container.
-- Only DATABASE_URL, DB_SCHEMA, and SERVICE_BASE_URL remain as ENV vars.

INSERT INTO "ai"."config" ("key", "value", "label_key", "description_key", "created_by", "updated_by")
VALUES
  ('nats_url', 'nats://127.0.0.1:4222', 'config.nats_url.label', 'config.nats_url.description', 'system', 'system'),
  ('service_code', 'AI', 'config.service_code.label', 'config.service_code.description', 'system', 'system'),
  ('http_port', '3004', 'config.http_port.label', 'config.http_port.description', 'system', 'system'),
  ('llm_base_url', 'http://localhost:8080', 'config.llm_base_url.label', 'config.llm_base_url.description', 'system', 'system'),
  ('llm_model', 'Qwen3-4B-Instruct-2507', 'config.llm_model.label', 'config.llm_model.description', 'system', 'system'),
  ('llm_api_key', 'not-required', 'config.llm_api_key.label', 'config.llm_api_key.description', 'system', 'system'),
  ('be_base_url', 'http://localhost:3001', 'config.be_base_url.label', 'config.be_base_url.description', 'system', 'system'),
  ('embedding_model', 'all-MiniLM-L6-v2', 'config.embedding_model.label', 'config.embedding_model.description', 'system', 'system'),
  ('auth_mode', 'GATEWAY', 'config.auth_mode.label', 'config.auth_mode.description', 'system', 'system'),
  ('auth_roles_path', 'roles', 'config.auth_roles_path.label', 'config.auth_roles_path.description', 'system', 'system')
ON CONFLICT ("key") DO NOTHING;
