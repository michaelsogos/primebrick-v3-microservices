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
 * that serve the routes and emits list+create leaves and routes for every
 * standard entity, dict leaves under settings, nothing for bridges.
 * Derivation is TOTAL: authored leaves are COSMETIC override carriers
 * only (icon, default, order) — they merge onto the derived leaf by href
 * and never suppress anything, never change a route or a page kind.
 */
export const CRM_NAV: ModuleNavDeclaration = {
  route_prefixes: ["/crm"],
  access: "access.crm",
  nav: [
    { id: "customers", label_key: "crm.customers.nav", href: customersPaths.list, icon: "users-round", default: true, order: 1 },
    // The create leaf override — cosmetics ONLY (user-ratified 2026-11-27): the
    // derivation owns id/href/sidebar:false; what is authored here is the
    // user-round icon and nothing else. It never suppresses anything.
    { id: "customers-create", label_key: "crm.customers.nav.create", href: customersPaths.create, icon: "user-round" },
  ],
  // NO authored routes — derivation is total (user-ratified 2026-11-27):
  // list + create routes are derived standard surfaces like every other
  // entity. This file carries ONLY the cosmetic leaf overrides the
  // derivation can never guess (icon, module default, pinned order).
};
