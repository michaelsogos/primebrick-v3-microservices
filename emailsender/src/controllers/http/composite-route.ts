/**
 * Composite route handler — composes factory-produced handlers only:
 * the OpenAPI handler (makeOpenApiHandler) plus the RPC router
 * (makeRpcRouter) covering every entity route.
 */

import { composeRouteHandlers, makeRpcRouter } from "@primebrick/sdk";
import { openapiRouteHandler } from "./openapi-route.js";
import { providerRoutes } from "./providers-route.js";
import { configEntryRoutes } from "./config-route.js";

export const compositeRouteHandler = composeRouteHandlers(
  // openapi first (public, no auth)
  openapiRouteHandler,
  // then entity routes (auth + RBAC + validation via makeRpcRouter)
  makeRpcRouter([...providerRoutes, ...configEntryRoutes]),
);
