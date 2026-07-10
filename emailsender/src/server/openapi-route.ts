/**
 * OpenAPI route handler — serves the microservice OpenAPI spec at GET /api/openapi.json.
 * Public endpoint (no auth) — the BE OpenAPI merger fetches this.
 */

import type { IncomingMessage, ServerResponse } from "http";

const OPENAPI_SPEC = {
  openapi: "3.1.0",
  info: {
    title: "EmailSender Microservice API",
    version: "1.0.0",
    description: "Email provider configuration and email sending microservice",
  },
  paths: {
    "/api/v1/providers": {
      get: {
        summary: "List all email providers",
        responses: { "200": { description: "List of providers" } },
      },
      post: {
        summary: "Create a new email provider",
        responses: { "201": { description: "Provider created" } },
      },
    },
    "/api/v1/providers/{uuid}": {
      get: {
        summary: "Get a single email provider",
        responses: { "200": { description: "Provider details" } },
      },
      put: {
        summary: "Update an email provider",
        responses: { "200": { description: "Provider updated" } },
      },
      delete: {
        summary: "Delete an email provider (soft-delete)",
        responses: { "204": { description: "Provider deleted" } },
      },
    },
  },
};

export async function openapiRouteHandler(
  req: IncomingMessage,
  res: ServerResponse,
  url: URL,
): Promise<boolean> {
  if (url.pathname === "/api/openapi.json" && req.method === "GET") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(OPENAPI_SPEC));
    return true;
  }
  return false;
}
