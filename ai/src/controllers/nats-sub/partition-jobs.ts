/**
 * Partition-maintenance — a SYSTEM TRIGGER declared by this module.
 *
 * The job is declared in code (the code owns the interchange contract)
 * and materialized onto `job.job_triggers` via `declareSystemJobs` →
 * `jobs.ctl.triggers.materialize` on primebrick-job. The trigger row is
 * then the declaration of record: primebrick-job's triggers engine arms
 * the JetStream schedule, the due-forwarder republishes onto the
 * `ai.partition_maintenance` callable below, and THIS service executes
 * `dal.partitionMaintenance(ENTITY_REGISTRY)` inside the same process —
 * the executor is the owning service itself, never a shared worker.
 *
 * Ownership split (the materialize contract):
 *   - code owns   → `target_subject`, `run_as`, `event_subject`,
 *                   `payload_map`, `filter` — releases reconcile them
 *                   delta-only
 *   - user owns   → `schedule_spec`, `name`, enable/disable — the row's
 *                   user-visible schedule is THE schedule (the retired
 *                   `partition_maintenance_schedule` config channel was
 *                   a hidden second source of truth)
 *
 * The declaration is DERIVED from entity metadata: no `@PartitionField`
 * with retention → nothing is materialized and the callable is not even
 * registered (a trigger for a job that can't run is a lie).
 *
 * Materialize goes through the governed control route (primebrick-job
 * down = the call rejects): retried every 30s and on
 * `service.gateway_online`. The reconcile is idempotent — re-declaring
 * the same contract is a pure read; a disabled (soft-deleted) trigger
 * row is NEVER resurrected.
 */
import {
  makeNatsRoutes,
  declareSystemJobs,
  setProcessInterval,
  subscribeShielded,
  SERVICE_SUBJECTS,
  logger,
} from "@primebrick/sdk";
import { z } from "zod";
import { getEntityPersistenceMeta } from "@primebrick/dal-pg";
import { ENTITY_REGISTRY } from "../../domain/entities/registry.js";
import { getDal } from "../../db/dal.js";

const SERVICE = "ai";
const JOB_NAME = "partition_maintenance";
const CALLABLE_SUBJECT = `${SERVICE}.${JOB_NAME}`;
/** Seed cadence — 03:00 UTC daily. The row is user-editable afterwards. */
const SEED_SCHEDULE = "0 3 * * *";
const ARM_RETRY_MS = 30_000;

/**
 * `ai.partition_maintenance` — the ONE declaration of the request
 * contract: parameterless maintenance call, `z.infer` is the request
 * type, `z.toJSONSchema` is the census projection, `.parse()` is the
 * mandatory runtime validation wired by the route factory. `nullish` —
 * schedule-only triggers dispatch a null payload.
 */
export const PartitionMaintenanceSchema = z.object({}).loose().nullish();
export type PartitionMaintenanceRequest = z.infer<typeof PartitionMaintenanceSchema>;
export const PARTITION_MAINTENANCE_PAYLOAD_SCHEMA: Record<string, unknown> =
  z.toJSONSchema(PartitionMaintenanceSchema);

let armed = false;

/** One materialize attempt — idempotent (an unchanged contract is a pure
 *  read). A failure is never fatal to boot: the callable route below is
 *  ready regardless, and the retry loop re-attempts until primebrick-job
 *  answers. */
async function tryDeclare(reason: string): Promise<void> {
  if (armed) return;
  try {
    const results = await declareSystemJobs(
      [
        {
          key: JOB_NAME,
          name: "AI partition maintenance",
          schedule_spec: SEED_SCHEDULE,
          target_subject: CALLABLE_SUBJECT,
          run_as: "system",
        },
      ],
      { timeoutMs: 3000 },
    );
    armed = true;
    logger.done(
      `${JOB_NAME} system trigger materialized (${results.map((r) => `${r.key}:${r.action}`).join(", ")})`,
      { tags: ["jobs"] },
    );
  } catch (err) {
    logger.warn(
      `${JOB_NAME} materialize failed (${reason}): ${err instanceof Error ? err.message : err} — retry pending`,
      { tags: ["jobs"] },
    );
  }
}

export async function startPartitionMaintenanceJob(): Promise<void> {
  const partitioned = ENTITY_REGISTRY.filter(
    (e) => getEntityPersistenceMeta(e).partition?.retention,
  );
  if (partitioned.length === 0) {
    logger.info("no partitioned entities — partition-maintenance job not declared", {
      tags: ["jobs"],
    });
    return;
  }

  // The callable route — the actual executor, inside this process. A
  // work item (queue `ai`): exactly one replica runs each fire. No user
  // context rides a system-lane dispatch — `permissions: []` leaves the
  // L1 client-shield as the only gate (primebrick-job is the publisher).
  await makeNatsRoutes<PartitionMaintenanceRequest>(
    [
      {
        subject: CALLABLE_SUBJECT,
        queue: SERVICE,
        permissions: [],
        payload_schema: {
          schema: PARTITION_MAINTENANCE_PAYLOAD_SCHEMA,
          parse: (raw) => PartitionMaintenanceSchema.parse(raw),
        },
        label_key: "ai.callable.partition_maintenance.label",
        description_key: "ai.callable.partition_maintenance.desc",
        handler: async () => {
          logger.info(`${JOB_NAME} fired`, { tags: ["jobs"] });
          const report = await getDal().partitionMaintenance(ENTITY_REGISTRY);
          logger.done(`${JOB_NAME} done`, { tags: ["jobs"] });
          // Returned object → the transport middleware publishes it as
          // the run report on jobs.result.ai.partition_maintenance.
          return report;
        },
      },
    ],
    { serviceCode: SERVICE },
  );
  logger.done(`${JOB_NAME} callable ready on ${CALLABLE_SUBJECT}`, { tags: ["jobs"] });

  // Materialize now; if primebrick-job is unreachable the interval + the
  // gateway_online broadcast (ecosystem restart — services re-register)
  // keep retrying. Failures must not delay the callable bind above.
  void tryDeclare("boot");
  setProcessInterval("ai-partition-materialize-retry", ARM_RETRY_MS, () => tryDeclare("interval"));
  await subscribeShielded(SERVICE_SUBJECTS.GATEWAY_ONLINE, () => tryDeclare("gateway_online"));
}
