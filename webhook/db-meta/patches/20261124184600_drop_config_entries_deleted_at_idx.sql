-- Primebrick: entity → database patch
-- Phase-5 approved drop — zero-selectivity deleted_at index (planner never uses it).
DROP INDEX IF EXISTS "webhook"."config_entries_deleted_at_idx";
