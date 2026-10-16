/**
 * entities-route — canonical entity CRUD for the AI-owned entities:
 * `ai_model` and `ai_cerebellum`.
 *
 * Built exclusively through the SDK `makeEntityRouter` factory — the same
 * mandatory chain (auth → RBAC → validation → ONE service call → RFC 7807)
 * the BE's Express router enforced. Paths are identical to the former BE
 * routes so the BE→US `/ws/ai` proxy is a pure transport hop:
 *
 *   /api/v1/entities/ai_model/meta|list|:uuid|restore|audit
 *   /api/v1/entities/ai_cerebellum/meta|list|:uuid|restore|audit
 *
 * Services are constructed lazily on first request — `getDal()` only
 * resolves after `getDal()` ran inside `createMicroservice`, while this
 * handler is composed at module import time.
 *
 * MFA step-up on delete is intentionally NOT wired yet — it requires the
 * governed `auth.mfa.consume` correlation pattern (plan item B9). Delete
 * remains AUTHENTICATED_ADMIN-gated.
 */
import {
  makeEntityRouter,
  composeRouteHandlers,
  Permission,
  type RouteHandler,
  type EntityServiceLike,
} from "@primebrick/sdk";

import { AiModelsService } from "../../modules/ai-models/ai-models.service.js";
import { AiCerebellumService } from "../../modules/ai-cerebellum/ai-cerebellum.service.js";
import { aiModelMeta } from "../../modules/ai-models/ai_models.meta.js";
import { aiCerebellumMeta } from "../../modules/ai-cerebellum/ai_cerebellum.meta.js";
import {
  AiModelListQuerySchema,
  AiModelCreateBodySchema,
  AiModelUpdateBodySchema,
  AiModelAuditQuerySchema,
} from "../../modules/ai-models/dto.js";
import {
  AiCerebellumListQuerySchema,
  AiCerebellumCreateBodySchema,
  AiCerebellumUpdateBodySchema,
  AiCerebellumAuditQuerySchema,
} from "../../modules/ai-cerebellum/dto.js";
import { entityOnlyWriteBody } from "../../modules/shared/validation.js";

const AiModelCreateWrite = entityOnlyWriteBody(AiModelCreateBodySchema);
const AiModelUpdateWrite = entityOnlyWriteBody(AiModelUpdateBodySchema);
const AiCerebellumCreateWrite = entityOnlyWriteBody(AiCerebellumCreateBodySchema);
const AiCerebellumUpdateWrite = entityOnlyWriteBody(AiCerebellumUpdateBodySchema);

/** Lazy service proxy — instantiated on first method call (post-initDal). */
function lazy<T extends object>(factory: () => T): T {
  let inst: T | null = null;
  return new Proxy({} as T, {
    get: (_t, k) => ((inst ??= factory()) as Record<string | symbol, unknown>)[k],
  });
}

const readPerms = [Permission.AUTHENTICATED_USER];
const writePerms = [Permission.AUTHENTICATED_ADMIN];

export const aiEntityRouteHandler: RouteHandler = composeRouteHandlers(
  makeEntityRouter({
    entityName: "ai_model",
    service: lazy(() => new AiModelsService()) as unknown as EntityServiceLike,
    meta: aiModelMeta as unknown as Record<string, unknown>,
    auditable: true,
    permissions: {
      meta: readPerms,
      list: readPerms,
      get: readPerms,
      create: writePerms,
      update: writePerms,
      delete: writePerms,
      restore: writePerms,
      audit: writePerms,
    },
    duplicate: false,
    schemas: {
      listQuery: (q) => AiModelListQuerySchema.parse(q),
      createBody: (b) => AiModelCreateWrite.parse(b) as { entity: Record<string, unknown> },
      updateBody: (b) => AiModelUpdateWrite.parse(b) as { entity: Record<string, unknown> },
      auditQuery: (q) => AiModelAuditQuerySchema.parse(q),
    },
  }),
  makeEntityRouter({
    entityName: "ai_cerebellum",
    service: lazy(() => new AiCerebellumService()) as unknown as EntityServiceLike,
    meta: aiCerebellumMeta as unknown as Record<string, unknown>,
    auditable: true,
    permissions: {
      meta: readPerms,
      list: readPerms,
      get: readPerms,
      create: writePerms,
      update: writePerms,
      delete: writePerms,
      restore: writePerms,
      audit: writePerms,
    },
    duplicate: false,
    schemas: {
      listQuery: (q) => AiCerebellumListQuerySchema.parse(q),
      createBody: (b) => AiCerebellumCreateWrite.parse(b) as { entity: Record<string, unknown> },
      updateBody: (b) => AiCerebellumUpdateWrite.parse(b) as { entity: Record<string, unknown> },
      auditQuery: (q) => AiCerebellumAuditQuerySchema.parse(q),
    },
  }),
);
