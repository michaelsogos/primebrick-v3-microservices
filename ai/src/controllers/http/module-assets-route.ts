/**
 * module-assets-route — serves the module's precompiled FE assets (remote
 * page chunks) at `GET /api/v1/module-assets/*`.
 *
 * Transport-only controller (controller-boundary): maps a URL path to a
 * file under `fe/dist`, streams bytes with the right content-type and cache
 * policy. No domain logic.
 *
 *   /svc/ai/api/v1/module-assets/ai-sheets.js   → fe/dist/ai-sheets.js
 *   /svc/ai/api/v1/module-assets/ai-sheets.css  → fe/dist/ai-sheets.css
 *
 * Cache policy: vite content-hashed assets (`-[hash8].<ext>`) are immutable;
 * the predictable entry names (ai-sheets.js/.css) are `no-cache` so a new
 * service version always revalidates.
 */

import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { extname, join, normalize, resolve, sep } from "node:path";
import { pipeline } from "node:stream/promises";
import {
  extJsonStringify,
  Permission,
  type RpcRoute,
} from "@primebrick/sdk";

const ASSETS_ROOT = resolve(process.cwd(), "fe", "dist");

const CONTENT_TYPES: Record<string, string> = {
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".map": "application/json; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
};

/** vite embeds an 8+ char base64-ish hash before the extension on split assets. */
const HASHED_NAME = /-[0-9A-Za-z_-]{8,}\.[0-9A-Za-z]+$/;

/**
 * Resolve a request-relative asset path inside the assets root — returns the
 * absolute path, or null when the input escapes the root (traversal) or is
 * empty. Pure for testability.
 */
export function resolveModuleAssetPath(relPath: string): string | null {
  const rel = normalize(relPath);
  if (!rel || rel === "." || rel.startsWith("..")) return null;
  const abs = resolve(ASSETS_ROOT, rel);
  if (!abs.startsWith(ASSETS_ROOT + sep) && abs !== ASSETS_ROOT) return null;
  return abs;
}

/** Content-type for a served asset — octet-stream fallback for unknown ext. */
export function moduleAssetContentType(absPath: string): string {
  return CONTENT_TYPES[extname(absPath).toLowerCase()] ?? "application/octet-stream";
}

/** Sibling manifests always revalidate — a rebuild rewrites them with new content. */
const SIBLING_MANIFEST = /\.(sha256|deps\.json)$/;

/** Immutable for vite-hashed names; `no-cache` for predictable entry names. */
export function moduleAssetCacheControl(relPath: string): string {
  if (SIBLING_MANIFEST.test(relPath)) return "no-cache";
  return HASHED_NAME.test(relPath) ? "public, max-age=31536000, immutable" : "no-cache";
}

function sendNotFound(res: import("node:http").ServerResponse): void {
  res.writeHead(404, { "Content-Type": "application/json" });
  res.end(
    extJsonStringify({
      type: "about:blank",
      title: "Not Found",
      status: 404,
      detail: "module asset not found",
      internal_code: "MODULE_ASSET_NOT_FOUND",
    }),
  );
}

export const moduleAssetsRoutes: RpcRoute[] = [
  {
    method: "GET",
    path: "/api/v1/module-assets/:file*",
    permissions: [Permission.AUTHENTICATED_USER],
    openapi: {
      summary: "Serve a module FE asset (remote page chunk)",
      description:
        "Streams a precompiled frontend asset from the module's fe/dist build output. Used by RemotePageMount to load module-owned pages as ESM chunks.",
      tags: ["module-assets"],
    },
    handler: async (ctx) => {
      const rel = ctx.params.file ?? "";
      const abs = resolveModuleAssetPath(rel);
      if (!abs) {
        sendNotFound(ctx.res);
        return;
      }
      const info = await stat(abs).catch(() => null);
      if (!info || !info.isFile()) {
        sendNotFound(ctx.res);
        return;
      }
      ctx.res.writeHead(200, {
        "Content-Type": moduleAssetContentType(abs),
        "Content-Length": info.size,
        "Cache-Control": moduleAssetCacheControl(rel),
      });
      await pipeline(createReadStream(abs), ctx.res);
    },
  },
];
