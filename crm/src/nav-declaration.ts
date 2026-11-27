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

/**
 * Entity nav is DERIVED, never hand-written — `deriveEntityNav` (sdk,
 * wired inside `createMicroservice`) reads the SAME entity declarations
 * that serve the routes and emits: `dict` leaves under the settings
 * sibling for `@Dict` vocabularies, list+create leaves at this root for
 * standard entities (create only when the permission exists), nothing
 * for `@Relation` bridges. This file declares only the surfaces the
 * derivation can never guess: customers (custom icon + module default +
 * remote create page) and the pipeline remote page. Authoring a route
 * for an entity here suppresses its derivation — the author owns it.
 */
export const CRM_NAV: ModuleNavDeclaration = {
  route_prefixes: ["/crm"],
  access: "access.crm",
  nav: [
    { id: "customers", label_key: "crm.customers.nav", href: customersPaths.list, icon: "users-round", default: true, order: 1 },
  ],
  routes: [
    // Host-rendered EntityTablePage list — the standard archetype,
    // delivered statically by the FE; the service declares ownership.
    { route: customersPaths.list, kind: "list", entity: "customer", label_key: "crm.customers.nav" },
    // Module-owned remote surface on the crm-pages chunk — the create
    // page is a stub pending the form archetype. It dispatches on
    // ctx.nav.route inside the chunk.
    {
      route: customersPaths.create,
      kind: "create",
      entity: "customer",
      label_key: "crm.customers.nav.create",
      component_url: "/svc/crm/api/v1/module-assets/crm-pages.js",
      component_format: "esm-mount",
    },
  ],
};
