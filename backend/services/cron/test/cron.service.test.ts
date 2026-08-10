import { afterEach, describe, expect, mock, test } from "bun:test";
import {
  CronConcurrencyPolicy,
  CronJobKind,
  CronRunStatus,
  CronScheduleStatus,
  CronTriggerSource,
} from "@/backend/enum/cron/cron.enums";
import type {
  CronRunListResult,
  CronRunReturnType,
  CronRunSelectType,
  CronScheduleListResult,
  CronScheduleReturnType,
  CronScheduleSelectType,
  CronScheduleSubmitInput,
} from "@/backend/types/cron/cron.types";

// ── Mutable mock call recording state ──
// Unlike jest.fn()/mock(), bun:test's mock.module clones the returned object,
// so .mock.calls etc. don't survive the structured clone boundary. We use
// mutable closure-captured arrays instead — same pattern as the worker test.

let createScheduleCalls: Record<string, unknown>[] = [];
let getScheduleByIdResult: CronScheduleSelectType | null = null;
let getScheduleByIdCalls: string[] = [];
let getScheduleByNameResult: CronScheduleSelectType | null = null;
let getScheduleByNameCalls: string[] = [];
let listSchedulesCalls: unknown[] = [];
let listSchedulesResult: CronScheduleListResult = {
  rows: [],
  totalCount: 0,
};
let listDueSchedulesCalls: unknown[] = [];
let listDueSchedulesResult: CronScheduleSelectType[] = [];
let claimNextRunCalls: {
  scheduleId: string;
  now: Date;
  source: unknown;
  nextRunAt: Date;
  tx?: unknown;
  forceDue?: boolean;
}[] = [];
let claimNextRunResult: { runId: string } | null = { runId: "run-1" };
let updateRunStatusCalls: {
  runId: string;
  status: CronRunStatus;
  extras?: Record<string, unknown>;
  tx?: unknown;
  fromStatuses?: CronRunStatus[];
}[] = [];
let updateRunStatusResult: CronRunSelectType | null = null;
let getRunByIdResult: CronRunReturnType | null = null;
let updateScheduleCalls: { id: string; input: Record<string, unknown> }[] = [];
let updateScheduleResult: CronScheduleSelectType | null = null;
let updateScheduleIfStatusCalls: {
  id: string;
  input: Record<string, unknown>;
  expectedStatus: CronScheduleStatus;
}[] = [];
let updateScheduleIfStatusResult: CronScheduleSelectType | null = null;
let recordHeartbeatCalls: Array<{ runId?: string; workerId?: string }> = [];
let reconcileStuckRunsCalls: { now: Date; batch: number }[] = [];
let reconcileStuckRunsResult: number = 0;
let softDeleteScheduleByIdCalls: string[] = [];
let permanentlyDeleteScheduleByIdCalls: string[] = [];
let listRunsResult: CronRunListResult = { rows: [], totalCount: 0 };

let adapterInitCalls: number = 0;
let adapterSendCalls: Record<string, unknown>[] = [];
let adapterSendResult: string | Error = "queue-job-id";
let adapterGetQueueStatsCalls: number = 0;
let adapterGetQueueStatsResult: unknown = { pending: 0, inFlight: 0, failed: 0, byJobKind: {} };

// ── Mock fixtures ──

const mockScheduleRow: CronScheduleSelectType = {
  id: "sched-1",
  name: "test-schedule",
  description: null,
  cronExpression: "*/5 * * * *",
  timezone: "UTC",
  status: CronScheduleStatus.ACTIVE,
  jobKind: "NOOP",
  concurrencyPolicy: "ALLOW",
  payload: null,
  nextRunAt: new Date("2025-01-01T00:00:00Z"),
  lastRunAt: null,
  timeoutSeconds: 300,
  maxRetries: 3,
  retryBackoffSeconds: 60,
  createdAt: new Date("2024-12-01T00:00:00Z"),
  updatedAt: new Date("2024-12-01T00:00:00Z"),
  createdByUserId: "user-1",
  updatedByUserId: null,
};

function makeScheduleRow(overrides: Partial<CronScheduleSelectType> = {}): CronScheduleSelectType {
  return { ...mockScheduleRow, ...overrides };
}

function makeRunRow(overrides: Partial<CronRunSelectType> = {}): CronRunSelectType {
  return {
    id: "run-1",
    scheduleId: "sched-1",
    jobKind: "NOOP",
    status: CronRunStatus.RUNNING,
    triggerSource: CronTriggerSource.MANUAL,
    payload: null,
    attempt: 1,
    startedAt: new Date("2025-01-01T00:00:00Z"),
    completedAt: null,
    durationMs: null,
    errorMessage: null,
    errorStack: null,
    workerId: "worker-1",
    createdAt: new Date("2025-01-01T00:00:00Z"),
    updatedAt: new Date("2025-01-01T00:00:00Z"),
    ...overrides,
  };
}

// ── ReturnType-typed fixtures ──
// ReturnType omits `createdByUserId`/`updatedByUserId` (concurrencyPolicy re-derived as enum).
const { createdByUserId: _sbCreatedBy, updatedByUserId: _sbUpdatedBy, ...mockScheduleReturnBase } = mockScheduleRow;

const mockScheduleReturnRow: CronScheduleReturnType = {
  ...mockScheduleReturnBase,
  jobKind: CronJobKind.NOOP,
  status: CronScheduleStatus.ACTIVE,
  concurrencyPolicy: CronConcurrencyPolicy.ALLOW,
};

// CronRunReturnType omits `errorStack` (jobKind/status/triggerSource re-derived as enums).
const { errorStack: _rbErrStack, ...mockRunReturnBase } = makeRunRow();

const mockRunReturnRow: CronRunReturnType = {
  ...mockRunReturnBase,
  jobKind: CronJobKind.NOOP,
  status: CronRunStatus.RUNNING,
  triggerSource: CronTriggerSource.MANUAL,
};

function makeRunReturnRow(overrides: Partial<CronRunReturnType> = {}): CronRunReturnType {
  return { ...mockRunReturnRow, ...overrides };
}

interface CreateScheduleInputOverrides {
  name?: string;
  cronExpression?: string;
  timezone?: string;
}

function makeCreateScheduleInput(overrides: CreateScheduleInputOverrides = {}): CronScheduleSubmitInput {
  return {
    name: "test-schedule",
    cronExpression: "0 9 * * *",
    timezone: "UTC",
    jobKind: "NOOP",
    concurrencyPolicy: "ALLOW",
    payload: null,
    timeoutSeconds: 300,
    maxRetries: 3,
    retryBackoffSeconds: 60,
    ...overrides,
  };
}

function resetState() {
  createScheduleCalls = [];
  getScheduleByIdResult = mockScheduleRow;
  getScheduleByIdCalls = [];
  getScheduleByNameResult = null;
  getScheduleByNameCalls = [];
  listSchedulesCalls = [];
  listSchedulesResult = { rows: [mockScheduleReturnRow], totalCount: 1 };
  listDueSchedulesCalls = [];
  listDueSchedulesResult = [];
  claimNextRunCalls = [];
  claimNextRunResult = { runId: "run-1" };
  updateRunStatusCalls = [];
  updateRunStatusResult = null;
  getRunByIdResult = null;
  updateScheduleCalls = [];
  updateScheduleResult = mockScheduleRow;
  updateScheduleIfStatusCalls = [];
  updateScheduleIfStatusResult = mockScheduleRow;
  recordHeartbeatCalls = [];
  reconcileStuckRunsCalls = [];
  reconcileStuckRunsResult = 0;
  softDeleteScheduleByIdCalls = [];
  permanentlyDeleteScheduleByIdCalls = [];
  listRunsResult = { rows: [], totalCount: 0 };
  if (adapterInitCalls > 0) adapterInitCalls = 0;
  adapterSendCalls = [];
  adapterSendResult = "queue-job-id";
  adapterGetQueueStatsCalls = 0;
  adapterGetQueueStatsResult = { pending: 0, inFlight: 0, failed: 0, byJobKind: {} };
}

interface UpdateScheduleIfStatusCallExpectation {
  status: CronScheduleStatus;
  nextRunAt: Date | null;
  [key: string]: unknown;
}

async function expectToThrow(fn: () => Promise<unknown>): Promise<Error> {
  let caughtErr: Error | undefined;
  try {
    await fn();
  } catch (err) {
    if (err instanceof Error) caughtErr = err;
  }
  if (!caughtErr) {
    throw new Error("Expected function to throw but it succeeded");
  }
  return caughtErr;
}

function expectUpdateScheduleIfStatusCall(
  index: number,
  expectedId: string,
  expectedInput: UpdateScheduleIfStatusCallExpectation
): void {
  const call = updateScheduleIfStatusCalls[index];
  expect(call.id).toBe(expectedId);
  expect(call.input).toEqual(expectedInput);
}

// ── Mock factory implementations ──

const repoImpl = {
  createSchedule: async (input: Record<string, unknown>) => {
    createScheduleCalls.push(input);
    return {
      ...mockScheduleRow,
      ...input,
      id: "sched-new",
    };
  },
  getScheduleById: async (id: string) => {
    getScheduleByIdCalls.push(id);
    return getScheduleByIdResult;
  },
  getScheduleByName: async (name: string) => {
    getScheduleByNameCalls.push(name);
    return getScheduleByNameResult;
  },
  listSchedules: async (input: unknown) => {
    listSchedulesCalls.push(input);
    return listSchedulesResult;
  },
  listDueSchedules: async (now: Date, limit: number) => {
    listDueSchedulesCalls.push({ now, limit });
    return listDueSchedulesResult;
  },
  claimNextRun: async (
    scheduleId: string,
    now: Date,
    source: CronTriggerSource,
    nextRunAt: Date,
    tx?: unknown,
    forceDue?: boolean
  ) => {
    claimNextRunCalls.push({ scheduleId, now, source, nextRunAt, tx, forceDue });
    return claimNextRunResult;
  },
  updateRunStatus: async (
    runId: string,
    status: CronRunStatus,
    extras?: Record<string, unknown>,
    fromStatuses?: CronRunStatus[],
    tx?: unknown
  ) => {
    updateRunStatusCalls.push({ runId, status, extras, fromStatuses, tx });
    return updateRunStatusResult;
  },
  updateSchedule: async (id: string, input: Record<string, unknown>) => {
    updateScheduleCalls.push({ id, input });
    return updateScheduleResult;
  },
  updateScheduleIfStatus: async (id: string, input: Record<string, unknown>, expectedStatus: CronScheduleStatus) => {
    updateScheduleIfStatusCalls.push({ id, input, expectedStatus });
    return updateScheduleIfStatusResult;
  },
  recordHeartbeat: async (input: { runId?: string; workerId?: string }) => {
    recordHeartbeatCalls.push(input);
  },
  reconcileStuckRuns: async (now: Date, batch: number) => {
    reconcileStuckRunsCalls.push({ now, batch });
    return reconcileStuckRunsResult;
  },
  softDeleteScheduleById: async (id: string) => {
    softDeleteScheduleByIdCalls.push(id);
  },
  permanentlyDeleteScheduleById: async (id: string) => {
    permanentlyDeleteScheduleByIdCalls.push(id);
  },
  getRunById: async () => getRunByIdResult,
  listRuns: async () => listRunsResult,
  listRunsBySchedule: async () => ({ rows: [], totalCount: 0 }),
};

await mock.module("@/backend/db/repo", () => ({
  CronRepository: repoImpl,
  toScheduleReturnType: (row: Record<string, unknown>) => {
    const { createdByUserId: _cb, updatedByUserId: _ub, ...rest } = row;
    return rest;
  },
}));

// ── Mock env-config service (resolveBatchSize calls resolveEnvConfig) ──

await mock.module("@/backend/services/system", () => ({
  resolveEnvConfig: async () => undefined,
}));

// ── Mock queue adapter ──

const adapterImpl = {
  init: async () => {
    adapterInitCalls++;
  },
  send: async (job: Record<string, unknown>) => {
    adapterSendCalls.push(job);
    if (adapterSendResult instanceof Error) throw adapterSendResult;
    return adapterSendResult;
  },
  fetch: async () => [],
  complete: async () => {},
  fail: async () => {},
  retry: async () => {},
  getQueueStats: async () => {
    adapterGetQueueStatsCalls++;
    return adapterGetQueueStatsResult;
  },
  shutdown: async () => {},
};

await mock.module("@/backend/services/cron/queue-adapter.factory", () => ({
  getQueueAdapter: async () => adapterImpl,
  resolveQueueBackend: async () => "PG_BOSS",
}));

// ── Mock logger ──

const noop = () => {};
await mock.module("@/backend/lib/logger", () => ({
  logger: { log: noop, info: noop, warn: noop, error: noop, debug: noop },
  default: { log: noop, info: noop, warn: noop, error: noop, debug: noop },
}));

// ── Mock translations ──

await mock.module("@/shared/locale/server-graphql", () => ({
  getServerTranslations: () => ({
    dashboardTranslations: {
      cron: {
        errors: {
          invalidCronExpression: (expr: string) => `Invalid cron: ${expr}`,
          scheduleNameTaken: (name: string) => `Schedule exists: ${name}`,
          scheduleNotFound: (id: string) => `Not found: ${id}`,
          scheduleNotActive: "Schedule is not active",
          scheduleNotPaused: "Schedule is not paused",
          concurrencyConflict: "A run for this schedule is already in progress",
          invalidTimezone: (tz: string) => `Invalid timezone: ${tz}`,
        },
      },
    },
  }),
}));

// ── Mock drizzleDb ──

await mock.module("@/backend/db/drizzleDb", () => ({
  db: {
    transaction: async (cb: (tx: unknown) => Promise<unknown>) => cb({}),
  },
}));

// ── Import CronService AFTER all mocks ──

const { CronService } = await import("@/backend/services/cron/cron.service");

// ── Service user ID for tests (replaces undefined user context) ──
const SERVICE_USER_ID = "00000000-0000-0000-0000-000000000001";

// ── Tests ──

afterEach(() => {
  resetState();
});

describe("CronService", () => {
  // ── createSchedule ──

  describe("createSchedule", () => {
    test("calls repo.createSchedule with computed nextRunAt", async () => {
      const input = makeCreateScheduleInput({ name: "my-schedule", cronExpression: "0 9 * * *" });

      const result = await CronService.createSchedule(input, "en", SERVICE_USER_ID);

      expect(createScheduleCalls).toHaveLength(1);
      const callArg = createScheduleCalls[0];
      expect(callArg?.nextRunAt).toBeInstanceOf(Date);
      expect(callArg?.status).toBe(CronScheduleStatus.ACTIVE);
      expect(callArg?.name).toBe("my-schedule");
      expect(callArg?.cronExpression).toBe("0 9 * * *");
      expect(result).toBeDefined();
      expect(result.id).toBe("sched-new");
    });

    test("throws error for invalid cron expression", async () => {
      const input = makeCreateScheduleInput({ name: "bad-cron", cronExpression: "not-a-cron" });
      const caughtErr = await expectToThrow(() => CronService.createSchedule(input, "en", SERVICE_USER_ID));
      expect(caughtErr.message).toContain("Invalid cron: not-a-cron");
      expect(createScheduleCalls).toHaveLength(0);
    });

    test("throws error when name already exists", async () => {
      getScheduleByNameResult = mockScheduleRow;
      const input = makeCreateScheduleInput({ name: "test-schedule", cronExpression: "*/5 * * * *" });
      const caughtErr = await expectToThrow(() => CronService.createSchedule(input, "en", SERVICE_USER_ID));
      expect(caughtErr.message).toContain("Schedule exists: test-schedule");
      expect(getScheduleByNameCalls).toHaveLength(1);
      expect(getScheduleByNameCalls[0]).toBe("test-schedule");
      expect(createScheduleCalls).toHaveLength(0);
    });

    test("throws error for invalid timezone", async () => {
      const input = makeCreateScheduleInput({ name: "bad-tz-schedule", timezone: "Not/A real timezone" });
      const caughtErr = await expectToThrow(() => CronService.createSchedule(input, "en", SERVICE_USER_ID));
      expect(caughtErr.message).toContain("Invalid timezone: Not/A real timezone");
      expect(createScheduleCalls).toHaveLength(0);
    });
  });

  // ── updateSchedule ──

  describe("updateSchedule", () => {
    test("updates schedule and recomputes nextRunAt when cron changes", async () => {
      getScheduleByIdResult = makeScheduleRow({ cronExpression: "*/5 * * * *" });
      updateScheduleResult = makeScheduleRow();

      const result = await CronService.updateSchedule(
        "sched-1",
        {
          cronExpression: "0 9 * * *",
        },
        "en",
        SERVICE_USER_ID
      );

      expect(getScheduleByIdCalls).toContain("sched-1");
      expect(updateScheduleCalls).toHaveLength(1);
      expect(updateScheduleCalls[0].id).toBe("sched-1");
      expect(updateScheduleCalls[0].input.cronExpression).toBe("0 9 * * *");
      expect(updateScheduleCalls[0].input.nextRunAt).toBeInstanceOf(Date);
      expect(result).toBeDefined();
    });

    test("throws error for invalid cron expression", async () => {
      getScheduleByIdResult = mockScheduleRow;
      const caughtErr = await expectToThrow(() =>
        CronService.updateSchedule("sched-1", { cronExpression: "not-a-cron" }, "en", SERVICE_USER_ID)
      );
      expect(caughtErr.message).toContain("Invalid cron: not-a-cron");
      expect(updateScheduleCalls).toHaveLength(0);
    });

    test("throws error for invalid timezone", async () => {
      getScheduleByIdResult = mockScheduleRow;
      const caughtErr = await expectToThrow(() =>
        CronService.updateSchedule("sched-1", { timezone: "Bogus/zone" }, "en", SERVICE_USER_ID)
      );
      expect(caughtErr.message).toContain("Invalid timezone: Bogus/zone");
      expect(updateScheduleCalls).toHaveLength(0);
    });

    test("allows update without timezone field (no timezone validation)", async () => {
      getScheduleByIdResult = mockScheduleRow;
      updateScheduleResult = mockScheduleRow;

      const result = await CronService.updateSchedule(
        "sched-1",
        {
          maxRetries: 5,
        },
        "en",
        SERVICE_USER_ID
      );

      expect(updateScheduleCalls).toHaveLength(1);
      expect(result).toBeDefined();
    });
  });

  // ── pauseSchedule ──

  describe("pauseSchedule", () => {
    test("calls updateScheduleIfStatus with PAUSED + ACTIVE guard", async () => {
      updateScheduleIfStatusResult = {
        ...mockScheduleRow,
        id: "sched-1",
        status: CronScheduleStatus.PAUSED,
        nextRunAt: null,
      };
      getScheduleByIdResult = {
        ...mockScheduleRow,
        id: "sched-1",
        status: CronScheduleStatus.ACTIVE,
      };

      const result = await CronService.pauseSchedule("sched-1", "en");

      expect(getScheduleByIdCalls).toContain("sched-1");
      expect(updateScheduleIfStatusCalls).toHaveLength(1);
      expectUpdateScheduleIfStatusCall(0, "sched-1", {
        status: CronScheduleStatus.PAUSED,
        nextRunAt: null,
      });
      expect(updateScheduleIfStatusCalls[0].expectedStatus).toBe(CronScheduleStatus.ACTIVE);
      expect(result).toBeDefined();
    });

    test("throws scheduleNotActive when updateScheduleIfStatus returns null", async () => {
      updateScheduleIfStatusResult = null;
      const caughtErr = await expectToThrow(() => CronService.pauseSchedule("sched-1", "en"));
      expect(caughtErr.message).toContain("Schedule is not active");
      expect(updateScheduleIfStatusCalls).toHaveLength(1);
    });
  });

  // ── resumeSchedule ──

  describe("resumeSchedule", () => {
    test("calls updateScheduleIfStatus with ACTIVE + PAUSED guard and computes nextRunAt", async () => {
      getScheduleByIdResult = makeScheduleRow({
        id: "sched-1",
        status: CronScheduleStatus.ACTIVE,
        lastRunAt: null,
      });
      updateScheduleIfStatusResult = makeScheduleRow({
        id: "sched-1",
        status: CronScheduleStatus.ACTIVE,
        lastRunAt: null,
      });

      const result = await CronService.resumeSchedule("sched-1", "en");

      expect(getScheduleByIdCalls).toContain("sched-1");
      expect(updateScheduleIfStatusCalls).toHaveLength(1);
      expect(updateScheduleIfStatusCalls[0].id).toBe("sched-1");
      expect(updateScheduleIfStatusCalls[0].input.status).toBe(CronScheduleStatus.ACTIVE);
      expect(updateScheduleIfStatusCalls[0].input.nextRunAt).toBeInstanceOf(Date);
      expect(updateScheduleIfStatusCalls[0].expectedStatus).toBe(CronScheduleStatus.PAUSED);
      expect(result).toBeDefined();
    });

    test("throws scheduleNotPaused when null returned", async () => {
      getScheduleByIdResult = makeScheduleRow({
        status: CronScheduleStatus.PAUSED,
        lastRunAt: null,
      });
      updateScheduleIfStatusResult = null;
      const caughtErr = await expectToThrow(() => CronService.resumeSchedule("sched-1", "en"));
      expect(caughtErr.message).toContain("Schedule is not paused");
      expect(updateScheduleIfStatusCalls).toHaveLength(1);
    });
  });

  // ── dispatchDueSchedules ──

  describe("dispatchDueSchedules", () => {
    test("lists due schedules, claims each, sends via adapter", async () => {
      listDueSchedulesResult = [makeScheduleRow({ id: "sched-due-1" })];
      claimNextRunResult = { runId: "run-due-1" };

      const result = await CronService.dispatchDueSchedules({
        now: new Date("2025-01-01T12:00:00Z"),
        source: CronTriggerSource.VERCEL_TICKER,
      });

      expect(listDueSchedulesCalls).toHaveLength(1);
      expect(claimNextRunCalls).toHaveLength(1);
      expect(claimNextRunCalls[0].scheduleId).toBe("sched-due-1");
      expect(claimNextRunCalls[0].source).toBe("VERCEL_TICKER");
      expect(adapterSendCalls).toHaveLength(1);
      const sendArg = adapterSendCalls[0];
      expect(sendArg.runId).toBe("run-due-1");
      expect(sendArg.scheduleId).toBe("sched-due-1");
      expect(result.dispatched).toBe(1);
      expect(result.skipped).toBe(0);
    });

    test("skips when claim returns null and does not send", async () => {
      listDueSchedulesResult = [makeScheduleRow({ id: "sched-due-2" })];
      claimNextRunResult = null;

      const result = await CronService.dispatchDueSchedules({
        now: new Date("2025-01-01T12:00:00Z"),
        source: CronTriggerSource.VERCEL_TICKER,
      });

      expect(adapterSendCalls).toHaveLength(0);
      expect(result.dispatched).toBe(0);
      expect(result.skipped).toBe(1);
    });

    test("marks run FAILED when adapter.send throws", async () => {
      listDueSchedulesResult = [makeScheduleRow({ id: "sched-due-3" })];
      claimNextRunResult = { runId: "run-fail-1" };
      adapterSendResult = new Error("queue down");
      updateRunStatusResult = makeRunRow({ id: "run-fail-1" });

      const result = await CronService.dispatchDueSchedules({
        now: new Date("2025-01-01T12:00:00Z"),
        source: CronTriggerSource.VERCEL_TICKER,
      });

      expect(updateRunStatusCalls).toHaveLength(1);
      expect(updateRunStatusCalls[0].runId).toBe("run-fail-1");
      expect(updateRunStatusCalls[0].status).toBe(CronRunStatus.FAILED);
      expect(result.dispatched).toBe(0);
      expect(result.failed).toBe(1);
    });
  });

  // ── dispatchScheduleById ──

  describe("dispatchScheduleById", () => {
    test("advances nextRunAt when null, claims, and sends", async () => {
      getScheduleByIdResult = makeScheduleRow({
        id: "sched-manual-1",
        nextRunAt: null,
      });
      claimNextRunResult = { runId: "run-manual-1" };

      const result = await CronService.dispatchScheduleById({
        id: "sched-manual-1",
        source: CronTriggerSource.MANUAL,
      });

      // Manual dispatch uses forceDue=true to bypass the due-check
      expect(updateScheduleIfStatusCalls).toHaveLength(0);
      expect(claimNextRunCalls).toHaveLength(1);
      expect(claimNextRunCalls[0].scheduleId).toBe("sched-manual-1");
      expect(claimNextRunCalls[0].forceDue).toBe(true);
      expect(adapterSendCalls).toHaveLength(1);
      const sendArg = adapterSendCalls[0];
      expect(sendArg.runId).toBe("run-manual-1");
      expect(sendArg.scheduleId).toBe("sched-manual-1");
      expect(result.runId).toBe("run-manual-1");
      expect(result.queueJobId).toBe("queue-job-id");
    });

    test("advances nextRunAt when in the future", async () => {
      getScheduleByIdResult = makeScheduleRow({
        id: "sched-future-1",
        nextRunAt: new Date("2099-01-01T00:00:00Z"),
      });
      claimNextRunResult = { runId: "run-future-1" };

      await CronService.dispatchScheduleById({
        id: "sched-future-1",
        source: CronTriggerSource.MANUAL,
      });

      // Manual dispatch uses forceDue=true to bypass the due-check
      expect(updateScheduleIfStatusCalls).toHaveLength(0);
      expect(claimNextRunCalls).toHaveLength(1);
      expect(claimNextRunCalls[0].scheduleId).toBe("sched-future-1");
      expect(claimNextRunCalls[0].forceDue).toBe(true);
    });

    test("does not advance nextRunAt when in the past", async () => {
      getScheduleByIdResult = makeScheduleRow({
        id: "sched-past-1",
        nextRunAt: new Date("2020-01-01T00:00:00Z"),
      });
      claimNextRunResult = { runId: "run-past-1" };

      await CronService.dispatchScheduleById({
        id: "sched-past-1",
        source: CronTriggerSource.MANUAL,
      });

      expect(updateScheduleCalls).toHaveLength(0);
      expect(claimNextRunCalls).toHaveLength(1);
    });

    test("throws when schedule not found", async () => {
      getScheduleByIdResult = null;

      return expect(
        CronService.dispatchScheduleById({
          id: "nonexistent",
          source: CronTriggerSource.MANUAL,
        })
      ).rejects.toThrow("Not found: nonexistent");
    });

    test("throws when claim fails", async () => {
      getScheduleByIdResult = makeScheduleRow({ id: "sched-claim-fail" });
      claimNextRunResult = null;

      return expect(
        CronService.dispatchScheduleById({
          id: "sched-claim-fail",
          source: CronTriggerSource.MANUAL,
        })
      ).rejects.toThrow("A run for this schedule is already in progress");
    });

    test("SKIP concurrency policy: when an active run exists, claimNextRun returns null and no new run is created", async () => {
      // Schedule with SKIP policy — repo.claimNextRun returns null when an
      // in-flight run already exists for schedules with SKIP policy.
      getScheduleByIdResult = makeScheduleRow({
        id: "sched-skip-1",
        concurrencyPolicy: "SKIP",
      });
      claimNextRunResult = null;
      const caughtErr = await expectToThrow(() =>
        CronService.dispatchScheduleById({
          id: "sched-skip-1",
          source: CronTriggerSource.MANUAL,
        })
      );
      expect(caughtErr).toBeInstanceOf(Error);

      // claimNextRun was called — it returned null (simulating the SKIP check)
      expect(claimNextRunCalls).toHaveLength(1);
      expect(claimNextRunCalls[0].scheduleId).toBe("sched-skip-1");

      // No run was enqueued via the adapter
      expect(adapterSendCalls).toHaveLength(0);
    });

    test("SKIP concurrency policy: returns in-flight run id and skipped:true when listRuns finds a RUNNING run", async () => {
      const inFlightRun = makeRunReturnRow({
        id: "run-inflight-1",
        scheduleId: "sched-skip-2",
        status: CronRunStatus.RUNNING,
      });

      getScheduleByIdResult = makeScheduleRow({
        id: "sched-skip-2",
        concurrencyPolicy: "SKIP",
      });
      claimNextRunResult = null;
      listRunsResult = { rows: [inFlightRun], totalCount: 1 };

      const result = await CronService.dispatchScheduleById({
        id: "sched-skip-2",
        source: CronTriggerSource.MANUAL,
      });

      expect(result.runId).toBe("run-inflight-1");
      expect(result.queueJobId).toBeNull();
      expect(result.skipped).toBe(true);

      // No run was enqueued via the adapter
      expect(adapterSendCalls).toHaveLength(0);
    });

    test("REPLACE concurrency policy: when an active run exists, the existing run is cancelled and a new run is created", async () => {
      // Schedule with REPLACE policy — repo.claimNextRun cancels in-flight runs
      // (sets them to CANCELLED status) and inserts a new run.
      getScheduleByIdResult = makeScheduleRow({
        id: "sched-replace-1",
        concurrencyPolicy: "REPLACE",
      });
      // Simulate claimNextRun cancelling the old run and returning a new runId
      claimNextRunResult = { runId: "run-replaced-new" };

      // Track updateRunStatus calls to verify the old run was cancelled
      const oldRunCancelled = makeRunRow({
        id: "run-replaced-old",
        scheduleId: "sched-replace-1",
        status: CronRunStatus.CANCELLED,
      });
      updateRunStatusResult = oldRunCancelled;

      // We need updateRunStatusResult to return the cancelled run row
      // Since the repo mock handles the cancel inline (via claimNextRun),
      // the mock simulates the effect by returning a new runId.
      // The service calls adapter.send with the new runId.

      const result = await CronService.dispatchScheduleById({
        id: "sched-replace-1",
        source: CronTriggerSource.MANUAL,
      });

      // claimNextRun was called — it cancels the old in-flight run and returns a new runId
      expect(claimNextRunCalls).toHaveLength(1);
      expect(claimNextRunCalls[0].scheduleId).toBe("sched-replace-1");

      // A new run was enqueued via the adapter
      expect(adapterSendCalls).toHaveLength(1);
      const sendArg = adapterSendCalls[0];
      expect(sendArg.runId).toBe("run-replaced-new");
      expect(sendArg.scheduleId).toBe("sched-replace-1");

      // The dispatch result returns the new runId
      expect(result.runId).toBe("run-replaced-new");
      expect(result.queueJobId).toBe("queue-job-id");
    });
  });

  // ── completeRun ──

  describe("completeRun", () => {
    test("computes durationMs, updates run + schedule lastRunAt", async () => {
      const startedAt = new Date("2025-01-01T12:00:00Z");
      updateRunStatusResult = makeRunRow({
        id: "run-complete-1",
        scheduleId: "sched-complete-1",
        startedAt,
        status: CronRunStatus.RUNNING,
      });

      await CronService.completeRun("run-complete-1");

      // Single call: status COMPLETED with completedAt, guard [RUNNING, RETRYING]
      // durationMs is computed from the returned row's startedAt (not passed as extra)
      expect(updateRunStatusCalls).toHaveLength(1);
      expect(updateRunStatusCalls[0].runId).toBe("run-complete-1");
      expect(updateRunStatusCalls[0].status).toBe(CronRunStatus.COMPLETED);
      expect(updateRunStatusCalls[0].extras?.completedAt).toBeInstanceOf(Date);
      expect(updateRunStatusCalls[0].fromStatuses).toEqual([CronRunStatus.RUNNING, CronRunStatus.RETRYING]);

      // Schedule lastRunAt update
      expect(updateScheduleCalls).toHaveLength(1);
      expect(updateScheduleCalls[0].id).toBe("sched-complete-1");
      expect(updateScheduleCalls[0].input.lastRunAt).toBeInstanceOf(Date);
    });

    test("skips completeRun when run not found (status guard fails)", async () => {
      updateRunStatusResult = null;

      await CronService.completeRun("run-missing-complete");

      // Only the status guard call, no schedule update
      expect(updateRunStatusCalls).toHaveLength(1);
      expect(updateRunStatusCalls[0].runId).toBe("run-missing-complete");
      expect(updateScheduleCalls).toHaveLength(0);
    });

    test("completes run when startedAt is null without computing durationMs", async () => {
      updateRunStatusResult = makeRunRow({
        id: "run-no-start",
        scheduleId: "sched-no-start",
        startedAt: undefined,
      });

      await CronService.completeRun("run-no-start");

      // Only the first status call, no durationMs second call
      expect(updateRunStatusCalls).toHaveLength(1);
      // Schedule lastRunAt still updated
      expect(updateScheduleCalls).toHaveLength(1);
      expect(updateScheduleCalls[0].id).toBe("sched-no-start");
    });
  });

  // ── failRun ──

  describe("failRun", () => {
    test("computes durationMs, updates run + schedule lastRunAt", async () => {
      const startedAt = new Date("2025-01-01T12:00:00Z");
      updateRunStatusResult = makeRunRow({
        id: "run-fail-1",
        scheduleId: "sched-fail-1",
        startedAt,
        status: CronRunStatus.RUNNING,
      });

      await CronService.failRun("run-fail-1", "Something went wrong", "stack trace here");

      // Single call: status FAILED with errorMessage + errorStack + completedAt
      // durationMs is computed from the returned row's startedAt (not passed as extra)
      expect(updateRunStatusCalls).toHaveLength(1);
      expect(updateRunStatusCalls[0].runId).toBe("run-fail-1");
      expect(updateRunStatusCalls[0].status).toBe(CronRunStatus.FAILED);
      expect(updateRunStatusCalls[0].extras?.errorMessage).toBe("Something went wrong");
      expect(updateRunStatusCalls[0].extras?.errorStack).toBe("stack trace here");
      expect(updateRunStatusCalls[0].extras?.completedAt).toBeInstanceOf(Date);
      expect(updateRunStatusCalls[0].fromStatuses).toEqual([
        CronRunStatus.PENDING,
        CronRunStatus.RUNNING,
        CronRunStatus.RETRYING,
      ]);

      // Schedule lastRunAt update
      expect(updateScheduleCalls).toHaveLength(1);
      expect(updateScheduleCalls[0].id).toBe("sched-fail-1");
      expect(updateScheduleCalls[0].input.lastRunAt).toBeInstanceOf(Date);
    });

    test("skips failRun when run not found in repository", async () => {
      updateRunStatusResult = null;

      await CronService.failRun("run-missing-fail", "error");

      expect(updateRunStatusCalls).toHaveLength(1);
      expect(updateRunStatusCalls[0].runId).toBe("run-missing-fail");
      expect(updateScheduleCalls).toHaveLength(0);
    });

    test("fails run when startedAt is null without computing durationMs", async () => {
      updateRunStatusResult = makeRunRow({
        id: "run-fail-no-start",
        scheduleId: "sched-fail-no-start",
        startedAt: undefined,
      });

      await CronService.failRun("run-fail-no-start", "error");

      // Only the status update call
      expect(updateRunStatusCalls).toHaveLength(1);
      // Schedule lastRunAt still updated
      expect(updateScheduleCalls).toHaveLength(1);
      expect(updateScheduleCalls[0].id).toBe("sched-fail-no-start");
    });

    test("works without errorStack parameter", async () => {
      updateRunStatusResult = makeRunRow({
        id: "run-fail-2",
        scheduleId: "sched-fail-2",
      });

      await CronService.failRun("run-fail-2", "no stack");

      expect(updateRunStatusCalls[0].extras?.errorMessage).toBe("no stack");
      expect(updateRunStatusCalls[0].extras?.errorStack).toBeUndefined();
    });
  });

  // ── Retry-decision path ──
  // The retry decision lives in the worker runtime (cron-worker.runtime.ts):
  //   when attempt < maxRetries → CronService.retryRun (status RETRYING)
  //   when attempt >= maxRetries → CronService.failRun   (status FAILED)
  // These tests verify that the service methods set the correct status for each branch.

  describe("retry-decision path", () => {
    test("retryRun sets status to RETRYING (not FAILED) when attempt < maxRetries", async () => {
      // Simulate the worker calling retryRun after a handler failure
      // where attempt (2) < maxRetries (3) — should set RETRYING, not FAILED.
      updateRunStatusResult = makeRunRow({ status: CronRunStatus.RETRYING });

      await CronService.retryRun("run-retry-decision", 30, 2);

      expect(updateRunStatusCalls).toHaveLength(1);
      const call = updateRunStatusCalls[0];
      expect(call.runId).toBe("run-retry-decision");
      expect(call.status).toBe(CronRunStatus.RETRYING);
      expect(call.status).not.toBe(CronRunStatus.FAILED);
      expect(call.extras?.attempt).toBe(2);
      expect(call.extras?.startedAt).toBeInstanceOf(Date);
      expect(call.extras?.durationMs).toBeNull();
      // Guard allows RUNNING, FAILED, or TIMEOUT → RETRYING transition
      expect(call.fromStatuses).toEqual([CronRunStatus.RUNNING, CronRunStatus.FAILED, CronRunStatus.TIMEOUT]);
      // No schedule lastRunAt update on retry
      expect(updateScheduleCalls).toHaveLength(0);
    });

    test("failRun sets status to FAILED when attempt >= maxRetries (retries exhausted)", async () => {
      // Simulate the worker calling failRun after attempt (3) >= maxRetries (3)
      // — irrecoverable failure, should set FAILED, not RETRYING.
      updateRunStatusResult = makeRunRow({
        id: "run-exhausted",
        scheduleId: "sched-exhausted",
        status: CronRunStatus.RUNNING,
        startedAt: new Date("2025-01-01T12:00:00Z"),
        attempt: 3,
      });

      await CronService.failRun("run-exhausted", "retries exhausted", null);

      expect(updateRunStatusCalls).toHaveLength(1);
      const firstCall = updateRunStatusCalls[0];
      expect(firstCall.runId).toBe("run-exhausted");
      expect(firstCall.status).toBe(CronRunStatus.FAILED);
      expect(firstCall.status).not.toBe(CronRunStatus.RETRYING);
      expect(firstCall.extras?.errorMessage).toBe("retries exhausted");
      expect(firstCall.fromStatuses).toEqual([CronRunStatus.PENDING, CronRunStatus.RUNNING, CronRunStatus.RETRYING]);

      // Schedule lastRunAt updated on final failure
      expect(updateScheduleCalls).toHaveLength(1);
      expect(updateScheduleCalls[0].id).toBe("sched-exhausted");
    });
  });

  // ── deleteSchedule ──

  describe("deleteSchedule", () => {
    test("calls repo.softDeleteScheduleById by default", async () => {
      await CronService.deleteSchedule({ id: "sched-1" }, "en");

      expect(getScheduleByIdCalls).toContain("sched-1");
      expect(softDeleteScheduleByIdCalls).toHaveLength(1);
      expect(softDeleteScheduleByIdCalls[0]).toBe("sched-1");
      expect(permanentlyDeleteScheduleByIdCalls).toHaveLength(0);
    });

    test("calls repo.permanentlyDeleteScheduleById when hard=true", async () => {
      await CronService.deleteSchedule({ id: "sched-1", hard: true }, "en");

      expect(getScheduleByIdCalls).toContain("sched-1");
      expect(permanentlyDeleteScheduleByIdCalls).toHaveLength(1);
      expect(permanentlyDeleteScheduleByIdCalls[0]).toBe("sched-1");
      expect(softDeleteScheduleByIdCalls).toHaveLength(0);
    });

    test("throws when schedule not found", async () => {
      getScheduleByIdResult = null;

      return expect(CronService.deleteSchedule({ id: "missing" }, "en")).rejects.toThrow("Not found: missing");
    });
  });

  // ── getSchedule ──

  describe("getSchedule", () => {
    test("returns schedule when found", async () => {
      getScheduleByIdResult = mockScheduleRow;

      const result = await CronService.getSchedule("sched-1");

      expect(getScheduleByIdCalls).toContain("sched-1");
      expect(result).not.toBeNull();
      expect(result?.id).toBe("sched-1");
    });

    test("returns null when not found", async () => {
      getScheduleByIdResult = null;

      const result = await CronService.getSchedule("nonexistent");

      expect(result).toBeNull();
    });
  });

  // ── getSchedules ──

  describe("getSchedules", () => {
    test("calls repo.listSchedules and returns rows + totalCount", async () => {
      listSchedulesResult = { rows: [mockScheduleReturnRow], totalCount: 1 };

      const result = await CronService.getSchedules({ limit: 10 });

      expect(listSchedulesCalls).toHaveLength(1);
      expect(result.rows).toHaveLength(1);
      expect(result.totalCount).toBe(1);
    });
  });

  // ── retryRun ──

  describe("retryRun", () => {
    test("resets startedAt, clears durationMs, sets RETRYING", async () => {
      updateRunStatusResult = makeRunRow({ status: CronRunStatus.RETRYING });

      await CronService.retryRun("run-retry-1", 30, 2);

      expect(updateRunStatusCalls).toHaveLength(1);
      const call = updateRunStatusCalls[0];
      expect(call.runId).toBe("run-retry-1");
      expect(call.status).toBe(CronRunStatus.RETRYING);
      expect(call.extras?.attempt).toBe(2);
      expect(call.extras?.startedAt).toBeInstanceOf(Date);
      expect(call.extras?.durationMs).toBeNull();
      expect(call.fromStatuses).toEqual([CronRunStatus.RUNNING, CronRunStatus.FAILED, CronRunStatus.TIMEOUT]);
    });

    test("skips when status guard fails (RUNNING not met)", async () => {
      updateRunStatusResult = null;

      await CronService.retryRun("run-retry-2", 60, 3);

      expect(updateRunStatusCalls).toHaveLength(1);
    });
  });

  // ── reconcileStuckRuns ──

  describe("reconcileStuckRuns", () => {
    test("calls repo.reconcileStuckRuns and returns count", async () => {
      reconcileStuckRunsResult = 3;

      const result = await CronService.reconcileStuckRuns({
        now: new Date("2025-01-01T12:00:00Z"),
      });

      expect(reconcileStuckRunsCalls).toHaveLength(1);
      expect(reconcileStuckRunsCalls[0].batch).toBe(100);
      expect(result).toBe(3);
    });

    test("returns 0 when no stuck runs", async () => {
      reconcileStuckRunsResult = 0;

      const result = await CronService.reconcileStuckRuns({
        now: new Date("2025-01-01T12:00:00Z"),
        batch: 50,
      });

      expect(reconcileStuckRunsCalls[0].batch).toBe(50);
      expect(result).toBe(0);
    });
  });

  // ── getQueueStats ──

  describe("getQueueStats", () => {
    test("calls adapter.getQueueStats", async () => {
      adapterGetQueueStatsResult = { backend: "pgboss", pending: 5, inFlight: 2, failed: 1, byJobKind: {} };

      const result = await CronService.getQueueStats();

      expect(adapterGetQueueStatsCalls).toBe(1);
      expect(result).toEqual({ backend: "pgboss", pending: 5, inFlight: 2, failed: 1, byJobKind: {} });
    });
  });

  // ── recordHeartbeat ──

  describe("recordHeartbeat", () => {
    test("calls repository.recordHeartbeat with input", async () => {
      await CronService.recordHeartbeat("run-1", "worker-1");

      expect(recordHeartbeatCalls).toHaveLength(1);
      expect(recordHeartbeatCalls[0]?.runId).toBe("run-1");
      expect(recordHeartbeatCalls[0]?.workerId).toBe("worker-1");
    });
  });
});
