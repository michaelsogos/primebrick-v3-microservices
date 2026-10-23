/**
 * AI service route surface — `makeServiceRoutes` derives BOTH the request
 * routers and `/api/v1/openapi.json` from ONE declaration:
 *
 *   - entities → makeEntityRouter + entityCrudSpec (ops derived from the
 *     declared `permissions`/`meta`/`duplicate` — never restated)
 *   - rpc      → makeRpcRouter + rpcSpec (route `openapi` metadata)
 *
 * A route that exists but isn't documented (or vice versa) is impossible.
 */

import {
  makeServiceRoutes,
  detectPackageIdentity,
} from "@primebrick/sdk";
import { AI_ROUTES } from "./controllers/http/composite-route.js";
import { DOCS_SEARCH_ROUTES } from "./controllers/http/docs-search-route.js";
import { aiEntityDecls } from "./controllers/http/entities-route.js";
import { moduleAssetsRoutes } from "./controllers/http/module-assets-route.js";
import { configEntryRoutes } from "./controllers/http/config-route.js";

export const aiRouteHandler = makeServiceRoutes({
  info: {
    title: "AI Catalog",
    version: detectPackageIdentity().version ?? "0.0.0",
    description:
      "AI chat, conversation, feedback, telemetry, embedding, ai_model/ai_cerebellum entity catalog and docs knowledge-base search microservice",
  },
  serverUrl: "http://localhost:3004",
  tags: [
    { name: "ai", description: "AI assistant endpoints" },
    { name: "conversations", description: "Conversation lifecycle" },
    { name: "feedback", description: "Message feedback" },
    { name: "telemetry", description: "Usage telemetry (admin)" },
    { name: "embeddings", description: "Docs knowledge-base embeddings" },
    { name: "ai_models", description: "AI model catalog entity" },
    { name: "ai_cerebellum", description: "Per-assistant tuning presets" },
    { name: "docs", description: "Docs knowledge-base search" },
    { name: "config_entries", description: "AI-owned config entries" },
  ],
  entities: aiEntityDecls,
  rpc: [AI_ROUTES, DOCS_SEARCH_ROUTES, moduleAssetsRoutes, configEntryRoutes],
});
