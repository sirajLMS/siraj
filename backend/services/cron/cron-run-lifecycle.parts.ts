/**
 * Cron run-query and run-lifecycle implementations backing `CronService`.
 *
 * Extracted from `cron.service.ts` to keep the orchestration module within the
 * file-size limit; `CronService` re-exposes every function here under its
 * original name.
 */
import { db } from "@/backend/db/drizzleDb";
import { CronRepository } from "@/backend/db/repo/cron";
import { CronRunStatus } from "@/backend/enum/cron/cron.enums";
import { DomainError } from "@/backend/lib/errors";
import { logger } from "@/backend/lib/logger";
import { buildCronJobPayload } from "@/backend/services/cron/cron-dispatch.parts";
import { formatError } from "@/backend/services/cron/cron-utils";
import { getQueueAdapter } from "@/backend/services/cron/queue-adapter.factory";
import type { CronQueueStats, CronRunListInput, CronRunListResult, CronRunReturnType } from "@/backend/types";
import { getServerTranslations } from "@/shared/locale/server-graphql";

export async function getRunByIdImpl(id: string): Promise<CronRunReturnType | null> {
  return CronRepository.getRunById(id);
}

export async function getRunsImpl(input: CronRunListInput): Promise<CronRunListResult> {
  return CronRepository.listRuns(input);
}

export async function setRunRunningImpl(runId: string, workerId: string): Promise<boolean> {
  const updated = await CronRepository.updateRunStatus(
    runId,
    CronRunStatus.RUNNING,
    {
      workerId,
      startedAt: new Date(),
    },
    [CronRunStatus.PENDING, CronRunStatus.RETRYING]
  );
  if (!updated) {
    logger.warn("cron.run.running.skipped", { runId, workerId, reason: "statusGuard" });
    return false;
  }
  logger.info("cron.run.running", { runId, workerId });
  return true;
}

function calcDurationMs(updated: { startedAt: string | Date | null } | null, now: Date): number | undefined {
  return updated?.startedAt ? now.getTime() - new Date(updated.startedAt).getTime() : undefined;
}

type RunFinalizePatch = {
  completedAt: Date;
  errorMessage?: string;
  errorStack?: string | null;
};

type TerminalRunTransition = {
  status: CronRunStatus;
  fromStatuses: CronRunStatus[];
  logEvent: "completed" | "failed";
  errorMessage?: string;
  errorStack?: string | null;
};

/**
 * Transition a run to a terminal status inside a single transaction, updating
 * the owning schedule's `lastRunAt` on success and logging the outcome (skip
 * warn when the status guard rejects, info/error otherwise).
 */
async function applyTerminalRun(runId: string, transition: TerminalRunTransition): Promise<void> {
  const now = new Date();
  const patch: RunFinalizePatch = { completedAt: now };
  if (transition.errorMessage !== undefined) {
    patch.errorMessage = transition.errorMessage;
    patch.errorStack = transition.errorStack;
  }

  const skippedLogEvent = `cron.run.${transition.logEvent}.skipped`;
  const updated = await db.transaction(async tx => {
    const row = await CronRepository.updateRunStatus(runId, transition.status, patch, transition.fromStatuses, tx);
    if (!row) {
      logger.warn(skippedLogEvent, { runId, reason: "statusGuard" });
      return null;
    }
    await CronRepository.updateSchedule(row.scheduleId, { lastRunAt: now }, tx);
    return row;
  });

  if (updated) {
    const durationMs = calcDurationMs(updated, now);
    if (transition.logEvent === "failed") {
      logger.error("cron.run.failed", { runId, errorMessage: transition.errorMessage, durationMs });
    } else {
      logger.info("cron.run.completed", { runId, durationMs });
    }
  }
}

export async function completeRunImpl(runId: string, _result?: { success?: boolean }): Promise<void> {
  await applyTerminalRun(runId, {
    status: CronRunStatus.COMPLETED,
    fromStatuses: [CronRunStatus.RUNNING, CronRunStatus.RETRYING],
    logEvent: "completed",
  });
}

export async function failRunImpl(runId: string, errorMessage: string, errorStack?: string | null): Promise<void> {
  await applyTerminalRun(runId, {
    status: CronRunStatus.FAILED,
    fromStatuses: [CronRunStatus.PENDING, CronRunStatus.RUNNING, CronRunStatus.RETRYING],
    logEvent: "failed",
    errorMessage,
    errorStack,
  });
}

export async function retryRunImpl(
  runId: string,
  _retryBackoffSeconds: number,
  attempt: number,
  locale: string = "en"
): Promise<void> {
  const run = await CronRepository.getRunById(runId);
  if (run && (run.status === CronRunStatus.COMPLETED || run.status === CronRunStatus.CANCELLED)) {
    const t = getServerTranslations(locale);
    throw new DomainError("INVALID_RUN_STATUS", t.errorsTranslations.invalidRunStatus(run.status, runId));
  }

  const updated = await CronRepository.updateRunStatus(
    runId,
    CronRunStatus.RETRYING,
    {
      attempt,
      startedAt: new Date(),
      durationMs: null,
    },
    [CronRunStatus.RUNNING, CronRunStatus.FAILED, CronRunStatus.TIMEOUT]
  );
  if (!updated) {
    logger.warn("cron.run.retrying.skipped", { runId, attempt, reason: "statusGuard" });
    return;
  }
  logger.info("cron.run.retrying", { runId, attempt });
}

/**
 * Enqueue a retry of a failed run by runId.
 *
 * Looks up the run and its schedule, updates the DB status to RETRYING FIRST
 * (via `retryRun`), then sends the job to the queue.  If the DB update throws
 * the job is never queued so we avoid orphaned queue entries.
 */
export async function enqueueRetryImpl(runId: string, attempt?: number, locale: string = "en"): Promise<void> {
  const run = await CronRepository.getRunById(runId);
  if (!run) {
    logger.error("cron.enqueueRetry.runNotFound", { runId });
    return;
  }

  const schedule = await CronRepository.getScheduleById(run.scheduleId);
  if (!schedule) {
    logger.error("cron.enqueueRetry.scheduleNotFound", { runId, scheduleId: run.scheduleId });
    return;
  }

  const nextAttempt = attempt ?? run.attempt + 1;

  // DB first: update run status to RETRYING before queueing.
  // If this throws (e.g. status guard rejects COMPLETED/CANCELLED), don't queue.
  await retryRunImpl(runId, schedule.retryBackoffSeconds ?? 60, nextAttempt, locale);

  const payload = buildCronJobPayload(schedule, { runId }, schedule.payload);
  payload.attempt = nextAttempt;

  const adapter = await getQueueAdapter();
  try {
    await adapter.send(payload);
  } catch (err) {
    logger.error("cron.enqueueRetry.sendFailed", {
      runId,
      attempt: nextAttempt,
      error: formatError(err),
    });
    const t = getServerTranslations(locale).dashboardTranslations.cron.errors;
    await CronRepository.updateRunStatus(
      runId,
      CronRunStatus.FAILED,
      {
        errorMessage: formatError(err),
      },
      [CronRunStatus.RETRYING]
    );
    throw new DomainError("ENQUEUE_RETRY_FAILED", t.enqueueRetryFailed(runId));
  }
}

export async function recordHeartbeatImpl(
  runId: string,
  workerId: string,
  progress?: Record<string, unknown>
): Promise<void> {
  await CronRepository.recordHeartbeat({
    runId,
    workerId,
    lastBeatAt: new Date(),
    progress: progress ?? {},
  });
}

export async function reconcileStuckRunsImpl(params: { now: Date; batch?: number }): Promise<number> {
  const { now, batch = 100 } = params;
  const timeoutCount = await CronRepository.reconcileStuckRuns(now, batch);
  if (timeoutCount > 0) {
    logger.warn("cron.reconcile.stuckRuns", { timeoutCount, now: now.toISOString() });
  }
  return timeoutCount;
}

export async function getQueueStatsImpl(): Promise<CronQueueStats> {
  const adapter = await getQueueAdapter();
  return adapter.getQueueStats();
}
