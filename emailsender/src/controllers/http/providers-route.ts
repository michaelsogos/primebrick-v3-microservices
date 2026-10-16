/**
 * provider entity routes — declared as RpcRoute[] and served exclusively
 * through makeRpcRouter (auth → RBAC → validation → handler → RFC 7807
 * baked in). Entity-CRUD path pattern per api-path-conventions.md:
 *   GET    /api/v1/entities/provider/meta    → entity metadata
 *   GET    /api/v1/entities/provider/list    → list
 *   GET    /api/v1/entities/provider/:uuid   → single record by UUID
 *   POST   /api/v1/entities/provider         → create new record
 *   PUT    /api/v1/entities/provider/:uuid   → update record by UUID
 *   DELETE /api/v1/entities/provider/:uuid   → soft-delete record by UUID
 *
 * All responses use snake_case field names (matching DB columns).
 */

import type { ServerResponse } from "http";
import { field, Filter, Project } from "@primebrick/dal-pg";
import { getDal } from "../../db/dal.js";
import { Permission, extJsonStringify, type RpcRoute } from "@primebrick/sdk";
import { ProviderEntity } from "../../domain/entities/provider_entity.js";

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

/**
 * `{entity, translations?}` write-payload standard (same envelope as the BE).
 * `translations` is rejected — no translations table in this schema.
 */
function unwrapEntityBody(raw: unknown): Record<string, unknown> {
  const body = raw as Record<string, unknown>;
  if (body?.translations !== undefined || !body?.entity || typeof body.entity !== "object" || Array.isArray(body.entity)) {
    throw new Error("Request body must be { entity: {...} }");
  }
  return body.entity as Record<string, unknown>;
}

/** Entity metadata for the provider entity (consumed by MCP get_entity_meta tool). */
export const PROVIDERS_META = {
  entity: "provider",
  module: "emailsender",
  fields: [
    { name: "uuid", type: "uuid", nullable: false, primary_key: true },
    { name: "provider", type: "string", nullable: false, description: "Provider name (e.g. brevo, sendgrid)" },
    { name: "api_key", type: "string", nullable: false, description: "API key for the email provider" },
    { name: "api_endpoint", type: "string", nullable: true, description: "Custom API endpoint URL" },
    { name: "from_email", type: "string", nullable: true, description: "Default sender email address" },
    { name: "from_name", type: "string", nullable: true, description: "Default sender display name" },
    { name: "reply_to", type: "string", nullable: true, description: "Default reply-to email address" },
    { name: "version", type: "integer", nullable: false, description: "Optimistic lock version" },
    { name: "created_at", type: "timestamp", nullable: false, description: "Record creation timestamp" },
    { name: "updated_at", type: "timestamp", nullable: true, description: "Last update timestamp" },
    { name: "deleted_at", type: "timestamp", nullable: true, description: "Soft-delete timestamp" },
  ],
  actions: [
    { op: "list", permissions: ["emailsender.provider.read.all"], enabled: true },
    { op: "get", permissions: ["emailsender.provider.read.single", "emailsender.provider.read.all"], enabled: true },
    { op: "create.single", permissions: ["emailsender.provider.create.single"], enabled: true },
    { op: "update.single", permissions: ["emailsender.provider.update.single"], enabled: true },
    { op: "delete.single", permissions: ["emailsender.provider.delete.single"], enabled: true },
  ],
};

const providersProjection = [
  Project.field(field(ProviderEntity, "uuid")),
  Project.field(field(ProviderEntity, "provider")),
  Project.field(field(ProviderEntity, "api_endpoint")),
  Project.field(field(ProviderEntity, "from_email")),
  Project.field(field(ProviderEntity, "from_name")),
  Project.field(field(ProviderEntity, "reply_to")),
  Project.field(field(ProviderEntity, "version")),
];

const providersDetailProjection = [
  Project.field(field(ProviderEntity, "uuid")),
  Project.field(field(ProviderEntity, "provider")),
  Project.field(field(ProviderEntity, "api_key")),
  Project.field(field(ProviderEntity, "api_endpoint")),
  Project.field(field(ProviderEntity, "from_email")),
  Project.field(field(ProviderEntity, "from_name")),
  Project.field(field(ProviderEntity, "reply_to")),
  Project.field(field(ProviderEntity, "version")),
];

export const providerRoutes: RpcRoute[] = [
  {
    method: "GET",
    path: "/api/v1/entities/provider/meta",
    auth: "user",
    permissions: [Permission.EMAILSENDER_PROVIDER_READ_ALL],
    handler: async () => PROVIDERS_META,
  },
  {
    method: "GET",
    path: "/api/v1/entities/provider/list",
    auth: "user",
    permissions: [Permission.EMAILSENDER_PROVIDER_READ_ALL],
    handler: async () => ({ providers: await getDal().findAll(ProviderEntity, providersProjection) }),
  },
  {
    method: "GET",
    path: "/api/v1/entities/provider/:uuid",
    auth: "user",
    permissions: [Permission.EMAILSENDER_PROVIDER_READ_SINGLE, Permission.EMAILSENDER_PROVIDER_READ_ALL],
    handler: async ({ params, res }) => {
      const row = await getDal().find(ProviderEntity, providersDetailProjection, {
        filters: [Filter.fieldValue(field(ProviderEntity, "uuid"), "=", params.uuid)],
      }) as ProviderEntity | null;
      if (!row) {
        sendError(res, 404, "Provider not found", "provider-not-found");
        return;
      }
      return row;
    },
  },
  {
    method: "POST",
    path: "/api/v1/entities/provider",
    auth: "user",
    permissions: [Permission.EMAILSENDER_PROVIDER_CREATE_SINGLE],
    body: unwrapEntityBody,
    handler: async ({ body, user, res }) => {
      const b = body as Record<string, unknown>;
      const created = await getDal().add(ProviderEntity, {
        provider: b.provider,
        api_key: b.api_key,
        api_endpoint: b.api_endpoint || null,
        from_email: b.from_email || null,
        from_name: b.from_name || null,
        reply_to: b.reply_to || null,
      }, { actor: user!.id });
      res.writeHead(201, { "Content-Type": "application/json" });
      res.end(extJsonStringify(created));
    },
  },
  {
    method: "PUT",
    path: "/api/v1/entities/provider/:uuid",
    auth: "user",
    permissions: [Permission.EMAILSENDER_PROVIDER_UPDATE_SINGLE],
    body: (raw) => {
      const entity = unwrapEntityBody(raw);
      if (entity.version === undefined || entity.version === null) {
        throw new Error("Missing 'version' in entity (optimistic concurrency)");
      }
      return entity;
    },
    handler: async ({ params, body, user }) => {
      const b = body as Record<string, unknown>;
      return getDal().update(
        ProviderEntity,
        {
          uuid: params.uuid,
          provider: b.provider,
          api_key: b.api_key,
          api_endpoint: b.api_endpoint || null,
          from_email: b.from_email || null,
          from_name: b.from_name || null,
          reply_to: b.reply_to || null,
          version: Number(b.version),
        },
        { actor: user!.id },
      );
    },
  },
  {
    method: "DELETE",
    path: "/api/v1/entities/provider/:uuid",
    auth: "user",
    permissions: [Permission.EMAILSENDER_PROVIDER_DELETE_SINGLE],
    handler: async ({ params, user, res }) => {
      const dal = getDal();
      const existing = await dal.find<ProviderEntity, { version: number }>(ProviderEntity, [Project.field(field(ProviderEntity, "version"))], {
        filters: [Filter.fieldValue(field(ProviderEntity, "uuid"), "=", params.uuid)],
      });
      if (!existing) {
        sendError(res, 404, "Provider not found", "NOT_FOUND");
        return;
      }
      await dal.delete(
        ProviderEntity,
        { uuid: params.uuid, version: existing.version },
        { actor: user!.id },
      );
      res.writeHead(204);
      res.end();
    },
  },
];
