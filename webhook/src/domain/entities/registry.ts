/**
 * Register every @Entity class so database patch tooling can scan them.
 */
import "reflect-metadata";

import { ConfigEntryEntity } from "./config_entry_entity.js";

export const ENTITY_REGISTRY = [
  ConfigEntryEntity,
] as const;

export { ConfigEntryEntity };
