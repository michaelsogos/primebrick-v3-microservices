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

  it("job_run — service_code dropped, trigger projected, subject anatomy aligned", async () => {
    const { jobEntityDecls } = await import("../controllers/http/entities-route.js");
    const run = jobEntityDecls.find((d) => d.entityName === "job_run");
    const keys = run?.meta?.columns?.map((c) => c.key) ?? [];
    expect(keys).not.toContain("service_code");
    const col = (key: string) => run?.meta?.columns?.find((c) => c.key === key);
    // Friendly calculated ref — visible, drills to job_trigger by trigger_uuid.
    expect(col("trigger")).toMatchObject({
      type: "ref",
      kind: "calculated",
      default_visible: true,
      ref: { entity: "job_trigger", key_field: "trigger_uuid" },
    });
    // Raw drill key — `hidden:true` strips it from served meta entirely
    // (row payload only, like `next_fire_mirror_at` on schedules).
    expect(keys).not.toContain("trigger_uuid");
    // Source subject — same anatomy as every sibling subject field.
    expect(col("schedule_subject")).toMatchObject({
      type: "text",
      format: "nats_subject",
      icon: "zap",
      default_visible: false,
    });
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
