/**
 * The ai module's nav self-declaration — persisted verbatim into
 * service_registry.endpoints.nav at registration.
 *
 * `part_of === 'system'` ⇒ primary prefix `/system/ai`, access namespace
 * `access.system.ai` — `accessNamespace(code, partOf)` derives it and
 * the enrollment validator requires the declaration to carry it. Every
 * leaf's access key is DERIVED from its route (`/system/ai/console` ⇒
 * `access.system.ai.console`; sheets `ai.<name>` ⇒
 * `access.system.ai.<name>`). The bare prefix `/system/ai` is the
 * namespace root — never a page (R4-rejected); GOTO(module) resolves the
 * `default` leaf — the console.
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
  access: "access.system.ai",
  nav: [
    { id: "console", label_key: "ai.nav", href: "/system/ai/console", icon: "brain-circuit", default: true },
    { id: "docs-index", label_key: "ai.nav.docs_index", href: "/system/ai/docs-index", icon: "book-search" },
  ],
  routes: [
    // Remote module-owned pages — the FE shells resolve these decls from
    // the routes census and mount the chunk via RemotePageMount; the chunk
    // dispatches on ctx.nav.route (job-handler precedent).
    {
      route: "/system/ai/console",
      kind: "page",
      label_key: "ai.console.title",
      component_url: "/svc/ai/api/v1/module-assets/ai-pages.js",
      component_format: "esm-mount",
    },
    {
      route: "/system/ai/docs-index",
      kind: "page",
      label_key: "ai.docs.title",
      component_url: "/svc/ai/api/v1/module-assets/ai-pages.js",
      component_format: "esm-mount",
    },
  ],
  // Remote sheet panels — declared by the owning service, resolved globally
  // by key, mounted at runtime by the host's sheet engine. The host owns
  // the chrome; the content is ai-domain.
  sheets: [
    {
      key: "ai.modelTestReport",
      component_url: "/svc/ai/api/v1/module-assets/ai-sheets.js",
      component_format: "esm-mount",
    },
    {
      key: "ai.modelCache",
      component_url: "/svc/ai/api/v1/module-assets/ai-sheets.js",
      component_format: "esm-mount",
    },
    {
      key: "ai.cerebellum",
      component_url: "/svc/ai/api/v1/module-assets/ai-sheets.js",
      component_format: "esm-mount",
    },
    {
      key: "ai.modelImport",
      component_url: "/svc/ai/api/v1/module-assets/ai-sheets.js",
      component_format: "esm-mount",
    },
  ],
};
