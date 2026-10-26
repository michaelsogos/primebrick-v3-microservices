/**
 * entities-route — canonical entity CRUD for the `emailsender` schema
 * entities, behind the SDK `makeEntityRouter` factory (auth → RBAC →
 * validation → ONE service call → RFC 7807). The BE `/svc/emailsender`
 * proxy makes it a pure transport hop.
 *
 *   /api/v1/entities/provider/meta|list|:uuid
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

import { ProvidersService } from "../../modules/providers/providers.service.js";
import { providerMeta } from "../../modules/providers/provider.meta.js";
import { TemplatesService } from "../../modules/templates/templates.service.js";
import { templateMeta } from "../../modules/templates/template.meta.js";

/** Lazy service proxy — instantiated on first method call (post-initDal). */
function lazy<T extends object>(factory: () => T): T {
  let inst: T | null = null;
  return new Proxy({} as T, {
    get: (_t, k) => ((inst ??= factory()) as Record<string | symbol, unknown>)[k],
  });
}

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
export const emailsenderEntityDecls: EntityRouteDecl[] = [
  {
    entityName: "provider",
    spec: { tag: "providers", label: "email provider" },
    service: lazy(() => new ProvidersService()) as unknown as EntityServiceLike,
    meta: providerMeta,
    // Auditable columns (created_by/updated_at/version) are stamped — the
    // entity intentionally has NO providers_audit trail table, so no
    // audit route/collaboration surface is exposed.
    auditable: false,
    permissions: {
      meta: [Permission.EMAILSENDER_PROVIDER_READ_ALL],
      list: [Permission.EMAILSENDER_PROVIDER_READ_ALL],
      get: [Permission.EMAILSENDER_PROVIDER_READ_SINGLE, Permission.EMAILSENDER_PROVIDER_READ_ALL],
      create: [Permission.EMAILSENDER_PROVIDER_CREATE_SINGLE],
      update: [Permission.EMAILSENDER_PROVIDER_UPDATE_SINGLE],
      delete: [Permission.EMAILSENDER_PROVIDER_DELETE_SINGLE],
    },
    duplicate: false,
    schemas: { createBody: entityBody, updateBody: entityBody },
  },
  {
    entityName: "email_template",
    spec: { tag: "templates", label: "email template" },
    service: lazy(() => new TemplatesService()) as unknown as EntityServiceLike,
    meta: templateMeta,
    // Same audit-columns-without-trail contract as provider — no
    // email_templates_audit table exists BY REQUIREMENT.
    auditable: false,
    permissions: {
      meta: [Permission.EMAILSENDER_TEMPLATE_READ_ALL],
      list: [Permission.EMAILSENDER_TEMPLATE_READ_ALL],
      get: [Permission.EMAILSENDER_TEMPLATE_READ_SINGLE, Permission.EMAILSENDER_TEMPLATE_READ_ALL],
      create: [Permission.EMAILSENDER_TEMPLATE_CREATE_SINGLE],
      update: [Permission.EMAILSENDER_TEMPLATE_UPDATE_SINGLE],
      delete: [Permission.EMAILSENDER_TEMPLATE_DELETE_SINGLE],
    },
    duplicate: false,
    schemas: { createBody: entityBody, updateBody: entityBody },
  },
];
