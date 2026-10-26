/**
 * config_entry entity routes — declared as RpcRoute[] and served exclusively
 * through makeRpcRouter. Entity-CRUD path pattern per api-path-conventions.md:
 *   GET    /api/v1/entities/config_entry/meta    → entity metadata
 *   GET    /api/v1/entities/config_entry/list    → list all config entries
 *   GET    /api/v1/entities/config_entry/:uuid   → single record by UUID
 *   PUT    /api/v1/entities/config_entry/:uuid   → update record by UUID
 *
 * Used by the FE module config page AND the AI console remote page via the
 * BE proxy:
 *   FE → BE /svc/ai/api/v1/entities/config_entry/list → ai
 *
 * Precedent: emailsender's config-route — same RpcRoute shape. Addition:
 * `type === 'secret'` rows mask `value` to null on reads (BE
 * ConfigEntriesService semantics — ai.config_entries can hold secrets like
 * `llm_api_key`).
 */

import type { ServerResponse } from "http";
import { field, Filter, Project } from "@primebrick/dal-pg";
import { getDal } from "../../db/dal.js";
import {
  Permission,
  extJsonStringify,
  assertWritableConfigKey,
  type RpcRoute,
} from "@primebrick/sdk";
import { ConfigEntryEntity } from "../../domain/entities/config_entry_entity.js";

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
  module: "ai",
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

const configProjection = [
  Project.field(field(ConfigEntryEntity, "uuid")),
  Project.field(field(ConfigEntryEntity, "key")),
  Project.field(field(ConfigEntryEntity, "value")),
  Project.field(field(ConfigEntryEntity, "type")),
  Project.field(field(ConfigEntryEntity, "type_config")),
  Project.field(field(ConfigEntryEntity, "label_key")),
  Project.field(field(ConfigEntryEntity, "description_key")),
  Project.field(field(ConfigEntryEntity, "group_key")),
  Project.field(field(ConfigEntryEntity, "reserved")),
  // `version` is required on write (optimistic concurrency) — the FE must
  // receive it to send it back.
  Project.field(field(ConfigEntryEntity, "version")),
];

/** Secret masking — `type === 'secret'` never serializes a value (BE
 *  ConfigEntriesService.maskSecretValue semantics). */
function maskRow(row: ConfigEntryEntity): ConfigEntryEntity {
  return row.type === "secret" ? { ...row, value: null } : row;
}

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
      config_entries: ((await getDal().findAll(ConfigEntryEntity, configProjection)) as ConfigEntryEntity[]).map(maskRow),
    }),
  },
  {
    method: "GET",
    path: "/api/v1/entities/config_entry/:uuid",
    auth: "user",
    permissions: [Permission.MODULES_CONFIG_READ_SINGLE],
    openapi: { summary: "Get a config entry by UUID", tags: ["config_entries"] },
    handler: async ({ params, res }) => {
      const row = await getDal().find(ConfigEntryEntity, configProjection, {
        filters: [Filter.fieldValue(field(ConfigEntryEntity, "uuid"), "=", params.uuid)],
      }) as ConfigEntryEntity | null;
      if (!row) {
        sendError(res, 404, "Config entry not found", "config-entry-not-found");
        return;
      }
      return maskRow(row);
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
      // `translations` is rejected — the ai schema owns its own table.
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
      const dal = getDal();
      const b = body as Record<string, unknown>;
      // Static-identity keys (service_code, service_base_url) are part of
      // the deployed artifact — never runtime-editable (B3). Reject before
      // the write; resolves the row to learn its key.
      const target = await dal.find(ConfigEntryEntity, [
        Project.field(field(ConfigEntryEntity, "key")),
        Project.field(field(ConfigEntryEntity, "type")),
      ], {
        filters: [Filter.fieldValue(field(ConfigEntryEntity, "uuid"), "=", params.uuid)],
        throwIfNotFound: false,
      }) as { key?: string; type?: string } | null;
      if (!target?.key) {
        sendError(res, 404, "Config entry not found", "config-entry-not-found");
        return;
      }
      assertWritableConfigKey(target.key);
      // `type === 'secret'` + empty value = "leave unchanged" (FE sends the
      // masked null back when the user didn't type a new secret).
      if (!(target.type === "secret" && (b.value === null || b.value === ""))) {
        await dal.update(
          ConfigEntryEntity,
          { uuid: params.uuid, value: b.value as string, version: Number(b.version) },
          { actor: user!.id },
        );
      }
      // Re-read with the projection
      const result = await dal.find(ConfigEntryEntity, configProjection, {
        filters: [Filter.fieldValue(field(ConfigEntryEntity, "uuid"), "=", params.uuid)],
      });
      return { config_entries: result ? maskRow(result as ConfigEntryEntity) : result };
    },
  },
];
