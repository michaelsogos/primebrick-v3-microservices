/**
 * Config route handler for /api/v1/config — module-specific configuration.
 *
 * Exposes the emailsender config table (key-value dictionary) via HTTP.
 * Used by the FE module config page (Tab 2) via the BE proxy:
 *   FE → BE /ws/:serviceCode/api/v1/config → emailsender /api/v1/config
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
): void {
  sendJson(res, status, {
    type: `https://primebrick.io/errors/${internalCode || "error"}`,
    title: message,
    status,
    detail: message,
    internal_code: internalCode,
    severity: status >= 500 ? "HIGH" : "MEDIUM",
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

const configProjection = [
  Project.field(field(ConfigEntryEntity, "uuid")),
  Project.field(field(ConfigEntryEntity, "key")),
  Project.field(field(ConfigEntryEntity, "value")),
  Project.field(field(ConfigEntryEntity, "label_key")),
  Project.field(field(ConfigEntryEntity, "description_key")),
];

/**
 * Config route handler for the SDK's createHttpServer routeHandler.
 * Handles GET /api/v1/config and PUT /api/v1/config/:key.
 * Returns true if the request was handled, false otherwise.
 */
export async function configRouteHandler(
  req: IncomingMessage,
  res: ServerResponse,
  url: URL,
): Promise<boolean> {
  const path = url.pathname;

  if (!path.startsWith("/api/v1/config")) return false;

  try {
    const user = await authenticate(req);
    const dal = getDal();

    // GET /api/v1/config — list all config entries (non-deleted)
    if (req.method === "GET" && path === "/api/v1/config") {
      enforceHttpRbac(user, [Permission.MODULES_CONFIG_READ]);
      const rows = await dal.findAll(ConfigEntryEntity, configProjection);
      sendJson(res, 200, { config: rows });
      return true;
    }

    // PUT /api/v1/config/:key — update single config value
    const keyMatch = path.match(/^\/api\/v1\/config\/([^/]+)$/);
    if (req.method === "PUT" && keyMatch) {
      enforceHttpRbac(user, [Permission.MODULES_CONFIG_UPDATE]);
      const body = await readBody(req);
      const newValue = body.value as string | undefined;
      if (newValue === undefined) {
        sendError(res, 400, "Missing 'value' in request body", "config-missing-value");
        return true;
      }

      // Find existing entry by key
      let existing: ConfigEntryEntity | null = null;
      try {
        existing = await dal.find(ConfigEntryEntity, configProjection, {
          filters: [Filter.fieldValue(field(ConfigEntryEntity, "key"), "=", keyMatch[1])],
        }) as ConfigEntryEntity;
      } catch (err) {
        if (err instanceof NotFoundError) {
          sendError(res, 404, `Config key '${keyMatch[1]}' not found`, "config-key-not-found");
          return true;
        }
        throw err;
      }

      // Update the value
      await dal.update(
        ConfigEntryEntity,
        { uuid: existing.uuid, value: newValue },
        { actor: user.id, matchBy: "uuid" },
      );

      // Re-read the updated entry
      const updated = await dal.find(ConfigEntryEntity, configProjection, {
        filters: [Filter.fieldValue(field(ConfigEntryEntity, "uuid"), "=", existing.uuid)],
      });
      sendJson(res, 200, { config: updated });
      return true;
    }

    return false;
  } catch (err: any) {
    if (err?.name === "RbacDeniedError" || err?.constructor?.name === "RbacDeniedError") {
      sendError(res, 403, "Permission denied", "rbac-denied");
      return true;
    }
    if (err?.name === "AuthError" || err?.constructor?.name === "AuthError") {
      sendError(res, 401, "Authentication required", "auth-required");
      return true;
    }
    console.error("[config-route] Error:", err);
    sendError(res, 500, "Internal server error", "config-internal-error");
    return true;
  }
}
