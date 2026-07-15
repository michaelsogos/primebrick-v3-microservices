/**
 * OpenAPI route handler — serves the microservice OpenAPI spec at GET /api/v1/openapi.json.
 * Public endpoint (no auth) — the BE OpenAPI merger fetches this.
 *
 * The spec includes operationId (snake_case), tags, summary, and description
 * for every operation — these are used by the MCP Server for tool name
 * generation and LLM-readable descriptions.
 */

import type { IncomingMessage, ServerResponse } from "http";

export const OPENAPI_SPEC = {
  openapi: "3.1.0",
  info: {
    title: "EmailSender Catalog",
    version: "1.0.0",
    description: "Email provider configuration and email sending microservice",
  },
  servers: [
    {
      url: "http://localhost:3002",
      description: "Local development server",
    },
  ],
  security: [{ bearerAuth: [] }, { apiKey: [] }],
  tags: [
    { name: "providers", description: "Email provider configuration entities" },
    { name: "config_entries", description: "Module configuration key-value entries" },
    { name: "webhook", description: "Inbound webhook receivers (API key auth)" },
  ],
  paths: {
    // ─── Providers (entity CRUD) ───────────────────────────────────────────
    "/api/v1/entities/providers/meta": {
      get: {
        operationId: "get_providers_meta",
        tags: ["providers"],
        summary: "Get providers entity metadata",
        description: "Returns the field schema, supported operations, and metadata for the providers entity. Used by MCP get_entity_meta tool and FE dynamic form generation.",
        responses: {
          "200": {
            description: "Entity metadata",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    entity: { type: "string", example: "providers" },
                    module: { type: "string", example: "emailsender" },
                    fields: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          name: { type: "string" },
                          type: { type: "string" },
                          nullable: { type: "boolean" },
                          description: { type: "string" },
                        },
                      },
                    },
                    supported_operations: {
                      type: "array",
                      items: { type: "string" },
                      example: ["list", "get", "create", "update", "delete"],
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/v1/entities/providers/list": {
      get: {
        operationId: "list_providers",
        tags: ["providers"],
        summary: "List all email providers",
        description: "Returns a list of all non-deleted email provider configurations. Each provider includes connection details (API key, endpoint, sender settings).",
        responses: {
          "200": {
            description: "List of providers",
            content: {
              "application/json": {
                schema: {
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
              },
            },
          },
        },
      },
    },
    "/api/v1/entities/providers/{uuid}": {
      get: {
        operationId: "get_provider",
        tags: ["providers"],
        summary: "Get a single email provider by UUID",
        description: "Returns the full details of a single email provider configuration, including the API key.",
        parameters: [
          {
            name: "uuid",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
            description: "Provider UUID",
          },
        ],
        responses: {
          "200": {
            description: "Provider details",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    uuid: { type: "string", format: "uuid" },
                    provider: { type: "string" },
                    api_key: { type: "string" },
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
          "404": { description: "Provider not found" },
        },
      },
      put: {
        operationId: "update_provider",
        tags: ["providers"],
        summary: "Update an email provider by UUID",
        description: "Updates the configuration of an existing email provider. All fields are replaced.",
        parameters: [
          {
            name: "uuid",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
            description: "Provider UUID",
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  provider: { type: "string" },
                  api_key: { type: "string" },
                  api_endpoint: { type: "string", nullable: true },
                  from_email: { type: "string", nullable: true },
                  from_name: { type: "string", nullable: true },
                  reply_to: { type: "string", nullable: true },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Provider updated" },
          "404": { description: "Provider not found" },
        },
      },
      delete: {
        operationId: "delete_provider",
        tags: ["providers"],
        summary: "Delete an email provider (soft-delete)",
        description: "Soft-deletes an email provider configuration. The record is marked as deleted but remains in the database.",
        parameters: [
          {
            name: "uuid",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
            description: "Provider UUID",
          },
        ],
        responses: {
          "204": { description: "Provider deleted" },
          "404": { description: "Provider not found" },
        },
      },
    },
    "/api/v1/entities/providers": {
      post: {
        operationId: "create_provider",
        tags: ["providers"],
        summary: "Create a new email provider",
        description: "Creates a new email provider configuration with API key, endpoint, and sender settings.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  provider: { type: "string", example: "brevo" },
                  api_key: { type: "string" },
                  api_endpoint: { type: "string", nullable: true },
                  from_email: { type: "string", nullable: true },
                  from_name: { type: "string", nullable: true },
                  reply_to: { type: "string", nullable: true },
                },
                required: ["provider", "api_key"],
              },
            },
          },
        },
        responses: {
          "201": { description: "Provider created" },
        },
      },
    },

    // ─── Config entries (entity CRUD) ──────────────────────────────────────
    "/api/v1/entities/config_entries/meta": {
      get: {
        operationId: "get_config_entries_meta",
        tags: ["config_entries"],
        summary: "Get config_entries entity metadata",
        description: "Returns the field schema and supported operations for the config_entries entity.",
        responses: {
          "200": { description: "Entity metadata" },
        },
      },
    },
    "/api/v1/entities/config_entries/list": {
      get: {
        operationId: "list_config_entries",
        tags: ["config_entries"],
        summary: "List all configuration entries",
        description: "Returns all non-deleted configuration key-value entries for the emailsender module.",
        responses: {
          "200": {
            description: "List of config entries",
            content: {
              "application/json": {
                schema: {
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
              },
            },
          },
        },
      },
    },
    "/api/v1/entities/config_entries/{uuid}": {
      get: {
        operationId: "get_config_entry",
        tags: ["config_entries"],
        summary: "Get a single config entry by UUID",
        description: "Returns a single configuration entry by its UUID.",
        parameters: [
          {
            name: "uuid",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
            description: "Config entry UUID",
          },
        ],
        responses: {
          "200": { description: "Config entry details" },
          "404": { description: "Config entry not found" },
        },
      },
      put: {
        operationId: "update_config_entry",
        tags: ["config_entries"],
        summary: "Update a config entry value by UUID",
        description: "Updates the value of a configuration entry. Only the 'value' field is updated.",
        parameters: [
          {
            name: "uuid",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
            description: "Config entry UUID",
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  value: { type: "string" },
                },
                required: ["value"],
              },
            },
          },
        },
        responses: {
          "200": { description: "Config entry updated" },
          "404": { description: "Config entry not found" },
        },
      },
    },

    // ─── Webhook (Category 3 — API key auth) ───────────────────────────────
    "/webhook": {
      post: {
        operationId: "receive_webhook",
        tags: ["webhook"],
        summary: "Receive an inbound webhook from an email provider",
        description: "Receives delivery events (bounces, opens, clicks, etc.) from email providers. Uses API key authentication, not JWT. The provider is specified via the 'provider' query parameter.",
        security: [{ apiKey: [] }],
        parameters: [
          {
            name: "provider",
            in: "query",
            required: false,
            schema: { type: "string", default: "brevo" },
            description: "Email provider name (defaults to 'brevo')",
          },
        ],
        responses: {
          "200": { description: "Webhook processed" },
          "401": { description: "Invalid API key" },
        },
      },
    },
  },
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "OAuth 2.1 Bearer token from the Primebrick backend.",
      },
      apiKey: {
        type: "apiKey",
        in: "header",
        name: "X-API-Key",
        description: "API key for service-to-service authentication.",
      },
    },
  },
};

export async function openapiRouteHandler(
  req: IncomingMessage,
  res: ServerResponse,
  url: URL,
): Promise<boolean> {
  if (url.pathname === "/api/v1/openapi.json" && req.method === "GET") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(OPENAPI_SPEC));
    return true;
  }
  return false;
}
