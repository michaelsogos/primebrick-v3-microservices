/**
 * Entity metadata for the `job` admin entities — returned by
 * `GET /api/v1/entities/job_rule|job_schedule|job_run/meta`.
 * Default sort `updated_at desc` comes from HERE (metadata), never
 * hardcoded in the FE.
 *
 * Contract: `EntityMeta`/`MetaColumn` come from `@primebrick/sdk`
 * (re-exported from `@primebrick/core`) — service metas MUST NOT
 * re-declare the shared contract locally.
 *
 * Convention: every label key lives in THIS module's namespace —
 * `job.entities.<entity>.fields.<column>`, badge value keys
 * `job.entities.<entity>.status.<value>`. `entities_ns: "job"` declares
 * the ownership so the FE composes `job.entities.*` (never
 * `system.entities.*`) for these entities. Keys are written by the
 * module's own `job.translations` patches — the namespace write boundary
 * rejects anything outside `job.*`.
 */

import type { EntityMeta } from "@primebrick/sdk";

const UPDATED_DESC = { key: "updated_at", dir: "desc" as const };
const F = (e: string, c: string) => `job.entities.${e}.fields.${c}`;
const V = (e: string, v: string) => `job.entities.${e}.status.${v}`;

export const jobRuleMeta: EntityMeta = {
  entity: "job_rule",
  translation_key: "job_rule",
  entities_ns: "job",
  title_key: "job.entities.job_rule.title",
  uid: "uuid",
  display_field: "name",
  columns: [
    { key: "name", label_key: F("job_rule", "name"), type: "text", order: 10, sortable: true, filterable: true, searchable: true },
    { key: "event_subject", label_key: F("job_rule", "event_subject"), type: "text", order: 20, filterable: true },
    { key: "schedule_spec", label_key: F("job_rule", "schedule_spec"), type: "text", order: 30 },
    { key: "target_subject", label_key: F("job_rule", "target_subject"), type: "text", order: 40 },
    {
      key: "execution_context", label_key: F("job_rule", "execution_context"), type: "badge", order: 50, filterable: true,
      badge: { values: {
        system: { label_key: V("job_rule", "system"), color: "blue" },
        user: { label_key: V("job_rule", "user"), color: "purple" },
      } },
    },
    { key: "enabled", label_key: F("job_rule", "enabled"), type: "boolean", order: 60, filterable: true },
    { key: "updated_at", label_key: F("job_rule", "updated_at"), type: "datetime", order: 70, sortable: true },
    { key: "created_at", label_key: F("job_rule", "created_at"), type: "datetime", order: 80, sortable: true, default_visible: false },
  ],
  table: { default_view: "table", default_sort: UPDATED_DESC, default_page_size: 25, page_size_options: [10, 25, 50] },
};

export const jobScheduleMeta: EntityMeta = {
  entity: "job_schedule",
  translation_key: "job_schedule",
  entities_ns: "job",
  title_key: "job.entities.job_schedule.title",
  uid: "uuid",
  display_field: "schedule_subject",
  columns: [
    { key: "job_name", label_key: F("job_schedule", "job_name"), type: "text", order: 10, sortable: true, filterable: true, searchable: true },
    { key: "service_code", label_key: F("job_schedule", "service_code"), type: "text", order: 20, filterable: true },
    {
      key: "kind", label_key: F("job_schedule", "kind"), type: "badge", order: 30, filterable: true,
      badge: { values: {
        infra_derived: { label_key: V("job_schedule", "infra_derived"), color: "gray" },
        rule: { label_key: V("job_schedule", "rule"), color: "blue" },
        manual: { label_key: V("job_schedule", "manual"), color: "amber" },
      } },
    },
    { key: "schedule_spec", label_key: F("job_schedule", "schedule_spec"), type: "text", order: 40 },
    {
      key: "schedule_type", label_key: F("job_schedule", "schedule_type"), type: "badge", order: 45, filterable: true,
      badge: { values: {
        recurring: { label_key: V("job_schedule", "recurring"), color: "blue" },
        once: { label_key: V("job_schedule", "once"), color: "purple" },
      } },
    },
    { key: "target_subject", label_key: F("job_schedule", "target_subject"), type: "text", order: 50, default_visible: false },
    {
      key: "status", label_key: F("job_schedule", "status"), type: "badge", order: 60, filterable: true,
      badge: { values: {
        armed: { label_key: V("job_schedule", "armed"), color: "green" },
        disarmed: { label_key: V("job_schedule", "disarmed"), color: "red" },
      } },
    },
    // Mini execution histogram — Kestra-style per-row sparkline fed by
    // the job-run-stats action (keyed by schedule_subject).
    { key: "run_stats", label_key: F("job_schedule", "run_stats"), type: "run_stats_sparkline", order: 70 },
    { key: "armed_at", label_key: F("job_schedule", "armed_at"), type: "datetime", order: 80, sortable: true },
    { key: "updated_at", label_key: F("job_schedule", "updated_at"), type: "datetime", order: 90, sortable: true },
  ],
  table: { default_view: "table", default_sort: UPDATED_DESC, default_page_size: 25, page_size_options: [10, 25, 50] },
};

export const jobRunMeta: EntityMeta = {
  entity: "job_run",
  translation_key: "job_run",
  entities_ns: "job",
  title_key: "job.entities.job_run.title",
  uid: "uuid",
  display_field: "job_name",
  columns: [
    { key: "job_name", label_key: F("job_run", "job_name"), type: "text", order: 10, sortable: true, filterable: true, searchable: true },
    { key: "service_code", label_key: F("job_run", "service_code"), type: "text", order: 20, filterable: true },
    {
      key: "status", label_key: F("job_run", "status"), type: "badge", order: 30, filterable: true,
      badge: { values: {
        dispatched: { label_key: V("job_run", "dispatched"), color: "gray" },
        succeeded: { label_key: V("job_run", "succeeded"), color: "green" },
        failed: { label_key: V("job_run", "failed"), color: "red" },
        skipped: { label_key: V("job_run", "skipped"), color: "amber" },
      } },
    },
    { key: "created_at", label_key: F("job_run", "started_at"), type: "datetime", order: 40, sortable: true },
    { key: "updated_at", label_key: F("job_run", "finished_at"), type: "datetime", order: 50, sortable: true },
    { key: "duration_ms", label_key: F("job_run", "duration"), type: "number", order: 60, sortable: true },
    { key: "error_code", label_key: F("job_run", "error_code"), type: "text", order: 70, default_visible: false },
    { key: "error_detail", label_key: F("job_run", "error_detail"), type: "text", order: 80, default_visible: false },
    { key: "redelivery_count", label_key: F("job_run", "redelivery"), type: "number", order: 90, default_visible: false },
  ],
  table: { default_view: "table", default_sort: UPDATED_DESC, default_page_size: 25, page_size_options: [10, 25, 50] },
};
