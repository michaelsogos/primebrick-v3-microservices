import { describe, expect, it } from "vitest";
import { validateNavDeclaration } from "@primebrick/sdk";

import { JOB_NAV } from "../nav-declaration.js";

/**
 * Write-time gate: the service's own nav declaration must pass the SAME
 * validator the BE applies at enrollment — a violation fails `pnpm test`
 * here long before registration rejects it.
 */
describe("JOB_NAV declaration", () => {
  it("passes the shared enrollment validator", () => {
    expect(validateNavDeclaration("job", JOB_NAV, "system")).toBeNull();
  });

  it("declares the derived module access namespace", () => {
    expect(JOB_NAV.access).toBe("access.system.job");
  });

  it("job-schedules is the module default leaf — GOTO(module) lands there", () => {
    const defaults = JOB_NAV.nav.filter((l) => l.default === true);
    expect(defaults.map((l) => l.id)).toEqual(["schedules"]);
    expect(defaults[0].href).toBe("/system/job/job-schedules");
  });

  it("schedules live at the plural leaf under the module prefix", () => {
    const routes = (JOB_NAV.routes ?? []).map((r) => r.route);
    expect(routes).toContain("/system/job/job-schedules");
    expect(routes).toContain("/system/job/job-schedules/create");
    expect(routes).not.toContain("/system/job");
    expect(routes).not.toContain("/system/job/new");
  });

  it("every nav href resolves to a declared route", () => {
    const routes = new Set((JOB_NAV.routes ?? []).map((r) => r.route));
    for (const link of JOB_NAV.nav ?? []) expect(routes.has(link.href)).toBe(true);
  });
});
