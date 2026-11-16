/**
 * config_entry entity routes — declared as RpcRoute[] and served exclusively
 * through makeRpcRouter. Entity-CRUD path pattern per api-path-conventions.md:
 *   GET    /api/v1/entities/config_entry/meta    → entity metadata
 *   GET    /api/v1/entities/config_entry/list    → list all config entries
 *   GET    /api/v1/entities/config_entry/:uuid   → single record by UUID
 *   PUT    /api/v1/entities/config_entry/:uuid   → update record by UUID
 *
 * Used by the FE module config page via the BE proxy:
 *   FE → BE /svc/<code>/api/v1/entities/config_entry/list → this service
 */

import type { ServerResponse } from "http";
import { Permission, extJsonStringify, type RpcRoute } from "@primebrick/sdk";
import { ConfigEntriesService } from "../../modules/config-entries/config-entries.service.js";

function sendError(
  res: ServerResponse,
  status: number,
  message: string,
  internalCode?: string,
): void {
  res.writeHead(status, { "Content-Type": "application/json" });
  // extJsonStringify: byte-identical to JSON.stringify on plain types and
  // bigint-safe (emits a bare JSON number instead of throwing).
  res.end(extJsonStringify({
    type: `https://primebrick.io/errors/${internalCode || "error"}`,
    title: message,
    status,
    detail: message,
    internal_code: internalCode,
    severity: status >= 500 ? "HIGH" : "MEDIUM",
  }));
}

/** Entity metadata for the config_entry entity (consumed by MCP get_entity_meta tool). */
export const CONFIG_ENTRIES_META = {
  entity: "config_entry",
  module: "boilerplate",
  fields: [
    { name: "uuid", type: "uuid", nullable: false, primary_key: true },
    { name: "key", type: "string", nullable: false, description: "Configuration key name" },
    { name: "value", type: "string", nullable: false, description: "Configuration value" },
    { name: "label_key", type: "string", nullable: true, description: "i18n key for display label" },
    { name: "description_key", type: "string", nullable: true, description: "i18n key for description" },
    { name: "version", type: "integer", nullable: false, description: "Optimistic lock version" },
    { name: "created_at", type: "timestamp", nullable: false, description: "Record creation timestamp" },
    { name: "updated_at", type: "timestamp", nullable: true, description: "Last update timestamp" },
  ],
  actions: [
    { op: "list", permissions: ["modules.config.read.single"], enabled: true },
    { op: "get", permissions: ["modules.config.read.single"], enabled: true },
    { op: "update.single", permissions: ["modules.config.update.single"], enabled: true },
  ],
};

export const configEntryRoutes: RpcRoute[] = [
  {
    method: "GET",
    path: "/api/v1/entities/config_entry/meta",
    auth: "user",
    permissions: [Permission.MODULES_CONFIG_READ_SINGLE],
    openapi: { summary: "Config entry entity metadata", tags: ["config_entries"] },
    handler: async () => CONFIG_ENTRIES_META,
  },
  {
    method: "GET",
    path: "/api/v1/entities/config_entry/list",
    auth: "user",
    permissions: [Permission.MODULES_CONFIG_READ_SINGLE],
    openapi: {
      summary: "List config entries",
      tags: ["config_entries"],
      responseSchema: {
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
                label_key: { type: "string" },
                description_key: { type: "string" },
              },
            },
          },
        },
      },
    },
    handler: async () => ({ config_entries: await new ConfigEntriesService().listEntries() }),
  },
  {
    method: "GET",
    path: "/api/v1/entities/config_entry/:uuid",
    auth: "user",
    permissions: [Permission.MODULES_CONFIG_READ_SINGLE],
    openapi: { summary: "Get a config entry by UUID", tags: ["config_entries"] },
    handler: async ({ params, res }) => {
      const row = await new ConfigEntriesService().getEntry(params.uuid);
      if (!row) {
        sendError(res, 404, "Config entry not found", "config-entry-not-found");
        return;
      }
      return row;
    },
  },
  {
    method: "PUT",
    path: "/api/v1/entities/config_entry/:uuid",
    auth: "user",
    permissions: [Permission.MODULES_CONFIG_UPDATE_SINGLE],
    openapi: {
      summary: "Update a config entry value by UUID",
      tags: ["config_entries"],
      requestSchema: { type: "object", required: ["entity"], properties: { entity: { type: "object" } } },
    },
    body: (raw) => {
      // `{entity}` write-payload standard (same envelope as the BE);
      // `translations` is rejected — translations writes are gateway-owned.
      const body = raw as Record<string, unknown>;
      if (body?.translations !== undefined || !body?.entity || typeof body.entity !== "object" || Array.isArray(body.entity)) {
        throw new Error("Request body must be { entity: {...} }");
      }
      const entity = body.entity as Record<string, unknown>;
      if (entity.value === undefined) {
        throw new Error("Missing 'value' in request body");
      }
      if (entity.version === undefined || entity.version === null) {
        throw new Error("Missing 'version' in entity (optimistic concurrency)");
      }
      return entity;
    },
    handler: async ({ params, body }) => {
      // Static-identity keys (service_code, service_base_url) are part of
      // the deployed artifact — never runtime-editable. The guard lives
      // inside ConfigEntriesService (lookup + assertWritableConfigKey in
      // svc's beforeUpdate hook); svc stamps the actor from the ambient
      // HTTP session — the wire contract is unchanged.
      const result = await new ConfigEntriesService().updateValue(params.uuid, body as { value: unknown; version: number });
      return { config_entries: result };
    },
  },
];
