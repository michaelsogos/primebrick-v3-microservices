/**
 * entities-route — canonical entity CRUD for the `crm` schema entities,
 * behind the SDK `makeEntityRouter` factory (auth → RBAC → validation →
 * ONE service call → RFC 7807). The BE `/svc/crm` proxy makes it a pure
 * transport hop.
 *
 *   /api/v1/entities/<entity>/meta|list|export|duplicate|:uuid[/audit|purge|restore]
 *
 * The `{entity, translations}` write envelope becomes `{entity}`-only:
 * translation writes are gateway-owned and never accepted by a US route.
 *
 * Route surface per entity is permission-driven: a permission key present
 * in `permissions` registers the route — `customer_consent` is read/audit
 * only (rows are written by domain flows that compute `seal`).
 */
import {
  Filter,
  Project,
  field,
  getDal,
} from "@primebrick/dal-pg";
import {
  callNats,
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
import { CustomerTypesService } from "../../modules/customer_types/customer_types.service.js";
import { customerTypeMeta } from "../../modules/customer_types/customer_type.meta.js";
import {
  CustomerTypeAuditQuerySchema,
  CustomerTypeCreateBodySchema,
  CustomerTypeListQuerySchema,
  CustomerTypeUpdateBodySchema,
} from "../../modules/customer_types/dto.js";
import { CompanyDimensionsService } from "../../modules/company_dimensions/company_dimensions.service.js";
import { companyDimensionMeta } from "../../modules/company_dimensions/company_dimension.meta.js";
import {
  CompanyDimensionAuditQuerySchema,
  CompanyDimensionCreateBodySchema,
  CompanyDimensionListQuerySchema,
  CompanyDimensionUpdateBodySchema,
} from "../../modules/company_dimensions/dto.js";
import { LegalFormsService } from "../../modules/legal_forms/legal_forms.service.js";
import { legalFormMeta } from "../../modules/legal_forms/legal_form.meta.js";
import {
  LegalFormAuditQuerySchema,
  LegalFormCreateBodySchema,
  LegalFormListQuerySchema,
  LegalFormUpdateBodySchema,
} from "../../modules/legal_forms/dto.js";
import { LocalAddressTypesService } from "../../modules/local_address_types/local_address_types.service.js";
import { localAddressTypeMeta } from "../../modules/local_address_types/local_address_type.meta.js";
import {
  LocalAddressTypeAuditQuerySchema,
  LocalAddressTypeCreateBodySchema,
  LocalAddressTypeListQuerySchema,
  LocalAddressTypeUpdateBodySchema,
} from "../../modules/local_address_types/dto.js";
import { QualificationsService } from "../../modules/qualifications/qualifications.service.js";
import { qualificationMeta } from "../../modules/qualifications/qualification.meta.js";
import {
  QualificationAuditQuerySchema,
  QualificationCreateBodySchema,
  QualificationListQuerySchema,
  QualificationUpdateBodySchema,
} from "../../modules/qualifications/dto.js";
import { MarketingQualificationsService } from "../../modules/marketing_qualifications/marketing_qualifications.service.js";
import { marketingQualificationMeta } from "../../modules/marketing_qualifications/marketing_qualification.meta.js";
import {
  MarketingQualificationAuditQuerySchema,
  MarketingQualificationCreateBodySchema,
  MarketingQualificationListQuerySchema,
  MarketingQualificationUpdateBodySchema,
} from "../../modules/marketing_qualifications/dto.js";
import { ContactTypesService } from "../../modules/contact_types/contact_types.service.js";
import { contactTypeMeta } from "../../modules/contact_types/contact_type.meta.js";
import {
  ContactTypeAuditQuerySchema,
  ContactTypeCreateBodySchema,
  ContactTypeListQuerySchema,
  ContactTypeUpdateBodySchema,
} from "../../modules/contact_types/dto.js";
import { AccountKindsService } from "../../modules/account_kinds/account_kinds.service.js";
import { accountKindMeta } from "../../modules/account_kinds/account_kind.meta.js";
import {
  AccountKindAuditQuerySchema,
  AccountKindCreateBodySchema,
  AccountKindListQuerySchema,
  AccountKindUpdateBodySchema,
} from "../../modules/account_kinds/dto.js";
import { CustomerLinkTypesService } from "../../modules/customer_link_types/customer_link_types.service.js";
import { customerLinkTypeMeta } from "../../modules/customer_link_types/customer_link_type.meta.js";
import {
  CustomerLinkTypeAuditQuerySchema,
  CustomerLinkTypeCreateBodySchema,
  CustomerLinkTypeListQuerySchema,
  CustomerLinkTypeUpdateBodySchema,
} from "../../modules/customer_link_types/dto.js";
import { ConsentTypesService } from "../../modules/consent_types/consent_types.service.js";
import { consentTypeMeta } from "../../modules/consent_types/consent_type.meta.js";
import {
  ConsentTypeAuditQuerySchema,
  ConsentTypeCreateBodySchema,
  ConsentTypeListQuerySchema,
  ConsentTypeUpdateBodySchema,
} from "../../modules/consent_types/dto.js";
import { LocalAddressesService } from "../../modules/local_addresses/local_addresses.service.js";
import { localAddressMeta } from "../../modules/local_addresses/local_address.meta.js";
import {
  LocalAddressAuditQuerySchema,
  LocalAddressCreateBodySchema,
  LocalAddressListQuerySchema,
  LocalAddressUpdateBodySchema,
} from "../../modules/local_addresses/dto.js";
import { CustomerAccountsService } from "../../modules/customer_accounts/customer_accounts.service.js";
import { customerAccountMeta } from "../../modules/customer_accounts/customer_account.meta.js";
import {
  CustomerAccountAuditQuerySchema,
  CustomerAccountCreateBodySchema,
  CustomerAccountListQuerySchema,
  CustomerAccountUpdateBodySchema,
} from "../../modules/customer_accounts/dto.js";
import { CustomerContactsService } from "../../modules/customer_contacts/customer_contacts.service.js";
import { customerContactMeta } from "../../modules/customer_contacts/customer_contact.meta.js";
import {
  CustomerContactAuditQuerySchema,
  CustomerContactCreateBodySchema,
  CustomerContactListQuerySchema,
  CustomerContactUpdateBodySchema,
} from "../../modules/customer_contacts/dto.js";
import { CustomerLinksService } from "../../modules/customer_links/customer_links.service.js";
import { customerLinkMeta } from "../../modules/customer_links/customer_link.meta.js";
import {
  CustomerLinkAuditQuerySchema,
  CustomerLinkCreateBodySchema,
  CustomerLinkListQuerySchema,
  CustomerLinkUpdateBodySchema,
} from "../../modules/customer_links/dto.js";
import { CustomerConsentsService } from "../../modules/customer_consents/customer_consents.service.js";
import { customerConsentMeta } from "../../modules/customer_consents/customer_consent.meta.js";
import {
  CustomerConsentAuditQuerySchema,
  CustomerConsentListQuerySchema,
} from "../../modules/customer_consents/dto.js";
import { entityOnlyWriteBody } from "../../modules/shared/validation.js";

const CustomerCreateWrite = entityOnlyWriteBody(CustomerCreateBodySchema);
const CustomerUpdateWrite = entityOnlyWriteBody(CustomerUpdateBodySchema);
const CustomerTypeCreateWrite = entityOnlyWriteBody(CustomerTypeCreateBodySchema);
const CustomerTypeUpdateWrite = entityOnlyWriteBody(CustomerTypeUpdateBodySchema);
const CompanyDimensionCreateWrite = entityOnlyWriteBody(CompanyDimensionCreateBodySchema);
const CompanyDimensionUpdateWrite = entityOnlyWriteBody(CompanyDimensionUpdateBodySchema);
const LegalFormCreateWrite = entityOnlyWriteBody(LegalFormCreateBodySchema);
const LegalFormUpdateWrite = entityOnlyWriteBody(LegalFormUpdateBodySchema);
const LocalAddressTypeCreateWrite = entityOnlyWriteBody(LocalAddressTypeCreateBodySchema);
const LocalAddressTypeUpdateWrite = entityOnlyWriteBody(LocalAddressTypeUpdateBodySchema);
const QualificationCreateWrite = entityOnlyWriteBody(QualificationCreateBodySchema);
const QualificationUpdateWrite = entityOnlyWriteBody(QualificationUpdateBodySchema);
const MarketingQualificationCreateWrite = entityOnlyWriteBody(MarketingQualificationCreateBodySchema);
const MarketingQualificationUpdateWrite = entityOnlyWriteBody(MarketingQualificationUpdateBodySchema);
const ContactTypeCreateWrite = entityOnlyWriteBody(ContactTypeCreateBodySchema);
const ContactTypeUpdateWrite = entityOnlyWriteBody(ContactTypeUpdateBodySchema);
const AccountKindCreateWrite = entityOnlyWriteBody(AccountKindCreateBodySchema);
const AccountKindUpdateWrite = entityOnlyWriteBody(AccountKindUpdateBodySchema);
const CustomerLinkTypeCreateWrite = entityOnlyWriteBody(CustomerLinkTypeCreateBodySchema);
const CustomerLinkTypeUpdateWrite = entityOnlyWriteBody(CustomerLinkTypeUpdateBodySchema);
const ConsentTypeCreateWrite = entityOnlyWriteBody(ConsentTypeCreateBodySchema);
const ConsentTypeUpdateWrite = entityOnlyWriteBody(ConsentTypeUpdateBodySchema);
const LocalAddressCreateWrite = entityOnlyWriteBody(LocalAddressCreateBodySchema);
const LocalAddressUpdateWrite = entityOnlyWriteBody(LocalAddressUpdateBodySchema);
const CustomerAccountCreateWrite = entityOnlyWriteBody(CustomerAccountCreateBodySchema);
const CustomerAccountUpdateWrite = entityOnlyWriteBody(CustomerAccountUpdateBodySchema);
const CustomerContactCreateWrite = entityOnlyWriteBody(CustomerContactCreateBodySchema);
const CustomerContactUpdateWrite = entityOnlyWriteBody(CustomerContactUpdateBodySchema);
const CustomerLinkCreateWrite = entityOnlyWriteBody(CustomerLinkCreateBodySchema);
const CustomerLinkUpdateWrite = entityOnlyWriteBody(CustomerLinkUpdateBodySchema);

/**
 * Export `dictResolver` — merges two label sources:
 *   - `crm.entities.*` from `crm.translations` via the DAL Repository
 *     (module reads its own schema);
 *   - `system.common.*` from the governed `system.dict.get` NATS route —
 *     `system.translations` is BE-owned and no US may read it under schema
 *     sovereignty. Shared columns (uid/audit/common system fields) cite
 *     `system.common.fields.*` label keys.
 * `null` on a missing module dict lets the export pipeline fall back to
 * humanized keys; a missing TABLE is a provisioning failure and fails loud.
 * A failed system-dict call degrades to the module dict only — system keys
 * humanize, never throw the export away.
 */
const SYSTEM_DICT_GET_SUBJECT = "system.dict.get";

async function crmDict(locale: string): Promise<Record<string, string> | null> {
  const rows = (await getDal().findAll(
    CrmTranslationEntity as never,
    [Project.expr("jsonb_object_agg(key, value)", "dict")],
    {
      filters: [Filter.fieldValue(field(CrmTranslationEntity as never, "language"), "=", locale)],
    },
  )) as { dict: Record<string, string> | null }[];
  const moduleDict = rows[0]?.dict ?? null;
  const systemDict = await callNats<Record<string, string> | null>(
    SYSTEM_DICT_GET_SUBJECT,
    { module: "system", language: locale },
    { timeoutMs: 3000 },
  ).catch(() => null);
  if (moduleDict == null && systemDict == null) return null;
  // Module keys win on collision — namespace rule makes overlap impossible
  // by construction, but own-schema labels take precedence by convention.
  return { ...(systemDict ?? {}), ...(moduleDict ?? {}) };
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
  {
    entityName: "customer_type",
    spec: { tag: "customer_types", label: "customer type" },
    service: new CustomerTypesService() as unknown as EntityServiceLike,
    meta: customerTypeMeta,
    auditable: true,
    permissions: {
      meta: [Permission.CRM_CUSTOMER_TYPE_READ_ALL, Permission.CRM_CUSTOMER_TYPE_READ_SINGLE],
      list: [Permission.CRM_CUSTOMER_TYPE_READ_ALL],
      get: [Permission.CRM_CUSTOMER_TYPE_READ_SINGLE],
      create: [Permission.CRM_CUSTOMER_TYPE_CREATE_SINGLE],
      update: [Permission.CRM_CUSTOMER_TYPE_UPDATE_SINGLE],
      delete: [Permission.CRM_CUSTOMER_TYPE_DELETE_SINGLE],
      restore: [Permission.CRM_CUSTOMER_TYPE_RESTORE_SINGLE],
      bulkDelete: [Permission.CRM_CUSTOMER_TYPE_DELETE_BULK],
      bulkRestore: [Permission.CRM_CUSTOMER_TYPE_RESTORE_BULK],
      audit: [Permission.CRM_CUSTOMER_TYPE_READ_AUDIT],
    },
    schemas: {
      listQuery: (q) => CustomerTypeListQuerySchema.parse(q),
      createBody: (b) => CustomerTypeCreateWrite.parse(b) as { entity: Record<string, unknown> },
      updateBody: (b) => CustomerTypeUpdateWrite.parse(b) as { entity: Record<string, unknown> },
      auditQuery: (q) => CustomerTypeAuditQuerySchema.parse(q),
    },
  },
  {
    entityName: "company_dimension",
    spec: { tag: "company_dimensions", label: "company dimension" },
    service: new CompanyDimensionsService() as unknown as EntityServiceLike,
    meta: companyDimensionMeta,
    auditable: true,
    permissions: {
      meta: [Permission.CRM_COMPANY_DIMENSION_READ_ALL, Permission.CRM_COMPANY_DIMENSION_READ_SINGLE],
      list: [Permission.CRM_COMPANY_DIMENSION_READ_ALL],
      get: [Permission.CRM_COMPANY_DIMENSION_READ_SINGLE],
      create: [Permission.CRM_COMPANY_DIMENSION_CREATE_SINGLE],
      update: [Permission.CRM_COMPANY_DIMENSION_UPDATE_SINGLE],
      delete: [Permission.CRM_COMPANY_DIMENSION_DELETE_SINGLE],
      restore: [Permission.CRM_COMPANY_DIMENSION_RESTORE_SINGLE],
      bulkDelete: [Permission.CRM_COMPANY_DIMENSION_DELETE_BULK],
      bulkRestore: [Permission.CRM_COMPANY_DIMENSION_RESTORE_BULK],
      audit: [Permission.CRM_COMPANY_DIMENSION_READ_AUDIT],
    },
    schemas: {
      listQuery: (q) => CompanyDimensionListQuerySchema.parse(q),
      createBody: (b) => CompanyDimensionCreateWrite.parse(b) as { entity: Record<string, unknown> },
      updateBody: (b) => CompanyDimensionUpdateWrite.parse(b) as { entity: Record<string, unknown> },
      auditQuery: (q) => CompanyDimensionAuditQuerySchema.parse(q),
    },
  },
  {
    entityName: "legal_form",
    spec: { tag: "legal_forms", label: "legal form" },
    service: new LegalFormsService() as unknown as EntityServiceLike,
    meta: legalFormMeta,
    auditable: true,
    permissions: {
      meta: [Permission.CRM_LEGAL_FORM_READ_ALL, Permission.CRM_LEGAL_FORM_READ_SINGLE],
      list: [Permission.CRM_LEGAL_FORM_READ_ALL],
      get: [Permission.CRM_LEGAL_FORM_READ_SINGLE],
      create: [Permission.CRM_LEGAL_FORM_CREATE_SINGLE],
      update: [Permission.CRM_LEGAL_FORM_UPDATE_SINGLE],
      delete: [Permission.CRM_LEGAL_FORM_DELETE_SINGLE],
      restore: [Permission.CRM_LEGAL_FORM_RESTORE_SINGLE],
      bulkDelete: [Permission.CRM_LEGAL_FORM_DELETE_BULK],
      bulkRestore: [Permission.CRM_LEGAL_FORM_RESTORE_BULK],
      audit: [Permission.CRM_LEGAL_FORM_READ_AUDIT],
    },
    schemas: {
      listQuery: (q) => LegalFormListQuerySchema.parse(q),
      createBody: (b) => LegalFormCreateWrite.parse(b) as { entity: Record<string, unknown> },
      updateBody: (b) => LegalFormUpdateWrite.parse(b) as { entity: Record<string, unknown> },
      auditQuery: (q) => LegalFormAuditQuerySchema.parse(q),
    },
  },
  {
    entityName: "local_address_type",
    spec: { tag: "local_address_types", label: "local address type" },
    service: new LocalAddressTypesService() as unknown as EntityServiceLike,
    meta: localAddressTypeMeta,
    auditable: true,
    permissions: {
      meta: [Permission.CRM_LOCAL_ADDRESS_TYPE_READ_ALL, Permission.CRM_LOCAL_ADDRESS_TYPE_READ_SINGLE],
      list: [Permission.CRM_LOCAL_ADDRESS_TYPE_READ_ALL],
      get: [Permission.CRM_LOCAL_ADDRESS_TYPE_READ_SINGLE],
      create: [Permission.CRM_LOCAL_ADDRESS_TYPE_CREATE_SINGLE],
      update: [Permission.CRM_LOCAL_ADDRESS_TYPE_UPDATE_SINGLE],
      delete: [Permission.CRM_LOCAL_ADDRESS_TYPE_DELETE_SINGLE],
      restore: [Permission.CRM_LOCAL_ADDRESS_TYPE_RESTORE_SINGLE],
      bulkDelete: [Permission.CRM_LOCAL_ADDRESS_TYPE_DELETE_BULK],
      bulkRestore: [Permission.CRM_LOCAL_ADDRESS_TYPE_RESTORE_BULK],
      audit: [Permission.CRM_LOCAL_ADDRESS_TYPE_READ_AUDIT],
    },
    schemas: {
      listQuery: (q) => LocalAddressTypeListQuerySchema.parse(q),
      createBody: (b) => LocalAddressTypeCreateWrite.parse(b) as { entity: Record<string, unknown> },
      updateBody: (b) => LocalAddressTypeUpdateWrite.parse(b) as { entity: Record<string, unknown> },
      auditQuery: (q) => LocalAddressTypeAuditQuerySchema.parse(q),
    },
  },
  {
    entityName: "qualification",
    spec: { tag: "qualifications", label: "qualification" },
    service: new QualificationsService() as unknown as EntityServiceLike,
    meta: qualificationMeta,
    auditable: true,
    permissions: {
      meta: [Permission.CRM_QUALIFICATION_READ_ALL, Permission.CRM_QUALIFICATION_READ_SINGLE],
      list: [Permission.CRM_QUALIFICATION_READ_ALL],
      get: [Permission.CRM_QUALIFICATION_READ_SINGLE],
      create: [Permission.CRM_QUALIFICATION_CREATE_SINGLE],
      update: [Permission.CRM_QUALIFICATION_UPDATE_SINGLE],
      delete: [Permission.CRM_QUALIFICATION_DELETE_SINGLE],
      restore: [Permission.CRM_QUALIFICATION_RESTORE_SINGLE],
      bulkDelete: [Permission.CRM_QUALIFICATION_DELETE_BULK],
      bulkRestore: [Permission.CRM_QUALIFICATION_RESTORE_BULK],
      audit: [Permission.CRM_QUALIFICATION_READ_AUDIT],
    },
    schemas: {
      listQuery: (q) => QualificationListQuerySchema.parse(q),
      createBody: (b) => QualificationCreateWrite.parse(b) as { entity: Record<string, unknown> },
      updateBody: (b) => QualificationUpdateWrite.parse(b) as { entity: Record<string, unknown> },
      auditQuery: (q) => QualificationAuditQuerySchema.parse(q),
    },
  },
  {
    entityName: "marketing_qualification",
    spec: { tag: "marketing_qualifications", label: "marketing qualification" },
    service: new MarketingQualificationsService() as unknown as EntityServiceLike,
    meta: marketingQualificationMeta,
    auditable: true,
    permissions: {
      meta: [Permission.CRM_MARKETING_QUALIFICATION_READ_ALL, Permission.CRM_MARKETING_QUALIFICATION_READ_SINGLE],
      list: [Permission.CRM_MARKETING_QUALIFICATION_READ_ALL],
      get: [Permission.CRM_MARKETING_QUALIFICATION_READ_SINGLE],
      create: [Permission.CRM_MARKETING_QUALIFICATION_CREATE_SINGLE],
      update: [Permission.CRM_MARKETING_QUALIFICATION_UPDATE_SINGLE],
      delete: [Permission.CRM_MARKETING_QUALIFICATION_DELETE_SINGLE],
      restore: [Permission.CRM_MARKETING_QUALIFICATION_RESTORE_SINGLE],
      bulkDelete: [Permission.CRM_MARKETING_QUALIFICATION_DELETE_BULK],
      bulkRestore: [Permission.CRM_MARKETING_QUALIFICATION_RESTORE_BULK],
      audit: [Permission.CRM_MARKETING_QUALIFICATION_READ_AUDIT],
    },
    schemas: {
      listQuery: (q) => MarketingQualificationListQuerySchema.parse(q),
      createBody: (b) => MarketingQualificationCreateWrite.parse(b) as { entity: Record<string, unknown> },
      updateBody: (b) => MarketingQualificationUpdateWrite.parse(b) as { entity: Record<string, unknown> },
      auditQuery: (q) => MarketingQualificationAuditQuerySchema.parse(q),
    },
  },
  {
    entityName: "contact_type",
    spec: { tag: "contact_types", label: "contact type" },
    service: new ContactTypesService() as unknown as EntityServiceLike,
    meta: contactTypeMeta,
    auditable: true,
    permissions: {
      meta: [Permission.CRM_CONTACT_TYPE_READ_ALL, Permission.CRM_CONTACT_TYPE_READ_SINGLE],
      list: [Permission.CRM_CONTACT_TYPE_READ_ALL],
      get: [Permission.CRM_CONTACT_TYPE_READ_SINGLE],
      create: [Permission.CRM_CONTACT_TYPE_CREATE_SINGLE],
      update: [Permission.CRM_CONTACT_TYPE_UPDATE_SINGLE],
      delete: [Permission.CRM_CONTACT_TYPE_DELETE_SINGLE],
      restore: [Permission.CRM_CONTACT_TYPE_RESTORE_SINGLE],
      bulkDelete: [Permission.CRM_CONTACT_TYPE_DELETE_BULK],
      bulkRestore: [Permission.CRM_CONTACT_TYPE_RESTORE_BULK],
      audit: [Permission.CRM_CONTACT_TYPE_READ_AUDIT],
    },
    schemas: {
      listQuery: (q) => ContactTypeListQuerySchema.parse(q),
      createBody: (b) => ContactTypeCreateWrite.parse(b) as { entity: Record<string, unknown> },
      updateBody: (b) => ContactTypeUpdateWrite.parse(b) as { entity: Record<string, unknown> },
      auditQuery: (q) => ContactTypeAuditQuerySchema.parse(q),
    },
  },
  {
    entityName: "account_kind",
    spec: { tag: "account_kinds", label: "account kind" },
    service: new AccountKindsService() as unknown as EntityServiceLike,
    meta: accountKindMeta,
    auditable: true,
    permissions: {
      meta: [Permission.CRM_ACCOUNT_KIND_READ_ALL, Permission.CRM_ACCOUNT_KIND_READ_SINGLE],
      list: [Permission.CRM_ACCOUNT_KIND_READ_ALL],
      get: [Permission.CRM_ACCOUNT_KIND_READ_SINGLE],
      create: [Permission.CRM_ACCOUNT_KIND_CREATE_SINGLE],
      update: [Permission.CRM_ACCOUNT_KIND_UPDATE_SINGLE],
      delete: [Permission.CRM_ACCOUNT_KIND_DELETE_SINGLE],
      restore: [Permission.CRM_ACCOUNT_KIND_RESTORE_SINGLE],
      bulkDelete: [Permission.CRM_ACCOUNT_KIND_DELETE_BULK],
      bulkRestore: [Permission.CRM_ACCOUNT_KIND_RESTORE_BULK],
      audit: [Permission.CRM_ACCOUNT_KIND_READ_AUDIT],
    },
    schemas: {
      listQuery: (q) => AccountKindListQuerySchema.parse(q),
      createBody: (b) => AccountKindCreateWrite.parse(b) as { entity: Record<string, unknown> },
      updateBody: (b) => AccountKindUpdateWrite.parse(b) as { entity: Record<string, unknown> },
      auditQuery: (q) => AccountKindAuditQuerySchema.parse(q),
    },
  },
  {
    entityName: "customer_link_type",
    spec: { tag: "customer_link_types", label: "customer link type" },
    service: new CustomerLinkTypesService() as unknown as EntityServiceLike,
    meta: customerLinkTypeMeta,
    auditable: true,
    permissions: {
      meta: [Permission.CRM_CUSTOMER_LINK_TYPE_READ_ALL, Permission.CRM_CUSTOMER_LINK_TYPE_READ_SINGLE],
      list: [Permission.CRM_CUSTOMER_LINK_TYPE_READ_ALL],
      get: [Permission.CRM_CUSTOMER_LINK_TYPE_READ_SINGLE],
      create: [Permission.CRM_CUSTOMER_LINK_TYPE_CREATE_SINGLE],
      update: [Permission.CRM_CUSTOMER_LINK_TYPE_UPDATE_SINGLE],
      delete: [Permission.CRM_CUSTOMER_LINK_TYPE_DELETE_SINGLE],
      restore: [Permission.CRM_CUSTOMER_LINK_TYPE_RESTORE_SINGLE],
      bulkDelete: [Permission.CRM_CUSTOMER_LINK_TYPE_DELETE_BULK],
      bulkRestore: [Permission.CRM_CUSTOMER_LINK_TYPE_RESTORE_BULK],
      audit: [Permission.CRM_CUSTOMER_LINK_TYPE_READ_AUDIT],
    },
    schemas: {
      listQuery: (q) => CustomerLinkTypeListQuerySchema.parse(q),
      createBody: (b) => CustomerLinkTypeCreateWrite.parse(b) as { entity: Record<string, unknown> },
      updateBody: (b) => CustomerLinkTypeUpdateWrite.parse(b) as { entity: Record<string, unknown> },
      auditQuery: (q) => CustomerLinkTypeAuditQuerySchema.parse(q),
    },
  },
  {
    entityName: "consent_type",
    spec: { tag: "consent_types", label: "consent type" },
    service: new ConsentTypesService() as unknown as EntityServiceLike,
    meta: consentTypeMeta,
    auditable: true,
    permissions: {
      meta: [Permission.CRM_CONSENT_TYPE_READ_ALL, Permission.CRM_CONSENT_TYPE_READ_SINGLE],
      list: [Permission.CRM_CONSENT_TYPE_READ_ALL],
      get: [Permission.CRM_CONSENT_TYPE_READ_SINGLE],
      create: [Permission.CRM_CONSENT_TYPE_CREATE_SINGLE],
      update: [Permission.CRM_CONSENT_TYPE_UPDATE_SINGLE],
      delete: [Permission.CRM_CONSENT_TYPE_DELETE_SINGLE],
      restore: [Permission.CRM_CONSENT_TYPE_RESTORE_SINGLE],
      bulkDelete: [Permission.CRM_CONSENT_TYPE_DELETE_BULK],
      bulkRestore: [Permission.CRM_CONSENT_TYPE_RESTORE_BULK],
      audit: [Permission.CRM_CONSENT_TYPE_READ_AUDIT],
    },
    schemas: {
      listQuery: (q) => ConsentTypeListQuerySchema.parse(q),
      createBody: (b) => ConsentTypeCreateWrite.parse(b) as { entity: Record<string, unknown> },
      updateBody: (b) => ConsentTypeUpdateWrite.parse(b) as { entity: Record<string, unknown> },
      auditQuery: (q) => ConsentTypeAuditQuerySchema.parse(q),
    },
  },
  {
    entityName: "local_address",
    spec: { tag: "local_addresses", label: "local address" },
    service: new LocalAddressesService() as unknown as EntityServiceLike,
    meta: localAddressMeta,
    auditable: true,
    permissions: {
      meta: [Permission.CRM_LOCAL_ADDRESS_READ_ALL, Permission.CRM_LOCAL_ADDRESS_READ_SINGLE],
      list: [Permission.CRM_LOCAL_ADDRESS_READ_ALL],
      get: [Permission.CRM_LOCAL_ADDRESS_READ_SINGLE],
      create: [Permission.CRM_LOCAL_ADDRESS_CREATE_SINGLE],
      update: [Permission.CRM_LOCAL_ADDRESS_UPDATE_SINGLE],
      delete: [Permission.CRM_LOCAL_ADDRESS_DELETE_SINGLE],
      restore: [Permission.CRM_LOCAL_ADDRESS_RESTORE_SINGLE],
      bulkDelete: [Permission.CRM_LOCAL_ADDRESS_DELETE_BULK],
      bulkRestore: [Permission.CRM_LOCAL_ADDRESS_RESTORE_BULK],
      audit: [Permission.CRM_LOCAL_ADDRESS_READ_AUDIT],
    },
    schemas: {
      listQuery: (q) => LocalAddressListQuerySchema.parse(q),
      createBody: (b) => LocalAddressCreateWrite.parse(b) as { entity: Record<string, unknown> },
      updateBody: (b) => LocalAddressUpdateWrite.parse(b) as { entity: Record<string, unknown> },
      auditQuery: (q) => LocalAddressAuditQuerySchema.parse(q),
    },
  },
  {
    entityName: "customer_account",
    spec: { tag: "customer_accounts", label: "customer account" },
    service: new CustomerAccountsService() as unknown as EntityServiceLike,
    meta: customerAccountMeta,
    auditable: true,
    permissions: {
      meta: [Permission.CRM_CUSTOMER_ACCOUNT_READ_ALL, Permission.CRM_CUSTOMER_ACCOUNT_READ_SINGLE],
      list: [Permission.CRM_CUSTOMER_ACCOUNT_READ_ALL],
      get: [Permission.CRM_CUSTOMER_ACCOUNT_READ_SINGLE],
      create: [Permission.CRM_CUSTOMER_ACCOUNT_CREATE_SINGLE],
      update: [Permission.CRM_CUSTOMER_ACCOUNT_UPDATE_SINGLE],
      delete: [Permission.CRM_CUSTOMER_ACCOUNT_DELETE_SINGLE],
      restore: [Permission.CRM_CUSTOMER_ACCOUNT_RESTORE_SINGLE],
      bulkDelete: [Permission.CRM_CUSTOMER_ACCOUNT_DELETE_BULK],
      bulkRestore: [Permission.CRM_CUSTOMER_ACCOUNT_RESTORE_BULK],
      audit: [Permission.CRM_CUSTOMER_ACCOUNT_READ_AUDIT],
    },
    schemas: {
      listQuery: (q) => CustomerAccountListQuerySchema.parse(q),
      createBody: (b) => CustomerAccountCreateWrite.parse(b) as { entity: Record<string, unknown> },
      updateBody: (b) => CustomerAccountUpdateWrite.parse(b) as { entity: Record<string, unknown> },
      auditQuery: (q) => CustomerAccountAuditQuerySchema.parse(q),
    },
  },
  {
    entityName: "customer_contact",
    spec: { tag: "customer_contacts", label: "customer contact" },
    service: new CustomerContactsService() as unknown as EntityServiceLike,
    meta: customerContactMeta,
    auditable: true,
    permissions: {
      meta: [Permission.CRM_CUSTOMER_CONTACT_READ_ALL, Permission.CRM_CUSTOMER_CONTACT_READ_SINGLE],
      list: [Permission.CRM_CUSTOMER_CONTACT_READ_ALL],
      get: [Permission.CRM_CUSTOMER_CONTACT_READ_SINGLE],
      create: [Permission.CRM_CUSTOMER_CONTACT_CREATE_SINGLE],
      update: [Permission.CRM_CUSTOMER_CONTACT_UPDATE_SINGLE],
      delete: [Permission.CRM_CUSTOMER_CONTACT_DELETE_SINGLE],
      restore: [Permission.CRM_CUSTOMER_CONTACT_RESTORE_SINGLE],
      bulkDelete: [Permission.CRM_CUSTOMER_CONTACT_DELETE_BULK],
      bulkRestore: [Permission.CRM_CUSTOMER_CONTACT_RESTORE_BULK],
      audit: [Permission.CRM_CUSTOMER_CONTACT_READ_AUDIT],
    },
    schemas: {
      listQuery: (q) => CustomerContactListQuerySchema.parse(q),
      createBody: (b) => CustomerContactCreateWrite.parse(b) as { entity: Record<string, unknown> },
      updateBody: (b) => CustomerContactUpdateWrite.parse(b) as { entity: Record<string, unknown> },
      auditQuery: (q) => CustomerContactAuditQuerySchema.parse(q),
    },
  },
  {
    entityName: "customer_link",
    spec: { tag: "customer_links", label: "customer link" },
    service: new CustomerLinksService() as unknown as EntityServiceLike,
    meta: customerLinkMeta,
    auditable: true,
    permissions: {
      meta: [Permission.CRM_CUSTOMER_LINK_READ_ALL, Permission.CRM_CUSTOMER_LINK_READ_SINGLE],
      list: [Permission.CRM_CUSTOMER_LINK_READ_ALL],
      get: [Permission.CRM_CUSTOMER_LINK_READ_SINGLE],
      create: [Permission.CRM_CUSTOMER_LINK_CREATE_SINGLE],
      update: [Permission.CRM_CUSTOMER_LINK_UPDATE_SINGLE],
      delete: [Permission.CRM_CUSTOMER_LINK_DELETE_SINGLE],
      restore: [Permission.CRM_CUSTOMER_LINK_RESTORE_SINGLE],
      bulkDelete: [Permission.CRM_CUSTOMER_LINK_DELETE_BULK],
      bulkRestore: [Permission.CRM_CUSTOMER_LINK_RESTORE_BULK],
      audit: [Permission.CRM_CUSTOMER_LINK_READ_AUDIT],
    },
    schemas: {
      listQuery: (q) => CustomerLinkListQuerySchema.parse(q),
      createBody: (b) => CustomerLinkCreateWrite.parse(b) as { entity: Record<string, unknown> },
      updateBody: (b) => CustomerLinkUpdateWrite.parse(b) as { entity: Record<string, unknown> },
      auditQuery: (q) => CustomerLinkAuditQuerySchema.parse(q),
    },
  },
  {
    entityName: "customer_consent",
    spec: { tag: "customer_consents", label: "customer consent" },
    service: new CustomerConsentsService() as unknown as EntityServiceLike,
    meta: customerConsentMeta,
    auditable: true,
    // Read/audit-only by design: consent rows are written by domain flows
    // that compute `seal` (sha256 tamper-evidence) server-side — no entity
    // write route exists.
    permissions: {
      meta: [Permission.CRM_CUSTOMER_CONSENT_READ_ALL, Permission.CRM_CUSTOMER_CONSENT_READ_SINGLE],
      list: [Permission.CRM_CUSTOMER_CONSENT_READ_ALL],
      get: [Permission.CRM_CUSTOMER_CONSENT_READ_SINGLE],
      audit: [Permission.CRM_CUSTOMER_CONSENT_READ_AUDIT],
    },
    schemas: {
      listQuery: (q) => CustomerConsentListQuerySchema.parse(q),
      auditQuery: (q) => CustomerConsentAuditQuerySchema.parse(q),
    },
  },
];
