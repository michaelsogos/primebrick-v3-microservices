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
 * Declaration goes through the governed `jobs.ctl.schedule.request` route
 * on primebrick-job (sole writer of `jobs.schedule.*` — records it in
 * `job.job_schedules` for the admin UI). Transitional fallback: if
 * primebrick-job is not registered yet, the schedule is published directly
 * and a loud warning is logged — remove the fallback once primebrick-job
 * is mandatory in the deployment.
 *
 * The consumer is on the SYSTEM lane (`dueLaneVerify("system")`): L1
 * client-shield only, actor=system — partition retention is a super-partes
 * infrastructure process, not a user action. Results are published to
 * `jobs.result.ai.partition-maintenance` for the governance tap.
 */

import {
  NatsClient,
  callNats,
  dueLaneVerify,
  ensureJobSchedule,
  extJsonStringify,
  logger,
  JOB_STREAM_SUBJECTS,
  JOB_SCHEDULE_REQUEST_SUBJECT,
} from "@primebrick/sdk";
import { getEntityPersistenceMeta } from "@primebrick/dal-pg";
import { ENTITY_REGISTRY } from "../../domain/entities/registry.js";
import { getDal } from "../../db/dal.js";
import { aiConfig } from "../../config/ai-config.js";

const SERVICE = "ai";
const JOBS_STREAM = "JOBS";
const JOB_NAME = "partition-maintenance";
const SCHEDULE_SUBJECT = `jobs.schedule.${SERVICE}.${JOB_NAME}`;
const DUE_SUBJECT = `jobs.due.system.${SERVICE}.${JOB_NAME}`;
const RESULT_SUBJECT = `jobs.result.${SERVICE}.${JOB_NAME}`;

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

  await NatsClient.ensureStream(JOBS_STREAM, [...JOB_STREAM_SUBJECTS], {
    allowMsgSchedules: true,
    syncSubjects: true,
  });

  // 1. Arm the schedule — via the governed route when primebrick-job is up.
  //    The request subject is OUTSIDE the stream capture set: a reply here
  //    can only come from a real responder, never a JetStream PubAck.
  // Cadence is a config entry (ops can override without a redeploy);
  // the DEFAULT remains @daily when the key is absent.
  const scheduleSpec = aiConfig("partition_maintenance_schedule") ?? "@daily";

  const declaration = {
    schedule_subject: SCHEDULE_SUBJECT,
    schedule: scheduleSpec,
    target: DUE_SUBJECT,
    kind: "infra_derived",
  };
  try {
    await callNats(JOB_SCHEDULE_REQUEST_SUBJECT, declaration, { timeoutMs: 3000 });
    logger.done(`${JOB_NAME} schedule declared via primebrick-job (${scheduleSpec})`, {
      tags: ["jobs"],
    });
  } catch (err) {
    logger.warn(
      `primebrick-job unreachable — declaring schedule directly (transitional fallback): ${err instanceof Error ? err.message : err}`,
      { tags: ["jobs"] },
    );
    await ensureJobSchedule({
      scheduleSubject: SCHEDULE_SUBJECT,
      schedule: scheduleSpec,
      target: DUE_SUBJECT,
      payload: { kind: "infra_derived", service: SERVICE },
    });
  }

  // 2. Durable consumer — the actual executor, inside this process.
  await NatsClient.jetstreamSubscribe({
    stream: JOBS_STREAM,
    durable: `exec-${SERVICE}-${JOB_NAME}`,
    filterSubject: DUE_SUBJECT,
    verify: dueLaneVerify("system"),
    consumer: { ackWaitMs: 120_000, maxAckPending: 1 },
    handler: async () => {
      const started = Date.now();
      logger.info(`${JOB_NAME} fired`, { tags: ["jobs"] });
      try {
        const report = await getDal().partitionMaintenance(ENTITY_REGISTRY);
        logger.done(`${JOB_NAME} done: ${extJsonStringify(report)}`, { tags: ["jobs"] });
        await NatsClient.jetstreamPublish(RESULT_SUBJECT, {
          job: JOB_NAME,
          service: SERVICE,
          status: "succeeded",
          duration_ms: Date.now() - started,
          report,
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        logger.error(`${JOB_NAME} failed: ${message}`, { tags: ["jobs"], error: err });
        await NatsClient.jetstreamPublish(RESULT_SUBJECT, {
          job: JOB_NAME,
          service: SERVICE,
          status: "failed",
          duration_ms: Date.now() - started,
          error: message,
        }).catch(() => {});
        throw err; // nak → redelivery per consumer policy
      }
    },
  });
  logger.done(`${JOB_NAME} consumer ready on ${DUE_SUBJECT}`, { tags: ["jobs"] });
}
