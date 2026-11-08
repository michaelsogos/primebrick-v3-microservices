import { z } from "zod";
import { zBoundedInt, zPartialNoDefaults, ListQueryBaseSchema } from "../shared/validation.js";
import { CUSTOMER_ACCOUNT_SORT_KEYS } from "./list-config.js";

export const CustomerAccountListQuerySchema = ListQueryBaseSchema.extend({
  sort_key: z.enum(CUSTOMER_ACCOUNT_SORT_KEYS as [string, ...string[]]).optional(),
});

const CustomerAccountBaseSchema = z.object({
  /** True FK → crm.customers(id). */
  customer_id: z.coerce.bigint().positive(),
  /** Lazy ref → account_kinds.uuid (invoice | legal | user-defined). */
  kind_uuid: z.string().uuid(),
  /** Fiscal/legal company name — the account carries it, not the customer. */
  company_name: z.string().min(1),
  /** Lazy ref → legal_forms.uuid — the ragione sociale (ISO 20275). */
  legal_form_uuid: z.string().uuid().optional(),
  /** Jurisdiction — ISO 3166-1 alpha-2; pivot of the legal_form cascade. */
  country: z.string().length(2),
  /** True FK → crm.local_addresses(id) — the LU this account represents. */
  local_address_id: z.coerce.bigint().positive().optional(),
  /** True FK → crm.customer_contacts(id) — e.g. where invoices are sent. */
  contact_id: z.coerce.bigint().positive().optional(),
  is_default: z.boolean().default(false),
});

export const CustomerAccountCreateBodySchema = CustomerAccountBaseSchema;
export const CustomerAccountUpdateBodySchema = zPartialNoDefaults(
  CustomerAccountBaseSchema.extend({ version: zBoundedInt(0, Number.MAX_SAFE_INTEGER) }),
);

export const CustomerAccountAuditQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(50),
});
