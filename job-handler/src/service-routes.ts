/**
 * Job-handler service route surface — `makeServiceRoutes` derives BOTH
 * the request routers and `/api/v1/openapi.json` from ONE declaration:
 *
 *   - entities → makeEntityRouter + entityCrudSpec (ops derived from the
 *     declared `permissions`/`meta`/`duplicate` — never restated)
 *   - rpc      → makeRpcRouter + rpcSpec (route `openapi` metadata)
 *
 * `jobServiceRouteHandler.spec` carries the built spec for docs-pack
 * builds. Importing this module is side-effect free (services are lazy).
 */

import {
  makeServiceRoutes,
  detectPackageIdentity,
} from "@primebrick/sdk";
import { jobEntityDecls } from "./controllers/http/entities-route.js";
import { jobActionsRoutes } from "./controllers/http/actions-route.js";
import { configEntryRoutes } from "./controllers/http/config-route.js";
import { moduleAssetsRoutes } from "./controllers/http/module-assets-route.js";

export const jobServiceRouteHandler = makeServiceRoutes({
  info: {
    title: "Job Handler",
    version: detectPackageIdentity().version ?? "0.0.0",
    description:
      "Scheduled/manual job engine — job_rule, job_schedule, job_run entity catalog plus schedule-arm and run-stats actions and module FE assets",
  },
  serverUrl: "http://localhost:3006",
  tags: [
    { name: "job_rules", description: "Job rule definitions" },
    { name: "job_schedules", description: "Armed schedules" },
    { name: "job_runs", description: "Execution history" },
    { name: "jobs", description: "Job actions" },
    { name: "config_entries", description: "Module config entries" },
    { name: "module-assets", description: "Module-owned frontend assets" },
  ],
  entities: jobEntityDecls,
  rpc: [jobActionsRoutes, configEntryRoutes, moduleAssetsRoutes],
});
