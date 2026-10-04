/**
 * Cron dispatch implementations backing `CronService`.
 *
 * Extracted from `cron.service.ts` to keep the orchestration module within the
 * file-size limit; `CronService` re-exposes the public dispatch functions under
 * their original names.
 */
import { CronRepository } from "@/backend/db/repo/cron";
import {
  CronConcurrencyPolicy,
  CronRunStatus,
  CronScheduleStatus,
  type CronTriggerSource,
  parseCronConcurrencyPolicy,
} from "@/backend/enum/cron/cron.enums";
import { DomainError, ForbiddenError } from "@/backend/lib/errors";
import { logger } from "@/backend/lib/logger";
import { safeCronJobKind } from "@/backend/services/cron/cron.helpers";
import { CRON_DEFAULT_BATCH_SIZE, parsePositiveInt } from "@/backend/services/cron/cron-env";
import { assertScheduleExists, type CronScheduleErrors } from "@/backend/services/cron/cron-schedule.parts";
import { nextRunAt } from "@/backend/services/cron/cron-scheduler.engine";
import { formatError } from "@/backend/services/cron/cron-utils";
import { getQueueAdapter } from "@/backend/services/cron/queue-adapter.factory";
import { resolveEnvConfig } from "@/backend/services/system";
import type { CronJobPayload, CronScheduleSelectType, DispatchByIdResult, DispatchDueResult } from "@/backend/types";
import { getServerTranslations } from "@/shared/locale/server-graphql";

const IN_FLIGHT_RUN_STATUSES = [CronRunStatus.RUNNING, CronRunStatus.PENDING, CronRunStatus.RETRYING] as const;

export function buildCronJobPayload(
  schedule: CronScheduleSelectType,
  claimed: { runId: string },
  payload?: Record<string, unknown> | null
): CronJobPayload {
  return {
    runId: claimed.runId,
    scheduleId: schedule.id,
    jobKind: safeCronJobKind(schedule.jobKind),
    payload: payload ?? schedule.payload,
    attempt: 1,
    timeoutSeconds: schedule.timeoutSeconds,
    maxRetries: schedule.maxRetries,
    retryBackoffSeconds: schedule.retryBackoffSeconds,
  };
}

async function resolveBatchSize(override: number): Promise<number> {
  const envValue = await resolveEnvConfig("CRON_QUEUE_MAX_BATCH");
  const envMax = parsePositiveInt(
    envValue ?? process.env.CRON_QUEUE_MAX_BATCH,
    "CRON_QUEUE_MAX_BATCH",
    CRON_DEFAULT_BATCH_SIZE
  );
  return Math.max(1, Math.min(override, envMax));
}

async function trySkipOnInFlight(scheduleId: string, concurrencyPolicy: string): Promise<DispatchByIdResult | null> {
  if (parseCronConcurrencyPolicy(concurrencyPolicy) !== CronConcurrencyPolicy.SKIP) {
    return null;
  }
  const runs = await CronRepository.listRuns({
    scheduleId,
    statuses: [...IN_FLIGHT_RUN_STATUSES],
    limit: 5,
  });
  const inFlight = runs.rows.find(r => (IN_FLIGHT_RUN_STATUSES as readonly string[]).includes(r.status));
  if (!inFlight) {
    return null;
  }
  logger.info("cron.dispatch.byId.skipped", { scheduleId, inFlightRunId: inFlight.id });
  return { runId: inFlight.id, queueJobId: null, skipped: true };
}

async function sendDispatchToQueue(
  schedule: CronScheduleSelectType,
  claimed: { runId: string },
  scheduleId: string,
  payload: Record<string, unknown> | null,
  t: CronScheduleErrors
): Promise<DispatchByIdResult> {
  const adapter = await getQueueAdapter();
  try {
    const queueJobId = await adapter.send(buildCronJobPayload(schedule, claimed, payload));
    logger.info("cron.dispatch.byId.sent", { runId: claimed.runId, scheduleId, queueJobId });
    return { runId: claimed.runId, queueJobId };
  } catch (err) {
    logger.error("cron.dispatch.byId.sendFailed", {
      runId: claimed.runId,
      scheduleId,
      error: formatError(err),
    });
    await CronRepository.updateRunStatus(
      claimed.runId,
      CronRunStatus.FAILED,
      {
        errorMessage: formatError(err),
      },
      [CronRunStatus.PENDING]
    );
    throw new DomainError("DISPATCH_SEND_FAILED", t.dispatchSendFailed(scheduleId));
  }
}

export async function dispatchDueSchedulesImpl(params: {
  now: Date;
  source: CronTriggerSource;
  batchSize?: number;
}): Promise<DispatchDueResult> {
  const { now, source, batchSize = CRON_DEFAULT_BATCH_SIZE } = params;
  const maxBatch = await resolveBatchSize(batchSize);

  logger.info("cron.dispatch.due.start", { source, now: now.toISOString(), maxBatch });

  const adapter = await getQueueAdapter();
  const dueSchedules = await CronRepository.listDueSchedules(now, maxBatch);

  const dispatchResults = await Promise.all(
    dueSchedules.map(async schedule => {
      const computedNextRunAt = nextRunAt(schedule.cronExpression, now, schedule.timezone);
      const claimed = await CronRepository.claimNextRun(schedule.id, now, source, computedNextRunAt);

      if (!claimed) {
        return { dispatched: false, skipped: true, failed: false };
      }

      try {
        const queueJobId = await adapter.send(buildCronJobPayload(schedule, claimed, schedule.payload));
        logger.info("cron.dispatch.due.sent", {
          runId: claimed.runId,
          scheduleId: schedule.id,
          queueJobId,
        });
        return { dispatched: true, skipped: false, failed: false };
      } catch (err) {
        logger.error("cron.dispatch.due.sendFailed", {
          runId: claimed.runId,
          scheduleId: schedule.id,
          error: formatError(err),
        });
        await CronRepository.updateRunStatus(
          claimed.runId,
          CronRunStatus.FAILED,
          {
            errorMessage: formatError(err),
          },
          [CronRunStatus.PENDING]
        );
        return { dispatched: false, skipped: false, failed: true };
      }
    })
  );

  const dispatched = dispatchResults.filter(r => r.dispatched).length;
  const skipped = dispatchResults.filter(r => r.skipped).length;
  const failed = dispatchResults.filter(r => r.failed).length;

  logger.info("cron.dispatch.due.done", { dispatched, skipped, failed, source });
  return { dispatched, skipped, failed };
}

export async function dispatchScheduleByIdImpl(
  params: {
    id: string;
    source: CronTriggerSource;
    payload?: Record<string, unknown> | null;
  },
  locale: string = "en"
): Promise<DispatchByIdResult> {
  const { id, source, payload } = params;
  const t = getServerTranslations(locale).dashboardTranslations.cron.errors;
  logger.info("cron.dispatch.byId.start", { scheduleId: id, source });

  const schedule = await assertScheduleExists(id, t);

  if (
    schedule.status === (CronScheduleStatus.PAUSED as typeof schedule.status) ||
    schedule.status === (CronScheduleStatus.DISABLED as typeof schedule.status)
  ) {
    throw new ForbiddenError(t.scheduleInactive);
  }

  // Manual triggers use `forceDue=true` to bypass the `nextRunAt <= now`
  // due-check inside `claimNextRun`. This eliminates the TOCTOU race that
  // occurred when `nextRunAt` was pre-updated in a separate query before the
  // claim — a concurrent ticker could see the schedule as "due" and steal the
  // run between the two steps. With `forceDue`, the claim and `nextRunAt`
  // advancement happen atomically within the same advisory-locked transaction.
  const now = new Date();
  const computedNextRunAt = nextRunAt(schedule.cronExpression, now, schedule.timezone);

  const claimed = await CronRepository.claimNextRun(
    id,
    now,
    source,
    computedNextRunAt,
    undefined,
    true,
    payload ?? undefined
  );
  if (!claimed) {
    const skipped = await trySkipOnInFlight(id, schedule.concurrencyPolicy);
    if (skipped) {
      return skipped;
    }
    throw new DomainError("CONCURRENCY_CONFLICT", t.concurrencyConflict);
  }

  return sendDispatchToQueue(schedule, claimed, id, payload ?? schedule.payload, t);
}
