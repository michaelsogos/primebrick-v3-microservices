-- 0006 — customer audit partitions: public.customers_audit_* → crm schema.
--
-- `ALTER TABLE ... SET SCHEMA` on a partitioned table (0005) moves ONLY the
-- parent — leaf partitions keep their own pg_class.relnamespace. The monthly
-- customers_audit_p* partitions and the default partition therefore remained
-- in `public`, violating the crm schema boundary (crm-owned data living in
-- the platform schema). All rows stayed attached and readable via the parent;
-- this patch completes the move — zero-copy, no data touched.

BEGIN;

ALTER TABLE "public"."customers_audit_default"   SET SCHEMA "crm";
ALTER TABLE "public"."customers_audit_p20260101" SET SCHEMA "crm";
ALTER TABLE "public"."customers_audit_p20260201" SET SCHEMA "crm";
ALTER TABLE "public"."customers_audit_p20260301" SET SCHEMA "crm";
ALTER TABLE "public"."customers_audit_p20260401" SET SCHEMA "crm";
ALTER TABLE "public"."customers_audit_p20260501" SET SCHEMA "crm";
ALTER TABLE "public"."customers_audit_p20260601" SET SCHEMA "crm";
ALTER TABLE "public"."customers_audit_p20260701" SET SCHEMA "crm";
ALTER TABLE "public"."customers_audit_p20260801" SET SCHEMA "crm";
ALTER TABLE "public"."customers_audit_p20260901" SET SCHEMA "crm";
ALTER TABLE "public"."customers_audit_p20261001" SET SCHEMA "crm";
ALTER TABLE "public"."customers_audit_p20261101" SET SCHEMA "crm";
ALTER TABLE "public"."customers_audit_p20261201" SET SCHEMA "crm";
ALTER TABLE "public"."customers_audit_p20270101" SET SCHEMA "crm";

COMMIT;
