/**
 * Job execution helpers for the cron worker runtime.
 *
 * Runs a single job handler under a heartbeat ticker and a hard deadline. The
 * deadline aborts the handler's signal and surfaces a `JobTimeoutError`, while
 * the heartbeat keeps `cron_runs` fresh while the handler is still working.
 */
import { DomainError } from "@/backend/lib/errors";
import { logger } from "@/backend/lib/logger";
import { formatError } from "@/backend/services/cron/cron-utils";
import type { CronJobHandler, CronJobPayload, CronJobResult } from "@/backend/types";

/** Error thrown when a job exceeds its `timeoutSeconds` deadline. */
export class JobTimeoutError extends DomainError {
  constructor(message: string) {
    super("JOB_TIMEOUT", message);
    this.name = "JobTimeoutError";
  }
}

/** Cadence and deadline for a single heartbeat-tracked job execution. */
type JobHeartbeatOptions = {
  heartbeatMs: number;
  jobDeadline: number;
  onHeartbeat: (progress?: Record<string, unknown>) => Promise<void>;
};

type HeartbeatState = {
  resolved: boolean;
  handlerCompleted: boolean;
  heartbeatTimer: ReturnType<typeof setTimeout> | null;
  timeoutTimer: ReturnType<typeof setTimeout> | null;
  abortController: AbortController;
};

function createHeartbeatState(): HeartbeatState {
  return {
    resolved: false,
    handlerCompleted: false,
    heartbeatTimer: null,
    timeoutTimer: null,
    abortController: new AbortController(),
  };
}

function stopHeartbeatTimer(state: HeartbeatState): void {
  if (state.heartbeatTimer) {
    clearTimeout(state.heartbeatTimer);
    state.heartbeatTimer = null;
  }
}

function stopTimeoutTimer(state: HeartbeatState): void {
  if (state.timeoutTimer) {
    clearTimeout(state.timeoutTimer);
    state.timeoutTimer = null;
  }
}

function stopAllTimers(state: HeartbeatState): void {
  stopHeartbeatTimer(state);
  stopTimeoutTimer(state);
}

function createTimeoutPromise(state: HeartbeatState, jobTimeoutMs: number): Promise<never> {
  return new Promise<never>((_resolve, reject) => {
    state.timeoutTimer = setTimeout(() => {
      state.abortController.abort();
      reject(new JobTimeoutError(`Job timed out after ${jobTimeoutMs}ms`));
    }, jobTimeoutMs);
  });
}

/** Emit one heartbeat and schedule the next tick, unless the job has settled. */
async function runHeartbeatTick(state: HeartbeatState, job: CronJobPayload, opts: JobHeartbeatOptions): Promise<void> {
  if (state.resolved) return;
  try {
    await opts.onHeartbeat({ tick: Date.now() });
  } catch (err) {
    logger.warn("cron.worker.heartbeatFailed", {
      runId: job.runId,
      error: formatError(err),
    });
  }
  scheduleHeartbeatTick(state, job, opts);
}

/** Schedule the next heartbeat tick. setTimeout recursion guarantees non-overlapping ticks. */
function scheduleHeartbeatTick(state: HeartbeatState, job: CronJobPayload, opts: JobHeartbeatOptions): void {
  if (state.resolved) return;
  if (Date.now() >= opts.jobDeadline) {
    logger.warn("cron.worker.jobTimeout", { runId: job.runId, jobDeadline: opts.jobDeadline });
    return;
  }
  state.heartbeatTimer = setTimeout(() => {
    void runHeartbeatTick(state, job, opts);
  }, opts.heartbeatMs);
}

/** Classify an execution error, converting aborts/deadlines into a {@link JobTimeoutError}. */
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

async function awaitHandlerOutcome(
  state: HeartbeatState,
  handlerPromise: Promise<CronJobResult>,
  timeoutPromise: Promise<never>
): Promise<void> {
  try {
    const handlerResult = await Promise.race([handlerPromise, timeoutPromise]);

    state.resolved = true;
    stopAllTimers(state);
    state.handlerCompleted = true;

    if (!handlerResult?.success) {
      throw new DomainError("JOB_HANDLER_FAILED", handlerResult?.error ?? "Handler returned failure");
    }
  } catch (err) {
    state.resolved = true;
    stopAllTimers(state);
    classifyAndThrowError(err, state.abortController);
  }
}

export async function runJobWithHeartbeat(
  job: CronJobPayload,
  handler: CronJobHandler,
  opts: JobHeartbeatOptions
): Promise<void> {
  const state = createHeartbeatState();
  const jobTimeoutMs = Math.max(0, opts.jobDeadline - Date.now());

  try {
    const handlerPromise = handler(job, { signal: state.abortController.signal });
    const timeoutPromise = createTimeoutPromise(state, jobTimeoutMs);

    scheduleHeartbeatTick(state, job, opts);
    await awaitHandlerOutcome(state, handlerPromise, timeoutPromise);
  } finally {
    state.resolved = true;
    stopAllTimers(state);
    // Only abort on timeout — aborting after success or non-timeout errors
    // forces abort signals on handlers that completed normally.
    if (!state.handlerCompleted && !state.abortController.signal.aborted && Date.now() >= opts.jobDeadline) {
      state.abortController.abort();
    }
  }
}
