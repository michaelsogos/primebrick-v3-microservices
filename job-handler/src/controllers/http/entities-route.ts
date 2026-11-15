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

const readPerms = [Permission.AUTHENTICATED_USER];
const writePerms = [Permission.AUTHENTICATED_ADMIN];

/** Entity declarations — makeServiceRoutes derives BOTH the CRUD routers
 *  and their OpenAPI path blocks from this single config set. */
export const jobEntityDecls: EntityRouteDecl[] = [
  {
    entityName: "job_trigger",
    spec: { tag: "job_triggers", label: "job trigger" },
    service: new JobTriggersService() as unknown as EntityServiceLike,
    meta: jobTriggerMeta,
    permissions: {
      meta: readPerms, list: readPerms, get: readPerms,
      create: writePerms, update: writePerms,
      delete: writePerms, restore: writePerms, audit: writePerms,
      bulkDelete: writePerms, bulkRestore: writePerms,
    },
  },
  {
    entityName: "job_schedule",
    spec: { tag: "job_schedules", label: "job schedule" },
    service: new JobSchedulesService() as unknown as EntityServiceLike,
    meta: jobScheduleMeta,
    permissions: {
      // READ-ONLY MIRROR — job_schedules mirrors live NATS declarations.
      // CRUD writes would flip the mirror without touching JetStream (the
      // direct-SQL bypass, but through the canonical API). Arm via
      // materialized triggers (jobs.ctl.triggers.materialize or the
      // canonical entity API); disarm via
      // /api/v1/actions/disable-schedule (owner-level) or stop-job
      // (instance-level). No create/update/delete/restore.
      // Derived mirror is not auditable state — no /:uuid/audit endpoint.
      meta: readPerms, list: readPerms, get: readPerms,
    },
  },
  {
    entityName: "job_run",
    spec: { tag: "job_runs", label: "job run" },
    service: new JobRunsService() as unknown as EntityServiceLike,
    meta: jobRunMeta,
    permissions: {
      // History is written by services, never edited by humans — read-only.
      // The run row IS the audit trail — no /:uuid/audit endpoint.
      meta: readPerms, list: readPerms, get: readPerms,
    },
  },
];
