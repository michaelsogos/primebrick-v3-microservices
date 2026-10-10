/**
 * Register every @Entity class so database patch tooling can scan them.
 * Add new entities here after creating the class file.
 */
import "reflect-metadata";

import type { EntityClass } from "@primebrick/dal-pg";
import { DocsKbEntity } from "./docs_kb_entity.js";
import { AiModelEntity } from "./ai_model_entity.js";
import { AiCerebellumEntity } from "./ai_cerebellum_entity.js";
import { ConfigEntryEntity } from "./config_entry_entity.js";

export const ENTITY_REGISTRY = [
  DocsKbEntity,
  AiModelEntity,
  AiCerebellumEntity,
  ConfigEntryEntity,
] as const;

export { DocsKbEntity, AiModelEntity, AiCerebellumEntity, ConfigEntryEntity };
export type { EntityClass };
