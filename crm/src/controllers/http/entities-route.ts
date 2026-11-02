/**
 * entities-route — canonical entity CRUD for the `crm` schema entities,
 * behind the SDK `makeEntityRouter` factory (auth → RBAC → validation →
 * ONE service call → RFC 7807). The BE `/svc/crm` proxy makes it a pure
 * transport hop.
 *
 *   /api/v1/entities/customer/meta|list|export|duplicate|:uuid[/audit|purge|restore]
 *
 * The `{entity, translations}` write envelope becomes `{entity}`-only:
 * translation writes are gateway-owned and never accepted by a US route.
 */
import {
  Filter,
  Project,
  field,
  getDal,
} from "@primebrick/dal-pg";
import {
  Permission,
  type EntityRouteDecl,
  type EntityServiceLike,
} from "@primebrick/sdk";

import { CrmTranslationEntity } from "../../domain/entities/crm_translation_entity.js";
import { CustomersService } from "../../modules/customers/customers.service.js";
import { customerMeta } from "../../modules/customers/customer.meta.js";
import {
  CustomerAuditQuerySchema,
  CustomerDuplicateBodySchema,
  CustomerExportQuerySchema,
  CustomerListQuerySchema,
  CustomerCreateBodySchema,
  CustomerUpdateBodySchema,
} from "../../modules/customers/dto.js";
import { entityOnlyWriteBody } from "../../modules/shared/validation.js";

const CustomerCreateWrite = entityOnlyWriteBody(CustomerCreateBodySchema);
const CustomerUpdateWrite = entityOnlyWriteBody(CustomerUpdateBodySchema);

/**
 * Export `dictResolver` — reads the `crm.entities.*` label dict from
 * `crm.translations` through the DAL Repository (module reads its own
 * schema). `null` on a missing dict lets the export pipeline fall back to
 * humanized keys; a missing TABLE is a provisioning failure and fails loud.
 */
async function crmDict(locale: string): Promise<Record<string, string> | null> {
  const rows = (await getDal().findAll(
    CrmTranslationEntity as never,
    [Project.expr("jsonb_object_agg(key, value)", "dict")],
    {
      filters: [Filter.fieldValue(field(CrmTranslationEntity as never, "language"), "=", locale)],
    },
  )) as { dict: Record<string, string> | null }[];
  return rows[0]?.dict ?? null;
}

/** Entity declarations — makeServiceRoutes derives BOTH the CRUD routers
 *  and their OpenAPI path blocks from this single config set. */
export const crmEntityDecls: EntityRouteDecl[] = [
  {
    entityName: "customer",
    spec: { tag: "customers", label: "customer" },
    // DomainService ctor is I/O-free — safe at module load.
    service: new CustomersService() as unknown as EntityServiceLike,
    meta: customerMeta,
    auditable: true,
    permissions: {
      meta: [Permission.CUSTOMER_READ_ALL, Permission.CUSTOMER_READ_SINGLE],
      list: [Permission.CUSTOMER_READ_ALL],
      export: [Permission.CUSTOMER_EXPORT],
      create: [Permission.CUSTOMER_CREATE_SINGLE],
      duplicate: [Permission.CUSTOMER_DUPLICATE_BULK],
      bulkDelete: [Permission.CUSTOMER_DELETE_BULK],
      bulkRestore: [Permission.CUSTOMER_RESTORE_BULK],
      get: [Permission.CUSTOMER_READ_SINGLE],
      update: [Permission.CUSTOMER_UPDATE_SINGLE],
      delete: [Permission.CUSTOMER_DELETE_SINGLE],
      restore: [Permission.CUSTOMER_RESTORE_SINGLE],
      audit: [Permission.CUSTOMER_READ_AUDIT],
    },
    schemas: {
      listQuery: (q) => CustomerListQuerySchema.parse(q),
      exportQuery: (q) => CustomerExportQuerySchema.parse(q),
      createBody: (b) => CustomerCreateWrite.parse(b) as { entity: Record<string, unknown> },
      updateBody: (b) => CustomerUpdateWrite.parse(b) as { entity: Record<string, unknown> },
      duplicateBody: (b) => CustomerDuplicateBodySchema.parse(b),
      auditQuery: (q) => CustomerAuditQuerySchema.parse(q),
    },
    // Meta-driven export pipeline — fieldMapping/labels/field types derive
    // from `customerMeta` + `crm.entities.customer.*` translations; rows
    // stream through `service.stream` (same filter builder as list).
    // Templates resolve by convention: templates/customer_export_template.*.
    export: { dictResolver: crmDict },
  },
];
