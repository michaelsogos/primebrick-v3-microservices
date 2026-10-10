/**
 * config_entry entity routes — declared as RpcRoute[] and served exclusively
 * through makeRpcRouter. Entity-CRUD path pattern per api-path-conventions.md:
 *   GET    /api/v1/entities/config_entry/meta    → entity metadata
 *   GET    /api/v1/entities/config_entry/list    → list all config entries
 *   GET    /api/v1/entities/config_entry/:uuid   → single record by UUID
 *   PUT    /api/v1/entities/config_entry/:uuid   → update record by UUID
 *
 * Used by the FE module config page via the BE proxy:
 *   FE → BE /ws/emailsender/api/v1/entities/config_entry/list → emailsender
 */

import type { ServerResponse } from "http";
import { field, Filter, Project } from "@primebrick/dal-pg";
import { getDal } from "../../db/dal.js";
import { Permission, type RpcRoute } from "@primebrick/sdk";
import { ConfigEntryEntity } from "../../domain/entities/config_entry_entity.js";

function sendError(
  res: ServerResponse,
  status: number,
  message: string,
  internalCode?: string,
): void {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify({
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
  module: "emailsender",
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

const configProjection = [
  Project.field(field(ConfigEntryEntity, "uuid")),
  Project.field(field(ConfigEntryEntity, "key")),
  Project.field(field(ConfigEntryEntity, "value")),
  Project.field(field(ConfigEntryEntity, "label_key")),
  Project.field(field(ConfigEntryEntity, "description_key")),
  // `version` is required on write (optimistic concurrency) — the FE must
  // receive it to send it back.
  Project.field(field(ConfigEntryEntity, "version")),
];

export const configEntryRoutes: RpcRoute[] = [
  {
    method: "GET",
    path: "/api/v1/entities/config_entry/meta",
    auth: "user",
    permissions: [Permission.MODULES_CONFIG_READ_SINGLE],
    handler: async () => CONFIG_ENTRIES_META,
  },
  {
    method: "GET",
    path: "/api/v1/entities/config_entry/list",
    auth: "user",
    permissions: [Permission.MODULES_CONFIG_READ_SINGLE],
    handler: async () => ({ config_entries: await getDal().findAll(ConfigEntryEntity, configProjection) }),
  },
  {
    method: "GET",
    path: "/api/v1/entities/config_entry/:uuid",
    auth: "user",
    permissions: [Permission.MODULES_CONFIG_READ_SINGLE],
    handler: async ({ params, res }) => {
      const row = await getDal().find(ConfigEntryEntity, configProjection, {
        filters: [Filter.fieldValue(field(ConfigEntryEntity, "uuid"), "=", params.uuid)],
      }) as ConfigEntryEntity | null;
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
    body: (raw) => {
      // `{entity}` write-payload standard (same envelope as the BE);
      // `translations` is rejected — no translations table in this schema.
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
    handler: async ({ params, body, user }) => {
      const dal = getDal();
      const b = body as Record<string, unknown>;
      await dal.update(
        ConfigEntryEntity,
        { uuid: params.uuid, value: b.value as string, version: Number(b.version) },
        { actor: user!.id },
      );
      // Re-read with the projection
      const result = await dal.find(ConfigEntryEntity, configProjection, {
        filters: [Filter.fieldValue(field(ConfigEntryEntity, "uuid"), "=", params.uuid)],
      });
      return { config_entries: result };
    },
  },
];
