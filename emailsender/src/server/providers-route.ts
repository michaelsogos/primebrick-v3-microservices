/**
 * CRUD route handler for /api/v1/entities/providers — email provider configuration.
 *
 * Uses the standardized entity CRUD path pattern (per api-path-conventions.md):
 *   GET    /api/v1/entities/providers/meta    → entity metadata
 *   GET    /api/v1/entities/providers/list    → paginated list
 *   GET    /api/v1/entities/providers/:uuid   → single record by UUID
 *   POST   /api/v1/entities/providers         → create new record
 *   PUT    /api/v1/entities/providers/:uuid   → update record by UUID
 *   DELETE /api/v1/entities/providers/:uuid   → soft-delete record by UUID
 *
 * Uses SDK auth (GATEWAY-RESOLVED mode) + RBAC enforcement.
 * All responses use snake_case field names (matching DB columns).
 */

import type { IncomingMessage, ServerResponse } from "http";
import { field, Filter, Project, NotFoundError } from "@primebrick/dal-pg";
import { getDal } from "../db/dal.js";
import {
  verifyHttpRequest,
  enforceHttpRbac,
  Permission,
  type AuthConfig,
  type AuthUser,
  type ApiKeyPort,
  AuthError,
  RbacDeniedError,
} from "@primebrick/sdk";
import { ProviderEntity } from "../domain/entities/provider_entity.js";

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

/** Entity metadata for the providers entity (consumed by MCP get_entity_meta tool). */
const PROVIDERS_META = {
  entity: "providers",
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
  supported_operations: ["list", "get", "create", "update", "delete"],
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
 * Handles the standardized /api/v1/entities/providers/... paths.
 * Returns true if the request was handled, false otherwise.
 */
export async function providersRouteHandler(
  req: IncomingMessage,
  res: ServerResponse,
  url: URL,
): Promise<boolean> {
  const path = url.pathname;

  // Match /api/v1/entities/providers and sub-paths
  if (!path.startsWith("/api/v1/entities/providers")) return false;

  try {
    // Authenticate (GATEWAY-RESOLVED mode — no ports needed)
    const user = await authenticate(req);

    const dal = getDal();

    // GET /api/v1/entities/providers/meta — entity metadata
    if (req.method === "GET" && path === "/api/v1/entities/providers/meta") {
      enforceHttpRbac(user, [Permission.EMAILSENDER_PROVIDERS_READ_ALL]);
      sendJson(res, 200, PROVIDERS_META);
      return true;
    }

    // GET /api/v1/entities/providers/list — list all (non-deleted)
    if (req.method === "GET" && path === "/api/v1/entities/providers/list") {
      enforceHttpRbac(user, [Permission.EMAILSENDER_PROVIDERS_READ_ALL]);
      const rows = await dal.findAll(ProviderEntity, providersProjection);
      sendJson(res, 200, { providers: rows });
      return true;
    }

    // GET /api/v1/entities/providers/:uuid — get single
    const uuidMatch = path.match(/^\/api\/v1\/entities\/providers\/([^/]+)$/);
    if (req.method === "GET" && uuidMatch) {
      enforceHttpRbac(user, [Permission.EMAILSENDER_PROVIDERS_READ_SINGLE, Permission.EMAILSENDER_PROVIDERS_READ_ALL]);
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

    // POST /api/v1/entities/providers — create
    if (req.method === "POST" && path === "/api/v1/entities/providers") {
      enforceHttpRbac(user, [Permission.EMAILSENDER_PROVIDERS_CREATE]);
      const body = await readBody(req);
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

    // PUT /api/v1/entities/providers/:uuid — update
    if (req.method === "PUT" && uuidMatch) {
      enforceHttpRbac(user, [Permission.EMAILSENDER_PROVIDERS_UPDATE]);
      const body = await readBody(req);
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
        },
        { actor: user.id, matchBy: "uuid" },
      );
      sendJson(res, 200, updated);
      return true;
    }

    // DELETE /api/v1/entities/providers/:uuid — soft-delete
    if (req.method === "DELETE" && uuidMatch) {
      enforceHttpRbac(user, [Permission.EMAILSENDER_PROVIDERS_DELETE]);
      await dal.delete(
        ProviderEntity,
        { uuid: uuidMatch[1] },
        { actor: user.id, matchBy: "uuid" },
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
