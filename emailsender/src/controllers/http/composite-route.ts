/**
 * Emailsender service route surface — `makeServiceRoutes` derives BOTH
 * the request routers and `/api/v1/openapi.json` from ONE declaration:
 * the RpcRoute tables carry their `openapi` metadata, so a route that
 * exists but isn't documented (or vice versa) is impossible.
 */

import { makeServiceRoutes, detectPackageIdentity } from "@primebrick/sdk";
import { providerRoutes } from "./providers-route.js";
import { configEntryRoutes } from "./config-route.js";

export const compositeRouteHandler = makeServiceRoutes({
  info: {
    title: "EmailSender Catalog",
    version: detectPackageIdentity().version ?? "0.0.0",
    description: "Email provider configuration and email sending microservice",
  },
  serverUrl: "http://localhost:3003",
  tags: [
    { name: "providers", description: "Email provider configuration entities" },
    { name: "config_entries", description: "Module configuration key-value entries" },
  ],
  rpc: [providerRoutes, configEntryRoutes],
});
