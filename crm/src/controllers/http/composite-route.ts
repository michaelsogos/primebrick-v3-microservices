/**
 * CRM service route surface — `makeServiceRoutes` derives BOTH the
 * request routers and `/api/v1/openapi.json` from ONE declaration:
 * entity CRUD comes from `entities:` (makeEntityRouter), non-entity
 * surfaces are `rpc:` tables; all carry `openapi` metadata so a route
 * that exists but isn't documented (or vice versa) is impossible.
 */

import { makeServiceRoutes, detectPackageIdentity } from "@primebrick/sdk";
import { crmEntityDecls } from "./entities-route.js";
import { moduleAssetsRoutes } from "./module-assets-route.js";

export const compositeRouteHandler = makeServiceRoutes({
  info: {
    title: "CRM",
    version: detectPackageIdentity().version ?? "0.0.0",
    description: "CRM module — customer domain entity owned by the crm service",
  },
  serverUrl: "http://localhost:3007",
  tags: [
    { name: "customers", description: "Customer domain entity" },
    { name: "module-assets", description: "Module-owned remote FE assets" },
  ],
  entities: crmEntityDecls,
  rpc: [moduleAssetsRoutes],
});
