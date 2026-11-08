-- Primebrick: entity → database patch
-- generatedAt: 2026-11-07T17:56:19.744Z

ALTER TABLE "crm"."customers" ADD COLUMN IF NOT EXISTS "display_name" text;
ALTER TABLE "crm"."customers" ADD COLUMN IF NOT EXISTS "customer_type_uuid" uuid;
ALTER TABLE "crm"."customers" ADD COLUMN IF NOT EXISTS "qualification_uuid" uuid;
ALTER TABLE "crm"."customers" ADD COLUMN IF NOT EXISTS "marketing_qualification_uuid" uuid;
ALTER TABLE "crm"."customers" ADD COLUMN IF NOT EXISTS "company_dimension_uuid" uuid;
