/**
 * The job module's nav self-declaration — persisted verbatim into
 * service_registry.endpoints.nav at registration.
 *
 * Route paths are DERIVED via `entityPaths`, never literals: that helper is
 * the single constructor of the `/{list}` / `/{list}/create` /
 * `/{list}/[param]` shape, and the shared `validateNavDeclaration` (enforced
 * at enrollment AND by src/__tests__/nav-declaration.test.ts) rejects
 * hand-written divergence — singular list leaves, `/new` creates, nav links
 * resolving to no declared route.
 *
 * `part_of === 'system'` ⇒ access namespace `access.system.job` —
 * `accessNamespace(code, partOf)` derives it and the enrollment validator
 * requires the declaration to carry it. Every leaf's access key is
 * DERIVED from its route (`/system/job/rules` ⇒ `access.system.job.rules`;
 * sheets `job.<name>` ⇒ `access.system.job.<name>`) — item `access` is
 * not declarable. The module is visible iff at least one leaf key is
 * covered by the user's grants (exact or `*` wildcard); `default: true`
 * flags the leaf GOTO(module) lands on.
 */
import { entityPaths, type ModuleNavDeclaration } from "@primebrick/sdk";

const schedulesPaths = entityPaths("/system/job", "job-schedules");
const rulesPaths = entityPaths("/system/job", "rules");
const runsPaths = entityPaths("/system/job", "runs");

export const JOB_NAV: ModuleNavDeclaration = {
  route_prefixes: ["/system/job"],
  access: "access.system.job",
  nav: [
    { id: "schedules", label_key: "job.jobs.nav", href: schedulesPaths.list, icon: "list-clock", default: true },
    { id: "runs", label_key: "job.jobs.nav_runs", href: runsPaths.list, icon: "play" },
    { id: "rules", label_key: "job.jobs.nav_rules", href: rulesPaths.list, icon: "list-checks" },
  ],
  routes: [
    // Host-rendered EntityTablePage lists — the standard archetype,
    // delivered statically by the FE; the service declares ownership.
    { route: schedulesPaths.list, kind: "list", entity: "job_schedule", label_key: "job.jobs.nav" },
    { route: runsPaths.list, kind: "list", entity: "job_run", label_key: "job.jobs.nav_runs" },
    { route: rulesPaths.list, kind: "list", entity: "job_rule", label_key: "job.jobs.nav_rules" },
    // The custom surfaces: manual schedule creation (its form composes
    // schedule_subject/target — not a plain entity form) and rule
    // creation (event subject → filter → schedule workflow). Both ride
    // the same esm-mount chunk, which dispatches on ctx.nav.route.
    {
      route: schedulesPaths.create,
      kind: "create",
      entity: "job_schedule",
      label_key: "job.jobs.scheduleNew",
      icon: "calendar-plus",
      component_url: "/svc/job/api/v1/module-assets/jobs-page.js",
      component_format: "esm-mount",
    },
    {
      route: rulesPaths.create,
      kind: "create",
      entity: "job_rule",
      label_key: "job.jobs.ruleForm.title",
      component_url: "/svc/job/api/v1/module-assets/jobs-page.js",
      component_format: "esm-mount",
    },
  ],
  // Remote sheet panels — engine is host-side, the mountSheet export of
  // jobs-page.js owns the content. Keyspace `<module>.<name>` — validated
  // at enrollment so services can never collide on an open-sheet address.
  sheets: [
    {
      key: "job.runDetail",
      component_url: "/svc/job/api/v1/module-assets/jobs-page.js",
      component_format: "esm-mount",
    },
  ],
};
