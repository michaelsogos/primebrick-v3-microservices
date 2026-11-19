/**
 * config_entry entity routes — declared as RpcRoute[] and served exclusively
 * through makeRpcRouter. Entity-CRUD path pattern per api-path-conventions.md:
 *   GET    /api/v1/entities/config_entry/meta    → entity metadata
 *   GET    /api/v1/entities/config_entry/list    → list all config entries
 *   GET    /api/v1/entities/config_entry/:uuid   → single record by UUID
 *   PUT    /api/v1/entities/config_entry/:uuid   → update record by UUID
 *
 * Used by the FE module config page via the BE proxy:
 *   FE → BE /svc/job/api/v1/entities/config_entry/list → job-handler
 *
 * Precedent: ai's config-route — same RpcRoute shape. `type === 'secret'`
 * rows mask `value` to null on reads (BE ConfigEntriesService semantics —
 * job.config_entries can hold secrets).
 */

import type { ServerResponse } from "http";
import {
  Permission,
  extJsonStringify,
  type RpcRoute,
} from "@primebrick/sdk";
import { ConfigEntriesService } from "../../modules/jobs/jobs.service.js";

/** Owning entity surface — module-scope (I/O-free ctor, lazy DAL). */
const configEntries = new ConfigEntriesService();

function sendError(
  res: ServerResponse,
  status: number,
  message: string,
  internalCode?: string,
): void {
  res.writeHead(status, { "Content-Type": "application/json" });
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
  module: "job",
  fields: [
    { name: "uuid", type: "uuid", nullable: false, primary_key: true },
    { name: "key", type: "string", nullable: false, description: "Configuration key name" },
    { name: "value", type: "string", nullable: false, description: "Configuration value" },
    { name: "type", type: "string", nullable: false, description: "Config value type (string, number, secret, …)" },
    { name: "type_config", type: "string", nullable: true, description: "Per-type JSON config (validation, options)" },
    { name: "label_key", type: "string", nullable: true, description: "i18n key for display label" },
    { name: "description_key", type: "string", nullable: true, description: "i18n key for description" },
    { name: "group_key", type: "string", nullable: true, description: "UI grouping key" },
    { name: "reserved", type: "boolean", nullable: false, description: "Reserved row (seed-owned)" },
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

// Column projection + secret masking live in ConfigEntriesService —
// domain shape, not transport shaping (BE maskSecretValue semantics).

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
            items: { type: "object" },
          },
        },
      },
    },
    handler: async () => ({
      config_entries: await configEntries.listEntries(),
    }),
  },
  {
    method: "GET",
    path: "/api/v1/entities/config_entry/:uuid",
    auth: "user",
    permissions: [Permission.MODULES_CONFIG_READ_SINGLE],
    openapi: { summary: "Get a config entry by UUID", tags: ["config_entries"] },
    handler: async ({ params, res }) => {
      const row = await configEntries.getEntry(params.uuid);
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
      // `translations` is rejected — the job schema owns its own table.
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
    handler: async ({ params, body, user, res }) => {
      const b = body as Record<string, unknown>;
      // Domain rules (404, static-key guard, secret-unchanged) live inside
      // the service — the controller maps `null` to the 404 transport.
      const result = await configEntries.updateValue(
        params.uuid,
        { value: b.value, version: Number(b.version) },
      );
      if (!result) {
        sendError(res, 404, "Config entry not found", "config-entry-not-found");
        return;
      }
      return { config_entries: result };
    },
  },
];
