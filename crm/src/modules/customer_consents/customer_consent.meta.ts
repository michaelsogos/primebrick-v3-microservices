/**
 * `customer_consent` entity metadata —
 * `GET /api/v1/entities/customer_consent/meta`.
 * `entities_ns: "crm"`; `display_field: "doc_version"`.
 */

import type { EntityMeta } from "@primebrick/sdk";
import { withColumnConstraints } from "@primebrick/dal-pg";
import { CustomerConsentEntity } from "../../domain/entities/customer_consent_entity.js";
import { CUSTOMER_CONSENT_DEFAULT_SORT, CUSTOMER_CONSENT_LIST_COLUMNS } from "./list-config.js";

export const customerConsentMeta: EntityMeta = withColumnConstraints({
  entity: "customer_consent",
  translation_key: "customer_consent",
  entities_ns: "crm",
  uid: "uuid",
  display_field: "doc_version",
  columns: CUSTOMER_CONSENT_LIST_COLUMNS,
  table: {
    default_view: "table",
    default_sort: CUSTOMER_CONSENT_DEFAULT_SORT,
    default_page_size: 25,
    page_size_options: [10, 25, 50],
  },
}, CustomerConsentEntity);
