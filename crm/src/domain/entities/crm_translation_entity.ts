/**
 * CrmTranslationEntity — read-side projection over `crm.translations`.
 *
 * NOT in `ENTITY_REGISTRY` (patch ownership/drift scanning stays with the
 * db-meta patches that create the table) and NOT a CRUD surface: writes to
 * `crm.translations` remain gateway-owned (BE central translations handler).
 * The only consumer is the export `dictResolver`, which reads the
 * `crm.entities.*` label dict via the DAL Repository — the module reads its
 * own schema, which schema-domain policy allows natively.
 *
 * (`TranslationEntityBase` is the platform-provided shape; the concrete
 * subclass exists only to bind the `crm` schema for this service's reads.)
 */

import { Entity, TranslationEntityBase } from "@primebrick/dal-pg";

@Entity("translations", "crm")
export class CrmTranslationEntity extends TranslationEntityBase {}
