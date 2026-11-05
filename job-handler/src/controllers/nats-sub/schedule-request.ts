/**
 * nats-sub controller — the governed schedule-declaration endpoint.
 *
 *   jobs.ctl.schedule.request  (callNats request/reply over correlation)
 *
 * ONLY writer of `jobs.schedule.*`. Callers are services self-declaring
 * infra jobs (e.g. AI arming its partition-maintenance) — L1 client
 * shield plus an explicit caller-namespace check: a service may only arm
 * schedules inside its own `jobs.schedule.<svc>.` namespace. Lives on
 * `jobs.ctl.*` (NOT `jobs.schedule.*`) so the JOBS stream never swallows
 * the request before the reply — verified empirically: a stream subject
 * match turns the request into a PubAck, impersonating the reply.
 */

import {
  makeNatsRequestRoute,
  serviceShieldVerify,
  logger,
} from "@primebrick/sdk";
import {
  callerServiceCode,
  declareSchedule,
  disarmSchedule,
  ScheduleDeclarationError,
} from "../../services/schedule-service.js";

interface ScheduleRequest {
  schedule_subject?: string;
  schedule?: string;
  target?: string;
  kind?: string;
  payload?: unknown;
  source?: string;
  ttl?: string;
}

interface ScheduleCancelRequest {
  schedule_subject?: string;
}

function validateDeclare(raw: unknown): ScheduleRequest {
  const r = raw as ScheduleRequest;
  if (typeof r?.schedule_subject !== "string" || !r.schedule_subject) {
    throw new ScheduleDeclarationError("VALIDATION_ERROR", "schedule_subject is required");
  }
  if (typeof r?.schedule !== "string" || !r.schedule) {
    throw new ScheduleDeclarationError("VALIDATION_ERROR", "schedule is required");
  }
  if (typeof r?.target !== "string" || !r.target) {
    throw new ScheduleDeclarationError("VALIDATION_ERROR", "target is required");
  }
  return r;
}

function validateCancel(raw: unknown): ScheduleCancelRequest {
  const r = raw as ScheduleCancelRequest;
  if (typeof r?.schedule_subject !== "string" || !r.schedule_subject) {
    throw new ScheduleDeclarationError("VALIDATION_ERROR", "schedule_subject is required");
  }
  return r;
}

export async function registerScheduleRoutes(): Promise<void> {
  await makeNatsRequestRoute(
    [
      {
        subject: "jobs.ctl.schedule.request",
        permissions: [], // `verify` replaces the user chain — service-only endpoint
        verify: serviceShieldVerify,
        validate: validateDeclare,
        handler: async ({ request, msg }) => {
          const caller = callerServiceCode(msg.headers?.get("user-agent") ?? undefined);
          const r = await declareSchedule({
            schedule_subject: (request as ScheduleRequest).schedule_subject!,
            schedule: (request as ScheduleRequest).schedule!,
            target: (request as ScheduleRequest).target!,
            // External callers only ever declare infra_derived schedules —
            // "trigger" is armed by the triggers engine, "manual" was
            // absorbed into schedule-only triggers.
            kind: "infra_derived",
            caller_service: caller,
            payload: (request as ScheduleRequest).payload,
            source: (request as ScheduleRequest).source,
            ttl: (request as ScheduleRequest).ttl,
            initiator: `service:${caller}`,
          });
          // A terminal-once skip is a SUCCESSFUL no-op: the schedule's
          // lifecycle already completed. `armed:false` + the skip reason
          // is the honest reply — no fake seq (JetStream seqs start at 1).
          return r.skipped ? { armed: false, skipped: r.skipped } : { armed: true, seq: String(r.seq) };
        },
      } as const,
    ],
    { serviceCode: "job" },
  );

  await makeNatsRequestRoute(
    [
      {
        subject: "jobs.ctl.schedule.cancel",
        permissions: [],
        verify: serviceShieldVerify,
        validate: validateCancel,
        handler: async ({ request, msg }) => {
          const caller = callerServiceCode(msg.headers?.get("user-agent") ?? undefined);
          const req = request as ScheduleCancelRequest;
          // A service may only disarm inside its own namespace.
          if (!req.schedule_subject!.startsWith(`jobs.schedule.${caller}.`)) {
            throw new ScheduleDeclarationError(
              "FOREIGN_NAMESPACE",
              `service "${caller}" cannot disarm "${req.schedule_subject}"`,
            );
          }
          await disarmSchedule(req.schedule_subject!, `service:${caller}`);
          return { disarmed: true };
        },
      } as const,
    ],
    { serviceCode: "job" },
  );

  logger.done("nats routes registered: jobs.ctl.schedule.request|cancel", { tags: ["jobs"] });
}
