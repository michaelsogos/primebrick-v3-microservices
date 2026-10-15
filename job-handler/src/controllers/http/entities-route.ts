/**
 * entities-route — canonical entity CRUD for the `job` schema entities,
 * behind the SDK `makeEntityRouter` factory (auth → RBAC → validation →
 * ONE service call → RFC 7807). The BE `/ws/job` proxy makes it a pure
 * transport hop.
 *
 *   /api/v1/entities/job_rule|job_schedule|job_run/…
 */

import {
  makeEntityRouter,
  composeRouteHandlers,
  Permission,
  type RouteHandler,
  type EntityServiceLike,
} from "@primebrick/sdk";

import {
  JobRulesService,
  JobSchedulesService,
  JobRunsService,
} from "../../modules/jobs/jobs.service.js";
import { jobRuleMeta, jobScheduleMeta, jobRunMeta } from "../../modules/jobs/job.meta.js";

function lazy<T extends object>(factory: () => T): T {
  let inst: T | null = null;
  return new Proxy({} as T, {
    get: (_t, k) => ((inst ??= factory()) as Record<string | symbol, unknown>)[k],
  });
}

const readPerms = [Permission.AUTHENTICATED_USER];
const writePerms = [Permission.AUTHENTICATED_ADMIN];

/** Permissive body validators — entity write envelope { entity, ... }. */
const entityBody = (b: unknown) => b as { entity: Record<string, unknown> };

export const jobEntityRouteHandler: RouteHandler = composeRouteHandlers(
  makeEntityRouter({
    entityName: "job_rule",
    service: lazy(() => new JobRulesService()) as unknown as EntityServiceLike,
    meta: jobRuleMeta as unknown as Record<string, unknown>,
    auditable: true,
    permissions: {
      meta: readPerms, list: readPerms, get: readPerms,
      create: writePerms, update: writePerms,
      delete: writePerms, restore: writePerms, audit: writePerms,
    },
    duplicate: false,
    schemas: { createBody: entityBody, updateBody: entityBody },
  }),
  makeEntityRouter({
    entityName: "job_schedule",
    service: lazy(() => new JobSchedulesService()) as unknown as EntityServiceLike,
    meta: jobScheduleMeta as unknown as Record<string, unknown>,
    auditable: true,
    permissions: {
      meta: readPerms, list: readPerms, get: readPerms, audit: writePerms,
      // Schedules are armed/disarmed by the services — admin write ops
      // exist for manual jobs & cleanup, gated to admin.
      create: writePerms, update: writePerms,
      delete: writePerms, restore: writePerms,
    },
    duplicate: false,
    schemas: { createBody: entityBody, updateBody: entityBody },
  }),
  makeEntityRouter({
    entityName: "job_run",
    service: lazy(() => new JobRunsService()) as unknown as EntityServiceLike,
    meta: jobRunMeta as unknown as Record<string, unknown>,
    auditable: true,
    permissions: {
      // History is written by services, never edited by humans — read-only.
      meta: readPerms, list: readPerms, get: readPerms, audit: writePerms,
    },
    duplicate: false,
  }),
);
