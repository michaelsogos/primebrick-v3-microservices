/**
 * Partition-maintenance infrastructure job — self-declared at boot.
 *
 * The declaration is DERIVED from entity metadata (`@PartitionField` with a
 * retention): if no partitioned entity exists nothing is armed. The
 * schedule lives in the `JOBS` JetStream stream (NATS 2.14+ ADR-51 native
 * scheduler); the fired message lands on `jobs.due.system.ai.partition-
 * maintenance` where THIS service's durable consumer runs
 * `dal.partitionMaintenance(ENTITY_REGISTRY)` — the executor is the owning
 * service itself, never primebrick-job or any shared worker.
 *
 * Arm goes through `armJobSchedule` — the governed `jobs.ctl.schedule.
 * request` route on primebrick-job, the ONLY writer of `jobs.schedule.*`
 * (the raw mechanism is not exported — a direct declaration is impossible
 * by construction). primebrick-job down = arm fails: retried every 30s and
 * on `service.gateway_online` (the ecosystem restart that re-registers
 * services — JH is typically back by then). The arm is idempotent: a
 * re-arm atomically replaces the same-subject declaration.
 *
 * This service does NOT own the JOBS stream — `ensureStream` here would
 * race primebrick-job's authoritative config (`syncSubjects` could strip
 * subjects it just added). The durable consumer retries "stream not
 * found" until primebrick-job creates it.
 *
 * The consumer is on the SYSTEM lane (`dueLaneVerify("system")`): L1
 * client-shield only, actor=system — partition retention is a super-partes
 * infrastructure process, not a user action. The execution outcome is
 * reported automatically by the SDK transport middleware on
 * `jobs.result.ai.partition-maintenance` (the fired message carries
 * `x-job-schedule-subject` — stamped by the governed arm): a returned
 * object becomes the run report, a throw becomes `failed` + nak.
 */

import {
  NatsClient,
  armJobSchedule,
  dueLaneVerify,
  extJsonStringify,
  setProcessInterval,
  subscribeShielded,
  SERVICE_SUBJECTS,
  logger,
} from "@primebrick/sdk";
import { getEntityPersistenceMeta } from "@primebrick/dal-pg";
import { ENTITY_REGISTRY } from "../../domain/entities/registry.js";
import { getDal } from "../../db/dal.js";
import { aiConfig } from "../../config/ai-config.js";

const SERVICE = "ai";
const JOB_NAME = "partition-maintenance";
const DUE_SUBJECT = `jobs.due.system.${SERVICE}.${JOB_NAME}`;
const ARM_RETRY_MS = 30_000;

let armed = false;

/**
 * One arm attempt — idempotent and quiet once armed. A failure is never
 * fatal to boot: the consumer below is ready regardless, and the retry
 * interval re-attempts until primebrick-job answers.
 */
async function tryArm(scheduleSpec: string, reason: string): Promise<void> {
  if (armed) return;
  try {
    await armJobSchedule(
      {
        name: JOB_NAME,
        schedule: scheduleSpec,
        target: DUE_SUBJECT,
        payload: { kind: "infra_derived", service: SERVICE },
      },
      { timeoutMs: 3000 },
    );
    armed = true;
    logger.done(`${JOB_NAME} schedule armed via primebrick-job (${scheduleSpec})`, { tags: ["jobs"] });
  } catch (err) {
    logger.warn(
      `${JOB_NAME} arm failed (${reason}): ${err instanceof Error ? err.message : err} — retry pending`,
      { tags: ["jobs"] },
    );
  }
}

export async function startPartitionMaintenanceJob(): Promise<void> {
  const partitioned = ENTITY_REGISTRY.filter(
    (e) => getEntityPersistenceMeta(e).partition?.retention,
  );
  if (partitioned.length === 0) {
    logger.info("no partitioned entities — partition-maintenance job not armed", {
      tags: ["jobs"],
    });
    return;
  }

  // Cadence is a config entry (ops can override without a redeploy);
  // the DEFAULT remains @daily when the key is absent.
  const scheduleSpec = aiConfig("partition_maintenance_schedule") ?? "@daily";

  // Arm now; if primebrick-job is unreachable the interval + the
  // gateway_online broadcast (ecosystem restart — services re-register)
  // keep retrying. Arm failures must not delay the consumer bind.
  void tryArm(scheduleSpec, "boot");
  setProcessInterval("ai-partition-arm-retry", ARM_RETRY_MS, () => tryArm(scheduleSpec, "interval"));
  await subscribeShielded(SERVICE_SUBJECTS.GATEWAY_ONLINE, () => tryArm(scheduleSpec, "gateway_online"));

  // Durable consumer — the actual executor, inside this process.
  await NatsClient.jetstreamSubscribe({
    stream: "JOBS",
    durable: `exec-${SERVICE}-${JOB_NAME}`,
    filterSubject: DUE_SUBJECT,
    verify: dueLaneVerify("system"),
    consumer: { ackWaitMs: 120_000, maxAckPending: 1 },
    handler: async () => {
      logger.info(`${JOB_NAME} fired`, { tags: ["jobs"] });
      const report = await getDal().partitionMaintenance(ENTITY_REGISTRY);
      logger.done(`${JOB_NAME} done: ${extJsonStringify(report)}`, { tags: ["jobs"] });
      // Returned object → the transport middleware publishes it as the
      // run report on jobs.result.ai.partition-maintenance.
      return report;
    },
  });
  logger.done(`${JOB_NAME} consumer ready on ${DUE_SUBJECT}`, { tags: ["jobs"] });
}
