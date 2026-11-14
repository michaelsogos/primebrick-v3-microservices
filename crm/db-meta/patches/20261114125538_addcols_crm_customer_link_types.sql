-- Primebrick: entity → database patch
-- pb:segments
-- generatedAt: 2026-11-14T12:55:38.162Z

ALTER TABLE "crm"."customer_link_types" ADD COLUMN IF NOT EXISTS "inverse_label_key" varchar(100);
-- pb:begin-no-transaction
CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS "customer_links_pair_uq" ON "crm"."customer_links" ((LEAST(parent_customer_uuid, child_customer_uuid)), (GREATEST(parent_customer_uuid, child_customer_uuid)), "type_uuid");
-- pb:end-no-transaction

-- WARN: DB-only index "customer_links_parent_uuid_idx" on crm.customer_links — not dropped
-- WARN: DB-only index "customer_links_child_uuid_idx" on crm.customer_links — not dropped
-- WARN: DB-only foreign key "customer_links_parent_uuid_fkey" on crm.customer_links — not dropped
-- WARN: DB-only foreign key "customer_links_child_uuid_fkey" on crm.customer_links — not dropped
