import { describe, expect, it } from "vitest";
import { validateNavDeclaration, deriveEntityNav } from "@primebrick/sdk";

import { CRM_NAV } from "../nav-declaration.js";
import { crmEntityDecls } from "../controllers/http/entities-route.js";

/** The nav shape the service actually registers — authored leaves plus
 *  everything `deriveEntityNav` emits from the SAME entity declarations
 *  that serve the routes (the wire this test guards). */
const DERIVED = deriveEntityNav(crmEntityDecls, CRM_NAV, { module_code: "crm" })!;

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

  it("the derived nav passes the shared enrollment validator", () => {
    expect(validateNavDeclaration("crm", DERIVED, "crm")).toBeNull();
  });

  it("derivation emits dict leaves under the settings sibling for @Dict vocabularies", () => {
    const sib = DERIVED.siblings?.find((s) => s.id === "settings");
    expect(sib).toBeDefined();
    expect(sib!.route_prefixes).toEqual(["/crm/settings"]);
    const dicts = (sib!.routes ?? []).filter((r) => r.kind === "dict");
    const entities = dicts.map((d) => d.entity);
    expect(entities).toContain("customer_type");
    expect(entities).toContain("customer_link_type");
    const ct = dicts.find((d) => d.entity === "customer_type")!;
    expect(ct.route).toBe("/crm/settings/customer_types");
    expect(sib!.nav.map((l) => l.href)).toContain(ct.route);
  });

  it("derivation emits list+create leaves for standard entities — never for the customer (author-owned)", () => {
    const accounts = (DERIVED.routes ?? []).filter((r) => r.entity === "customer_account");
    expect(accounts.map((r) => r.kind).sort()).toEqual(["create", "list"]);
    expect(accounts.find((r) => r.kind === "list")!.route).toBe("/crm/customer_accounts");
    expect(accounts.find((r) => r.kind === "create")!.route).toBe("/crm/customer_accounts/create");
    // customer is hand-authored (icon + module default + remote create)
    // — the derivation must not double-leaf it.
    const customerRoutes = (DERIVED.routes ?? []).filter((r) => r.entity === "customer");
    expect(customerRoutes.length).toBe(2);
    expect(DERIVED.nav.filter((l) => l.id === "customers").length).toBe(1);
  });

  it("@Relation bridges never leaf — customer_link keeps its API but no surface", () => {
    expect((DERIVED.routes ?? []).some((r) => r.entity === "customer_link")).toBe(false);
    expect(DERIVED.nav.some((l) => l.id === "customer_links")).toBe(false);
    const sib = DERIVED.siblings?.find((s) => s.id === "settings");
    expect((sib?.routes ?? []).some((r) => r.entity === "customer_link")).toBe(false);
  });

  it("read/audit-only entities derive list-only — customer_consent has no create route", () => {
    const consents = (DERIVED.routes ?? []).filter((r) => r.entity === "customer_consent");
    expect(consents.map((r) => r.kind)).toEqual(["list"]);
  });
});
