/**
 * Service route surface — `makeServiceRoutes` derives BOTH the request
 * routers and `/api/v1/openapi.json` from ONE declaration:
 *
 *   - entities → makeEntityRouter + entityCrudSpec (ops derived from the
 *     declared `permissions`/`meta`/`schemas` — never restated)
 *   - rpc      → makeRpcRouter + rpcSpec (route `openapi` metadata)
 *
 * `boilerplateRouteHandler.spec` carries the built spec — a route that
 * exists but isn't documented (or vice versa) is impossible by
 * construction. Never hand-compose buildOpenApiSpec/entityCrudSpec/
 * makeOpenApiHandler separately. Importing this module is side-effect
 * free (services are lazy).
 */

import {
  makeServiceRoutes,
  detectPackageIdentity,
} from "@primebrick/sdk";
import { OWNED_SCHEMAS } from "./db/dal.js";
import { boilerplateEntityDecls } from "./controllers/http/entities-route.js";
import { testActionRoutes } from "./controllers/http/test-actions-route.js";
import { configEntryRoutes } from "./controllers/http/config-route.js";

export const boilerplateRouteHandler = makeServiceRoutes({
  schemas: OWNED_SCHEMAS,
  info: {
    title: "Boilerplate Catalog",
    version: detectPackageIdentity().version ?? "0.0.0",
    description:
      "Microservice boilerplate — test_item entity CRUD, config_entry surface and test action routes (rename on clone)",
  },
  serverUrl: "http://localhost:3008",
  tags: [
    { name: "test_items", description: "Example entity — replace with your domain entities" },
    { name: "test", description: "Example RPC actions — replace with your domain actions" },
    { name: "config_entries", description: "Module configuration key-value entries" },
  ],
  entities: boilerplateEntityDecls,
  rpc: [testActionRoutes, configEntryRoutes],
});
