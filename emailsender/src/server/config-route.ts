/**
 * CRUD route handler for /api/v1/entities/config_entries — module configuration.
 *
 * Uses the standardized entity CRUD path pattern (per api-path-conventions.md):
 *   GET    /api/v1/entities/config_entries/meta    → entity metadata
 *   GET    /api/v1/entities/config_entries/list    → list all config entries
 *   GET    /api/v1/entities/config_entries/:uuid   → single record by UUID
 *   PUT    /api/v1/entities/config_entries/:uuid   → update record by UUID
 *
 * Exposes the emailsender config table (key-value dictionary) via HTTP.
 * Used by the FE module config page via the BE proxy:
 *   FE → BE /ws/emailsender/api/v1/entities/config_entries/list → emailsender
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
import { ConfigEntryEntity } from "../domain/entities/config_entry_entity.js";

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

/** Entity metadata for the config_entries entity (consumed by MCP get_entity_meta tool). */
const CONFIG_ENTRIES_META = {
  entity: "config_entries",
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
  supported_operations: ["list", "get", "update"],
};

const configProjection = [
  Project.field(field(ConfigEntryEntity, "uuid")),
  Project.field(field(ConfigEntryEntity, "key")),
  Project.field(field(ConfigEntryEntity, "value")),
  Project.field(field(ConfigEntryEntity, "label_key")),
  Project.field(field(ConfigEntryEntity, "description_key")),
];

/**
 * Config entries entity CRUD route handler for the SDK's createHttpServer routeHandler.
 * Handles the standardized /api/v1/entities/config_entries/... paths.
 * Returns true if the request was handled, false otherwise.
 */
export async function configRouteHandler(
  req: IncomingMessage,
  res: ServerResponse,
  url: URL,
): Promise<boolean> {
  const path = url.pathname;

  if (!path.startsWith("/api/v1/entities/config_entries")) return false;

  try {
    const user = await authenticate(req);
    const dal = getDal();

    // GET /api/v1/entities/config_entries/meta — entity metadata
    if (req.method === "GET" && path === "/api/v1/entities/config_entries/meta") {
      enforceHttpRbac(user, [Permission.MODULES_CONFIG_READ]);
      sendJson(res, 200, CONFIG_ENTRIES_META);
      return true;
    }

    // GET /api/v1/entities/config_entries/list — list all config entries (non-deleted)
    if (req.method === "GET" && path === "/api/v1/entities/config_entries/list") {
      enforceHttpRbac(user, [Permission.MODULES_CONFIG_READ]);
      const rows = await dal.findAll(ConfigEntryEntity, configProjection);
      sendJson(res, 200, { config_entries: rows });
      return true;
    }

    // GET /api/v1/entities/config_entries/:uuid — get single config entry by UUID
    const uuidMatch = path.match(/^\/api\/v1\/entities\/config_entries\/([^/]+)$/);
    if (req.method === "GET" && uuidMatch) {
      enforceHttpRbac(user, [Permission.MODULES_CONFIG_READ]);
      let row: ConfigEntryEntity | null = null;
      try {
        row = await dal.find(ConfigEntryEntity, configProjection, {
          filters: [Filter.fieldValue(field(ConfigEntryEntity, "uuid"), "=", uuidMatch[1])],
        }) as ConfigEntryEntity;
      } catch (err) {
        if (err instanceof NotFoundError) {
          sendError(res, 404, "Config entry not found", "config-entry-not-found");
          return true;
        }
        throw err;
      }
      sendJson(res, 200, row);
      return true;
    }

    // PUT /api/v1/entities/config_entries/:uuid — update config value by UUID
    if (req.method === "PUT" && uuidMatch) {
      enforceHttpRbac(user, [Permission.MODULES_CONFIG_UPDATE]);
      const body = await readBody(req);
      const newValue = body.value as string | undefined;
      if (newValue === undefined) {
        sendError(res, 400, "Missing 'value' in request body", "config-missing-value");
        return true;
      }

      // Update the value by UUID
      const updated = await dal.update(
        ConfigEntryEntity,
        { uuid: uuidMatch[1], value: newValue },
        { actor: user.id, matchBy: "uuid" },
      );

      // Re-read with the projection
      const result = await dal.find(ConfigEntryEntity, configProjection, {
        filters: [Filter.fieldValue(field(ConfigEntryEntity, "uuid"), "=", uuidMatch[1])],
      });
      sendJson(res, 200, { config_entries: result });
      return true;
    }

    return false;
  } catch (err) {
    if (err instanceof AuthError) {
      sendError(res, 401, err.message, err.internal_code, { instance: url.pathname });
      return true;
    }
    if (err instanceof RbacDeniedError) {
      sendError(res, 403, "Insufficient permissions", "RBAC_PERMISSION_DENIED", { instance: url.pathname });
      return true;
    }
    if (err instanceof NotFoundError) {
      sendError(res, 404, "Config entry not found", "config-entry-not-found", { instance: url.pathname, severity: "LOW" });
      return true;
    }
    console.error("[emailsender] Config route error:", {
      message: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : undefined,
      name: err instanceof Error ? err.name : undefined,
      path: url.pathname,
      method: req.method,
    });
    sendError(res, 500, "Internal server error", "internal-error", { instance: url.pathname });
    return true;
  }
}
