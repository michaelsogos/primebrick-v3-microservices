/**
 * The emailsender module's nav self-declaration — persisted verbatim into
 * service_registry.endpoints.nav at registration.
 *
 * Route paths are DERIVED via `entityPaths`, never literals: that helper is
 * the single constructor of the `/{list}` / `/{list}/create` /
 * `/{list}/[param]` shape, and the shared `validateNavDeclaration` (enforced
 * at enrollment AND by src/__tests__/nav-declaration.test.ts) rejects
 * hand-written divergence — singular list leaves, `/new` creates, nav links
 * resolving to no declared route.
 *
 * `part_of === 'system'` ⇒ access namespace `access.system.emailsender` —
 * `accessNamespace(code, partOf)` derives it and the enrollment validator
 * requires the declaration to carry it. Every leaf's access key is
 * DERIVED from its route (`/system/emailsender/providers` ⇒
 * `access.system.emailsender.providers`) — item `access` is not
 * declarable. The module is visible iff at least one leaf key is
 * covered by the user's grants (exact or `*` wildcard); `default: true`
 * flags the leaf GOTO(module) lands on.
 *
 * The providers list is the standard host-rendered `EntityTablePage`
 * archetype (`kind:"list"` — no `component_url`); create/edit are the
 * module-owned remote forms mounted from `emailsender-pages.js`, which
 * dispatches on `ctx.nav.route` and reads the record uuid from
 * `ctx.components.params` (injected by the host `[uuid]` shim).
 */
import { entityPaths, type ModuleNavDeclaration } from "@primebrick/sdk";

const providersPaths = entityPaths("/system/emailsender", "providers");

export const EMAILSENDER_NAV: ModuleNavDeclaration = {
  route_prefixes: ["/system/emailsender"],
  access: "access.system.emailsender",
  nav: [
    { id: "providers", label_key: "emailsender.nav.providers", href: providersPaths.list, icon: "mail", default: true },
  ],
  routes: [
    // Host-rendered EntityTablePage list — the standard archetype,
    // delivered statically by the FE; the service declares ownership.
    { route: providersPaths.list, kind: "list", entity: "provider", label_key: "emailsender.nav.providers" },
    // The custom surfaces: provider create/edit forms ride the
    // esm-mount chunk, dispatched on ctx.nav.route (create) and hydrated
    // from ctx.components.params.uuid (detail).
    {
      route: providersPaths.create,
      kind: "create",
      entity: "provider",
      label_key: "emailsender.providers.createProvider",
      icon: "plus",
      component_url: "/ws/emailsender/api/v1/module-assets/emailsender-pages.js",
      component_format: "esm-mount",
    },
    {
      route: providersPaths.detail,
      kind: "detail",
      entity: "provider",
      label_key: "emailsender.providers.editProvider",
      component_url: "/ws/emailsender/api/v1/module-assets/emailsender-pages.js",
      component_format: "esm-mount",
    },
  ],
};
