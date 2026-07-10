/**
 * Composite route handler — chains all HTTP route handlers.
 * Tries each handler in order; the first one that returns true handles the request.
 */

import type { IncomingMessage, ServerResponse } from "http";
import { openapiRouteHandler } from "./openapi-route.js";
import { providersRouteHandler } from "./providers-route.js";
import { webhookRouteHandler } from "./webhook-route.js";

export async function compositeRouteHandler(
  req: IncomingMessage,
  res: ServerResponse,
  url: URL,
): Promise<boolean> {
  // Try openapi first (public, no auth)
  if (await openapiRouteHandler(req, res, url)) return true;
  // Then providers (auth + RBAC)
  if (await providersRouteHandler(req, res, url)) return true;
  // Then webhook (API key auth)
  if (await webhookRouteHandler(req, res, url)) return true;
  return false;
}
