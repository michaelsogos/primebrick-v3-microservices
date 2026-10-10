/**
 * OpenAPI route handler — serves the microservice OpenAPI spec at GET /api/v1/openapi.json.
 * The spec is GENERATED at module load from the canonical entity-CRUD
 * metadata (`entityCrudSpec`) — it always reflects the declared operation
 * set instead of drifting from a hand-maintained object.
 *
 * The route itself is factory-produced via `makeOpenApiHandler` so it
 * passes createMicroservice's route-handler enforcement.
 */

import { buildOpenApiSpec, entityCrudSpec, makeOpenApiHandler } from "@primebrick/sdk";

export const OPENAPI_SPEC = buildOpenApiSpec({
  info: {
    title: "EmailSender Catalog",
    version: "1.0.0",
    description: "Email provider configuration and email sending microservice",
  },
  serverUrl: "http://localhost:3003",
  tags: [
    { name: "providers", description: "Email provider configuration entities" },
    { name: "config_entries", description: "Module configuration key-value entries" },
  ],
  paths: {
    ...entityCrudSpec("provider", {
      ops: ["meta", "list", "get", "create", "update", "delete"],
      tag: "providers",
      label: "email provider",
      listResponse: {
        type: "object",
        properties: {
          providers: {
            type: "array",
            items: {
              type: "object",
              properties: {
                uuid: { type: "string", format: "uuid" },
                provider: { type: "string", example: "brevo" },
                api_endpoint: { type: "string", nullable: true },
                from_email: { type: "string", nullable: true },
                from_name: { type: "string", nullable: true },
                reply_to: { type: "string", nullable: true },
                version: { type: "integer" },
              },
            },
          },
        },
      },
    }),
    ...entityCrudSpec("config_entry", {
      ops: ["meta", "list", "get", "update"],
      tag: "config_entries",
      label: "config entry",
      listResponse: {
        type: "object",
        properties: {
          config_entries: {
            type: "array",
            items: {
              type: "object",
              properties: {
                uuid: { type: "string", format: "uuid" },
                key: { type: "string" },
                value: { type: "string" },
                label_key: { type: "string", nullable: true },
                description_key: { type: "string", nullable: true },
              },
            },
          },
        },
      },
    }),
  },
});

/** OpenAPI handler — factory-produced, mounted by composite-route. */
export const openapiRouteHandler = makeOpenApiHandler(OPENAPI_SPEC);
