import { describe, expect, mock, test } from "bun:test";
import { eq } from "drizzle-orm";
import { CronRepository } from "@/backend/db/repo/cron";
import { cronRuns, cronSchedules } from "@/backend/db/schema";
import { createTestUser } from "@/backend/db/test/entity-setup";
import { runInRollback } from "@/backend/db/test/test-utils";
import {
  CronConcurrencyPolicy,
  CronJobKind,
  CronRunStatus,
  CronScheduleStatus,
  CronTriggerSource,
} from "@/backend/enum/cron/cron.enums";
import type { DBTransaction } from "@/backend/types";
import type {
  CronRunInsertType,
  CronScheduleInsertType,
  CronScheduleSelectType,
} from "@/backend/types/cron/cron.types";

const noop = () => {};
void mock.module("@/backend/lib/logger", () => ({
  logger: { log: noop, info: noop, warn: noop, error: noop, debug: noop },
  default: { log: noop, info: noop, warn: noop, error: noop, debug: noop },
}));

async function expectRepoError(fn: () => Promise<unknown>): Promise<Error> {
  let errorCaught: unknown = null;
  try {
    await fn();
  } catch (error) {
    errorCaught = error;
  }
  expect(errorCaught).not.toBeNull();
  if (!(errorCaught instanceof Error)) {
    throw new TypeError("expected Error");
  }
  return errorCaught;
}

async function createTestSchedule(
  tx: DBTransaction,
  overrides: Partial<CronScheduleInsertType> & Pick<CronScheduleInsertType, "createdByUserId">
): Promise<CronScheduleSelectType> {
  return CronRepository.createSchedule(
    {
      name: `test-schedule-${crypto.randomUUID()}`,
      jobKind: CronJobKind.NOOP,
      cronExpression: "*/5 * * * *",
      timezone: "UTC",
      payload: {},
      status: CronScheduleStatus.ACTIVE,
      concurrencyPolicy: CronConcurrencyPolicy.ALLOW,
      maxRetries: 3,
      retryBackoffSeconds: 60,
      timeoutSeconds: 300,
      nextRunAt: new Date(),
      ...overrides,
    },
    tx
  );
}

/** Assert that a nullable value is non-null and return the narrowed value. */
function assertNotNull<T>(value: T | null | undefined, msg?: string): T {
  expect(value).not.toBeNull();
  if (value === null || value === undefined) throw new Error(msg ?? "expected non-null");
  return value;
}

const PAST_OFFSET = -5000;
const RESET_OFFSET = -1000;
const CLAIM_TIMEOUT_OFFSET = 60000;
const RECLAIM_TIMEOUT_OFFSET = 120000;
const COMPLETED_OFFSET = 5000;
const NON_EXISTENT_ID = "00000000-0000-0000-0000-000000000000";

type TestUser = Awaited<ReturnType<typeof createTestUser>>;
type CronRun = Awaited<ReturnType<typeof CronRepository.createRun>>;

/** Create a user + a schedule (nextRunAt in the past by default). Returns { user, schedule, now }. */
async function setupSchedule(
  tx: DBTransaction,
  namePrefix: string,
  overrides: Partial<CronScheduleInsertType> = {}
): Promise<{ user: TestUser; schedule: CronScheduleSelectType; now: Date }> {
  const now = new Date();
  const user = await createTestUser(tx);
  const schedule = await createTestSchedule(tx, {
    name: `${namePrefix}-${crypto.randomUUID()}`,
    createdByUserId: user.id,
    nextRunAt: new Date(now.getTime() + PAST_OFFSET),
    ...overrides,
  });
  return { user, schedule, now };
}

/** Claim a run for `scheduleId` using the standard trigger + future timeout. Returns the runId. */
async function claimRun(
  tx: DBTransaction,
  scheduleId: string,
  now: Date,
  timeoutOffsetMs = CLAIM_TIMEOUT_OFFSET
): Promise<string> {
  const claimed = await CronRepository.claimNextRun(
    scheduleId,
    now,
    CronTriggerSource.VERCEL_EXPLICIT,
    new Date(now.getTime() + timeoutOffsetMs),
    tx
  );
  return assertNotNull(claimed).runId;
}

/** Setup a due schedule + claim a run. Returns { user, schedule, runId, now }. */
async function setupClaimedRun(
  tx: DBTransaction,
  namePrefix: string,
  overrides: Partial<CronScheduleInsertType> = {}
): Promise<{ user: TestUser; schedule: CronScheduleSelectType; runId: string; now: Date }> {
  const { user, schedule, now } = await setupSchedule(tx, namePrefix, overrides);
  const runId = await claimRun(tx, schedule.id, now);
  return { user, schedule, runId, now };
}

/** Insert a run with the default NOOP/VERCEL_EXPLICIT fields. */
async function makeRun(
  tx: DBTransaction,
  scheduleId: string,
  overrides: Partial<CronRunInsertType> = {}
): Promise<CronRun> {
  return CronRepository.createRun(
    {
      scheduleId,
      status: CronRunStatus.PENDING,
      attempt: 1,
      jobKind: CronJobKind.NOOP,
      triggerSource: CronTriggerSource.VERCEL_EXPLICIT,
      ...overrides,
    },
    tx
  );
}

/** Transition an existing run through RUNNING → COMPLETED. Returns the runId. */
async function runToCompleted(tx: DBTransaction, runId: string, now: Date): Promise<string> {
  await CronRepository.updateRunStatus(runId, CronRunStatus.RUNNING, { startedAt: now }, undefined, tx);
  await CronRepository.updateRunStatus(
    runId,
    CronRunStatus.COMPLETED,
    { completedAt: new Date(now.getTime() + COMPLETED_OFFSET) },
    undefined,
    tx
  );
  return runId;
}

/** Reset a schedule's nextRunAt to the past, then re-claim. Returns the second claim result (null if blocked). */
async function reClaimAfterReset(
  tx: DBTransaction,
  schedule: CronScheduleSelectType,
  now: Date,
  timeoutOffsetMs = RECLAIM_TIMEOUT_OFFSET
): Promise<string | null> {
  await tx
    .update(cronSchedules)
    .set({ nextRunAt: new Date(now.getTime() + RESET_OFFSET) })
    .where(eq(cronSchedules.id, schedule.id));
  const second = await CronRepository.claimNextRun(
    schedule.id,
    now,
    CronTriggerSource.VERCEL_EXPLICIT,
    new Date(now.getTime() + timeoutOffsetMs),
    tx
  );
  return second?.runId ?? null;
}

/** Higher-order cron test wrapper: runs `test(name, body)` inside runInRollback and passes `tx`. */
function cronTest(name: string, body: (tx: DBTransaction) => Promise<void>): void {
  test(name, async () => {
    expect(body).toBeDefined();
    await runInRollback(async tx => body(tx));
  });
}

describe("CronRepository", () => {
  // ── 1. createSchedule + getScheduleById ──

  cronTest("createSchedule + getScheduleById — creates and fetches by ID", async tx => {
    const { schedule } = await setupSchedule(tx, "create-and-fetch", { nextRunAt: new Date(Date.now() - 1000) });

    const fetched = await CronRepository.getScheduleById(schedule.id, tx);
    expect(fetched).not.toBeNull();
    expect(fetched?.id).toBe(schedule.id);
    expect(fetched?.name).toBe(schedule.name);
    expect(fetched?.status).toBe(CronScheduleStatus.ACTIVE);
    expect(fetched?.cronExpression).toBe("*/5 * * * *");
  });

  cronTest("getScheduleById — returns null for non-existent id", async tx => {
    expect(await CronRepository.getScheduleById(NON_EXISTENT_ID, tx)).toBeNull();
  });

  // ── 2. getScheduleByName ──

  cronTest("getScheduleByName — fetches by name", async tx => {
    const { schedule } = await setupSchedule(tx, "fetch-by-name", { nextRunAt: new Date() });

    const fetched = await CronRepository.getScheduleByName(schedule.name, tx);
    expect(fetched).not.toBeNull();
    expect(fetched?.id).toBe(schedule.id);
    expect(fetched?.name).toBe(schedule.name);
  });

  cronTest("getScheduleByName — returns null for non-existent name", async tx => {
    expect(await CronRepository.getScheduleByName("non-existent-schedule-name", tx)).toBeNull();
  });

  // ── 3. listSchedules ──

  cronTest("listSchedules — returns paginated results with totalCount", async tx => {
    const { schedule } = await setupSchedule(tx, "list-page-seed");
    await Promise.all(
      Array.from({ length: 4 }, (_, i) =>
        createTestSchedule(tx, {
          name: `list-page-${i}-${crypto.randomUUID()}`,
          createdByUserId: schedule.createdByUserId,
        })
      )
    );

    const page1 = await CronRepository.listSchedules({ limit: 2, offset: 0 }, tx);
    expect(page1.rows).toHaveLength(2);
    expect(page1.totalCount).toBeGreaterThanOrEqual(5);

    const page2 = await CronRepository.listSchedules({ limit: 2, offset: 2 }, tx);
    expect(page2.rows).toHaveLength(2);

    const page3 = await CronRepository.listSchedules({ limit: 2, offset: 4 }, tx);
    expect(page3.rows.length).toBeGreaterThanOrEqual(1);
  });

  cronTest("listSchedules — filters by status", async tx => {
    const { schedule } = await setupSchedule(tx, "filter-active", { status: CronScheduleStatus.ACTIVE });
    await createTestSchedule(tx, {
      name: `filter-paused-${crypto.randomUUID()}`,
      createdByUserId: schedule.createdByUserId,
      status: CronScheduleStatus.PAUSED,
    });

    const active = await CronRepository.listSchedules({ status: CronScheduleStatus.ACTIVE }, tx);
    expect(active.rows.every(s => s.status === CronScheduleStatus.ACTIVE)).toBe(true);

    const paused = await CronRepository.listSchedules({ status: CronScheduleStatus.PAUSED }, tx);
    expect(paused.rows.every(s => s.status === CronScheduleStatus.PAUSED)).toBe(true);
  });

  // ── 4. listDueSchedules ──

  cronTest("listDueSchedules — returns ACTIVE schedules with nextRunAt <= now", async tx => {
    const { now } = await setupSchedule(tx, "due-past");

    const due = await CronRepository.listDueSchedules(now, 100, tx);
    expect(due.length).toBeGreaterThanOrEqual(1);
    expect(due.every(s => s.status === "ACTIVE" && s.nextRunAt !== null && s.nextRunAt <= now)).toBe(true);
  });

  cronTest("listDueSchedules — excludes schedules with nextRunAt in the future", async tx => {
    const { schedule, now } = await setupSchedule(tx, "due-future", { nextRunAt: new Date(Date.now() + 60000) });

    const due = await CronRepository.listDueSchedules(now, 100, tx);
    expect(due.find(s => s.name === schedule.name)).toBeUndefined();
  });

  cronTest("listDueSchedules — excludes PAUSED schedules", async tx => {
    const { schedule, now } = await setupSchedule(tx, "due-paused", { status: CronScheduleStatus.PAUSED });

    const due = await CronRepository.listDueSchedules(now, 100, tx);
    expect(due.find(s => s.name === schedule.name)).toBeUndefined();
  });

  // ── 5. claimNextRun ──

  cronTest("claimNextRun — returns a runId for an ACTIVE due schedule", async tx => {
    const { schedule, runId } = await setupClaimedRun(tx, "claim");

    const run = await CronRepository.getRunById(runId, tx);
    expect(run).not.toBeNull();
    expect(run?.status).toBe(CronRunStatus.PENDING);
    expect(run?.scheduleId).toBe(schedule.id);
    expect(runId).not.toBe("");
  });

  cronTest("claimNextRun — ALLOW policy permits multiple concurrent runs", async tx => {
    const {
      schedule,
      runId: firstRunId,
      now,
    } = await setupClaimedRun(tx, "claim-allow", {
      concurrencyPolicy: CronConcurrencyPolicy.ALLOW,
    });

    const secondRunId = await reClaimAfterReset(tx, schedule, now);
    expect(secondRunId).not.toBeNull();
    expect(secondRunId).not.toBe(firstRunId);
  });

  cronTest("claimNextRun — SKIP policy blocks second claim while first is in-flight", async tx => {
    const { schedule, now } = await setupClaimedRun(tx, "claim-skip", {
      concurrencyPolicy: CronConcurrencyPolicy.SKIP,
    });

    expect(await reClaimAfterReset(tx, schedule, now)).toBeNull();
  });

  cronTest("claimNextRun — returns null for non-existent schedule", async tx => {
    const result = await CronRepository.claimNextRun(
      NON_EXISTENT_ID,
      new Date(),
      CronTriggerSource.VERCEL_EXPLICIT,
      new Date(Date.now() + CLAIM_TIMEOUT_OFFSET),
      tx
    );
    expect(result).toBeNull();
  });

  // ── 6. updateRunStatus status guard ──

  cronTest("updateRunStatus — transitions PENDING → RUNNING → COMPLETED", async tx => {
    const { runId, now } = await setupClaimedRun(tx, "status-flow");

    const running = await CronRepository.updateRunStatus(
      runId,
      CronRunStatus.RUNNING,
      { startedAt: now, workerId: "test-worker" },
      undefined,
      tx
    );
    expect(running).not.toBeNull();
    expect(running?.status).toBe(CronRunStatus.RUNNING);
    expect(running?.workerId).toBe("test-worker");

    const completed = await CronRepository.updateRunStatus(
      runId,
      CronRunStatus.COMPLETED,
      { completedAt: new Date(now.getTime() + COMPLETED_OFFSET) },
      undefined,
      tx
    );
    expect(completed).not.toBeNull();
    expect(completed?.status).toBe(CronRunStatus.COMPLETED);
  });

  cronTest("updateRunStatus — status guard prevents COMPLETED → RUNNING transition", async tx => {
    const { runId, now } = await setupClaimedRun(tx, "status-guard");
    await runToCompleted(tx, runId, now);

    const blocked = await CronRepository.updateRunStatus(
      runId,
      CronRunStatus.RUNNING,
      { startedAt: now },
      undefined,
      tx
    );
    expect(blocked).toBeNull();

    const finalRun = await CronRepository.getRunById(runId, tx);
    expect(finalRun?.status).toBe(CronRunStatus.COMPLETED);
  });

  cronTest("updateRunStatus — explicit fromStatuses override works", async tx => {
    const { runId, now } = await setupClaimedRun(tx, "from-statuses");
    await runToCompleted(tx, runId, now);

    const forced = await CronRepository.updateRunStatus(
      runId,
      CronRunStatus.RUNNING,
      { startedAt: now },
      [CronRunStatus.COMPLETED],
      tx
    );
    expect(forced).not.toBeNull();
    expect(forced?.status).toBe(CronRunStatus.RUNNING);
  });

  cronTest("updateRunStatus — returns null for non-existent run", async tx => {
    const result = await CronRepository.updateRunStatus(NON_EXISTENT_ID, CronRunStatus.RUNNING, {}, undefined, tx);
    expect(result).toBeNull();
  });

  // ── 7. updateScheduleIfStatus ──

  cronTest("updateScheduleIfStatus — succeeds when status matches", async tx => {
    const { schedule } = await setupSchedule(tx, "if-status-ok", { status: CronScheduleStatus.ACTIVE });

    const updated = await CronRepository.updateScheduleIfStatus(
      schedule.id,
      { cronExpression: "0 0 * * *", status: CronScheduleStatus.PAUSED },
      CronScheduleStatus.ACTIVE,
      tx
    );
    expect(updated).not.toBeNull();
    expect(updated?.cronExpression).toBe("0 0 * * *");
    expect(updated?.status).toBe(CronScheduleStatus.PAUSED);
  });

  cronTest("updateScheduleIfStatus — returns null when status does not match", async tx => {
    const { schedule } = await setupSchedule(tx, "if-status-fail", { status: CronScheduleStatus.ACTIVE });

    const updated = await CronRepository.updateScheduleIfStatus(
      schedule.id,
      { cronExpression: "0 0 * * *" },
      CronScheduleStatus.PAUSED,
      tx
    );
    expect(updated).toBeNull();

    const fetched = await CronRepository.getScheduleById(schedule.id, tx);
    expect(fetched?.cronExpression).toBe("*/5 * * * *");
  });

  cronTest("updateSchedule — updates fields directly", async tx => {
    const { schedule } = await setupSchedule(tx, "update-sched");

    const updated = await CronRepository.updateSchedule(
      schedule.id,
      { cronExpression: "0 0 * * *", status: CronScheduleStatus.PAUSED },
      tx
    );
    expect(updated).not.toBeNull();
    expect(updated?.cronExpression).toBe("0 0 * * *");
    expect(updated?.status).toBe(CronScheduleStatus.PAUSED);
  });

  cronTest("updateSchedule — returns null for non-existent schedule", async tx => {
    const updated = await CronRepository.updateSchedule(NON_EXISTENT_ID, { cronExpression: "0 0 * * *" }, tx);
    expect(updated).toBeNull();
  });

  // ── 8. recordHeartbeat ──

  cronTest("recordHeartbeat — inserts heartbeat without error", async tx => {
    const { runId, now } = await setupClaimedRun(tx, "heartbeat");
    await CronRepository.updateRunStatus(
      runId,
      CronRunStatus.RUNNING,
      { startedAt: now, workerId: "hb-worker" },
      undefined,
      tx
    );

    await CronRepository.recordHeartbeat(
      { runId, workerId: "hb-worker", lastBeatAt: new Date(now.getTime() + 1000), progress: { percent: 50 } },
      tx
    );

    const beats = await tx.select().from(cronRuns).where(eq(cronRuns.id, runId)).limit(1);
    expect(beats[0]?.status).toBe(CronRunStatus.RUNNING);
  });

  // ── 9. reconcileStuckRuns ──

  cronTest("reconcileStuckRuns — marks stuck RUNNING run as TIMEOUT", async tx => {
    const { runId, now } = await setupClaimedRun(tx, "stuck", {
      nextRunAt: new Date(Date.now() - 10000),
      timeoutSeconds: 1,
    });
    await CronRepository.updateRunStatus(runId, CronRunStatus.RUNNING, { startedAt: now }, undefined, tx);

    const futureNow = new Date(now.getTime() + 5000);
    expect(await CronRepository.reconcileStuckRuns(futureNow, 100, tx)).toBe(1);

    const run = await CronRepository.getRunById(runId, tx);
    expect(run?.status).toBe(CronRunStatus.TIMEOUT);
  });

  cronTest("reconcileStuckRuns — skips recently started runs", async tx => {
    const { runId, now } = await setupClaimedRun(tx, "not-stuck", { timeoutSeconds: 300 });
    await CronRepository.updateRunStatus(runId, CronRunStatus.RUNNING, { startedAt: now }, undefined, tx);

    expect(await CronRepository.reconcileStuckRuns(new Date(now.getTime() + 1000), 100, tx)).toBe(0);

    const run = await CronRepository.getRunById(runId, tx);
    expect(run?.status).toBe(CronRunStatus.RUNNING);
  });

  cronTest("reconcileStuckRuns — returns 0 when no RUNNING runs exist", async tx => {
    expect(await CronRepository.reconcileStuckRuns(new Date(), 100, tx)).toBe(0);
  });

  // ── 10. deleteScheduleById ──

  cronTest("softDeleteScheduleById — soft delete sets status to DISABLED", async tx => {
    const { schedule } = await setupSchedule(tx, "soft-delete", { nextRunAt: new Date() });
    await CronRepository.softDeleteScheduleById(schedule.id, tx);

    const fetched = await CronRepository.getScheduleById(schedule.id, tx);
    expect(fetched).not.toBeNull();
    expect(fetched?.status).toBe(CronScheduleStatus.DISABLED);
  });

  cronTest("permanentlyDeleteScheduleById — hard delete removes schedule and runs", async tx => {
    const { schedule, runId } = await setupClaimedRun(tx, "hard-delete");
    await CronRepository.permanentlyDeleteScheduleById(schedule.id, tx);

    expect(await CronRepository.getScheduleById(schedule.id, tx)).toBeNull();
    expect(await CronRepository.getRunById(runId, tx)).toBeNull();
  });

  // ── listRunsBySchedule ──

  cronTest("listRunsBySchedule — returns paginated runs for a schedule", async tx => {
    const { schedule } = await setupSchedule(tx, "runs-by-sched");

    const runs = await Promise.all([
      makeRun(tx, schedule.id, { attempt: 1 }),
      makeRun(tx, schedule.id, { attempt: 2 }),
      makeRun(tx, schedule.id, { attempt: 3 }),
    ]);

    expect(runs).toHaveLength(3);
    const page1 = await CronRepository.listRunsBySchedule(schedule.id, { limit: 2, offset: 0 }, tx);
    expect(page1.rows).toHaveLength(2);
    expect(page1.totalCount).toBe(3);

    const page2 = await CronRepository.listRunsBySchedule(schedule.id, { limit: 2, offset: 2 }, tx);
    expect(page2.rows).toHaveLength(1);
  });

  // ── listRuns ──

  cronTest("listRuns — filters by scheduleId", async tx => {
    const { schedule, runId } = await setupClaimedRun(tx, "list-runs-filter");

    const runs = await CronRepository.listRuns({ scheduleId: schedule.id }, tx);
    expect(runs.totalCount).toBe(1);
    expect(runs.rows[0]?.id).toBe(runId);
  });

  cronTest("listRuns — filters by status", async tx => {
    const { runId } = await setupClaimedRun(tx, "list-runs-status");

    const pending = await CronRepository.listRuns({ status: CronRunStatus.PENDING }, tx);
    expect(pending.rows.some(r => r.id === runId)).toBe(true);

    const running = await CronRepository.listRuns({ status: CronRunStatus.RUNNING }, tx);
    expect(running.rows.some(r => r.id === runId)).toBe(false);
  });

  cronTest("listRuns — filters by date range", async tx => {
    const { runId, now } = await setupClaimedRun(tx, "list-runs-date");

    const fromFilter = await CronRepository.listRuns({ from: new Date(now.getTime() + 1000) }, tx);
    expect(fromFilter.rows.some(r => r.id === runId)).toBe(false);

    const toFilter = await CronRepository.listRuns({ to: now }, tx);
    expect(toFilter.rows.some(r => r.id === runId)).toBe(true);
  });

  // ── getRunById ──

  cronTest("getRunById — returns null for non-existent run", async tx => {
    expect(await CronRepository.getRunById(NON_EXISTENT_ID, tx)).toBeNull();
  });

  // ── createSchedule validation ──

  cronTest("createSchedule — throws on missing required createdByUserId (FK violation)", async tx => {
    await expectRepoError(async () => createTestSchedule(tx, { createdByUserId: NON_EXISTENT_ID }));
  });

  // ── createRun ──

  cronTest("createRun — inserts a new run with defaults", async tx => {
    const { schedule } = await setupSchedule(tx, "create-run", { nextRunAt: new Date() });
    const startedAt = new Date();
    const run = await makeRun(tx, schedule.id, { startedAt });

    expect(run).toBeDefined();
    expect(run.id).toBeDefined();
    expect(run.scheduleId).toBe(schedule.id);
    expect(run.status).toBe(CronRunStatus.PENDING);
    expect(run.attempt).toBe(1);
    expect(run.jobKind).toBe("NOOP");
    expect(run.triggerSource).toBe(CronTriggerSource.VERCEL_EXPLICIT);
    expect(run.startedAt).toEqual(startedAt);
  });

  cronTest("createRun — defaults startedAt to now when not provided", async tx => {
    const { schedule } = await setupSchedule(tx, "create-run-default", { nextRunAt: new Date() });

    const before = new Date(Date.now() - 1000);
    const run = await makeRun(tx, schedule.id, { attempt: 0, triggerSource: CronTriggerSource.VERCEL_TICKER });
    const after = new Date(Date.now() + 1000);

    expect(run.startedAt).toBeDefined();
    expect(run.startedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
    expect(run.startedAt.getTime()).toBeLessThanOrEqual(after.getTime());
  });

  cronTest("createRun — stores payload when provided", async tx => {
    const { schedule } = await setupSchedule(tx, "create-run-payload", { nextRunAt: new Date() });

    const payload = { key: "value", nested: { num: 42 } };
    const run = await makeRun(tx, schedule.id, { payload });

    expect(run.payload).toEqual(payload);
  });

  // ── getActiveRunCount ──

  cronTest("getActiveRunCount — counts RUNNING and RETRYING runs", async tx => {
    const { schedule, now } = await setupSchedule(tx, "active-count");

    expect(await CronRepository.getActiveRunCount(schedule.id, tx)).toBe(0);

    const run = await makeRun(tx, schedule.id);
    await CronRepository.updateRunStatus(run.id, CronRunStatus.RUNNING, { startedAt: now }, undefined, tx);
    expect(await CronRepository.getActiveRunCount(schedule.id, tx)).toBe(1);

    await CronRepository.updateRunStatus(run.id, CronRunStatus.RETRYING, {}, undefined, tx);
    expect(await CronRepository.getActiveRunCount(schedule.id, tx)).toBe(1);

    await CronRepository.updateRunStatus(run.id, CronRunStatus.COMPLETED, { completedAt: now }, undefined, tx);
    expect(await CronRepository.getActiveRunCount(schedule.id, tx)).toBe(0);
  });

  cronTest("getActiveRunCount — returns 0 for schedule with no runs", async tx => {
    const { schedule } = await setupSchedule(tx, "active-count-empty", { nextRunAt: new Date() });
    expect(await CronRepository.getActiveRunCount(schedule.id, tx)).toBe(0);
  });

  // ── getRunHeartbeats ──

  cronTest("getRunHeartbeats — returns heartbeats ordered by lastBeatAt ascending", async tx => {
    const { schedule, now } = await setupSchedule(tx, "heartbeats");
    const run = await makeRun(tx, schedule.id, { status: CronRunStatus.RUNNING, startedAt: now });

    const beat1 = new Date(now.getTime() + 1000);
    const beat2 = new Date(now.getTime() + 2000);
    const beat3 = new Date(now.getTime() + 3000);
    await CronRepository.recordHeartbeat({ runId: run.id, workerId: "w1", lastBeatAt: beat2 }, tx);
    await CronRepository.recordHeartbeat({ runId: run.id, workerId: "w1", lastBeatAt: beat1 }, tx);
    await CronRepository.recordHeartbeat({ runId: run.id, workerId: "w1", lastBeatAt: beat3 }, tx);

    const heartbeats = await CronRepository.getRunHeartbeats(run.id, tx);
    expect(heartbeats).toBeDefined();
    expect(heartbeats).toHaveLength(3);
    expect(heartbeats[0].lastBeatAt.getTime()).toBeLessThanOrEqual(heartbeats[1].lastBeatAt.getTime());
    expect(heartbeats[1].lastBeatAt.getTime()).toBeLessThanOrEqual(heartbeats[2].lastBeatAt.getTime());
    expect(heartbeats[0].workerId).toBe("w1");
  });

  cronTest("getRunHeartbeats — returns empty array for run with no heartbeats", async tx => {
    const { schedule, now } = await setupSchedule(tx, "heartbeats-empty");
    const run = await makeRun(tx, schedule.id, { status: CronRunStatus.RUNNING, startedAt: now });

    expect(await CronRepository.getRunHeartbeats(run.id, tx)).toEqual([]);
  });

  // ── appendRunError ──

  cronTest("appendRunError — appends error messages without overwriting", async tx => {
    const { schedule, now } = await setupSchedule(tx, "append-err");
    const run = await makeRun(tx, schedule.id, { status: CronRunStatus.RUNNING, startedAt: now });

    const firstError = "Connection refused";
    const firstUpdated = await CronRepository.appendRunError(run.id, firstError, tx);
    expect(firstUpdated).not.toBeNull();
    expect(firstUpdated?.errorMessage).toContain(firstError);

    const secondError = "Timeout after 30s";
    const secondUpdated = await CronRepository.appendRunError(run.id, secondError, tx);
    expect(secondUpdated).not.toBeNull();
    expect(secondUpdated?.errorMessage).toContain(firstError);
    expect(secondUpdated?.errorMessage).toContain(secondError);
  });

  // ── listDueSchedules SKIP policy ──

  cronTest("listDueSchedules — excludes SKIP schedules with in-flight runs, includes ALLOW", async tx => {
    const now = new Date();
    const { schedule: skipSchedule } = await setupSchedule(tx, "due-skip-inflight", {
      concurrencyPolicy: CronConcurrencyPolicy.SKIP,
    });
    const { schedule: allowSchedule } = await setupSchedule(tx, "due-allow-inflight", {
      concurrencyPolicy: CronConcurrencyPolicy.ALLOW,
    });

    await makeRun(tx, skipSchedule.id, { status: CronRunStatus.PENDING });
    await makeRun(tx, allowSchedule.id, { status: CronRunStatus.PENDING });

    const due = await CronRepository.listDueSchedules(now, 100, tx);
    expect(due.find(s => s.name === skipSchedule.name)).toBeUndefined();
    expect(due.find(s => s.name === allowSchedule.name)).toBeDefined();
  });
});
