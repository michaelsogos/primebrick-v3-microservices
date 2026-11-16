/**
 * Register every @Entity class so database patch tooling can scan them
 * (`db:meta:compare`, `db:check`, `partitionMaintenance`, dbPatches).
 */
import "reflect-metadata";

import { ConfigEntryEntity } from "./config_entry_entity.js";
import { TestItemEntity } from "./test_item_entity.js";

export const ENTITY_REGISTRY = [
  ConfigEntryEntity,
  TestItemEntity,
] as const;

export { ConfigEntryEntity, TestItemEntity };
