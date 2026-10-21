/**
 * docs-search-route — documentation KB vector search, AI-owned.
 *
 *   POST /api/v1/system/docs/search    → { results: DocsSearchResult[] }
 *   POST /api/v1/system/docs/document  → { document } | 404
 *   POST /api/v1/system/docs/index     → { repos: DocsIndexRepo[] }
 *
 * Paths identical to the former BE routes so the BE→US `/ws/ai` proxy is a
 * pure transport hop. The FE calls `/ws/ai/api/v1/system/docs/*`; the MCP
 * `search_docs`/`docs_fetch` tools reach the same endpoints through the
 * gateway's OpenAPI dispatch.
 */
import { z } from "zod";
import { extJsonStringify, makeRpcRouter, Permission, type RpcRoute } from "@primebrick/sdk";

import { DocsSearchService } from "../../services/docs-search-service.js";
import { zBoundedInt, zBoundedNumber } from "../../modules/shared/validation.js";

const DocsSearchBodySchema = z.object({
  query: z.string().min(1).max(2000).optional(),
  embedding: z.array(zBoundedNumber(-10, 10)).min(1).optional(),
  keywords: z.array(z.string()).optional(),
  limit: zBoundedInt(1, 20).optional(),
  repo: z.string().optional(),
  path_prefix: z.string().max(200).optional(),
  min_similarity: zBoundedNumber(0, 1).optional(),
  keyword_boost: zBoundedNumber(0, 1).optional(),
  lexical_boost: zBoundedNumber(0, 1).optional(),
  lex_match_min: zBoundedNumber(0, 1).optional(),
  oversample: zBoundedInt(1, 10).optional(),
  graph_max_paths: zBoundedInt(0, 20).optional(),
});

const DocsDocumentBodySchema = z.object({
  path: z.string().min(1).max(500),
  repo: z.string().optional(),
});

const service = new DocsSearchService();

const routes: RpcRoute[] = [
  {
    method: "POST",
    path: "/api/v1/system/docs/search",
    permissions: [Permission.AUTHENTICATED_USER],
    body: (raw) => DocsSearchBodySchema.parse(raw),
    handler: async (ctx) => ({
      results: await service.search(
        ctx.body as z.infer<typeof DocsSearchBodySchema>,
      ),
    }),
  },
  {
    method: "POST",
    path: "/api/v1/system/docs/document",
    permissions: [Permission.AUTHENTICATED_USER],
    body: (raw) => DocsDocumentBodySchema.parse(raw),
    handler: async (ctx) => {
      const document = await service.getDocument(
        ctx.body as z.infer<typeof DocsDocumentBodySchema>,
      );
      if (!document) {
        ctx.res.writeHead(404, { "Content-Type": "application/json" });
        ctx.res.end(extJsonStringify({ detail: "document not found" }));
        return;
      }
      return { document };
    },
  },
  {
    method: "POST",
    path: "/api/v1/system/docs/index",
    permissions: [Permission.AUTHENTICATED_USER],
    body: (raw) => z.object({}).passthrough().parse(raw),
    handler: async () => ({ repos: await service.getIndex() }),
  },
];

export const DOCS_SEARCH_ROUTES = routes;

export const docsSearchRouteHandler = makeRpcRouter(routes);
