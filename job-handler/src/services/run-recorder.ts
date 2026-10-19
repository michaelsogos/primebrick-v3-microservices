/**
 * run-recorder — governance tap on `jobs.result.>`.
 *
 * Executors publish one result per job run (terminal status). This
 * durable consumer folds them into `job.job_runs` so the admin UI has a
 * complete, durable execution history — including failures, durations
 * and redelivery counts. L1 shield only: results come from services,
 * never from end users.
 *
 * Result envelope (published by the executor):
 *   { job, service, status, schedule_subject?, duration_ms?, report?, error? }
 */

import {
  NatsClient,
  dueLaneVerify,
  extJsonStringify,
  logger,
} from "@primebrick/sdk";
import { getDal } from "../db/dal.js";
import { JobRunEntity } from "../domain/entities/job_run_entity.js";

export const JOBS_STREAM = "JOBS";

/**
 * NatsClient decodes payloads with extJsonParse — every integer arrives as
 * native bigint. node-pg serializes object params with plain JSON.stringify,
 * which rejects bigint; fold them back to plain JSON before the jsonb insert
 * (jsonb has no distinct bigint type anyway).
 */
function plainJson<T>(v: T): T {
  if (v === undefined) return v;
  return JSON.parse(extJsonStringify(v)) as T;
}

interface JobResultEnvelope {
  job?: string;
  service?: string;
  status?: string;
  schedule_subject?: string;
  duration_ms?: number;
  report?: unknown;
  error?: string;
}

/** Parse `jobs.result.<svc>.<rest>` → { svc, jobName }. */
function parseResultSubject(subject: string): { svc: string; jobName: string } | null {
  const m = /^jobs\.result\.([a-z0-9-]+)\.([a-z0-9.-]+)$/.exec(subject);
  return m ? { svc: m[1]!, jobName: m[2]! } : null;
}

export async function startRunRecorder(): Promise<void> {
  const dal = getDal();

  await NatsClient.jetstreamSubscribe<JobResultEnvelope>({
    stream: JOBS_STREAM,
    durable: "job-results-recorder",
    filterSubject: "jobs.result.>",
    verify: dueLaneVerify("system"),
    handler: async (data, meta) => {
      const parsed = parseResultSubject(meta.subject);
      if (!parsed) {
        logger.warn(`run-recorder: unparseable result subject "${meta.subject}" — dropped`, {
          tags: ["jobs"],
        });
        return; // ack — malformed subjects are terminal, not transient
      }
      const status = (data.status ?? "unknown") as JobRunEntity["status"];
      const isError = status === "failed" || status === "error";
      await dal.add<JobRunEntity>(
        JobRunEntity,
        {
          schedule_subject: data.schedule_subject ?? `jobs.schedule.${parsed.svc}.${data.job ?? parsed.jobName}`,
          service_code: data.service ?? parsed.svc,
          job_name: data.job ?? parsed.jobName,
          lane: "system",
          status,
          error_code: isError ? "EXECUTION_ERROR" : undefined,
          error_detail: isError ? (data.error ?? String(data.report ?? "")).slice(0, 2000) : undefined,
          duration_ms: data.duration_ms === undefined ? undefined : Number(data.duration_ms),
          redelivery_count: meta.info?.redeliveryCount,
          initiator: parsed.svc,
          report: plainJson(data.report),
        } as never,
        { actor: `system:${parsed.svc}` } as never,
      );
    },
  });

  logger.done("run-recorder: durable consumer ready on jobs.result.>", { tags: ["jobs"] });
}
