import { describe, expect, it } from "vitest";
import { validateNavDeclaration } from "@primebrick/sdk";

import { CRM_NAV } from "../nav-declaration.js";

/**
 * Write-time gate: the service's own nav declaration must pass the SAME
 * validator the BE applies at enrollment — a violation fails `pnpm test`
 * here long before registration rejects it.
 */
describe("CRM_NAV declaration", () => {
  it("passes the shared enrollment validator", () => {
    expect(validateNavDeclaration("crm", CRM_NAV, "crm")).toBeNull();
  });

  it("declares the derived module access namespace (part_of === code collapse)", () => {
    expect(CRM_NAV.access).toBe("access.crm");
  });

  it("customers is the module default leaf — GOTO(module) lands there", () => {
    const defaults = CRM_NAV.nav.filter((l) => l.default === true);
    expect(defaults.map((l) => l.id)).toEqual(["customers"]);
    expect(defaults[0].href).toBe("/crm/customers");
  });

  it("customer create uses the canonical /create suffix", () => {
    const routes = (CRM_NAV.routes ?? []).map((r) => r.route);
    expect(routes).toContain("/crm/customers/create");
    expect(routes).not.toContain("/crm/customers/new");
  });
});
