-- Seed runtime config keys into ai.config_entries.
-- Completes the env-policy migration: LLM/embedding/rate-limit/redaction
-- settings previously read from process.env now live in config_entries.
-- Also corrects stale seed values: llm_base_url gains the /v1 path required
-- by the OpenAI-compatible provider, embedding_model matches the e5-large
-- model the embedding pipeline actually runs (docs_kb is 1024-dim).

INSERT INTO "ai"."config_entries" ("key", "value", "label_key", "description_key", "created_by", "updated_by")
VALUES
  ('llm_base_url', 'http://localhost:8080/v1', 'config.llm_base_url.label', 'config.llm_base_url.description', 'system', 'system'),
  ('llm_model', 'Qwen3-4B-Instruct-2507', 'config.llm_model.label', 'config.llm_model.description', 'system', 'system'),
  ('llm_api_key', 'not-required', 'config.llm_api_key.label', 'config.llm_api_key.description', 'system', 'system'),
  ('embedding_provider', 'transformers', 'config.embedding_provider.label', 'config.embedding_provider.description', 'system', 'system'),
  ('embedding_model', 'lmo3/multilingual-e5-large-instruct', 'config.embedding_model.label', 'config.embedding_model.description', 'system', 'system'),
  ('embedding_dim', '384', 'config.embedding_dim.label', 'config.embedding_dim.description', 'system', 'system'),
  ('embedding_dtype', 'q8', 'config.embedding_dtype.label', 'config.embedding_dtype.description', 'system', 'system'),
  ('embedding_local_only', 'false', 'config.embedding_local_only.label', 'config.embedding_local_only.description', 'system', 'system'),
  ('redact_pii', 'false', 'config.redact_pii.label', 'config.redact_pii.description', 'system', 'system'),
  ('rate_limit_capacity', '10', 'config.rate_limit_capacity.label', 'config.rate_limit_capacity.description', 'system', 'system'),
  ('rate_limit_refill_rate', '1', 'config.rate_limit_refill_rate.label', 'config.rate_limit_refill_rate.description', 'system', 'system'),
  ('rate_limit_token_cost', '1', 'config.rate_limit_token_cost.label', 'config.rate_limit_token_cost.description', 'system', 'system')
ON CONFLICT ("key") DO UPDATE
  SET "value" = EXCLUDED."value",
      "updated_at" = now(),
      "updated_by" = 'system';
