import { describe, expect, it } from "vitest";
import { validateNavDeclaration } from "@primebrick/sdk";

import { EMAILSENDER_NAV } from "../nav-declaration.js";

/**
 * Write-time gate: the service's own nav declaration must pass the SAME
 * validator the BE applies at enrollment — a violation fails `pnpm test`
 * here long before registration rejects it.
 */
describe("EMAILSENDER_NAV declaration", () => {
  it("passes the shared enrollment validator", () => {
    expect(validateNavDeclaration("emailsender", EMAILSENDER_NAV, "system")).toBeNull();
  });

  it("declares the derived module access namespace", () => {
    expect(EMAILSENDER_NAV.access).toBe("access.system.emailsender");
  });

  it("providers is the module default leaf — GOTO(module) lands there", () => {
    const defaults = EMAILSENDER_NAV.nav.filter((l) => l.default === true);
    expect(defaults.map((l) => l.id)).toEqual(["providers"]);
    expect(defaults[0].href).toBe("/system/emailsender/providers");
  });

  it("declares the list/create/detail triplets under the module prefix", () => {
    const routes = (EMAILSENDER_NAV.routes ?? []).map((r) => r.route);
    for (const leaf of ["providers", "templates"]) {
      expect(routes).toContain(`/system/emailsender/${leaf}`);
      expect(routes).toContain(`/system/emailsender/${leaf}/create`);
      expect(routes).toContain(`/system/emailsender/${leaf}/[uuid]`);
    }
    expect(routes).not.toContain("/system/emailsender");
    expect(routes).not.toContain("/system/emailsender/new");
  });

  it("remote routes point at the module-assets chunk", () => {
    const remote = (EMAILSENDER_NAV.routes ?? []).filter((r) => r.component_url);
    expect(remote.map((r) => r.kind)).toEqual(["create", "detail", "create", "detail"]);
    for (const r of remote) {
      expect(r.component_url).toBe("/svc/emailsender/api/v1/module-assets/emailsender-pages.js");
      expect(r.component_format).toBe("esm-mount");
    }
  });

  it("every nav href resolves to a declared route", () => {
    const routes = new Set((EMAILSENDER_NAV.routes ?? []).map((r) => r.route));
    for (const link of EMAILSENDER_NAV.nav ?? []) expect(routes.has(link.href)).toBe(true);
  });
});
