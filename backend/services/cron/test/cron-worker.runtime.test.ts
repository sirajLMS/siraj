import { afterEach, describe, expect, mock, test } from "bun:test";
import { CronJobKind } from "@/backend/enum/cron/cron.enums";
import type { CronJobPayload } from "@/backend/types/cron/cron.types";

// ── Mock state ──
let completeCalls: string[] = [];
let failCalls: { jobId: string; error: string }[] = [];
let setRunRunningCalls: { runId: string; workerId: string }[] = [];
let completeRunCalls: string[] = [];
let failRunCalls: { runId: string; error: string }[] = [];
let retryRunCalls: { runId: string; backoff: number; attempt: number }[] = [];
let heartbeatCalls: { runId: string; workerId: string }[] = [];
let retryCalls: { jobId: string; delaySeconds: number; newAttempt?: number }[] = [];
let queuedJobs: CronJobPayload[] = [];
let jobCounter = 0;

void mock.module("@/backend/services/cron/queue-adapter.factory", () => ({
  getQueueAdapter: async () => ({
    init: async () => {},
    send: async () => "mock-queue-id",
    fetch: async ({ count }: { count: number }) => {
      const jobs = queuedJobs.slice(0, count);
      queuedJobs = queuedJobs.slice(count);
      return jobs;
    },
    complete: async (jobId: string) => {
      completeCalls.push(jobId);
    },
    fail: async (jobId: string, error: string) => {
      failCalls.push({ jobId, error });
    },
    retry: async (jobId: string, delaySeconds: number, newAttempt?: number) => {
      retryCalls.push({ jobId, delaySeconds, newAttempt });
    },
    getQueueStats: async () => ({ pending: 0, inFlight: 0, failed: 0, byJobKind: {} }),
    shutdown: async () => {},
  }),
  resolveQueueBackend: async () => "PG_BOSS",
}));

void mock.module("@/backend/services/cron/cron.service", () => ({
  CronService: {
    setRunRunning: async (runId: string, workerId: string) => {
      setRunRunningCalls.push({ runId, workerId });
      return true;
    },
    completeRun: async (runId: string) => {
      completeRunCalls.push(runId);
    },
    failRun: async (runId: string, error: string) => {
      failRunCalls.push({ runId, error });
    },
    retryRun: async (runId: string, backoff: number, attempt: number) => {
      retryRunCalls.push({ runId, backoff, attempt });
    },
    recordHeartbeat: async (runId: string, workerId: string) => {
      heartbeatCalls.push({ runId, workerId });
    },
  },
}));

void mock.module("@/backend/services/cron/job-handler-registry", () => ({
  getHandler: (kind: string) => {
    if (kind === "NOOP") return async () => ({ success: true });
    if (kind === "SLOW_NOOP")
      return async () => {
        await new Promise(resolve => setTimeout(resolve, 1100));
        return { success: true };
      };
    if (kind === "FAILING")
      return async () => {
        throw new Error("handler boom");
      };
    return null;
  },
  registerCoreHandlers: () => {},
}));

const { runDrainLoop } = await import("@/backend/services/cron/cron-worker.runtime");

function makeJob(
  overrides: Partial<Omit<CronJobPayload, "jobKind" | "queueJobId">> & { jobKind?: string; queueJobId?: string } = {}
): CronJobPayload & { queueJobId: string } {
  const { jobKind, queueJobId, ...rest } = overrides;
  return {
    runId: `run-${++jobCounter}`,
    scheduleId: "sched-1",
    jobKind: jobKind ?? CronJobKind.NOOP,
    payload: null,
    attempt: 1,
    timeoutSeconds: 300,
    queueJobId: queueJobId ?? `qj-${jobCounter}`,
    maxRetries: 3,
    retryBackoffSeconds: 60,
    ...rest,
  } as CronJobPayload & { queueJobId: string };
}

afterEach(() => {
  completeCalls = [];
  failCalls = [];
  setRunRunningCalls = [];
  completeRunCalls = [];
  failRunCalls = [];
  retryRunCalls = [];
  retryCalls = [];
  heartbeatCalls = [];
  queuedJobs = [];
  // Clear any lingering worker ID
  delete process.env.WORKER_ID;
});

describe("cron-worker.runtime", () => {
  test("processes a successful job: sets RUNNING, completes queue + run", async () => {
    const job = makeJob();
    queuedJobs = [job];

    const result = await runDrainLoop({ maxDurationMs: 1000, batchSize: 5 });

    expect(result.processed).toBe(1);
    expect(result.failed).toBe(0);
    expect(setRunRunningCalls).toHaveLength(1);
    expect(setRunRunningCalls[0].runId).toBe(job.runId);
    expect(completeCalls).toContain(job.queueJobId);
    expect(completeRunCalls).toContain(job.runId);
  });

  test("uses queueJobId for adapter.complete, NOT runId", async () => {
    const job = makeJob({ queueJobId: "qj-explicit-123" });
    queuedJobs = [job];

    await runDrainLoop({ maxDurationMs: 1000, batchSize: 5 });

    expect(completeCalls).toContain("qj-explicit-123");
    expect(completeCalls).not.toContain(job.runId);
  });

  test("uses queueJobId for adapter.fail when retries are exhausted", async () => {
    const job = makeJob({
      jobKind: "FAILING",
      queueJobId: "qj-fail-456",
      attempt: 4,
      maxRetries: 3,
    });
    queuedJobs = [job];

    const result = await runDrainLoop({ maxDurationMs: 1000, batchSize: 5 });

    expect(failCalls.some(c => c.jobId === "qj-fail-456")).toBe(true);
    expect(failRunCalls.some(c => c.runId === job.runId)).toBe(true);
    expect(result.failed).toBe(1);
    expect(result.retried).toBe(0);
  });

  test("retries with exponential backoff using job.maxRetries and retryBackoffSeconds", async () => {
    const job = makeJob({
      jobKind: "FAILING",
      attempt: 1,
      maxRetries: 5,
      retryBackoffSeconds: 30,
    });
    queuedJobs = [job];

    const result = await runDrainLoop({ maxDurationMs: 1000, batchSize: 5 });

    expect(retryRunCalls).toHaveLength(1);
    expect(retryRunCalls[0].attempt).toBe(2);
    expect(retryRunCalls[0].backoff).toBe(30);
    expect(retryCalls).toHaveLength(1);
    expect(retryCalls[0].newAttempt).toBe(2);
    expect(result.retried).toBe(1);
    expect(result.failed).toBe(0);
  });

  test("does not retry when attempt > maxRetries (initial run counts as attempt 1)", async () => {
    const job = makeJob({
      jobKind: "FAILING",
      attempt: 4,
      maxRetries: 3,
    });
    queuedJobs = [job];

    const result = await runDrainLoop({ maxDurationMs: 1000, batchSize: 5 });

    expect(retryRunCalls).toHaveLength(0);
    expect(result.failed).toBe(1);
  });

  test("marks run FAILED and fails queue job when no handler is registered", async () => {
    const job = makeJob({ jobKind: "UNREGISTERED", queueJobId: "qj-no-handler" });
    queuedJobs = [job];

    await runDrainLoop({ maxDurationMs: 1000, batchSize: 5 });

    expect(failRunCalls.some(c => c.runId === job.runId)).toBe(true);
    expect(failCalls.some(c => c.jobId === "qj-no-handler")).toBe(true);
  });

  test("uses workerId from env WORKER_ID for setRunRunning", async () => {
    // heartbeatMs = Math.min(60000, 4 * 1000 / 4) = 1000ms; SLOW_NOOP takes 400ms…
    // We need heartbeat to fire BEFORE handler resolves, so use shorter timeout:
    // timeoutSeconds: 2 → heartbeatMs = 500ms, SLOW_NOOP takes 400ms → still too fast.
    // Use timeoutSeconds: 4 → heartbeatMs = 1000ms, SLOW_NOOP takes 400ms → still too fast.
    // Bigger: timeoutSeconds: 4, handlerDelay 1100ms → heartbeat at 1000ms, handler at 1100ms ✓
    const job = makeJob({ jobKind: "SLOW_NOOP", timeoutSeconds: 4 });
    queuedJobs = [job];

    process.env.WORKER_ID = "test-worker-abc";
    await runDrainLoop({ maxDurationMs: 5000, batchSize: 5 });

    expect(setRunRunningCalls[0].workerId).toBe("test-worker-abc");
    expect(heartbeatCalls.length).toBeGreaterThanOrEqual(1);
    expect(heartbeatCalls[0].workerId).toBe("test-worker-abc");
  });

  test("deadline stop leaves remaining jobs in queue", async () => {
    // 3 SLOW_NOOP jobs (each ~1100ms), deadline 1500ms, batch size 1.
    // First job completes (~1100ms < 1500ms deadline), second job times out
    // (only ~400ms budget left → 1100ms handler exceeds it), then the overall
    // deadline is reached and the loop exits — leaving the 3rd job untouched.
    const jobs = [
      makeJob({ jobKind: "SLOW_NOOP", timeoutSeconds: 300 }),
      makeJob({ jobKind: "SLOW_NOOP", timeoutSeconds: 300 }),
      makeJob({ jobKind: "SLOW_NOOP", timeoutSeconds: 300 }),
    ];
    queuedJobs = [...jobs];

    const result = await runDrainLoop({ maxDurationMs: 1500, batchSize: 1 });

    // Not all 3 jobs were processed (deadline was hit mid-way)
    expect(result.processed).toBeLessThan(3);
    // At least the first job was processed successfully
    expect(result.processed).toBeGreaterThanOrEqual(1);
    // Remaining jobs are still in the adapter's queue (not drained)
    expect(queuedJobs.length).toBeGreaterThanOrEqual(1);
    // The loop stopped due to the deadline, not because the queue was empty
    expect(queuedJobs.length).toBeGreaterThan(0);
  });

  test("returns empty result when queue is empty", async () => {
    queuedJobs = [];

    const result = await runDrainLoop({ maxDurationMs: 500, batchSize: 5 });

    expect(result.processed).toBe(0);
    expect(result.failed).toBe(0);
    expect(result.retried).toBe(0);
  });
});
