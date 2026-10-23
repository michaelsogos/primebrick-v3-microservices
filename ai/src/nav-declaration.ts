/**
 * The ai module's nav self-declaration — persisted verbatim into
 * service_registry.endpoints.nav at registration.
 *
 * Sheet keys are module-namespaced (`ai.<name>`) — `validateNavDeclaration`
 * (enforced at enrollment AND by src/__tests__/nav-declaration.test.ts)
 * rejects keys outside the `ai.*` namespace, so services can never collide
 * on an open-sheet address. The sheet engine is host-side; the mountSheet
 * export of ai-sheets.js owns the content.
 */
import type { ModuleNavDeclaration } from "@primebrick/sdk";

export const AI_NAV: ModuleNavDeclaration = {
  route_prefixes: ["/system/ai"],
  nav: [],
  // Remote sheet panels — declared by the owning service, resolved globally
  // by key, mounted at runtime by the host's sheet engine. The host owns
  // the chrome; the content is ai-domain.
  sheets: [
    {
      key: "ai.modelTestReport",
      component_url: "/ws/ai/api/v1/module-assets/ai-sheets.js",
      component_format: "esm-mount",
    },
    {
      key: "ai.modelCache",
      component_url: "/ws/ai/api/v1/module-assets/ai-sheets.js",
      component_format: "esm-mount",
    },
    {
      key: "ai.cerebellum",
      component_url: "/ws/ai/api/v1/module-assets/ai-sheets.js",
      component_format: "esm-mount",
    },
    {
      key: "ai.modelImport",
      component_url: "/ws/ai/api/v1/module-assets/ai-sheets.js",
      component_format: "esm-mount",
    },
  ],
};
