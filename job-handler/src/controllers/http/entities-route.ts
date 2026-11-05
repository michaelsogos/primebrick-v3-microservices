/**
 * entities-route — canonical entity CRUD for the `job` schema entities,
 * behind the SDK `makeEntityRouter` factory (auth → RBAC → validation →
 * ONE service call → RFC 7807). The BE `/svc/job` proxy makes it a pure
 * transport hop.
 *
 *   /api/v1/entities/job_trigger|job_schedule|job_run/…
 */

import {
  Permission,
  type EntityRouteDecl,
  type EntityServiceLike,
} from "@primebrick/sdk";

import {
  JobTriggersService,
  JobSchedulesService,
  JobRunsService,
} from "../../modules/jobs/jobs.service.js";
import { jobTriggerMeta, jobScheduleMeta, jobRunMeta } from "../../modules/jobs/job.meta.js";

function lazy<T extends object>(factory: () => T): T {
  let inst: T | null = null;
  return new Proxy({} as T, {
    get: (_t, k) => ((inst ??= factory()) as Record<string | symbol, unknown>)[k],
  });
}

const readPerms = [Permission.AUTHENTICATED_USER];
const writePerms = [Permission.AUTHENTICATED_ADMIN];

/** Entity declarations — makeServiceRoutes derives BOTH the CRUD routers
 *  and their OpenAPI path blocks from this single config set. */
export const jobEntityDecls: EntityRouteDecl[] = [
  {
    entityName: "job_trigger",
    spec: { tag: "job_triggers", label: "job trigger" },
    service: lazy(() => new JobTriggersService()) as unknown as EntityServiceLike,
    meta: jobTriggerMeta,
    auditable: true,
    permissions: {
      meta: readPerms, list: readPerms, get: readPerms,
      create: writePerms, update: writePerms,
      delete: writePerms, restore: writePerms, audit: writePerms,
    },
    duplicate: false,
  },
  {
    entityName: "job_schedule",
    spec: { tag: "job_schedules", label: "job schedule" },
    service: lazy(() => new JobSchedulesService()) as unknown as EntityServiceLike,
    meta: jobScheduleMeta,
    auditable: true,
    permissions: {
      // READ-ONLY MIRROR — job_schedules mirrors live NATS declarations.
      // CRUD writes would flip the mirror without touching JetStream (the
      // direct-SQL bypass, but through the canonical API). Arm via
      // jobs.ctl.schedule.request / schedule-only triggers; disarm via
      // /api/v1/actions/disable-schedule (owner-level) or stop-job
      // (instance-level). No create/update/delete/restore.
      meta: readPerms, list: readPerms, get: readPerms, audit: writePerms,
    },
    duplicate: false,
  },
  {
    entityName: "job_run",
    spec: { tag: "job_runs", label: "job run" },
    service: lazy(() => new JobRunsService()) as unknown as EntityServiceLike,
    meta: jobRunMeta,
    auditable: true,
    permissions: {
      // History is written by services, never edited by humans — read-only.
      meta: readPerms, list: readPerms, get: readPerms, audit: writePerms,
    },
    duplicate: false,
  },
];
