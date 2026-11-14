/**
 * Entity metadata for the `job` admin entities — returned by
 * `GET /api/v1/entities/job_trigger|job_schedule|job_run/meta`.
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
import { PAYLOAD_MAP_ENTRY_KINDS, PAYLOAD_MAP_META_KINDS, PAYLOAD_INJECTORS } from "@primebrick/sdk";
import { withColumnConstraints } from "@primebrick/dal-pg";
import { JobTriggerEntity, JobScheduleEntity, JobRunEntity } from "../../domain/entities/registry.js";
import { TRIGGER_SCHEDULE_SUBJECT_PREFIX } from "../../domain/entities/job_trigger_entity.js";

const UPDATED_DESC = { key: "updated_at", dir: "desc" as const };
const F = (e: string, c: string) => `job.entities.${e}.fields.${c}`;
const V = (e: string, v: string) => `job.entities.${e}.status.${v}`;
const H = (e: string, c: string) => `job.entities.${e}.hints.${c}`;
const HT = (e: string, c: string) => `job.entities.${e}.hints.${c}_title`;

/**
 * `job_trigger.filter` JSON Schema — mirrors `matchFilter` in the rules engine:
 * `RuleFilter[]` where each entry is `{ field, op?, value? }` — `field` is a
 * dot-path on the event payload, `op` the closed operator enum. Served to the
 * form archetype for BOTH editor lint/completion and submit validation.
 */
const TRIGGER_FILTER_SCHEMA = {
  type: "array",
  items: {
    type: "object",
    required: ["field"],
    properties: {
      field: { type: "string" },
      op: { enum: ["eq", "neq", "exists", "contains", "gt", "lt"] },
      value: {},
    },
  },
} as const;

/**
 * `job_trigger.payload_map` JSON Schema — the authored DST the rules engine
 * resolves at arm time (`applyPayloadMap` in @primebrick/core): each key
 * is a field of the callable's request payload, each value a
 * `{kind:"const"|"path"|"meta"}` entry. The form renders the structured
 * `payload_map` control for it; this schema also drives editor
 * lint/completion and submit validation.
 */
const PAYLOAD_MAP_SCHEMA = {
  type: "object",
  additionalProperties: {
    type: "object",
    required: ["kind"],
    properties: {
      kind: { enum: [...PAYLOAD_MAP_ENTRY_KINDS] },
      value: {},
      path: { type: "string", pattern: "^\\$" },
      meta: { enum: [...PAYLOAD_MAP_META_KINDS] },
      inject: { enum: [...PAYLOAD_INJECTORS] },
      items: { type: "array" },
      entries: { type: "object" },
      fallback: { type: "array" },
    },
  },
} as const;

export const jobTriggerMeta: EntityMeta = withColumnConstraints({
  entity: "job_trigger",
  translation_key: "job_trigger",
  entities_ns: "job",
  title_key: "job.entities.job_trigger.title",
  uid: "uuid",
  display_field: "name",
  columns: [
    { key: "name", label_key: F("job_trigger", "name"), type: "text", format: "identifier", order: 10 },
    { key: "event_subject", label_key: F("job_trigger", "event_subject"), type: "text", format: "nats_subject", order: 20, icon: "zap", color: "amber-500", options_source: "census.emits", tooltip: H("job_trigger", "event_subject"), tooltip_title: HT("job_trigger", "event_subject"), tooltip_priority: "HINT" },
    {
      key: "filter", label_key: F("job_trigger", "filter"), type: "text", format: "json", order: 30,
      // Authoring-only — a JSON AST has no honest equality/text matcher.
      filterable: false,
      default_visible: false,
      json_schema: TRIGGER_FILTER_SCHEMA,
      tooltip: H("job_trigger", "filter"), tooltip_title: HT("job_trigger", "filter"), tooltip_priority: "HINT",
    },
    {
      key: "schedule_spec", label_key: F("job_trigger", "schedule_spec"), type: "text", format: "schedule_spec", order: 40,
      // Authoring-only — the cron spec editor is a writer, not a matcher.
      filterable: false,
      tooltip: H("job_trigger", "schedule_spec"), tooltip_title: HT("job_trigger", "schedule_spec"), tooltip_priority: "HINT",
    },
    {
      key: "target_subject", label_key: F("job_trigger", "target_subject"), type: "text", format: "nats_subject", order: 50,
      icon: "send", color: "sky-500", options_source: "census.callables",
      tooltip: H("job_trigger", "target_subject"), tooltip_title: HT("job_trigger", "target_subject"), tooltip_priority: "HINT",
    },
    {
      key: "payload_map", label_key: F("job_trigger", "payload_map"), type: "text", format: "json", order: 55,
      // Authoring-only — the payload-map editor is a writer, not a matcher.
      filterable: false,
      default_visible: false, widget: "payload_map",
      json_schema: PAYLOAD_MAP_SCHEMA,
      tooltip: H("job_trigger", "payload_map"), tooltip_title: HT("job_trigger", "payload_map"), tooltip_priority: "HINT",
    },
    { key: "run_as", label_key: F("job_trigger", "run_as"), type: "badge", order: 60, badge: { values: { system: { label_key: V("job_trigger", "system"), color: "#000000" }, originator: { label_key: V("job_trigger", "originator"), color: "primary" }, author: { label_key: V("job_trigger", "author"), color: "info" } } }, tooltip: H("job_trigger", "run_as"), tooltip_title: HT("job_trigger", "run_as"), tooltip_priority: "HINT" },
    {
      // 1:N children link — the runs list filtered by this trigger's
      // schedule-mirror subject (runs record it as `schedule_subject`).
      key: "runs", label_key: F("job_trigger", "runs"), type: "ref_count", order: 70, kind: "calculated",
      reverse_ref: { entity: "job_run", filter_field: "schedule_subject", value_template: `${TRIGGER_SCHEDULE_SUBJECT_PREFIX}{uuid}` },
    },
    // NOTE: no `enabled` column — soft-delete IS the disable (ghost rows +
    // restore CTA + "include deleted" filter are the UX). `deleted_at`/
    // `deleted_by` are auto-derived system columns.
    {
      // @Calculated on JobTriggerEntity — max job_runs.created_at per
      // mirror subject, SQL-projected (sortable/filterable like physical).
      key: "last_run", label_key: F("job_trigger", "last_run"), type: "datetime", order: 82, kind: "calculated",
      tooltip: H("job_trigger", "last_run"), tooltip_title: HT("job_trigger", "last_run"),
    },
    {
      // @Calculated — job_schedules.next_run_at of the armed mirror.
      // NULL for disabled/event-only triggers and cron specs before
      // their first fire (NATS owns cron evaluation).
      key: "next_run", label_key: F("job_trigger", "next_run"), type: "datetime", order: 84, kind: "calculated", default_visible: false,
      null_label: { label_key: "job.entities.job_trigger.fields.next_run.states.disabled", when: { field: "deleted_at", not: null } },
      tooltip: H("job_trigger", "next_run"), tooltip_title: HT("job_trigger", "next_run"),
    },
    {
      // Run outcomes over time — trigger-keyed (`row_key:"uuid"` → the
      // endpoint resolves the mirror subject server-side). Data arrives
      // via a batch action call, not the row payload → virtual.
      key: "run_stats", label_key: F("job_trigger", "run_stats"), type: "sparkline", order: 86, kind: "virtual",
      sparkline: {
        endpoint: "/actions/job-run-stats",
        request_field: "trigger_uuids",
        row_key: "uuid",
        series: [
          { field: "succeeded", color: "fill-emerald-500", label_key: V("job_run", "succeeded") },
          { field: "failed", color: "fill-red-500", label_key: V("job_run", "failed") },
          { field: "skipped", color: "fill-neutral-400", label_key: V("job_run", "skipped") },
        ],
      },
    },
    // updated_at stays declared only to keep it visible by default (derived default is false)
    { key: "updated_at", label_key: "system.common.fields.updated_at", type: "datetime", order: 90, default_visible: true },
  ],
  // Soft-delete IS disable — chrome only: delete renders "Disattiva" +
  // exec-stop (gradient-filled square, destructive), restore "Attiva" +
  // exec-start (gradient-filled play, success — a deliberate divergence
  // from the standard restore-warning: reactivation is a positive op).
  // exec-* icons are SEMANTIC — icon↔color agreement is enforced, never
  // free-form. Logic/dialogs/gating stay standard.
  actions_overrides: {
    "delete.single": { label_key: "job.entities.job_trigger.actions.disable", icon: "exec-stop", color: "destructive", confirm_key: "job.entities.job_trigger.actions.disable_confirm", busy_key: "job.entities.job_trigger.actions.disabling" },
    "delete.bulk": { label_key: "job.entities.job_trigger.actions.disable", icon: "exec-stop", color: "destructive", confirm_key: "job.entities.job_trigger.actions.disable_entities_confirm", busy_key: "job.entities.job_trigger.actions.disabling" },
    "restore.single": { label_key: "job.entities.job_trigger.actions.enable", icon: "exec-start", color: "success", confirm_key: "job.entities.job_trigger.actions.enable_confirm", busy_key: "job.entities.job_trigger.actions.enabling" },
    "restore.bulk": { label_key: "job.entities.job_trigger.actions.enable", icon: "exec-start", color: "success", confirm_key: "job.entities.job_trigger.actions.enable_entities_confirm", busy_key: "job.entities.job_trigger.actions.enabling" },
  },
  table: { default_view: "table", default_sort: UPDATED_DESC, default_page_size: 25, page_size_options: [10, 25, 50] },
}, JobTriggerEntity);

export const jobScheduleMeta: EntityMeta = withColumnConstraints<EntityMeta>({
  entity: "job_schedule",
  translation_key: "job_schedule",
  entities_ns: "job",
  title_key: "job.entities.job_schedule.title",
  uid: "uuid",
  display_field: "job_name",
  columns: [
    {
      // @Calculated on JobScheduleEntity — the scheduled job's name:
      // trigger name (live or from the actor stamp) for trigger mirrors,
      // the declared subject tail for manual/infra declarations. The
      // schedule has no name of its own — it inherits the job's, same
      // semantic as `job_run.job_name`. display_field → the pin derives
      // here (never on a subject mirror).
      key: "job_name", label_key: F("job_schedule", "job_name"), type: "text", order: 0, kind: "calculated",
    },
    { key: "schedule_subject", label_key: F("job_schedule", "schedule_subject"), type: "text", format: "nats_subject", order: 15, icon: "zap", color: "amber-500", tooltip: H("job_schedule", "schedule_subject"), tooltip_title: HT("job_schedule", "schedule_subject"), tooltip_priority: "HINT" },
    { key: "service_code", label_key: F("job_schedule", "service_code"), type: "text", format: "service_code", order: 20 },
    { key: "kind", label_key: F("job_schedule", "kind"), type: "badge", order: 30, badge: { values: { infra_derived: { label_key: V("job_schedule", "infra_derived"), color: "gray" }, trigger: { label_key: V("job_schedule", "trigger"), color: "blue" } } } },
    {
      // WHO armed it — the audit actor stamp, label-overridden to
      // "Armed By" (system-column relabel, same mechanism as job_run's
      // started_at). The cell renders `created_by_name` automatically:
      // `trigger:<name>`/`rule:<name>` for engine mirrors, the user
      // display_name for user actors, the raw service code otherwise.
      // options_source:"audit.actors" stays class-derived.
      key: "created_by", label_key: F("job_schedule", "armed_by"), type: "ref", order: 35, default_visible: true,
    },
    { key: "schedule_spec", label_key: F("job_schedule", "schedule_spec"), type: "text", format: "schedule_spec", order: 40, filterable: false },
    {
      // Owning trigger for kind=trigger mirrors — detail page via census.
      key: "trigger_uuid", label_key: F("job_schedule", "trigger_uuid"), type: "ref", order: 46, default_visible: false,
    },
    {
      // NOT `filterable` — the `schedule_kind` filter preset owns this
      // field (a sheet filter AND-ed with the preset would contradict it).
      key: "schedule_type", label_key: F("job_schedule", "schedule_type"), type: "badge", order: 45, filterable: false,
      badge: { values: {
        recurring: { label_key: V("job_schedule", "recurring"), color: "blue" },
        once: { label_key: V("job_schedule", "once"), color: "purple" },
      } },
    },
    { key: "target_subject", label_key: F("job_schedule", "target_subject"), type: "text", format: "nats_subject", order: 50, icon: "send", color: "sky-500", default_visible: false, tooltip: H("job_schedule", "target_subject"), tooltip_title: HT("job_schedule", "target_subject"), tooltip_priority: "HINT" },
    { key: "run_as", label_key: F("job_schedule", "run_as"), type: "badge", order: 55, default_visible: false, badge: { values: { user: { label_key: V("job_schedule", "user"), color: "primary" }, system: { label_key: V("job_schedule", "system"), color: "#000000" } } } },
    { key: "status", label_key: F("job_schedule", "status"), type: "badge", order: 60, badge: { values: { armed: { label_key: V("job_schedule", "armed"), color: "green" }, stopped: { label_key: V("job_schedule", "stopped"), color: "amber" }, paused: { label_key: V("job_schedule", "paused"), color: "amber" }, disarmed: { label_key: V("job_schedule", "disarmed"), color: "red" }, fired: { label_key: V("job_schedule", "fired"), color: "gray" }, expired: { label_key: V("job_schedule", "expired"), color: "gray" } } } },
    // Virtual columns — decorated per-row by JobSchedulesService from the
    // live JetStream enumeration (external source, never queryable).
    {
      key: "live", label_key: F("job_schedule", "live"), type: "boolean", order: 62, kind: "virtual",
    },
    {
      key: "drift", label_key: F("job_schedule", "drift"), type: "badge", order: 64, kind: "virtual",
      badge: { values: {
        stale: { label_key: V("job_schedule", "stale"), color: "red" },
        missing: { label_key: V("job_schedule", "missing"), color: "amber" },
      } },
    },
    // Mini execution histogram — builtin `sparkline` cell fed by ONE batch
    // POST per rows load (virtual column, keyed by schedule_subject).
    {
      key: "run_stats", label_key: F("job_schedule", "run_stats"), type: "sparkline", order: 70, kind: "virtual",
      sparkline: {
        endpoint: "/actions/job-run-stats",
        request_field: "schedule_subjects",
        row_key: "schedule_subject",
        series: [
          { field: "succeeded", color: "fill-emerald-500", label_key: V("job_run", "succeeded") },
          { field: "failed", color: "fill-red-500", label_key: V("job_run", "failed") },
          { field: "skipped", color: "fill-neutral-400", label_key: V("job_run", "skipped") },
        ],
      },
    },
    { key: "armed_at", label_key: F("job_schedule", "armed_at"), type: "datetime", order: 80 },
    {
      // Engine-maintained next fire — deterministic for @every/@at,
      // server's own Nats-Schedule-Next for cron (null pre-first-fire).
      key: "next_run_at", label_key: F("job_schedule", "next_run_at"), type: "datetime", order: 82,
    },
    // updated_at stays declared only to keep it visible by default (derived default is false)
    { key: "updated_at", label_key: "system.common.fields.updated_at", type: "datetime", order: 90, default_visible: true },
  ],
  table: {
    default_view: "table",
    default_sort: UPDATED_DESC,
    default_page_size: 25,
    page_size_options: [10, 25, 50],
    // Lifecycle row/bulk CTAs are synthesized by makeServiceRoutes from the
    // `entity_op.cta` declarations on the op routes — the route owns the op
    // and its chrome (no second source of truth here).
    // Mutually-exclusive scope selector in the toolbar (tandem with the
    // soft-delete group): one option always active, AND-ed into every list
    // call. `schedule_kind` owns the `schedule_type` field (not filterable).
    filter_presets: [
      {
        id: "schedule_kind",
        display: "button_group",
        label_key: "job.entities.job_schedule.presets.schedule_kind.label",
        default_option: "recurring",
        options: [
          {
            id: "recurring",
            label_key: "job.entities.job_schedule.presets.schedule_kind.recurring",
            icon: "repeat",
            tooltip_key: "job.entities.job_schedule.presets.schedule_kind.recurring_tip",
            where: [{ field: "schedule_type", op: "=", value: "recurring" }],
          },
          {
            id: "once",
            label_key: "job.entities.job_schedule.presets.schedule_kind.once",
            icon: "zap",
            tooltip_key: "job.entities.job_schedule.presets.schedule_kind.once_tip",
            where: [{ field: "schedule_type", op: "=", value: "once" }],
          },
          {
            id: "all",
            label_key: "job.entities.job_schedule.presets.schedule_kind.all",
            icon: "list-clock",
            tooltip_key: "job.entities.job_schedule.presets.schedule_kind.all_tip",
            where: [],
          },
        ],
      },
    ],
  },
}, JobScheduleEntity);

export const jobRunMeta: EntityMeta = withColumnConstraints<EntityMeta>({
  entity: "job_run",
  translation_key: "job_run",
  entities_ns: "job",
  title_key: "job.entities.job_run.title",
  uid: "uuid",
  display_field: "job_name",
  columns: [
    { key: "job_name", label_key: F("job_run", "job_name"), type: "text", order: 10 },
    { key: "service_code", label_key: F("job_run", "service_code"), type: "text", format: "service_code", order: 20 },
    { key: "status", label_key: F("job_run", "status"), type: "badge", order: 30, badge: { values: { dispatched: { label_key: V("job_run", "dispatched"), color: "gray" }, succeeded: { label_key: V("job_run", "succeeded"), color: "green" }, failed: { label_key: V("job_run", "failed"), color: "red" }, skipped: { label_key: V("job_run", "skipped"), color: "amber" } } } },
    { key: "run_as", label_key: F("job_run", "run_as"), type: "badge", order: 35, default_visible: false, badge: { values: { user: { label_key: V("job_run", "user"), color: "primary" }, system: { label_key: V("job_run", "system"), color: "#000000" } } } },
    // created_at is semantically the run's start instant — relabeled, kept visible (derived default hides audit cols)
    { key: "created_at", label_key: F("job_run", "started_at"), type: "datetime", order: 40, default_visible: true },
    {
      // The schedule that fired this run — links to the schedules list
      // filtered by subject (schedules have no detail route).
      key: "schedule_subject", label_key: F("job_run", "schedule_subject"), type: "ref", order: 45,
      ref: { entity: "job_schedule", route: "list", filter_field: "schedule_subject" },
    },
    // updated_at is the finish/last-seen instant — relabeled, kept visible (derived default hides audit cols)
    { key: "updated_at", label_key: F("job_run", "finished_at"), type: "datetime", order: 50, default_visible: true },
    { key: "duration_ms", label_key: F("job_run", "duration"), type: "number", order: 60 },
    { key: "error_code", label_key: F("job_run", "error_code"), type: "text", order: 70, default_visible: false },
    { key: "error_detail", label_key: F("job_run", "error_detail"), type: "text", order: 80, default_visible: false },
    { key: "redelivery_count", label_key: F("job_run", "redelivery"), type: "number", order: 90, default_visible: false },
  ],
  table: { default_view: "table", default_sort: UPDATED_DESC, default_page_size: 25, page_size_options: [10, 25, 50] },
}, JobRunEntity);
