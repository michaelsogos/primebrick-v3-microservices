-- Primebrick: repair 0014 — label updates must bump the audit triple.
--
-- `getI18nDict` proves freshness read-side: a cached dict older than the
-- table's max(updated_at) is rebuilt, otherwise it survives up to the 6h
-- TTL. Patch 0014 rewrote `value` without touching `updated_at`, so the
-- BE keeps serving the stale dict ("Deriva", "Attiva") although the rows
-- are correct. This patch re-touches the same 42 rows with the audit
-- triple the convention requires (updated_at/updated_by/version).

UPDATE job.translations
   SET updated_at = now(), updated_by = 'migration-label-bump-fix', version = version + 1
 WHERE key IN (
   'job.entities.job_schedule.fields.live',
   'job.entities.job_schedule.fields.drift',
   'job.entities.job_schedule.fields.armed_at',
   'job.entities.job_schedule.fields.disarmed_at',
   'job.entities.job_schedule.status.armed',
   'job.entities.job_schedule.status.disarmed'
 );
