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
});
