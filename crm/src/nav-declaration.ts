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
 */
import { entityPaths, type ModuleNavDeclaration } from "@primebrick/sdk";

const customersPaths = entityPaths("/crm", "customers");

export const CRM_NAV: ModuleNavDeclaration = {
  route_prefixes: ["/crm", "/system/crm"],
  nav: [
    { id: "customers", label_key: "crm.customers.nav", href: customersPaths.list, icon: "users" },
    { id: "pipeline", label_key: "crm.pipeline.nav", href: "/system/crm/pipeline", icon: "git-branch" },
  ],
  routes: [
    { route: customersPaths.list, kind: "list", entity: "customer", label_key: "crm.customers.nav" },
    { route: customersPaths.create, kind: "create", entity: "customer", label_key: "app.common.new", icon: "plus" },
    { route: "/system/crm/pipeline", kind: "page" },
  ],
};
