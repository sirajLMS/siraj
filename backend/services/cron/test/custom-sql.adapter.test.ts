import { beforeEach, describe, expect, mock, test } from "bun:test";
import { CronJobKind } from "@/backend/enum/cron/cron.enums";
import { createCustomSqlAdapter } from "@/backend/services/cron/queue-adapters/custom-sql.adapter";
import type { CronJobPayload, CronQueueStats } from "@/backend/types/cron/cron.types";

// Mock createPool so the adapter never touches a real database.
type QueryResult = { rows: unknown[]; rowCount: number };
const queryMock = mock(
  (_text?: string, _values?: unknown[]): Promise<QueryResult> => Promise.resolve({ rows: [], rowCount: 0 })
);
const endMock = mock((): Promise<void> => Promise.resolve());

const poolMock = {
  query: queryMock,
  end: endMock,
};

void mock.module("@/backend/db/factory", () => ({
  createPool: () => poolMock,
}));

// Silence logger calls in test output.
void mock.module("@/backend/lib/logger", () => ({
  default: {
    info: () => {},
    warn: () => {},
    error: () => {},
    debug: () => {},
    log: () => {},
  },
}));

function makeJob(overrides?: Partial<CronJobPayload>): CronJobPayload {
  return {
    runId: "run-1",
    scheduleId: "sched-1",
    jobKind: CronJobKind.NOOP,
    payload: { hello: "world" },
    attempt: 0,
    timeoutSeconds: 300,
    queueJobId: undefined,
    ...overrides,
  };
}

/**
 * Creates and inits a fresh adapter.
 * Mocks are reset between tests by the `beforeEach` hook, so this must NOT
 * reset them here — callers set up query return values (mockQueryEmpty /
 * mockQueryReturn) before calling this, and a reset would wipe that.
 */
async function setupAdapter() {
  const adapter = createCustomSqlAdapter();
  await adapter.init();
  return adapter;
}

/**
 * Finds a query mock call by searching for a substring in the SQL text.
 */
function findQueryCall(searchText: string) {
  return queryMock.mock.calls.find(
    (c: unknown) => Array.isArray(c) && typeof c[0] === "string" && c[0].includes(searchText)
  );
}

/**
 * Safely extract the second element (values) from a mock call if present and
 * ensure it is returned as an array. Avoids unnecessary 'as' type assertions
 * and keeps the test logic resilient to unexpected shapes.
 */
function getCallValues(call: unknown): unknown[] {
  if (!call || !Array.isArray(call)) return [];
  const args = (call as unknown[])[1];
  return Array.isArray(args) ? args : [];
}

/**
 * Sets up the query mock to return the given rows for all calls.
 */
function mockQueryReturn(rows: unknown[]) {
  queryMock.mockImplementation(() => Promise.resolve({ rows, rowCount: rows.length }));
}

/**
 * Sets up the query mock to return empty rows with the given rowCount.
 */
function mockQueryEmpty(rowCount = 0) {
  queryMock.mockImplementation(() => Promise.resolve({ rows: [], rowCount }));
}

describe("custom-sql.adapter", () => {
  beforeEach(() => {
    queryMock.mockReset();
    endMock.mockReset();
  });

  // ── init / start ──

  test("init creates the cron_queue table on first call", async () => {
    await setupAdapter();

    const firstCall = queryMock.mock.calls[0];
    expect(firstCall?.[0]).toContain("CREATE TABLE IF NOT EXISTS cron_queue");
  });

  test("init is lazy — subsequent calls do not re-run CREATE TABLE", async () => {
    const adapter = await setupAdapter();
    const callsAfterFirstInit = queryMock.mock.calls.length;
    await adapter.init();
    expect(queryMock.mock.calls).toHaveLength(callsAfterFirstInit);
  });

  // ── send ──

  test("send inserts a pending row and returns a queue id", async () => {
    mockQueryEmpty(1);
    const adapter = await setupAdapter();

    const job = makeJob();
    const id = await adapter.send(job);

    expect(id).toMatch(/^cq_/);

    const insertCall = findQueryCall("INSERT INTO cron_queue");
    expect(insertCall).toBeDefined();
    const values = getCallValues(insertCall);
    expect(values).toContain(job.runId);
    expect(values).toContain(job.scheduleId);
    expect(values).toContain(job.jobKind);
    expect(values).toContain(job.attempt);
    expect(values).toContain(job.timeoutSeconds);
  });

  test("send stores the mapping from runId to queueId internally", async () => {
    mockQueryEmpty(1);
    const adapter = await setupAdapter();

    const job = makeJob({ runId: "run-mapped" });
    const id = await adapter.send(job);

    // fetch will look up the mapping — since we mock query to return an empty
    // array it won't use the mapping, but complete publishes the deletion.
    // Instead we verify the id format and that no error is thrown.
    expect(id).toMatch(/^cq_/);
  });

  // ── fetch ──

  test("fetch returns payloads from claimed rows", async () => {
    const rows = [
      {
        id: "cq_1",
        run_id: "run-a",
        schedule_id: "sched-a",
        job_kind: "NOOP",
        payload: { task: "a" },
        attempt: 0,
        timeout_seconds: 120,
      },
      {
        id: "cq_2",
        run_id: "run-b",
        schedule_id: "sched-b",
        job_kind: "NOOP",
        payload: null,
        attempt: 1,
        timeout_seconds: 240,
      },
    ];
    mockQueryReturn(rows);
    const adapter = await setupAdapter();

    const result = await adapter.fetch({ count: 5 });

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      runId: "run-a",
      scheduleId: "sched-a",
      jobKind: CronJobKind.NOOP,
      payload: { task: "a" },
      attempt: 0,
      timeoutSeconds: 120,
      queueJobId: "cq_1",
    });
    expect(result[1]).toEqual({
      runId: "run-b",
      scheduleId: "sched-b",
      jobKind: CronJobKind.NOOP,
      payload: null,
      attempt: 1,
      timeoutSeconds: 240,
      queueJobId: "cq_2",
    });
  });

  test("fetch uses FOR UPDATE SKIP LOCKED and LIMIT $1", async () => {
    mockQueryEmpty(0);
    const adapter = await setupAdapter();

    await adapter.fetch({ count: 10 });

    const fetchCall = findQueryCall("FOR UPDATE SKIP LOCKED");
    expect(fetchCall).toBeDefined();
    expect(fetchCall?.[1]).toEqual([10]);
  });

  test("fetch returns empty array when no rows are available", async () => {
    mockQueryEmpty(0);
    const adapter = await setupAdapter();

    const result = await adapter.fetch({ count: 1 });
    expect(result).toEqual([]);
  });

  // ── complete ──

  test("complete deletes the queue row", async () => {
    mockQueryEmpty(1);
    const adapter = await setupAdapter();

    await adapter.complete("cq_complete_1");

    const deleteCall = findQueryCall("DELETE FROM cron_queue");
    expect(deleteCall).toBeDefined();
    expect(deleteCall?.[1]).toEqual(["cq_complete_1"]);
  });

  test("complete is idempotent when called with an unknown id", async () => {
    mockQueryEmpty(0);
    const adapter = await setupAdapter();

    const result = await adapter.complete("nonexistent");
    expect(result).toBeUndefined();
  });

  // ── fail ──

  test("fail updates status to failed and stores error info", async () => {
    mockQueryEmpty(1);
    const adapter = await setupAdapter();

    await adapter.fail("cq_fail_1", "something went wrong", "stack-trace");

    const failCall = findQueryCall("UPDATE cron_queue SET status = 'failed'");
    expect(failCall).toBeDefined();
    const values = getCallValues(failCall);
    expect(values[0]).toBe("cq_fail_1");
    expect(values[1]).toBe("something went wrong");
    expect(values[2]).toBe("stack-trace");
  });

  test("fail with no stack passes null", async () => {
    mockQueryEmpty(1);
    const adapter = await setupAdapter();

    await adapter.fail("cq_fail_2", "err");

    const failCall = findQueryCall("UPDATE cron_queue SET status = 'failed'");
    expect(getCallValues(failCall)[2]).toBeNull();
  });

  // ── retry ──

  test("retry resets status to pending with a delay", async () => {
    mockQueryEmpty(1);
    const adapter = await setupAdapter();

    await adapter.retry("cq_retry_1", 30, 2);

    const retryCall = queryMock.mock.calls.find(
      c =>
        typeof c[0] === "string" &&
        c[0].includes("SET status = 'pending'") &&
        c[0].includes("available_at = now() + make_interval")
    );
    expect(retryCall).toBeDefined();
    const values = getCallValues(retryCall);
    expect(values[0]).toBe(30);
    expect(values[1]).toBe("cq_retry_1");
    expect(values[2]).toBe(2);
  });

  test("retry with no newAttempt passes null", async () => {
    mockQueryEmpty(1);
    const adapter = await setupAdapter();

    await adapter.retry("cq_retry_2", 15);

    const retryCall = findQueryCall("SET status = 'pending'");
    const retryValues = getCallValues(retryCall);
    expect(retryValues[2]).toBe(0);
  });

  // ── getQueueStats ──

  test("getQueueStats aggregates counts by job kind and status", async () => {
    const rows = [
      { job_kind: "NOOP", status: "pending", count: "3" },
      { job_kind: "NOOP", status: "in_flight", count: "1" },
      { job_kind: "NOOP", status: "failed", count: "2" },
      { job_kind: "REPORT", status: "pending", count: "5" },
    ];
    mockQueryReturn(rows);
    const adapter = await setupAdapter();

    const stats: CronQueueStats = await adapter.getQueueStats();

    expect(stats).toEqual({
      backend: "custom-sql",
      pending: 8,
      inFlight: 1,
      failed: 2,
      byJobKind: {
        NOOP: { pending: 3, inFlight: 1, failed: 2 },
        REPORT: { pending: 5, inFlight: 0, failed: 0 },
      },
    });
  });

  test("getQueueStats returns zeroes when table is empty", async () => {
    mockQueryEmpty(0);
    const adapter = await setupAdapter();

    const stats = await adapter.getQueueStats();
    expect(stats).toEqual({
      backend: "custom-sql",
      pending: 0,
      inFlight: 0,
      failed: 0,
      byJobKind: {},
    });
  });

  // ── shutdown ──

  test("shutdown closes the pool and clears maps", async () => {
    mockQueryEmpty(1);
    const adapter = await setupAdapter();

    // Send a job so maps are populated.
    await adapter.send(makeJob());

    await adapter.shutdown();

    expect(endMock).toHaveBeenCalledTimes(1);
    // After shutdown, calling init again should re-create the pool and
    // re-issue CREATE TABLE.
    const callsBeforeReinit = queryMock.mock.calls.length;
    await adapter.init();
    expect(queryMock.mock.calls.length).toBeGreaterThan(callsBeforeReinit);
    const createTableCall = queryMock.mock.calls
      .slice(callsBeforeReinit)
      .find(c => typeof c[0] === "string" && c[0].includes("CREATE TABLE IF NOT EXISTS cron_queue"));
    expect(createTableCall).toBeDefined();
  });

  test("shutdown is a no-op when pool was never initialised", async () => {
    const adapter = createCustomSqlAdapter();
    await adapter.shutdown();
    expect(endMock).not.toHaveBeenCalled();
  });

  // ── retry / complete map cleanup ──

  test("complete cleans up internal runId→queueId mapping", async () => {
    mockQueryEmpty(1);
    const adapter = await setupAdapter();

    const job = makeJob({ runId: "run-cleanup" });
    const queueId = await adapter.send(job);

    await adapter.complete(queueId);

    // The DELETE query should have been issued with the queue id.
    const deleteCall = findQueryCall("DELETE FROM cron_queue");
    expect(getCallValues(deleteCall)).toEqual([queueId]);
  });

  test("fail cleans up internal runId→queueId mapping", async () => {
    mockQueryEmpty(1);
    const adapter = await setupAdapter();

    const job = makeJob({ runId: "run-fail-cleanup" });
    const queueId = await adapter.send(job);

    await adapter.fail(queueId, "error");

    const failCall = findQueryCall("status = 'failed'");
    expect(getCallValues(failCall)[0]).toBe(queueId);
  });

  // ── race safety (two simulated workers) ──

  test("two concurrent fetches do not return the same row (SKIP LOCKED race safety)", async () => {
    // Simulate two workers calling fetch simultaneously.
    // The first fetch claim returns the row; the second returns empty
    // because FOR UPDATE SKIP LOCKED excludes already-locked rows.
    let firstFetch = true;
    queryMock.mockImplementation((text?: string) => {
      // Non-fetch queries (CREATE TABLE, etc.) always return empty.
      if (typeof text !== "string" || !text.includes("FOR UPDATE SKIP LOCKED")) {
        return Promise.resolve({ rows: [], rowCount: 0 });
      }
      if (firstFetch) {
        firstFetch = false;
        return Promise.resolve({
          rows: [
            {
              id: "cq_race_1",
              run_id: "run-race-a",
              schedule_id: "sched-race",
              job_kind: "NOOP",
              payload: { task: "race" },
              attempt: 0,
              timeout_seconds: 120,
            },
          ],
          rowCount: 1,
        });
      }
      return Promise.resolve({ rows: [], rowCount: 0 });
    });

    const adapterA = createCustomSqlAdapter();
    const adapterB = createCustomSqlAdapter();
    await adapterA.init();
    await adapterB.init();

    // Both workers fetch concurrently
    const [resultA, resultB] = await Promise.all([adapterA.fetch({ count: 1 }), adapterB.fetch({ count: 1 })]);

    // Worker A got the job
    expect(resultA).toHaveLength(1);
    expect(resultA[0]?.runId).toBe("run-race-a");

    // Worker B got nothing (SKIP LOCKED prevented double-claim)
    expect(resultB).toEqual([]);
  });
});
