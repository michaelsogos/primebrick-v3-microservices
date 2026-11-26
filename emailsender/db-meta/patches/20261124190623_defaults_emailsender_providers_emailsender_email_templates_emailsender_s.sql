-- Primebrick: entity → database patch
-- pb:requires-review
-- generatedAt: 2026-11-24T19:06:23.190Z

-- ── review section (runs only after approval) ──
-- set default "created_at" → clock_timestamp() (db=now())
ALTER TABLE "emailsender"."providers" ALTER COLUMN "created_at" SET DEFAULT clock_timestamp();
-- set default "updated_at" → clock_timestamp() (db=now())
ALTER TABLE "emailsender"."providers" ALTER COLUMN "updated_at" SET DEFAULT clock_timestamp();
-- set default "created_at" → clock_timestamp() (db=now())
ALTER TABLE "emailsender"."email_templates" ALTER COLUMN "created_at" SET DEFAULT clock_timestamp();
-- set default "updated_at" → clock_timestamp() (db=now())
ALTER TABLE "emailsender"."email_templates" ALTER COLUMN "updated_at" SET DEFAULT clock_timestamp();
-- set default "sent_at" → clock_timestamp() (db=(none))
ALTER TABLE "emailsender"."sender_log" ALTER COLUMN "sent_at" SET DEFAULT clock_timestamp();
-- set default "status_changed_at" → clock_timestamp() (db=(none))
ALTER TABLE "emailsender"."sender_log" ALTER COLUMN "status_changed_at" SET DEFAULT clock_timestamp();
-- set default "created_at" → clock_timestamp() (db=now())
ALTER TABLE "emailsender"."config_entries" ALTER COLUMN "created_at" SET DEFAULT clock_timestamp();
-- set default "updated_at" → clock_timestamp() (db=now())
ALTER TABLE "emailsender"."config_entries" ALTER COLUMN "updated_at" SET DEFAULT clock_timestamp();
-- set default "created_at" → clock_timestamp() (db=now())
ALTER TABLE "emailsender"."sequences" ALTER COLUMN "created_at" SET DEFAULT clock_timestamp();
-- set default "updated_at" → clock_timestamp() (db=now())
ALTER TABLE "emailsender"."sequences" ALTER COLUMN "updated_at" SET DEFAULT clock_timestamp();
-- set default "created_at" → clock_timestamp() (db=now())
ALTER TABLE "emailsender"."sequence_counters" ALTER COLUMN "created_at" SET DEFAULT clock_timestamp();
-- set default "updated_at" → clock_timestamp() (db=now())
ALTER TABLE "emailsender"."sequence_counters" ALTER COLUMN "updated_at" SET DEFAULT clock_timestamp();
