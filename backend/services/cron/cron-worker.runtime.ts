/**
 * Cron Worker Runtime — drains the queue, dispatches each job to its handler,
 * updates `cron_runs`.
 *
 * Designed for **in-process** use inside the `ticker` route (default); same code
 * supports a future `bun scripts/cron-worker.ts` — only the harness differs.
 *
 * Clock: a `Date.now()` deadline computed up-front; loop exits when deadline reached.
 * Heartbeat: written periodically via `computeHeartbeatMs(timeoutSeconds)` (shared
 * utility — same formula as the pg-boss adapter's `computeHeartbeatSeconds`).
 */
import { DomainError } from "@/backend/lib/errors";
import { logger } from "@/backend/lib/logger";
import { CronService } from "@/backend/services/cron/cron.service";
import {
  CRON_DEFAULT_BATCH_SIZE,
  CRON_DEFAULT_WORKER_TIMEOUT_MS,
  CRON_SAFETY_MARGIN_MS,
} from "@/backend/services/cron/cron-env";
import { computeHeartbeatMs } from "@/backend/services/cron/cron-heartbeat.utils";
import { computeBackoffSeconds } from "@/backend/services/cron/cron-scheduler.engine";
import { formatError } from "@/backend/services/cron/cron-utils";
import { getHandler } from "@/backend/services/cron/job-handler-registry";
import { getQueueAdapter } from "@/backend/services/cron/queue-adapter.factory";
import type {
  CronJobHandler,
  CronJobPayload,
  CronQueueAdapter,
  WorkerDrainResult,
} from "@/backend/types/cron/cron.types";

const DEFAULT_CONCURRENCY = 4;
const HEARTBEAT_MIN_MS = 1_000;
const MIN_TIMEOUT_SECONDS = 1;

/** Error thrown when a job exceeds its `timeoutSeconds` deadline. */
export class JobTimeoutError extends DomainError {
  constructor(message: string) {
    super("JOB_TIMEOUT", message);
    this.name = "JobTimeoutError";
  }
}

function getWorkerId(): string {
  return process.env.WORKER_ID ?? `worker-${process.pid}`;
}

export async function runDrainLoop(
  params: { maxDurationMs?: number; batchSize?: number; concurrency?: number } = {}
): Promise<WorkerDrainResult> {
  const {
    maxDurationMs = CRON_DEFAULT_WORKER_TIMEOUT_MS,
    batchSize = CRON_DEFAULT_BATCH_SIZE,
    concurrency = DEFAULT_CONCURRENCY,
  } = params;

  // Apply 30s safety margin to maxDuration (REQ-8 AC2).
  // CRON_DEFAULT_WORKER_TIMEOUT_MS (270_000) already includes the margin.
  // For explicitly-passed values >= 60s, subtract the 30s margin.
  // Values < 60s are treated as test/debug shortcuts (no margin needed).
  const effectiveMaxMs =
    maxDurationMs === CRON_DEFAULT_WORKER_TIMEOUT_MS || maxDurationMs < 60_000
      ? maxDurationMs
      : maxDurationMs - CRON_SAFETY_MARGIN_MS;
  const deadline = Date.now() + effectiveMaxMs;
  const adapter = await getQueueAdapter();

  const result: WorkerDrainResult = {
    processed: 0,
    failed: 0,
    retried: 0,
  };

  logger.info("cron.worker.drain.start", { maxDurationMs, batchSize });

  while (Date.now() < deadline) {
    const jobs = await adapter.fetch({ count: batchSize });
    if (jobs.length === 0) {
      logger.info("cron.worker.drain.queueEmpty", { processed: result.processed });
      break;
    }

    // Process up to `concurrency` jobs in parallel (bounded concurrency)
    const cap = Math.max(1, Math.min(concurrency, jobs.length));
    for (let i = 0; i < jobs.length; i += cap) {
      const batch = jobs.slice(i, i + cap);
      await Promise.all(
        batch.map(job =>
          processJob(job, adapter, deadline, result).catch(err => {
            // Guard against unexpected errors from processJob itself (e.g. handleJobError failing)
            logger.error("cron.worker.jobProcessingCrashed", {
              runId: job.runId,
              jobKind: job.jobKind,
              error: formatError(err),
            });
            result.failed++;
          })
        )
      );
      if (Date.now() >= deadline) break;
    }
  }

  logger.info("cron.worker.drain.done", {
    processed: result.processed,
    failed: result.failed,
    retried: result.retried,
  });

  return result;
}

/**
 * Process a single job — contains all per-job logic extracted from the drain loop
 * so that bounded-concurrency `Promise.all` can dispatch multiple jobs in parallel.
 * Never throws: all errors are caught and logged so one job failure doesn't abort the batch.
 */
async function handleMissingHandler(
  job: CronJobPayload,
  adapter: CronQueueAdapter,
  result: WorkerDrainResult
): Promise<void> {
  logger.error("cron.worker.noHandler", { jobKind: job.jobKind, runId: job.runId });
  try {
    await CronService.failRun(job.runId, `No handler registered for jobKind=${job.jobKind}`);
  } catch (err) {
    logger.error("cron.worker.failRunCrashed", {
      runId: job.runId,
      error: formatError(err),
    });
  }
  try {
    await adapter.fail(job.queueJobId ?? job.runId, `No handler for ${job.jobKind}`);
  } catch (err) {
    logger.error("cron.worker.adapterFailCrashed", {
      runId: job.runId,
      error: formatError(err),
    });
  }
  result.failed++;
}

async function processJob(
  job: CronJobPayload,
  adapter: CronQueueAdapter,
  deadline: number,
  result: WorkerDrainResult
): Promise<void> {
  const handler = getHandler(job.jobKind);
  const workerId = getWorkerId();

  if (!handler) {
    await handleMissingHandler(job, adapter, result);
    return;
  }

  // Guard against zero timeoutSeconds — enforce minimum of 1 second
  const safeTimeoutSeconds = Math.max(MIN_TIMEOUT_SECONDS, job.timeoutSeconds);
  const heartbeatMs = Math.max(HEARTBEAT_MIN_MS, computeHeartbeatMs(safeTimeoutSeconds));

  try {
    const jobTimeoutMs = safeTimeoutSeconds * 1000;
    const jobDeadline = Math.min(deadline, Date.now() + jobTimeoutMs);

    // setRunRunning returns false when the repository's status guard skipped
    // the update (e.g. the run was already claimed by another worker). In that
    // case the run is still in PENDING/RETRYING and completeRun/failRun would
    // silently no-op (they guard on RUNNING/RETRYING), leaving the run stuck.
    // Skip processing to avoid that stuck state.
    const running = await CronService.setRunRunning(job.runId, workerId);
    if (!running) {
      logger.info("cron.worker.jobSkipped", { runId: job.runId, workerId });
      return;
    }

    await runJobWithHeartbeat(job, handler, {
      heartbeatMs,
      jobDeadline,
      onHeartbeat: async progress => {
        await CronService.recordHeartbeat(job.runId, workerId, progress);
      },
    });

    await CronService.completeRun(job.runId, { success: true });
    await adapter.complete(job.queueJobId ?? job.runId);
    result.processed++;
  } catch (err) {
    try {
      await handleJobError(job, adapter, err, result);
    } catch (nestedErr) {
      // handleJobError itself failed — log and count as failed, don't abort the batch
      logger.error("cron.worker.handleJobErrorCrashed", {
        runId: job.runId,
        error: formatError(nestedErr),
      });
      result.failed++;
    }
  }
}

/**
 * Log a retry-path failure using the consistent `cron.worker` logger pattern.
 * Used for both `retryRun` and `adapter.retry` failures so both emit the same
 * structured event shape.
 */
function logRetryFailure(tag: string, runId: string, err: unknown): void {
  logger.error("cron.worker", `${tag} failed for run ${runId}: ${formatError(err)}`);
}

async function handleJobError(
  job: CronJobPayload,
  adapter: CronQueueAdapter,
  err: unknown,
  result: WorkerDrainResult
): Promise<void> {
  const isTimeout = err instanceof JobTimeoutError;
  // An AbortError (e.g. worker shutdown / SIGTERM) is NOT a job-level timeout.
  // Classify it separately so the run is eligible for retry rather than being
  // permanently marked as a non-retryable timeout failure.
  const isAbortError =
    err instanceof Error && (err.name === "AbortError" || (err as NodeJS.ErrnoException).code === "ABORT_ERR");
  const errorMessage = formatError(err);
  const errorStack = err instanceof Error ? (err.stack ?? null) : null;

  if (isTimeout) {
    logger.warn("cron.worker.jobTimedOut", { runId: job.runId, timeoutSeconds: job.timeoutSeconds });
  } else {
    logger.error("cron.worker.handlerFailed", { runId: job.runId, error: errorMessage });
  }

  const maxRetries = job.maxRetries ?? 3;
  // Retry only when the initial attempt doesn't count toward the retry budget:
  // attempt 1 is the first execution, so retries happen when (attempt - 1) < maxRetries.
  // This gives `maxRetries` retries AFTER the initial run (maxRetries + 1 total executions).
  // Timeouts should not be retried — the job already exhausted its time budget.
  // AbortError (shutdown) IS retryable — it's not a job-level timeout.
  const isRetryableFailure = !isTimeout || isAbortError;
  const shouldRetry = isRetryableFailure && job.attempt - 1 < maxRetries;

  if (shouldRetry) {
    const backoff = computeBackoffSeconds(job.retryBackoffSeconds ?? 60, job.attempt);
    // DB first: update run status to RETRYING before queueing.
    // If the DB update throws, don't enqueue the retry — avoids orphaned jobs.
    try {
      await CronService.retryRun(job.runId, backoff, job.attempt + 1);
    } catch (caughtErr) {
      logRetryFailure("retryRun", job.runId, caughtErr);
      return;
    }
    try {
      await adapter.retry(job.queueJobId ?? job.runId, backoff, job.attempt + 1);
    } catch (caughtErr) {
      logRetryFailure("adapter.retry", job.runId, caughtErr);
    }
    result.retried++;
  } else {
    // DB first: mark the run as FAILED before failing the queue job.
    // If failRun throws, the queue job stays in-flight and can be re-processed
    // rather than leaving the DB stuck in RUNNING while the queue is failed.
    try {
      await CronService.failRun(job.runId, errorMessage, errorStack);
    } catch (caughtErr) {
      logger.error("cron.worker", `failRun failed for run ${job.runId}: ${formatError(caughtErr)}`);
    }
    try {
      await adapter.fail(job.queueJobId ?? job.runId, errorMessage, errorStack ?? undefined);
    } catch (caughtErr) {
      logger.error("cron.worker", `adapter.fail failed for job ${job.queueJobId}: ${formatError(caughtErr)}`);
    }
    result.failed++;
  }
}

function classifyAndThrowError(err: unknown, abortController: AbortController): never {
  if (err instanceof JobTimeoutError) {
    throw err;
  }
  if (abortController.signal.aborted) {
    // If our own timeout timer aborted the signal, the error should already be
    // a JobTimeoutError (caught above). If it's a different error (e.g. an
    // AbortError from the handler reacting to the abort signal), preserve the
    // original error so handleJobError can classify it as a retryable AbortError
    // rather than a non-retryable timeout.
    if (err instanceof Error && (err.name === "AbortError" || (err as NodeJS.ErrnoException).code === "ABORT_ERR")) {
      throw err;
    }
    // Signal aborted but error isn't an AbortError — treat as timeout.
    throw new JobTimeoutError(formatError(err));
  }
  if (err instanceof Error && err.message.includes("timed out")) {
    throw new JobTimeoutError(err.message);
  }
  throw err;
}

async function runJobWithHeartbeat(
  job: CronJobPayload,
  handler: CronJobHandler,
  opts: {
    heartbeatMs: number;
    jobDeadline: number;
    onHeartbeat: (progress?: Record<string, unknown>) => Promise<void>;
  }
): Promise<void> {
  const { heartbeatMs, jobDeadline, onHeartbeat } = opts;

  let resolved = false;
  let handlerCompleted = false;
  let heartbeatTimer: ReturnType<typeof setTimeout> | null = null;
  let timeoutTimer: ReturnType<typeof setTimeout> | null = null;
  const abortController = new AbortController();
  const jobTimeoutMs = Math.max(0, jobDeadline - Date.now());

  function stopHeartbeat(): void {
    if (heartbeatTimer) {
      clearTimeout(heartbeatTimer);
      heartbeatTimer = null;
    }
  }

  function clearTimeoutTimer(): void {
    if (timeoutTimer) {
      clearTimeout(timeoutTimer);
      timeoutTimer = null;
    }
  }

  try {
    const handlerPromise = handler(job, { signal: abortController.signal });

    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutTimer = setTimeout(() => {
        abortController.abort();
        reject(new JobTimeoutError(`Job timed out after ${jobTimeoutMs}ms`));
      }, jobTimeoutMs);
    });

    // Start heartbeat ticker — setTimeout recursion guarantees non-overlapping ticks
    const scheduleHeartbeat = (): void => {
      if (resolved) return;
      if (Date.now() >= jobDeadline) {
        logger.warn("cron.worker.jobTimeout", { runId: job.runId, jobDeadline });
        return;
      }
      heartbeatTimer = setTimeout(async () => {
        if (resolved) return;
        try {
          await onHeartbeat({ tick: Date.now() });
        } catch (err) {
          logger.warn("cron.worker.heartbeatFailed", {
            runId: job.runId,
            error: formatError(err),
          });
        }
        if (!resolved) scheduleHeartbeat();
      }, heartbeatMs);
    };

    scheduleHeartbeat();

    try {
      const handlerResult = await Promise.race([handlerPromise, timeoutPromise]);

      resolved = true;
      stopHeartbeat();
      clearTimeoutTimer();
      handlerCompleted = true;

      if (!handlerResult?.success) {
        throw new DomainError("JOB_HANDLER_FAILED", handlerResult?.error ?? "Handler returned failure");
      }
    } catch (err) {
      resolved = true;
      stopHeartbeat();
      clearTimeoutTimer();
      classifyAndThrowError(err, abortController);
    }
  } finally {
    resolved = true;
    stopHeartbeat();
    clearTimeoutTimer();
    // Only abort on timeout — aborting after success or non-timeout errors
    // forces abort signals on handlers that completed normally.
    if (!handlerCompleted && !abortController.signal.aborted && Date.now() >= jobDeadline) {
      abortController.abort();
    }
  }
}
