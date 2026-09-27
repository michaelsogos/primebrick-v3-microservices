/**
 * CRUD route handler for /api/v1/entities/provider — email provider configuration.
 *
 * Uses the standardized entity CRUD path pattern (per api-path-conventions.md):
 *   GET    /api/v1/entities/provider/meta    → entity metadata
 *   GET    /api/v1/entities/provider/list    → paginated list
 *   GET    /api/v1/entities/provider/:uuid   → single record by UUID
 *   POST   /api/v1/entities/provider         → create new record
 *   PUT    /api/v1/entities/provider/:uuid   → update record by UUID
 *   DELETE /api/v1/entities/provider/:uuid   → soft-delete record by UUID
 *
 * Uses SDK auth (GATEWAY-RESOLVED mode) + RBAC enforcement.
 * All responses use snake_case field names (matching DB columns).
 */

import type { IncomingMessage, ServerResponse } from "http";
import { field, Filter, Project, NotFoundError } from "@primebrick/dal-pg";
import { getDal } from "../../db/dal.js";
import {
  verifyHttpRequest,
  enforceHttpRbac,
  Permission,
  type AuthConfig,
  type AuthUser,
  type ApiKeyPort,
  AuthError,
  RbacDeniedError,
  mapDalError,
} from "@primebrick/sdk";
import { ProviderEntity } from "../../domain/entities/provider_entity.js";

let authConfig: AuthConfig | null = null;
let apiKeyPort: ApiKeyPort | null = null;

export function setAuthDependencies(config: AuthConfig, apiKey: ApiKeyPort): void {
  authConfig = config;
  apiKeyPort = apiKey;
}

function sendJson(res: ServerResponse, status: number, body: unknown): void {
  const json = JSON.stringify(body);
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(json);
}

function sendError(
  res: ServerResponse,
  status: number,
  message: string,
  internalCode?: string,
  options?: { instance?: string; severity?: string },
): void {
  sendJson(res, status, {
    type: `https://primebrick.io/errors/${internalCode || "error"}`,
    title: message,
    status,
    detail: message,
    instance: options?.instance,
    internal_code: internalCode,
    severity: options?.severity ?? (status >= 500 ? "HIGH" : "MEDIUM"),
  });
}

/**
 * `{entity, translations?}` write-payload standard (same envelope as the BE).
 * Extracts `body.entity`; returns null when the envelope is invalid or when
 * `translations` is present — the emailsender schema has no translations
 * table, so the sibling is always rejected.
 */
function unwrapEntityBody(
  body: Record<string, unknown>,
): Record<string, unknown> | null {
  if (body.translations !== undefined) return null;
  const entity = body.entity;
  if (entity && typeof entity === "object" && !Array.isArray(entity)) {
    return entity as Record<string, unknown>;
  }
  return null;
}

async function readBody(req: IncomingMessage): Promise<Record<string, unknown>> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(chunk as Buffer);
  }
  const text = Buffer.concat(chunks).toString();
  if (!text) return {};
  return JSON.parse(text);
}

async function authenticate(req: IncomingMessage): Promise<AuthUser> {
  if (!authConfig) throw new Error("Auth config not initialized");
  return verifyHttpRequest(req, authConfig);
}

/** Entity metadata for the provider entity (consumed by MCP get_entity_meta tool). */
const PROVIDERS_META = {
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

/**
 * Providers entity CRUD route handler for the SDK's createHttpServer routeHandler.
 * Handles the standardized /api/v1/entities/provider/... paths.
 * Returns true if the request was handled, false otherwise.
 */
export async function providersRouteHandler(
  req: IncomingMessage,
  res: ServerResponse,
  url: URL,
): Promise<boolean> {
  const path = url.pathname;

  // Match /api/v1/entities/provider and sub-paths
  if (!path.startsWith("/api/v1/entities/provider")) return false;

  try {
    // Authenticate (GATEWAY-RESOLVED mode — no ports needed)
    const user = await authenticate(req);

    const dal = getDal();

    // GET /api/v1/entities/provider/meta — entity metadata
    if (req.method === "GET" && path === "/api/v1/entities/provider/meta") {
      enforceHttpRbac(user, [Permission.EMAILSENDER_PROVIDER_READ_ALL]);
      sendJson(res, 200, PROVIDERS_META);
      return true;
    }

    // GET /api/v1/entities/provider/list — list all (non-deleted)
    if (req.method === "GET" && path === "/api/v1/entities/provider/list") {
      enforceHttpRbac(user, [Permission.EMAILSENDER_PROVIDER_READ_ALL]);
      const rows = await dal.findAll(ProviderEntity, providersProjection);
      sendJson(res, 200, { providers: rows });
      return true;
    }

    // GET /api/v1/entities/provider/:uuid — get single
    const uuidMatch = path.match(/^\/api\/v1\/entities\/providers\/([^/]+)$/);
    if (req.method === "GET" && uuidMatch) {
      enforceHttpRbac(user, [Permission.EMAILSENDER_PROVIDER_READ_SINGLE, Permission.EMAILSENDER_PROVIDER_READ_ALL]);
      let row: ProviderEntity | null = null;
      try {
        row = await dal.find(ProviderEntity, providersDetailProjection, {
          filters: [Filter.fieldValue(field(ProviderEntity, "uuid"), "=", uuidMatch[1])],
        }) as ProviderEntity;
      } catch (err) {
        if (err instanceof NotFoundError) {
          sendError(res, 404, "Provider not found", "provider-not-found");
          return true;
        }
        throw err;
      }
      sendJson(res, 200, row);
      return true;
    }

    // POST /api/v1/entities/provider — create
    if (req.method === "POST" && path === "/api/v1/entities/provider") {
      enforceHttpRbac(user, [Permission.EMAILSENDER_PROVIDER_CREATE_SINGLE]);
      const body = unwrapEntityBody(await readBody(req));
      if (!body) {
        sendError(res, 400, "Request body must be { entity: {...} }", "VALIDATION_ERROR", { instance: path });
        return true;
      }
      const created = await dal.add(ProviderEntity, {
        provider: body.provider,
        api_key: body.api_key,
        api_endpoint: body.api_endpoint || null,
        from_email: body.from_email || null,
        from_name: body.from_name || null,
        reply_to: body.reply_to || null,
      }, { actor: user.id });
      sendJson(res, 201, created);
      return true;
    }

    // PUT /api/v1/entities/provider/:uuid — update
    if (req.method === "PUT" && uuidMatch) {
      enforceHttpRbac(user, [Permission.EMAILSENDER_PROVIDER_UPDATE_SINGLE]);
      const body = unwrapEntityBody(await readBody(req));
      if (!body) {
        sendError(res, 400, "Request body must be { entity: {...} }", "VALIDATION_ERROR", { instance: path });
        return true;
      }
      if (body.version === undefined || body.version === null) {
        sendError(res, 400, "Missing 'version' in entity (optimistic concurrency)", "VALIDATION_ERROR", { instance: path });
        return true;
      }
      const updated = await dal.update(
        ProviderEntity,
        {
          uuid: uuidMatch[1],
          provider: body.provider,
          api_key: body.api_key,
          api_endpoint: body.api_endpoint || null,
          from_email: body.from_email || null,
          from_name: body.from_name || null,
          reply_to: body.reply_to || null,
          version: Number(body.version),
        },
        { actor: user.id },
      );
      sendJson(res, 200, updated);
      return true;
    }

    // DELETE /api/v1/entities/provider/:uuid — soft-delete
    if (req.method === "DELETE" && uuidMatch) {
      enforceHttpRbac(user, [Permission.EMAILSENDER_PROVIDER_DELETE_SINGLE]);
      const existing = await dal.find<ProviderEntity, { version: number }>(ProviderEntity, [Project.field(field(ProviderEntity, "version"))], {
        filters: [Filter.fieldValue(field(ProviderEntity, "uuid"), "=", uuidMatch[1])],
      });
      if (!existing) {
        sendError(res, 404, "Provider not found", "NOT_FOUND", { instance: path });
        return true;
      }
      await dal.delete(
        ProviderEntity,
        { uuid: uuidMatch[1], version: existing.version },
        { actor: user.id },
      );
      sendJson(res, 204, {});
      return true;
    }

    // Method not allowed for this path
    sendError(res, 405, "Method not allowed", "method-not-allowed");
    return true;
  } catch (err) {
    if (err instanceof AuthError) {
      sendError(res, 401, err.message, err.internal_code, { instance: path });
      return true;
    }
    if (err instanceof RbacDeniedError) {
      sendError(res, 403, "Insufficient permissions", "RBAC_PERMISSION_DENIED", { instance: path });
      return true;
    }
    if (err instanceof NotFoundError) {
      sendError(res, 404, "Provider not found", "provider-not-found", { instance: path, severity: "LOW" });
      return true;
    }
    // Shared DAL error mapping (ERR01–ERR07, 57014, generic codes) — same
    // contract as the BE error-handler; bulk details surface as extra.issues.
    const mapped = mapDalError(err, path);
    if (mapped) {
      sendJson(res, mapped.status, mapped.body);
      return true;
    }
    console.error("[emailsender] Providers route error:", {
      message: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : undefined,
      name: err instanceof Error ? err.name : undefined,
      path,
      method: req.method,
    });
    sendError(res, 500, "Internal server error", "internal-error", { instance: path });
    return true;
  }
}
