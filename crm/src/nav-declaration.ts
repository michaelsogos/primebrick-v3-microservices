/**
 * The crm module's nav self-declaration — persisted verbatim into
 * service_registry.endpoints.nav at registration.
 *
 * Route paths are DERIVED via `entityPaths`, never literals: that helper is
 * the single constructor of the `/{list}` / `/{list}/create` /
 * `/{list}/[param]` shape, and the shared `validateNavDeclaration` (enforced
 * at enrollment AND by src/__tests__/nav-declaration.test.ts) rejects
 * hand-written divergence — singular list leaves, `/new` creates, nav links
 * resolving to no declared route.
 *
 * `part_of === code` ⇒ the namespace collapses: access namespace
 * `access.crm` — `accessNamespace(code, partOf)` derives it and the
 * enrollment validator requires the declaration to carry it. Every
 * leaf's access key is DERIVED from its route (`/crm/customers` ⇒
 * `access.crm.customers`); the module is visible iff at least one leaf
 * key is covered by the user's grants — `access.crm.*` for the whole
 * module, an exact leaf key for a single page. No grant is admin-
 * inherited: crm visibility always requires an explicit assignment.
 * `default: true` flags the leaf GOTO(module) lands on.
 */
import { entityPaths, type ModuleNavDeclaration } from "@primebrick/sdk";

const customersPaths = entityPaths("/crm", "customers");

export const CRM_NAV: ModuleNavDeclaration = {
  route_prefixes: ["/crm", "/system/crm"],
  access: "access.crm",
  nav: [
    { id: "customers", label_key: "crm.customers.nav", href: customersPaths.list, icon: "users", default: true },
    { id: "pipeline", label_key: "crm.pipeline.nav", href: "/system/crm/pipeline", icon: "git-branch" },
  ],
  routes: [
    // Host-rendered EntityTablePage list — the standard archetype,
    // delivered statically by the FE; the service declares ownership.
    { route: customersPaths.list, kind: "list", entity: "customer", label_key: "crm.customers.nav" },
    // Module-owned remote surfaces on the crm-pages chunk — the create
    // page is a stub pending the form archetype; pipeline is the static
    // preview. Both dispatch on ctx.nav.route inside the chunk.
    {
      route: customersPaths.create,
      kind: "create",
      entity: "customer",
      label_key: "app.common.new",
      icon: "plus",
      component_url: "/ws/crm/api/v1/module-assets/crm-pages.js",
      component_format: "esm-mount",
    },
    {
      route: "/system/crm/pipeline",
      kind: "page",
      component_url: "/ws/crm/api/v1/module-assets/crm-pages.js",
      component_format: "esm-mount",
    },
  ],
};
