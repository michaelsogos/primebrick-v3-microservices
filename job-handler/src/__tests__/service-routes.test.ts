/**
 * service-routes smoke — `makeServiceRoutes` construction runs the full
 * enforcement surface: withColumnConstraints (virtual columns), entity_op
 * attach, and the meta-action ↔ route fail-fast. A regression in ANY of
 * these would crash JH at boot while leaving every unit test green —
 * that's exactly what happened to the `live`/`drift` columns.
 */
import { describe, expect, it, vi } from "vitest";

vi.mock("@primebrick/sdk", async (importOriginal) => {
  const real = await importOriginal<typeof import("@primebrick/sdk")>();
  return {
    ...real,
    // dal init is deferred to first use — construction must not touch it.
    detectPackageIdentity: () => ({ name: "job-handler", version: "0.0.0-test" }),
  };
});

describe("jobServiceRouteHandler construction", () => {
  it("builds without throwing — all meta actions resolve to entity_op routes", async () => {
    const { jobServiceRouteHandler } = await import("../service-routes.js");
    expect(typeof jobServiceRouteHandler).toBe("function");
  });

  it("job_trigger declares the semantic exec-* chrome pairs", async () => {
    const { jobEntityDecls } = await import("../controllers/http/entities-route.js");
    const trigger = jobEntityDecls.find((d) => d.entityName === "job_trigger");
    const ov = trigger?.meta?.actions_overrides ?? {};
    expect(ov["delete.single"]).toMatchObject({ icon: "exec-stop", color: "destructive" });
    expect(ov["delete.bulk"]).toMatchObject({ icon: "exec-stop", color: "destructive" });
    expect(ov["restore.single"]).toMatchObject({ icon: "exec-start", color: "success" });
    expect(ov["restore.bulk"]).toMatchObject({ icon: "exec-start", color: "success" });
  });

  it("job_trigger declares confirm_key/busy_key — dialogs say disable/enable, never delete", async () => {
    const { jobEntityDecls } = await import("../controllers/http/entities-route.js");
    const trigger = jobEntityDecls.find((d) => d.entityName === "job_trigger");
    const ov = trigger?.meta?.actions_overrides ?? {};
    for (const op of ["delete.single", "restore.single"] as const) {
      expect(ov[op]?.confirm_key).toMatch(/actions\.(disable|enable)_confirm$/);
      expect(ov[op]?.busy_key).toMatch(/actions\.(disabling|enabling)$/);
    }
    for (const op of ["delete.bulk", "restore.bulk"] as const) {
      expect(ov[op]?.confirm_key).toMatch(/actions\.(disable|enable)_entities_confirm$/);
      expect(ov[op]?.busy_key).toMatch(/actions\.(disabling|enabling)$/);
    }
  });

  it("job_trigger column defaults — is_system hidden-but-toggleable, next_run visible", async () => {
    const { jobEntityDecls } = await import("../controllers/http/entities-route.js");
    const trigger = jobEntityDecls.find((d) => d.entityName === "job_trigger");
    const col = (key: string) => trigger?.meta?.columns?.find((c) => c.key === key);
    expect(col("is_system")?.default_visible).toBe(false);
    expect(col("is_system")?.hideable).not.toBe(false);
    expect(col("next_run")?.default_visible).toBe(true);
    expect(col("next_run")?.hideable).not.toBe(false);
  });

  it("job_run — stamped lineage, source+destination subjects, closed error badge", async () => {
    const { jobEntityDecls } = await import("../controllers/http/entities-route.js");
    const run = jobEntityDecls.find((d) => d.entityName === "job_run");
    const keys = run?.meta?.columns?.map((c) => c.key) ?? [];
    expect(keys).not.toContain("service_code");
    const col = (key: string) => run?.meta?.columns?.find((c) => c.key === key);
    // Friendly calculated ref — visible, drills to job_trigger by the
    // PHYSICAL stamped trigger_uuid (schedules are hard-deleted; the
    // stamped uuid survives mirror churn).
    expect(col("trigger")).toMatchObject({
      type: "ref",
      kind: "calculated",
      default_visible: true,
      ref: { entity: "job_trigger", key_field: "trigger_uuid" },
    });
    // The owning schedule — calculated friendly name, uuid-ref drill on
    // the stamped `schedule_uuid` (same anatomy as `armed_by`).
    expect(col("schedule")).toMatchObject({
      type: "ref",
      kind: "calculated",
      default_visible: true,
      ref: { entity: "job_schedule", key_field: "schedule_uuid" },
    });
    // Raw drill keys — `hidden:true` strips them from served meta
    // entirely (row payload only, like `next_fire_mirror_at`).
    expect(keys).not.toContain("trigger_uuid");
    expect(keys).not.toContain("schedule_uuid");
    // SOURCE — same anatomy as every sibling ingress subject field.
    expect(col("schedule_subject")).toMatchObject({
      type: "text",
      format: "nats_subject",
      icon: "zap",
      default_visible: true,
    });
    // Ordinary NULLs render "-", never a destructive label.
    expect(col("schedule_subject")?.null_label).toBeUndefined();
    expect(col("trigger")?.null_label).toBeUndefined();
    // DESTINATION — stamped at write time, mirrors schedule target anatomy.
    expect(col("target_subject")).toMatchObject({
      type: "text",
      format: "nats_subject",
      icon: "send",
      color: "sky-500",
      default_visible: true,
    });
    // error_code is a CLOSED badge enum — every item mapped+colored,
    // raw values can never render for a status-like column.
    const ec = col("error_code");
    expect(ec).toMatchObject({ type: "badge", default_visible: true });
    const badgeValues = ec?.badge?.values ?? {};
    expect(Object.keys(badgeValues).sort()).toEqual(
      [
        "EXECUTION_ERROR",
        "HANDLER_ERROR",
        "VALIDATION_ERROR",
        "DENIED",
        "DISPATCH_ERROR",
        "DISPATCH_TIMEOUT",
        "AUTH_ACTOR_UNRESOLVABLE",
        "SCHEDULE_PAUSED",
        "SCHEDULE_DISARMED",
      ].sort(),
    );
    for (const v of Object.values(badgeValues)) {
      expect(v.label_key).toMatch(/^job\.entities\.job_run\.status\./);
      expect(v.color).toBeTruthy();
    }
    // error_detail never surfaces as a column — hidden, non-toggleable;
    // the run-detail sheet is its only surface.
    expect(keys).not.toContain("error_detail");
    // Newly surfaced engine fields — hidden by default, never filterable.
    for (const key of ["fire_seq", "report"] as const) {
      expect(col(key)).toMatchObject({ default_visible: false, filterable: false });
    }
    // Outcome preset owns `status`; default sort is dispatch-instant desc.
    const preset = run?.meta?.table?.filter_presets?.find((p) => p.id === "outcome");
    expect(preset).toMatchObject({ display: "button_group", default_option: "all" });
    expect(preset?.options.map((o) => o.id).sort()).toEqual(
      ["all", "dispatched", "failed", "lost", "skipped", "succeeded"].sort(),
    );
    expect(run?.meta?.table?.default_sort).toEqual({ key: "created_at", dir: "desc" });
  });

  it("rejects a divergent semantic icon/color pair at construction", async () => {
    const { makeEntityRouter } = await import("@primebrick/sdk");
    const bad = () =>
      makeEntityRouter({
        entityName: "job_trigger",
        permissions: {},
        service: {},
        meta: {
          entities_ns: "job",
          uid: "uuid",
          columns: [],
          actions_overrides: {
            "delete.single": { icon: "exec-stop", color: "success" },
          },
        },
      } as never);
    expect(bad).toThrow(/exec-stop.*destructive|destructive.*exec-stop/i);
  });
});
