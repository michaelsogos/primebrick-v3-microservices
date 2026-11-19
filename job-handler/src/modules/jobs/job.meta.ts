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
const CREATED_DESC = { key: "created_at", dir: "desc" as const };
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
    {
      // @Calculated — `system_key IS NOT NULL`. The ELT-visible flag for
      // "this row is a module-declared system trigger": the interchange
      // fields below are code-owned on these rows (the depends_on.set
      // gate + the wire's frozen-set rule read the same physical source).
      key: "is_system", label_key: F("job_trigger", "is_system"), type: "boolean", order: 15, kind: "calculated", default_visible: false,
      tooltip: H("job_trigger", "is_system"), tooltip_title: HT("job_trigger", "is_system"), tooltip_priority: "HINT",
    },
    {
      key: "event_subject", label_key: F("job_trigger", "event_subject"), type: "text", format: "nats_subject", order: 20, icon: "zap", color: "amber-500", options_source: "census.emits",
      depends_on: { field: "system_key", disabled_when: { set: true } },
      tooltip: H("job_trigger", "event_subject"), tooltip_title: HT("job_trigger", "event_subject"), tooltip_priority: "HINT",
    },
    {
      key: "filter", label_key: F("job_trigger", "filter"), type: "text", format: "rule_filter", order: 50,
      // Authoring-only — a JSON AST has no honest equality/text matcher.
      filterable: false,
      default_visible: false,
      json_schema: TRIGGER_FILTER_SCHEMA,
      depends_on: { field: "system_key", disabled_when: { set: true } },
      tooltip: H("job_trigger", "filter"), tooltip_title: HT("job_trigger", "filter"), tooltip_priority: "HINT",
    },
    {
      key: "schedule_spec", label_key: F("job_trigger", "schedule_spec"), type: "text", format: "schedule_spec", order: 40,
      // Authoring-only — the cron spec editor is a writer, not a matcher.
      filterable: false,
      tooltip: H("job_trigger", "schedule_spec"), tooltip_title: HT("job_trigger", "schedule_spec"), tooltip_priority: "HINT",
    },
    {
      key: "target_subject", label_key: F("job_trigger", "target_subject"), type: "text", format: "nats_subject", order: 30,
      icon: "send", color: "sky-500", options_source: "census.callables",
      depends_on: { field: "system_key", disabled_when: { set: true } },
      tooltip: H("job_trigger", "target_subject"), tooltip_title: HT("job_trigger", "target_subject"), tooltip_priority: "HINT",
    },
    {
      key: "payload_map", label_key: F("job_trigger", "payload_map"), type: "text", format: "json", order: 55,
      // Authoring-only — the payload-map editor is a writer, not a matcher.
      filterable: false,
      default_visible: false, widget: "payload_map",
      json_schema: PAYLOAD_MAP_SCHEMA,
      depends_on: { field: "system_key", disabled_when: { set: true } },
      tooltip: H("job_trigger", "payload_map"), tooltip_title: HT("job_trigger", "payload_map"), tooltip_priority: "HINT",
    },
    { key: "run_as", label_key: F("job_trigger", "run_as"), type: "badge", order: 60, badge: { values: { system: { label_key: V("job_trigger", "system"), color: "#000000" }, originator: { label_key: V("job_trigger", "originator"), color: "primary" }, author: { label_key: V("job_trigger", "author"), color: "info" } } }, depends_on: { field: "system_key", disabled_when: { set: true } }, tooltip: H("job_trigger", "run_as"), tooltip_title: HT("job_trigger", "run_as"), tooltip_priority: "HINT" },
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
      // @Calculated — the armed mirror's NATS mirror, status-gated.
      // NULL for disabled/event-only triggers; cron shows a one-time
      // UTC estimate until the first fire reports Nats-Schedule-Next.
      key: "next_run", label_key: F("job_trigger", "next_run"), type: "datetime", order: 84, kind: "calculated", default_visible: true,
      null_label: { label_key: "job.entities.job_trigger.fields.next_run.states.disabled", when: { field: "deleted_at", not: null } },
      tooltip: H("job_trigger", "next_run"), tooltip_title: HT("job_trigger", "next_run"),
    },
    {
      // The module's stable job id — the materialization anchor. Written
      // once by the declaring service (never by the form — it is not in
      // page_props.form — and never by API: the wire rejects it); NULL
      // on user-made triggers. Internal reconcile anchor — suppressed
      // from the served meta entirely (never an user-facing surface).
      key: "system_key", label_key: F("job_trigger", "system_key"), type: "text", format: "identifier", order: 90,
      immutable: true, hidden: true,
      tooltip: H("job_trigger", "system_key"), tooltip_title: HT("job_trigger", "system_key"), tooltip_priority: "HINT",
    },
    {
      // Run outcomes over time — trigger-keyed (`row_key:"uuid"` → the
      // endpoint resolves the mirror subject server-side). Data arrives
      // via a batch action call, not the row payload → virtual. Sits
      // before last_run (82) — stats summary precedes the timestamps.
      key: "run_stats", label_key: F("job_trigger", "run_stats"), type: "sparkline", order: 80, kind: "virtual",
      sparkline: {
        endpoint: "/actions/job-run-stats",
        request_field: "trigger_uuids",
        row_key: "uuid",
        series: [
          { field: "succeeded", color: "fill-emerald-500", label_key: V("job_run", "succeeded") },
          { field: "failed", color: "fill-red-500", label_key: V("job_run", "failed") },
          { field: "lost", color: "fill-orange-500", label_key: V("job_run", "lost") },
          { field: "dispatched", color: "fill-slate-300", label_key: V("job_run", "dispatched") },
          { field: "skipped", color: "fill-neutral-400", label_key: V("job_run", "skipped") },
          { field: "missed", color: "fill-rose-300", label_key: V("job_run", "missed") },
        ],
      },
    },
    // updated_at is NOT declared — auto-derived like every other entity:
    // audited + canonical band order 2130, toggleable in the picker.
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
  display_field: "trigger",
  columns: [
    {
      // The schedule's identity — the owning trigger's display name,
      // resolved live via `trigger_uuid` (NOT NULL: every mirror is
      // trigger-owned). display_field → the pin derives here (never on
      // a subject mirror); the ref drills to job_trigger by the same
      // uuid, and a physically-gone trigger surfaces the dead uuid —
      // never "-". Identity position: sticky, always visible — only
      // `uuid` may precede it (hidden by default).
      key: "trigger", label_key: F("job_schedule", "trigger"), type: "ref", kind: "calculated", order: 0,
      ref: { entity: "job_trigger", key_field: "trigger_uuid" },
      tooltip: H("job_schedule", "trigger"), tooltip_title: HT("job_schedule", "trigger"), tooltip_priority: "HINT",
    },
    { key: "schedule_subject", label_key: F("job_schedule", "schedule_subject"), type: "text", format: "nats_subject", order: 10, icon: "zap", color: "amber-500", tooltip: H("job_schedule", "schedule_subject"), tooltip_title: HT("job_schedule", "schedule_subject"), tooltip_priority: "HINT" },
    { key: "target_subject", label_key: F("job_schedule", "target_subject"), type: "text", format: "nats_subject", order: 20, icon: "send", color: "sky-500", default_visible: true, tooltip: H("job_schedule", "target_subject"), tooltip_title: HT("job_schedule", "target_subject"), tooltip_priority: "HINT" },
    { key: "schedule_spec", label_key: F("job_schedule", "schedule_spec"), type: "text", format: "schedule_spec", order: 30, filterable: false },
    {
      // Wire-filterable — the `schedule_kind` filter preset filters on it.
      // The filters PANEL excludes it anyway: preset-owned fields are
      // derived out of the sheet's field list on the FE side (a sheet
      // criterion AND-ed with the preset would contradict it).
      key: "schedule_type", label_key: F("job_schedule", "schedule_type"), type: "badge", order: 50,
      badge: { values: {
        recurring: { label_key: V("job_schedule", "recurring"), color: "blue" },
        once: { label_key: V("job_schedule", "once"), color: "purple" },
      } },
    },
    { key: "run_as", label_key: F("job_schedule", "run_as"), type: "badge", order: 60, default_visible: true, badge: { values: { user: { label_key: V("job_schedule", "user"), color: "primary" }, system: { label_key: V("job_schedule", "system"), color: "#000000" } } }, tooltip: H("job_schedule", "run_as"), tooltip_title: HT("job_schedule", "run_as"), tooltip_priority: "HINT" },
    { key: "status", label_key: F("job_schedule", "status"), type: "badge", order: 70, badge: { values: { armed: { label_key: V("job_schedule", "armed"), color: "green" }, stopped: { label_key: V("job_schedule", "stopped"), color: "amber" }, paused: { label_key: V("job_schedule", "paused"), color: "amber" }, disarmed: { label_key: V("job_schedule", "disarmed"), color: "red" }, fired: { label_key: V("job_schedule", "fired"), color: "gray" }, expired: { label_key: V("job_schedule", "expired"), color: "gray" } } } },
    // Virtual columns — decorated per-row by JobSchedulesService from the
    // live JetStream enumeration (external source, never queryable).
    {
      key: "live", label_key: F("job_schedule", "live"), type: "boolean", order: 72, kind: "virtual", default_visible: false,
    },
    {
      key: "drift", label_key: F("job_schedule", "drift"), type: "badge", order: 74, kind: "virtual",
      badge: { values: {
        stale: { label_key: V("job_schedule", "stale"), color: "red" },
        missing: { label_key: V("job_schedule", "missing"), color: "amber" },
      } },
    },
    // Mini execution histogram — builtin `sparkline` cell fed by ONE batch
    // POST per rows load (virtual column, keyed by schedule_subject).
    {
      key: "run_stats", label_key: F("job_schedule", "run_stats"), type: "sparkline", order: 80, kind: "virtual",
      sparkline: {
        endpoint: "/actions/job-run-stats",
        request_field: "schedule_subjects",
        row_key: "schedule_subject",
        series: [
          { field: "succeeded", color: "fill-emerald-500", label_key: V("job_run", "succeeded") },
          { field: "failed", color: "fill-red-500", label_key: V("job_run", "failed") },
          { field: "lost", color: "fill-orange-500", label_key: V("job_run", "lost") },
          { field: "dispatched", color: "fill-slate-300", label_key: V("job_run", "dispatched") },
          { field: "skipped", color: "fill-neutral-400", label_key: V("job_run", "skipped") },
          { field: "missed", color: "fill-rose-300", label_key: V("job_run", "missed") },
        ],
      },
    },
    {
      // Served next-fire — @Calculated gate on the internal NATS mirror
      // (`next_fire_mirror_at`): NULL whenever status is not executable —
      // a disabled/paused/terminal schedule has no next run.
      key: "next_run_at", label_key: F("job_schedule", "next_run_at"), type: "datetime", order: 90, kind: "calculated",
      tooltip: H("job_schedule", "next_run_at"), tooltip_title: HT("job_schedule", "next_run_at"), tooltip_priority: "HINT",
    },
    // updated_at is NOT declared — auto-derived like every other entity:
    // audited + canonical band order 2130, toggleable in the picker.
    {
      // Internal scheduler shadow — never a column, never in the picker.
      // The mirror's only readers are SQL-level (the `next_run_at` gate)
      // and server-side (the live/drift decoration); `hidden` drops it
      // from served meta while the physical field keeps travelling in
      // the wire row.
      key: "next_fire_mirror_at", label_key: F("job_schedule", "next_fire_mirror_at"), type: "datetime", order: 94, hidden: true,
    },
    {
      // Owning trigger — the ONE owner of every mirror row (NOT NULL).
      // Togglable detail: trails the business block rather than sitting
      // mid-sequence (its old slot was taken by the destination column).
      key: "trigger_uuid", label_key: F("job_schedule", "trigger_uuid"), type: "ref", order: 100, default_visible: false,
    },
    // ── Extra audit stamps (entity-specific lifecycle facts) ─────────
    // These are audited columns: a schedule's utility is not "created,
    // therefore exists" but "created AND armed". They rank FIRST of the
    // audit block (canonical extras band — declaration order IS the
    // sequence: fired_at → armed_at → disarmed_at), ahead of the standard
    // created/updated pairs. `fired_at`/`armed_at` stay visible by
    // default; `disarmed_at` is togglable like every audit.
    // Semantics: `armed_at` is monotonic history (persists across disarm);
    // `disarmed_at` is the active disarm stamp (cleared on re-arm) — both
    // populated reads "armed at T1, disarmed at T2".
    {
      // Universal "Eseguita il" — @Calculated latest ACTUAL run on the
      // subject (`skipped` excluded — a suppressed due never ran).
      key: "fired_at", label_key: F("job_schedule", "fired_at"), type: "datetime", kind: "calculated", audited: true, default_visible: true, order: 2000,
      tooltip: H("job_schedule", "fired_at"), tooltip_title: HT("job_schedule", "fired_at"), tooltip_priority: "HINT",
    },
    { key: "armed_at", label_key: F("job_schedule", "armed_at"), type: "datetime", audited: true, default_visible: true, order: 2020 },
    { key: "disarmed_at", label_key: F("job_schedule", "disarmed_at"), type: "datetime", audited: true, default_visible: false, order: 2030 },
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
  display_field: "trigger",
  columns: [
    {
      // The run's identity — the owning trigger's display name, resolved
      // live via `trigger_uuid` (NOT NULL: every run derives from a
      // trigger; the stamped uuid survives the mirror's hard-delete).
      // display_field → the pin derives here; the ref drills to
      // job_trigger by the same uuid, and a physically-gone trigger
      // surfaces the dead uuid — never "-". Identity position: sticky,
      // always visible — only `uuid` may precede it (hidden by default).
      key: "trigger", label_key: F("job_run", "trigger"), type: "ref", kind: "calculated", order: 10,
      ref: { entity: "job_trigger", key_field: "trigger_uuid" },
    },
    { key: "status", label_key: F("job_run", "status"), type: "badge", order: 30, badge: { values: { dispatched: { label_key: V("job_run", "dispatched"), color: "info" }, succeeded: { label_key: V("job_run", "succeeded"), color: "green" }, failed: { label_key: V("job_run", "failed"), color: "red" }, lost: { label_key: V("job_run", "lost"), color: "amber" }, skipped: { label_key: V("job_run", "skipped"), color: "gray" } } } },
    {
      // The owning schedule — its identity IS its owning trigger's name
      // (resolved transitively via `js.trigger_uuid` — schedules carry
      // no name of their own), drills to job_schedule by the PHYSICAL
      // stamped `schedule_uuid` (same uuid-ref anatomy as `trigger` →
      // record sheet GET by uuid; a hard-deleted schedule lands on the
      // not-found hero while the subject column keeps the raw truth).
      // NULL → "-". Toggleable but off the default surface — the default
      // grid is the outcome-monitor nine (trigger/status/timing/counters).
      key: "schedule", label_key: F("job_run", "schedule"), type: "ref", order: 36, kind: "calculated", default_visible: false,
      ref: { entity: "job_schedule", key_field: "schedule_uuid" },
    },
    // created_at is semantically the run's start instant — relabeled, kept visible (derived default hides audit cols)
    { key: "created_at", label_key: F("job_run", "started_at"), type: "datetime", order: 40, default_visible: true },
    // updated_at is the finish/last-seen instant — relabeled, kept visible (derived default hides audit cols)
    { key: "updated_at", label_key: F("job_run", "finished_at"), type: "datetime", order: 50, default_visible: true },
    // duration_ms — canonical milliseconds; the FIXED Intl-sanctioned unit
    // rides the `time` category kind (no sibling code column): the cell
    // renders `style:"unit"` — "24 ms" in every locale.
    { key: "duration_ms", label_key: F("job_run", "duration"), type: "number", uom: { kind: "time", unit: "millisecond" }, order: 60 },
    {
      // SOURCE — the ingress queue this run arrived on, a NATS subject
      // like every sibling subject field (zap = ingress). Stays
      // filterable: the trigger's `runs` reverse_ref and own-lane run
      // correlation depend on it. NULL = manual run → `-`.
      // Toggleable but off the default surface (lineage, not outcome data).
      key: "schedule_subject", label_key: F("job_run", "schedule_subject"), type: "text", format: "nats_subject", order: 70,
      icon: "zap", color: "amber-500", default_visible: false,
    },
    {
      // DESTINATION — the subject the handler consumed, stamped verbatim
      // at write time (forwarder: `envelope.target`; direct: `data.target`).
      // Mirrors `job_schedule.target_subject` (send = destination); NOT
      // derivable from `trigger` — the job identity is the owning
      // trigger's name, never the destination itself.
      // Toggleable but off the default surface (lineage, not outcome data).
      key: "target_subject", label_key: F("job_run", "target_subject"), type: "text", format: "nats_subject", order: 75,
      icon: "send", color: "sky-500", default_visible: false,
    },
    { key: "run_as", label_key: F("job_run", "run_as"), type: "badge", order: 80, default_visible: false, badge: { values: { user: { label_key: V("job_run", "user"), color: "primary" }, system: { label_key: V("job_run", "system"), color: "#000000" } } } },
    {
      // Closed failure vocabulary — writers normalize to this enum and
      // unmapped callable codes coerce to EXECUTION_ERROR (the original
      // code/detail survives in `error_detail`, never a raw cell).
      key: "error_code", label_key: F("job_run", "error_code"), type: "badge", order: 90, default_visible: true,
      badge: {
        values: {
          EXECUTION_ERROR: { label_key: V("job_run", "execution_error"), color: "red" },
          HANDLER_ERROR: { label_key: V("job_run", "handler_error"), color: "red" },
          VALIDATION_ERROR: { label_key: V("job_run", "validation_error"), color: "amber" },
          DENIED: { label_key: V("job_run", "denied"), color: "amber" },
          DISPATCH_ERROR: { label_key: V("job_run", "dispatch_error"), color: "red" },
          DISPATCH_TIMEOUT: { label_key: V("job_run", "dispatch_timeout"), color: "amber" },
          AUTH_ACTOR_UNRESOLVABLE: { label_key: V("job_run", "auth_actor_unresolvable"), color: "red" },
          SCHEDULE_PAUSED: { label_key: V("job_run", "schedule_paused"), color: "gray" },
          SCHEDULE_DISARMED: { label_key: V("job_run", "schedule_disarmed"), color: "gray" },
        },
      },
    },
    {
      // Free-form detail behind the badge — never a column (not even
      // toggleable): the run-detail sheet is its surface.
      key: "error_detail", label_key: F("job_run", "error_detail"), type: "text", order: 100, hidden: true, filterable: false,
    },
    { key: "redelivery_count", label_key: F("job_run", "redelivery"), type: "number", order: 110, default_visible: true },
    {
      // JetStream dedup sequence of the due fire — the execution-count
      // column ("Fire #"/"Esecuzione n."). Not a matcher: filterable stays
      // off, it is a diagnostic seq not a criteria.
      key: "fire_seq", label_key: F("job_run", "fire_seq"), type: "number", order: 120, default_visible: true, filterable: false,
    },
    {
      // Free-form executor report (jsonb) — the "Esito"/outcome column;
      // a writer, not a matcher.
      key: "report", label_key: F("job_run", "report"), type: "text", format: "json", order: 130, default_visible: true, filterable: false,
    },
    {
      // Owning trigger uuid — PHYSICAL, stamped at write time; exists
      // only as the `trigger` column's drill key, never a surface.
      key: "trigger_uuid", label_key: F("job_run", "trigger_uuid"), type: "ref", order: 140, hidden: true,
    },
    {
      // Owning schedule uuid — PHYSICAL, stamped at write time; exists
      // only as the `schedule` column's drill key, never a surface.
      key: "schedule_uuid", label_key: F("job_run", "schedule_uuid"), type: "ref", order: 141, hidden: true,
    },
  ],
  table: {
    default_view: "table",
    // Dispatch instant first — a long-running `dispatched` row stays on
    // top instead of sinking behind finished rows (monitoring semantic).
    default_sort: CREATED_DESC,
    default_page_size: 25,
    page_size_options: [10, 25, 50],
    // Outcome selector in the toolbar — owns the `status` field (it
    // leaves the filter sheet, like `schedule_kind` owns `schedule_type`).
    filter_presets: [
      {
        id: "outcome",
        display: "button_group",
        label_key: "job.entities.job_run.presets.outcome.label",
        // `sent` first and DEFAULT — the monitor lands on what is still
        // queued, then drills into outcomes.
        default_option: "sent",
        options: [
          // Option labels reuse `status.*` — the same words the badge
          // already says; only the tooltips are preset-owned copy.
          {
            // `dispatched` rows — sent to the queue, awaiting a handler.
            id: "sent",
            label_key: V("job_run", "dispatched"),
            icon: "play",
            tooltip_key: "job.entities.job_run.presets.outcome.sent_tip",
            where: [{ field: "status", op: "=", value: "dispatched" }],
          },
          {
            id: "succeeded",
            label_key: V("job_run", "succeeded"),
            icon: "circle-check",
            tooltip_key: "job.entities.job_run.presets.outcome.succeeded_tip",
            where: [{ field: "status", op: "=", value: "succeeded" }],
          },
          {
            // Failure aggregate — lost (never reported) and skipped
            // (suppressed) belong to the same problem bucket.
            id: "failed",
            label_key: V("job_run", "failed"),
            icon: "triangle-exclamation-point",
            tooltip_key: "job.entities.job_run.presets.outcome.failed_tip",
            where: [{ field: "status", op: "IN", value: ["failed", "lost", "skipped"] }],
          },
          {
            id: "all",
            label_key: "job.entities.job_run.presets.outcome.all",
            icon: "list-clock",
            tooltip_key: "job.entities.job_run.presets.outcome.all_tip",
            where: [],
          },
        ],
      },
    ],
    // Read-only entity — every row op gates on `meta.actions`, and no
    // write op exists → the actions column is suppressed entirely. The
    // run's detail surface is the canonical `entity.record` sheet,
    // reached automatically when a ref cell resolves a run elsewhere.
  },
}, JobRunEntity);
