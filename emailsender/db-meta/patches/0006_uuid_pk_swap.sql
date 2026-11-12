-- Primebrick: emailsender uuid phase 4+5 — uuid becomes the PRIMARY KEY.
-- DROP COLUMN id removes the legacy PK constraint, the identity clause and
-- the owned sequence in one shot. ADD PRIMARY KEY (uuid) names the new
-- constraint <table>_pkey automatically. The now-redundant *_uuid_uq
-- indexes drop (PK enforces uniqueness). sender_log.entity_id drops —
-- entity_uuid is the only polymorphic ref (all rows were NULL anyway).
-- No physical FKs exist in this schema — nothing else to rewire.

ALTER TABLE "emailsender"."providers" DROP COLUMN "id";
ALTER TABLE "emailsender"."providers" ADD PRIMARY KEY ("uuid");
DROP INDEX "emailsender"."email_config_uuid_uq";
DROP INDEX "emailsender"."providers_uuid_uq";

ALTER TABLE "emailsender"."email_templates" DROP COLUMN "id";
ALTER TABLE "emailsender"."email_templates" ADD PRIMARY KEY ("uuid");
DROP INDEX "emailsender"."email_templates_uuid_uq";

ALTER TABLE "emailsender"."config_entries" DROP COLUMN "id";
ALTER TABLE "emailsender"."config_entries" ADD PRIMARY KEY ("uuid");
DROP INDEX "emailsender"."config_entries_uuid_uq";
DROP INDEX "emailsender"."config_entries_deleted_at_idx";

ALTER TABLE "emailsender"."sender_log" DROP COLUMN "id";
ALTER TABLE "emailsender"."sender_log" DROP COLUMN "entity_id";
ALTER TABLE "emailsender"."sender_log" ADD PRIMARY KEY ("uuid");
DROP INDEX "emailsender"."sender_log_uuid_uq";
