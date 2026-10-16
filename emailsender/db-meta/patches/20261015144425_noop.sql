-- Primebrick: entity → database patch
-- pb:segments
-- generatedAt: 2026-10-15T14:44:25.155Z

-- pb:begin-no-transaction
CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS "sender_log_provider_message_id_uq" ON "emailsender"."sender_log" ("provider_message_id");
-- pb:end-no-transaction
