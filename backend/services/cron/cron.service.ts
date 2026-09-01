/**
 * CronService — Single orchestration layer for cron schedules + dispatch + history.
 *
 * All DB access via `CronRepository` — service never touches Drizzle directly.
 * All user-facing errors use typed translation functions (never hardcoded strings).
 * Logging is structured via `@/backend/lib/logger`.
 */

import { db } from "@/backend/db/drizzleDb";
import { CronRepository, toScheduleReturnType } from "@/backend/db/repo/cron";
import {
  CronConcurrencyPolicy,
  CronRunStatus,
  CronScheduleStatus,
  type CronTriggerSource,
  parseCronConcurrencyPolicy,
} from "@/backend/enum/cron/cron.enums";
import { DomainError, ForbiddenError, NotFoundError, UnauthorizedError } from "@/backend/lib/errors";
import { logger } from "@/backend/lib/logger";
import { safeCronJobKind } from "@/backend/services/cron/cron.helpers";
import { CRON_DEFAULT_BATCH_SIZE, parsePositiveInt } from "@/backend/services/cron/cron-env";
import {
  InvalidCronExpression,
  nextRunAt,
  validateCronExpression,
} from "@/backend/services/cron/cron-scheduler.engine";
import { formatError } from "@/backend/services/cron/cron-utils";
import { getQueueAdapter } from "@/backend/services/cron/queue-adapter.factory";
import { isDuplicateError } from "@/backend/services/shared/is-duplicate-error";
import { resolveEnvConfig } from "@/backend/services/system";
import type {
  CronJobPayload,
  CronQueueStats,
  CronRunListInput,
  CronRunListResult,
  CronRunReturnType,
  CronScheduleInsertType,
  CronScheduleListInput,
  CronScheduleListResult,
  CronScheduleReturnType,
  CronScheduleSelectType,
  CronScheduleSubmitInput,
  CronScheduleUpdateInput,
  DBTransaction,
  DispatchByIdResult,
  DispatchDueResult,
} from "@/backend/types";
import { getServerTranslations } from "@/shared/locale/server-graphql";

export namespace CronService {
  // ── Schedule CRUD ──

  export async function createSchedule(
    input: CronScheduleSubmitInput,
    locale: string = "en",
    createdByUserId?: string
  ): Promise<CronScheduleReturnType> {
    const translations = getServerTranslations(locale);
    const t = translations.dashboardTranslations.cron.errors;

    if (!createdByUserId) {
      throw new UnauthorizedError(t.userContextRequired);
    }

    if (!validateCronExpression(input.cronExpression)) {
      throw new InvalidCronExpression(input.cronExpression, t.invalidCronExpression(input.cronExpression));
    }

    if (input.timezone) {
      validateTimezone(input.timezone, t.invalidTimezone);
    } else {
      // Timezone is always present in valid input; throw error if missing
      throw new DomainError("INVALID_TIMEZONE", t.invalidTimezone("undefined"));
    }

    const computedNextRunAt = nextRunAt(input.cronExpression, new Date(), input.timezone);

    // Pre-check for existing schedule name (fast path)
    const existing = await CronRepository.getScheduleByName(input.name);
    if (existing) {
      throw new DomainError("SCHEDULE_NAME_TAKEN", t.scheduleNameTaken(input.name));
    }

    const insertData: CronScheduleInsertType = {
      ...input,
      createdByUserId,
      nextRunAt: computedNextRunAt,
      status: CronScheduleStatus.ACTIVE,
    };

    let row: CronScheduleSelectType;
    try {
      row = await CronRepository.createSchedule(insertData);
    } catch (err) {
      if (isDuplicateError(err)) {
        throw new DomainError("SCHEDULE_NAME_TAKEN", t.scheduleNameTaken(input.name), { cause: err });
      }
      throw err;
    }
    logger.info("cron.schedule.created", { id: row.id, name: row.name });

    return toScheduleReturnType(row);
  }

  export async function updateSchedule(
    id: string,
    input: CronScheduleUpdateInput,
    locale: string = "en",
    updatedByUserId?: string
  ): Promise<CronScheduleReturnType> {
    const translations = getServerTranslations(locale);
    const t = translations.dashboardTranslations.cron.errors;

    if (!updatedByUserId) {
      throw new UnauthorizedError(t.userContextRequired);
    }

    const existing = await CronRepository.getScheduleById(id);
    if (!existing) {
      throw new NotFoundError("SCHEDULE", t.scheduleNotFound(id));
    }

    if (input.cronExpression && !validateCronExpression(input.cronExpression)) {
      throw new InvalidCronExpression(input.cronExpression, t.invalidCronExpression(input.cronExpression));
    }

    if (input.timezone) {
      validateTimezone(input.timezone, t.invalidTimezone);
    }

    const cronChanged = input.cronExpression && input.cronExpression !== existing.cronExpression;
    const tzChanged = input.timezone && input.timezone !== existing.timezone;
    const shouldRecompute = cronChanged ?? tzChanged;

    const updateData: CronScheduleUpdateInput = { ...input };
    if (shouldRecompute && existing.status === (CronScheduleStatus.ACTIVE as typeof existing.status)) {
      updateData.nextRunAt = nextRunAt(
        input.cronExpression ?? existing.cronExpression,
        new Date(),
        input.timezone ?? existing.timezone
      );
    }

    const row = await CronRepository.updateSchedule(id, { ...updateData, updatedByUserId });
    if (!row) {
      throw new NotFoundError("SCHEDULE", t.scheduleNotFound(id));
    }

    logger.info("cron.schedule.updated", { id });
    return toScheduleReturnType(row);
  }

  export async function pauseSchedule(id: string, locale: string = "en"): Promise<CronScheduleReturnType> {
    const t = getScheduleErrorTranslations(locale);
    await assertScheduleExists(id, t);

    const updated = await CronRepository.updateScheduleIfStatus(
      id,
      {
        status: CronScheduleStatus.PAUSED,
        nextRunAt: null,
      },
      CronScheduleStatus.ACTIVE
    );
    if (!updated) {
      throw new ForbiddenError(t.scheduleNotActive);
    }

    logger.info("cron.schedule.paused", { id });
    return toScheduleReturnType(updated);
  }

  export async function resumeSchedule(id: string, locale: string = "en"): Promise<CronScheduleReturnType> {
    const t = getScheduleErrorTranslations(locale);
    const existing = await assertScheduleExists(id, t);

    const computedNextRunAt = nextRunAt(existing.cronExpression, new Date(), existing.timezone);

    const updated = await CronRepository.updateScheduleIfStatus(
      id,
      {
        status: CronScheduleStatus.ACTIVE,
        nextRunAt: computedNextRunAt,
      },
      CronScheduleStatus.PAUSED
    );
    if (!updated) {
      throw new ForbiddenError(t.scheduleNotPaused);
    }

    logger.info("cron.schedule.resumed", { id, nextRunAt: computedNextRunAt });
    return toScheduleReturnType(updated);
  }

  export async function deleteSchedule(params: { id: string; hard?: boolean }, locale: string = "en"): Promise<void> {
    const translations = getServerTranslations(locale);
    const t = translations.dashboardTranslations.cron.errors;
    const existing = await CronRepository.getScheduleById(params.id);
    if (!existing) {
      throw new NotFoundError("SCHEDULE", t.scheduleNotFound(params.id));
    }

    if (params.hard) {
      await CronRepository.permanentlyDeleteScheduleById(params.id);
    } else {
      await CronRepository.softDeleteScheduleById(params.id);
    }
    logger.info("cron.schedule.deleted", { id: params.id, hard: params.hard ?? false });
  }

  export async function getSchedule(id: string): Promise<CronScheduleReturnType | null> {
    const row = await CronRepository.getScheduleById(id);
    return row ? toScheduleReturnType(row) : null;
  }

  export async function getSchedules(input: CronScheduleListInput = {}): Promise<CronScheduleListResult> {
    return CronRepository.listSchedules(input);
  }

  // ── Run queries ──

  export async function getRunById(id: string): Promise<CronRunReturnType | null> {
    return CronRepository.getRunById(id);
  }

  export async function getRuns(input: CronRunListInput): Promise<CronRunListResult> {
    return CronRepository.listRuns(input);
  }

  // ── Dispatch ──

  export async function dispatchDueSchedules(params: {
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

  export async function dispatchScheduleById(
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

  // ── Run lifecycle (called by worker runtime) ──

  export async function setRunRunning(runId: string, workerId: string): Promise<boolean> {
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

  export async function completeRun(runId: string, _result?: { success?: boolean }): Promise<void> {
    const now = new Date();

    const runner = async (tx: DBTransaction) => {
      const updated = await CronRepository.updateRunStatus(
        runId,
        CronRunStatus.COMPLETED,
        {
          completedAt: now,
        },
        [CronRunStatus.RUNNING, CronRunStatus.RETRYING],
        tx
      );
      if (updated) {
        await CronRepository.updateSchedule(updated.scheduleId, { lastRunAt: now }, tx);
        return updated;
      }
      logger.warn("cron.run.completed.skipped", { runId, reason: "statusGuard" });
      return null;
    };

    const updated = await db.transaction(runner);
    if (updated) {
      logger.info("cron.run.completed", { runId, durationMs: calcDurationMs(updated, now) });
    }
  }

  export async function failRun(runId: string, errorMessage: string, errorStack?: string | null): Promise<void> {
    const now = new Date();

    const runner = async (tx: DBTransaction) => {
      const updated = await CronRepository.updateRunStatus(
        runId,
        CronRunStatus.FAILED,
        {
          completedAt: now,
          errorMessage,
          errorStack,
        },
        [CronRunStatus.PENDING, CronRunStatus.RUNNING, CronRunStatus.RETRYING],
        tx
      );
      if (updated) {
        await CronRepository.updateSchedule(updated.scheduleId, { lastRunAt: now }, tx);
        return updated;
      }
      logger.warn("cron.run.failed.skipped", { runId, reason: "statusGuard" });
      return null;
    };

    const updated = await db.transaction(runner);
    if (updated) {
      logger.error("cron.run.failed", { runId, errorMessage, durationMs: calcDurationMs(updated, now) });
    }
  }

  export async function retryRun(
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
  export async function enqueueRetry(runId: string, attempt?: number, locale: string = "en"): Promise<void> {
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
    await retryRun(runId, schedule.retryBackoffSeconds ?? 60, nextAttempt, locale);

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

  export async function recordHeartbeat(
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

  // ── Reconciliation ──

  export async function reconcileStuckRuns(params: { now: Date; batch?: number }): Promise<number> {
    const { now, batch = 100 } = params;
    const timeoutCount = await CronRepository.reconcileStuckRuns(now, batch);
    if (timeoutCount > 0) {
      logger.warn("cron.reconcile.stuckRuns", { timeoutCount, now: now.toISOString() });
    }
    return timeoutCount;
  }

  // ── Queue stats ──

  export async function getQueueStats(): Promise<CronQueueStats> {
    const adapter = await getQueueAdapter();
    return adapter.getQueueStats();
  }

  // ── Utilities ──
}

// ── Helpers ──

function buildCronJobPayload(
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

function validateTimezone(timezone: string, errFn: (tz: string) => string): void {
  try {
    // Intl.DateTimeFormat throws if timezone is invalid; we don't need the instance
    Intl.DateTimeFormat(undefined, { timeZone: timezone });
  } catch (err) {
    throw new DomainError("INVALID_TIMEZONE", errFn(timezone), { cause: err });
  }
}

type CronScheduleErrors = ReturnType<typeof getServerTranslations>["dashboardTranslations"]["cron"]["errors"];

function getScheduleErrorTranslations(locale: string): CronScheduleErrors {
  return getServerTranslations(locale).dashboardTranslations.cron.errors;
}

async function assertScheduleExists(id: string, t: CronScheduleErrors): Promise<CronScheduleSelectType> {
  const existing = await CronRepository.getScheduleById(id);
  if (!existing) {
    throw new NotFoundError("SCHEDULE", t.scheduleNotFound(id));
  }
  return existing;
}

const IN_FLIGHT_RUN_STATUSES = [CronRunStatus.RUNNING, CronRunStatus.PENDING, CronRunStatus.RETRYING] as const;

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
