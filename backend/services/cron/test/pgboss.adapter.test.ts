import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test";
import { CronJobKind } from "@/backend/enum/cron/cron.enums";
import type { CronJobPayload } from "@/backend/types";

// ── Mock state (reset per test) ──
let startCalls = 0;
let sendCalls: { name: string; data: Record<string, unknown>; options?: Record<string, unknown> }[] = [];
let completeCalls: { name: string; ids: unknown }[] = [];
let failCalls: { name: string; ids: unknown[]; options?: Record<string, unknown> }[] = [];
let getQueueStatsCalls: string[] = [];
let stopCalls: { options: Record<string, unknown> }[] = [];
let createQueueCalls: { name: string; options?: Record<string, unknown> }[] = [];
let fetchCalls: { name: string; options: Record<string, unknown> }[] = [];
let sendReturnId = "mock-job-id-1";

function resetMockState() {
  startCalls = 0;
  sendCalls = [];
  completeCalls = [];
  failCalls = [];
  getQueueStatsCalls = [];
  stopCalls = [];
  createQueueCalls = [];
  fetchCalls = [];
  sendReturnId = "mock-job-id-1";
}

// ── Mock pg-boss instance ──
function makeMockBoss() {
  return {
    on: mock((_event: string, _handler: (err: Error) => void) => {}),
    start: mock(async () => {
      startCalls++;
    }),
    send: mock(async (name: string, data: Record<string, unknown>, options?: Record<string, unknown>) => {
      sendCalls.push({ name, data, options });
      return sendReturnId;
    }),
    complete: mock(async (name: string, ids: unknown[]) => {
      completeCalls.push({ name, ids });
    }),
    fail: mock(async (name: string, ids: unknown[], options?: Record<string, unknown>) => {
      failCalls.push({ name, ids, options });
    }),
    fetch: mock(async (name: string, options: Record<string, unknown>) => {
      fetchCalls.push({ name, options });
      return [];
    }),
    createQueue: mock(async (name: string, options?: Record<string, unknown>) => {
      createQueueCalls.push({ name, options });
      return name;
    }),
    getQueueStats: mock(async (name: string) => {
      getQueueStatsCalls.push(name);
      return [
        {
          name,
          queuedCount: 0,
          deferredCount: 0,
          readyCount: 0,
          activeCount: 0,
          failedCount: 0,
        },
      ];
    }),
    stop: mock(async (options: Record<string, unknown>) => {
      stopCalls.push({ options });
    }),
  };
}

let currentBoss = makeMockBoss();

// ── Mock pg-boss module ──
// The adapter does `import { PgBoss } from "pg-boss"` then `new PgBoss(options)`.
// We mock the class so `new` returns our mock instance.
// Need a workaround not returning from constructor: use a regular function so
// calling it with `new` will return the object via default behaviour.
await mock.module("pg-boss", () => ({
  PgBoss: function MockPgBoss(this: object, _options: Record<string, unknown>) {
    // We need to return currentBoss. Since we can't assign its properties to `this`,
    // and the adapter expects `new PgBoss(...)` to return the boss interface,
    // we swap `this` to currentBoss via Object.assign on the prototype.
    Object.assign(this, currentBoss);
  },
}));

// ── Mock @/backend/db/factory so createPool doesn't touch the DB ──
await mock.module("@/backend/db/factory", () => ({
  createPool: () => ({ dummy: true }),
}));

// The adapter has module-level state (boss, started, knownQueues, maps).
// To get a fresh module instance per test we use a cache-busting query param.
// This ensures ensureStarted() is called fresh, knownQueues starts empty, etc.
let moduleCounter = 0;

type AdapterModule = { createPgBossAdapter: () => CronQueueAdapterLike };

interface CronQueueAdapterLike {
  init(): Promise<void>;
  send(job: CronJobPayload): Promise<string>;
  fetch(opts: { count: number }): Promise<CronJobPayload[]>;
  complete(jobId: string): Promise<void>;
  fail(jobId: string, error: string, stack?: string): Promise<void>;
  retry(jobId: string, delaySeconds: number, newAttempt?: number): Promise<void>;
  getQueueStats(): Promise<Record<string, unknown>>;
  shutdown(): Promise<void>;
}

async function getCreateAdapter(): Promise<AdapterModule["createPgBossAdapter"]> {
  moduleCounter++;
  const mod = await import(`@/backend/services/cron/queue-adapters/pgboss.adapter?fresh=${moduleCounter}`);
  return mod.createPgBossAdapter;
}

function makeJob(overrides: Partial<CronJobPayload> = {}): CronJobPayload {
  return {
    runId: "run-1",
    scheduleId: "sched-1",
    jobKind: CronJobKind.NOOP,
    payload: { test: true },
    attempt: 1,
    timeoutSeconds: 300,
    ...overrides,
  };
}

const QUEUE_PREFIX = "cron_";

describe("pgboss.adapter", () => {
  beforeEach(() => {
    currentBoss = makeMockBoss();
    resetMockState();
  });

  afterEach(() => {
    resetMockState();
  });

  test("start() is called lazily on first send(), not at construction time", async () => {
    const createPgBossAdapter = await getCreateAdapter();
    // Construction should NOT call start()
    const adapter = createPgBossAdapter();
    expect(startCalls).toBe(0);

    // First send triggers ensureStarted → boss.start()
    await adapter.send(makeJob());
    expect(startCalls).toBe(1);
  });

  test("start() is called lazily on first fetch(), not at construction time", async () => {
    const createPgBossAdapter = await getCreateAdapter();
    const adapter = createPgBossAdapter();
    expect(startCalls).toBe(0);

    await adapter.fetch({ count: 5 });
    expect(startCalls).toBe(1);
    // fetch returns [] early when knownQueues is empty — no boss.fetch calls
    expect(fetchCalls).toHaveLength(0);
  });

  test("send(job) maps to boss.send(name, data) with correct data shape", async () => {
    const createPgBossAdapter = await getCreateAdapter();
    const adapter = createPgBossAdapter();
    const job = makeJob();
    const jobId = await adapter.send(job);

    expect(jobId).toBe("mock-job-id-1");
    expect(sendCalls).toHaveLength(1);
    expect(createQueueCalls).toHaveLength(1);

    const queueName = `${QUEUE_PREFIX}NOOP`;
    expect(createQueueCalls[0]?.name).toBe(queueName);
    expect(sendCalls[0]?.name).toBe(queueName);
    expect(sendCalls[0]?.data).toMatchObject({
      runId: "run-1",
      scheduleId: "sched-1",
      payload: { test: true },
    });
  });

  test("complete(jobId) maps to boss.complete(name, [jobId]) — verify array is passed", async () => {
    const createPgBossAdapter = await getCreateAdapter();
    const adapter = createPgBossAdapter();

    // Send first so the queue name and jobId→queue mapping are registered
    const job = makeJob();
    const jobId = await adapter.send(job);
    const queueName = `${QUEUE_PREFIX}NOOP`;

    await adapter.complete(jobId);
    expect(completeCalls).toHaveLength(1);
    expect(completeCalls[0]?.name).toBe(queueName);
    expect(Array.isArray(completeCalls[0]?.ids)).toBe(true);
    expect(completeCalls[0]?.ids).toEqual([jobId]);
  });

  test("fail(jobId, error) maps to boss.fail(name, [jobId], { data: { message, stack } }) — verify array is passed", async () => {
    const createPgBossAdapter = await getCreateAdapter();
    const adapter = createPgBossAdapter();

    const job = makeJob();
    const jobId = await adapter.send(job);
    const queueName = `${QUEUE_PREFIX}NOOP`;

    await adapter.fail(jobId, "something went wrong", "Error: boom\n  at foo:1");

    expect(failCalls).toHaveLength(1);
    expect(failCalls[0]?.name).toBe(queueName);
    expect(Array.isArray(failCalls[0]?.ids)).toBe(true);
    expect(failCalls[0]?.ids).toEqual([jobId]);
    expect(failCalls[0]?.options).toMatchObject({
      message: "something went wrong",
      stack: "Error: boom\n  at foo:1",
    });
  });

  test("getQueueStats() iterates queue names per job kind", async () => {
    const createPgBossAdapter = await getCreateAdapter();
    const adapter = createPgBossAdapter();

    // Send two jobs with different jobKinds to register two queues
    await adapter.send(makeJob({ jobKind: CronJobKind.NOOP }));
    // Use Object.assign to override jobKind with a non-enum string at runtime.
    // This avoids an unsafe `as CronJobKind` narrowing assertion while still
    // exercising the queue-per-kind iteration path.
    await adapter.send(Object.assign(makeJob({ runId: "run-2" }), { jobKind: "OTHER" }));

    const stats = await adapter.getQueueStats();

    expect(getQueueStatsCalls).toHaveLength(2);
    expect(getQueueStatsCalls).toContain(`${QUEUE_PREFIX}NOOP`);
    expect(getQueueStatsCalls).toContain(`${QUEUE_PREFIX}OTHER`);
    expect(stats.pending).toBe(0);
    expect(stats.inFlight).toBe(0);
    expect(stats.failed).toBe(0);
    expect(stats.byJobKind).toHaveProperty("NOOP");
    expect(stats.byJobKind).toHaveProperty("OTHER");
  });

  test("retry(jobId, delaySeconds, newAttempt) completes old job and sends new job with incremented attempt", async () => {
    const createPgBossAdapter = await getCreateAdapter();
    const adapter = createPgBossAdapter();

    const job = makeJob({ attempt: 1 });
    const jobId = await adapter.send(job);
    const queueName = `${QUEUE_PREFIX}NOOP`;
    expect(sendCalls).toHaveLength(1);

    // The retry's internal send() will also return sendReturnId, so bump it
    // to a distinct value so we can verify the new job mapping was registered.
    sendReturnId = "mock-job-id-2";

    await adapter.retry(jobId, 30, 2);

    // 1. complete() called once for the original job (retry passes bare jobId, not array)
    expect(completeCalls).toHaveLength(1);
    expect(completeCalls[0]?.name).toBe(queueName);
    expect(completeCalls[0]?.ids).toEqual(jobId);

    // 2. send() called twice total (initial + retry)
    expect(sendCalls).toHaveLength(2);

    // 3. The retry's sendCall passes the new attempt and startAfter option
    const retrySend = sendCalls[1];
    expect(retrySend?.name).toBe(queueName);
    expect(retrySend?.data).toMatchObject({
      runId: "run-1",
      scheduleId: "sched-1",
      jobKind: "NOOP",
      payload: { test: true },
      attempt: 2,
      timeoutSeconds: 300,
    });
    expect(retrySend?.options).toMatchObject({ startAfter: 30 });
  });

  test("retry(jobId, delaySeconds) without newAttempt defaults to originalPayload.attempt + 1", async () => {
    const createPgBossAdapter = await getCreateAdapter();
    const adapter = createPgBossAdapter();

    const job = makeJob({ attempt: 1 });
    const jobId = await adapter.send(job);
    const queueName = `${QUEUE_PREFIX}NOOP`;

    sendReturnId = "mock-job-id-2";

    await adapter.retry(jobId, 15);

    expect(completeCalls).toHaveLength(1);
    expect(sendCalls).toHaveLength(2);

    const retrySend = sendCalls[1];
    expect(retrySend?.name).toBe(queueName);
    // attempt defaults to originalPayload.attempt + 1 = 1 + 1 = 2
    expect(retrySend?.data).toMatchObject({ attempt: 2 });
    expect(retrySend?.options).toMatchObject({ startAfter: 15 });
  });

  test("shutdown() calls boss.stop({ close: false })", async () => {
    const createPgBossAdapter = await getCreateAdapter();
    const adapter = createPgBossAdapter();

    // Must start the adapter first so shutdown has a boss instance to stop
    await adapter.init();

    await adapter.shutdown();
    expect(stopCalls).toHaveLength(1);
    expect(stopCalls[0]?.options).toEqual({ close: false });
  });
});
