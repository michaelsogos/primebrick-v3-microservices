/**
 * entities-route — canonical entity CRUD for the service's schema
 * entities, behind the SDK `makeEntityRouter` factory (auth → RBAC →
 * validation → ONE service call → RFC 7807). The BE `/svc/<code>` proxy
 * makes it a pure transport hop.
 *
 *   /api/v1/entities/test_item/meta|list|:uuid
 *
 * The `{entity, translations}` write envelope becomes `{entity}`-only:
 * translation writes are gateway-owned and never accepted by a US route.
 */
import {
  Permission,
  ValidationError,
  type EntityRouteDecl,
  type EntityServiceLike,
} from "@primebrick/sdk";

import { TestItemsService } from "../../modules/test/test-items.service.js";
import { testItemMeta } from "../../modules/test/test-item.meta.js";

const readPerms = [Permission.AUTHENTICATED_USER];
const writePerms = [Permission.AUTHENTICATED_ADMIN];

/**
 * `{entity}` write envelope — strict, no `translations` sibling (piggyback
 * translation writes are gateway-owned; a US entity route must not accept
 * them — same contract as the BE's `entityOnlyWriteBody`).
 */
function entityBody(raw: unknown): { entity: Record<string, unknown> } {
  const body = raw as Record<string, unknown>;
  if (
    body?.translations !== undefined ||
    !body?.entity ||
    typeof body.entity !== "object" ||
    Array.isArray(body.entity)
  ) {
    throw new ValidationError("Request body must be { entity: {...} }");
  }
  return { entity: body.entity as Record<string, unknown> };
}

/** Entity declarations — makeServiceRoutes derives BOTH the CRUD routers
 *  and their OpenAPI path blocks from this single config set. */
export const boilerplateEntityDecls: EntityRouteDecl[] = [
  {
    entityName: "test_item",
    spec: { tag: "test_items", label: "test item" },
    service: new TestItemsService() as unknown as EntityServiceLike,
    meta: testItemMeta,
    schemas: { createBody: entityBody, updateBody: entityBody },
    permissions: {
      meta: readPerms, list: readPerms, get: readPerms,
      create: writePerms, update: writePerms,
      delete: writePerms, restore: writePerms, audit: writePerms,
      bulkDelete: writePerms, bulkRestore: writePerms, bulkUpdate: writePerms,
    },
  },
];
