import { describe, expect, it } from "vitest";
import { validateNavDeclaration } from "@primebrick/sdk";

import { AI_NAV } from "../nav-declaration.js";

/**
 * Write-time gate: the service's own nav declaration must pass the SAME
 * validator the BE applies at enrollment — a violation fails `pnpm test`
 * here long before registration rejects it.
 */
describe("AI_NAV declaration", () => {
  it("passes the shared enrollment validator", () => {
    expect(validateNavDeclaration("ai", AI_NAV, "system")).toBeNull();
  });

  it("declares the four ai-domain remote sheets under the ai.* keyspace", () => {
    const keys = (AI_NAV.sheets ?? []).map((s) => s.key).sort();
    expect(keys).toEqual([
      "ai.cerebellum",
      "ai.modelCache",
      "ai.modelImport",
      "ai.modelTestReport",
    ]);
  });

  it("every sheet points at the ai-sheets esm-mount chunk", () => {
    for (const sheet of AI_NAV.sheets ?? []) {
      expect(sheet.component_url).toBe("/ws/ai/api/v1/module-assets/ai-sheets.js");
      expect(sheet.component_format).toBe("esm-mount");
    }
  });

  it("declares the two remote pages under /system/ai on the ai-pages chunk", () => {
    const routes = (AI_NAV.routes ?? []).map((r) => r.route).sort();
    expect(routes).toEqual(["/system/ai", "/system/ai/docs-index"]);
    for (const route of AI_NAV.routes ?? []) {
      expect(route.kind).toBe("page");
      expect(route.component_url).toBe("/ws/ai/api/v1/module-assets/ai-pages.js");
      expect(route.component_format).toBe("esm-mount");
      expect(route.label_key).toMatch(/^ai\./);
    }
  });

  it("nav links resolve to declared routes and live under ai.* labels", () => {
    const hrefs = (AI_NAV.routes ?? []).map((r) => r.route);
    for (const link of AI_NAV.nav) {
      expect(hrefs).toContain(link.href);
      expect(link.label_key).toMatch(/^ai\./);
    }
  });

  it("module-level access is the derived access.system.ai namespace", () => {
    expect(AI_NAV.access).toBe("access.system.ai");
  });
});
