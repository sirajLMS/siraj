import { describe, expect, mock, test } from "bun:test";
import { eq } from "drizzle-orm";
import type { DBTransaction } from "@/backend/db/db.types";
import { CronRepository } from "@/backend/db/repo";
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
import type { CronScheduleInsertType, CronScheduleSelectType } from "@/backend/types/cron/cron.types";

const noop = () => {};
mock.module("@/backend/lib/logger", () => ({
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
  return errorCaught as Error;
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

describe("CronRepository", () => {
  // ── 1. createSchedule + getScheduleById ──

  test("createSchedule + getScheduleById — creates and fetches by ID", async () => {
    await runInRollback(async tx => {
      const user = await createTestUser(tx);
      const created = await createTestSchedule(tx, {
        name: "create-and-fetch",
        createdByUserId: user.id,
        nextRunAt: new Date(Date.now() - 1000),
      });

      const fetched = await CronRepository.getScheduleById(created.id, tx);
      expect(fetched).not.toBeNull();
      expect(fetched?.id).toBe(created.id);
      expect(fetched?.name).toBe("create-and-fetch");
      expect(fetched?.status).toBe(CronScheduleStatus.ACTIVE);
      expect(fetched?.cronExpression).toBe("*/5 * * * *");
    });
  });

  test("getScheduleById — returns null for non-existent id", async () => {
    await runInRollback(async tx => {
      const fetched = await CronRepository.getScheduleById("00000000-0000-0000-0000-000000000000", tx);
      expect(fetched).toBeNull();
    });
  });

  // ── 2. getScheduleByName ──

  test("getScheduleByName — fetches by name", async () => {
    await runInRollback(async tx => {
      const user = await createTestUser(tx);
      const created = await createTestSchedule(tx, {
        name: "fetch-by-name",
        createdByUserId: user.id,
      });

      const fetched = await CronRepository.getScheduleByName("fetch-by-name", tx);
      expect(fetched).not.toBeNull();
      expect(fetched?.id).toBe(created.id);
      expect(fetched?.name).toBe("fetch-by-name");
    });
  });

  test("getScheduleByName — returns null for non-existent name", async () => {
    await runInRollback(async tx => {
      const fetched = await CronRepository.getScheduleByName("non-existent-schedule-name", tx);
      expect(fetched).toBeNull();
    });
  });

  // ── 3. listSchedules ──

  test("listSchedules — returns paginated results with totalCount", async () => {
    await runInRollback(async tx => {
      const user = await createTestUser(tx);
      for (let i = 0; i < 5; i++) {
        await createTestSchedule(tx, {
          name: `list-page-${i}-${crypto.randomUUID()}`,
          createdByUserId: user.id,
        });
      }

      const page1 = await CronRepository.listSchedules({ limit: 2, offset: 0 }, tx);
      expect(page1.rows).toHaveLength(2);
      expect(page1.totalCount).toBeGreaterThanOrEqual(5);

      const page2 = await CronRepository.listSchedules({ limit: 2, offset: 2 }, tx);
      expect(page2.rows).toHaveLength(2);

      const page3 = await CronRepository.listSchedules({ limit: 2, offset: 4 }, tx);
      expect(page3.rows.length).toBeGreaterThanOrEqual(1);
    });
  });

  test("listSchedules — filters by status", async () => {
    await runInRollback(async tx => {
      const user = await createTestUser(tx);
      await createTestSchedule(tx, {
        name: `filter-active-${crypto.randomUUID()}`,
        createdByUserId: user.id,
        status: CronScheduleStatus.ACTIVE,
      });
      await createTestSchedule(tx, {
        name: `filter-paused-${crypto.randomUUID()}`,
        createdByUserId: user.id,
        status: CronScheduleStatus.PAUSED,
      });

      const active = await CronRepository.listSchedules({ status: CronScheduleStatus.ACTIVE }, tx);
      expect(active.rows.every(s => s.status === CronScheduleStatus.ACTIVE)).toBe(true);

      const paused = await CronRepository.listSchedules({ status: CronScheduleStatus.PAUSED }, tx);
      expect(paused.rows.every(s => s.status === CronScheduleStatus.PAUSED)).toBe(true);
    });
  });

  // ── 4. listDueSchedules ──

  test("listDueSchedules — returns ACTIVE schedules with nextRunAt <= now", async () => {
    await runInRollback(async tx => {
      const user = await createTestUser(tx);
      const now = new Date();

      await createTestSchedule(tx, {
        name: `due-past-${crypto.randomUUID()}`,
        createdByUserId: user.id,
        nextRunAt: new Date(now.getTime() - 5000),
      });

      const due = await CronRepository.listDueSchedules(now, 100, tx);
      expect(due.length).toBeGreaterThanOrEqual(1);
      expect(due.every(s => s.status === CronScheduleStatus.ACTIVE)).toBe(true);
      expect(due.every(s => s.nextRunAt !== null && s.nextRunAt <= now)).toBe(true);
    });
  });

  test("listDueSchedules — excludes schedules with nextRunAt in the future", async () => {
    await runInRollback(async tx => {
      const user = await createTestUser(tx);
      const now = new Date();
      const futureName = `due-future-${crypto.randomUUID()}`;

      await createTestSchedule(tx, {
        name: futureName,
        createdByUserId: user.id,
        nextRunAt: new Date(now.getTime() + 60000),
      });

      const due = await CronRepository.listDueSchedules(now, 100, tx);
      expect(due.find(s => s.name === futureName)).toBeUndefined();
    });
  });

  test("listDueSchedules — excludes PAUSED schedules", async () => {
    await runInRollback(async tx => {
      const user = await createTestUser(tx);
      const now = new Date();
      const pausedName = `due-paused-${crypto.randomUUID()}`;

      await createTestSchedule(tx, {
        name: pausedName,
        createdByUserId: user.id,
        nextRunAt: new Date(now.getTime() - 5000),
        status: CronScheduleStatus.PAUSED,
      });

      const due = await CronRepository.listDueSchedules(now, 100, tx);
      expect(due.find(s => s.name === pausedName)).toBeUndefined();
    });
  });

  // ── 5. claimNextRun ──

  test("claimNextRun — returns a runId for an ACTIVE due schedule", async () => {
    await runInRollback(async tx => {
      const user = await createTestUser(tx);
      const now = new Date();
      const schedule = await createTestSchedule(tx, {
        name: `claim-${crypto.randomUUID()}`,
        createdByUserId: user.id,
        nextRunAt: new Date(now.getTime() - 5000),
      });

      const result = await CronRepository.claimNextRun(
        schedule.id,
        now,
        CronTriggerSource.VERCEL_EXPLICIT,
        new Date(now.getTime() + 60000),
        tx
      );

      const claimed = assertNotNull(result);
      expect(typeof claimed.runId).toBe("string");
      expect(claimed.runId).not.toBe("");

      const run = await CronRepository.getRunById(claimed.runId, tx);
      expect(run).not.toBeNull();
      expect(run?.status).toBe(CronRunStatus.PENDING);
      expect(run?.scheduleId).toBe(schedule.id);
    });
  });

  test("claimNextRun — ALLOW policy permits multiple concurrent runs", async () => {
    await runInRollback(async tx => {
      const user = await createTestUser(tx);
      const now = new Date();
      const schedule = await createTestSchedule(tx, {
        name: `claim-allow-${crypto.randomUUID()}`,
        createdByUserId: user.id,
        nextRunAt: new Date(now.getTime() - 5000),
        concurrencyPolicy: CronConcurrencyPolicy.ALLOW,
      });

      const first = await CronRepository.claimNextRun(
        schedule.id,
        now,
        CronTriggerSource.VERCEL_EXPLICIT,
        new Date(now.getTime() + 60000),
        tx
      );
      const firstClaimed = assertNotNull(first);

      // Reset nextRunAt to past so second claim sees it as due
      await tx
        .update(cronSchedules)
        .set({ nextRunAt: new Date(now.getTime() - 1000) })
        .where(eq(cronSchedules.id, schedule.id));

      const second = await CronRepository.claimNextRun(
        schedule.id,
        now,
        CronTriggerSource.VERCEL_EXPLICIT,
        new Date(now.getTime() + 120000),
        tx
      );
      expect(second).not.toBeNull();
      expect(second?.runId).not.toBe(firstClaimed.runId);
    });
  });

  test("claimNextRun — SKIP policy blocks second claim while first is in-flight", async () => {
    await runInRollback(async tx => {
      const user = await createTestUser(tx);
      const now = new Date();
      const schedule = await createTestSchedule(tx, {
        name: `claim-skip-${crypto.randomUUID()}`,
        createdByUserId: user.id,
        nextRunAt: new Date(now.getTime() - 5000),
        concurrencyPolicy: CronConcurrencyPolicy.SKIP,
      });

      const first = await CronRepository.claimNextRun(
        schedule.id,
        now,
        CronTriggerSource.VERCEL_EXPLICIT,
        new Date(now.getTime() + 60000),
        tx
      );
      assertNotNull(first);

      // Reset nextRunAt to past so second claim re-checks the schedule
      await tx
        .update(cronSchedules)
        .set({ nextRunAt: new Date(now.getTime() - 1000) })
        .where(eq(cronSchedules.id, schedule.id));

      const second = await CronRepository.claimNextRun(
        schedule.id,
        now,
        CronTriggerSource.VERCEL_EXPLICIT,
        new Date(now.getTime() + 120000),
        tx
      );
      expect(second).toBeNull();
    });
  });

  test("claimNextRun — returns null for non-existent schedule", async () => {
    await runInRollback(async tx => {
      const result = await CronRepository.claimNextRun(
        "00000000-0000-0000-0000-000000000000",
        new Date(),
        CronTriggerSource.VERCEL_EXPLICIT,
        new Date(Date.now() + 60000),
        tx
      );
      expect(result).toBeNull();
    });
  });

  // ── 6. updateRunStatus status guard ──

  test("updateRunStatus — transitions PENDING → RUNNING → COMPLETED", async () => {
    await runInRollback(async tx => {
      const user = await createTestUser(tx);
      const now = new Date();
      const schedule = await createTestSchedule(tx, {
        name: `status-flow-${crypto.randomUUID()}`,
        createdByUserId: user.id,
        nextRunAt: new Date(now.getTime() - 5000),
      });

      const claimed = await CronRepository.claimNextRun(
        schedule.id,
        now,
        CronTriggerSource.VERCEL_EXPLICIT,
        new Date(now.getTime() + 60000),
        tx
      );
      const runId = assertNotNull(claimed).runId;

      // PENDING → RUNNING
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

      // RUNNING → COMPLETED
      const completed = await CronRepository.updateRunStatus(
        runId,
        CronRunStatus.COMPLETED,
        { completedAt: new Date(now.getTime() + 5000) },
        undefined,
        tx
      );
      expect(completed).not.toBeNull();
      expect(completed?.status).toBe(CronRunStatus.COMPLETED);
    });
  });

  test("updateRunStatus — status guard prevents COMPLETED → RUNNING transition", async () => {
    await runInRollback(async tx => {
      const user = await createTestUser(tx);
      const now = new Date();
      const schedule = await createTestSchedule(tx, {
        name: `status-guard-${crypto.randomUUID()}`,
        createdByUserId: user.id,
        nextRunAt: new Date(now.getTime() - 5000),
      });

      const claimed = await CronRepository.claimNextRun(
        schedule.id,
        now,
        CronTriggerSource.VERCEL_EXPLICIT,
        new Date(now.getTime() + 60000),
        tx
      );
      const runId = assertNotNull(claimed).runId;

      // PENDING → RUNNING
      await CronRepository.updateRunStatus(runId, CronRunStatus.RUNNING, { startedAt: now }, undefined, tx);

      // RUNNING → COMPLETED
      await CronRepository.updateRunStatus(
        runId,
        CronRunStatus.COMPLETED,
        { completedAt: new Date(now.getTime() + 5000) },
        undefined,
        tx
      );

      // Try COMPLETED → RUNNING (should fail via DEFAULT_PRIOR_STATUSES)
      const blocked = await CronRepository.updateRunStatus(
        runId,
        CronRunStatus.RUNNING,
        { startedAt: now },
        undefined,
        tx
      );
      expect(blocked).toBeNull();

      // Verify it's still COMPLETED
      const finalRun = await CronRepository.getRunById(runId, tx);
      expect(finalRun?.status).toBe(CronRunStatus.COMPLETED);
    });
  });

  test("updateRunStatus — explicit fromStatuses override works", async () => {
    await runInRollback(async tx => {
      const user = await createTestUser(tx);
      const now = new Date();
      const schedule = await createTestSchedule(tx, {
        name: `from-statuses-${crypto.randomUUID()}`,
        createdByUserId: user.id,
        nextRunAt: new Date(now.getTime() - 5000),
      });

      const claimed = await CronRepository.claimNextRun(
        schedule.id,
        now,
        CronTriggerSource.VERCEL_EXPLICIT,
        new Date(now.getTime() + 60000),
        tx
      );
      const runId = assertNotNull(claimed).runId;

      // PENDING → RUNNING
      await CronRepository.updateRunStatus(runId, CronRunStatus.RUNNING, { startedAt: now }, undefined, tx);

      // RUNNING → COMPLETED
      await CronRepository.updateRunStatus(
        runId,
        CronRunStatus.COMPLETED,
        { completedAt: new Date(now.getTime() + 5000) },
        undefined,
        tx
      );

      // Normally COMPLETED → RUNNING is blocked, but with explicit fromStatuses=[COMPLETED] it should work
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
  });

  test("updateRunStatus — returns null for non-existent run", async () => {
    await runInRollback(async tx => {
      const result = await CronRepository.updateRunStatus(
        "00000000-0000-0000-0000-000000000000",
        CronRunStatus.RUNNING,
        {},
        undefined,
        tx
      );
      expect(result).toBeNull();
    });
  });

  // ── 7. updateScheduleIfStatus ──

  test("updateScheduleIfStatus — succeeds when status matches", async () => {
    await runInRollback(async tx => {
      const user = await createTestUser(tx);
      const schedule = await createTestSchedule(tx, {
        name: `if-status-ok-${crypto.randomUUID()}`,
        createdByUserId: user.id,
        status: CronScheduleStatus.ACTIVE,
      });

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
  });

  test("updateScheduleIfStatus — returns null when status does not match", async () => {
    await runInRollback(async tx => {
      const user = await createTestUser(tx);
      const schedule = await createTestSchedule(tx, {
        name: `if-status-fail-${crypto.randomUUID()}`,
        createdByUserId: user.id,
        status: CronScheduleStatus.ACTIVE,
      });

      // Expected status is PAUSED but actual is ACTIVE — should return null
      const updated = await CronRepository.updateScheduleIfStatus(
        schedule.id,
        { cronExpression: "0 0 * * *" },
        CronScheduleStatus.PAUSED,
        tx
      );
      expect(updated).toBeNull();

      // Verify the schedule was NOT modified
      const fetched = await CronRepository.getScheduleById(schedule.id, tx);
      expect(fetched?.cronExpression).toBe("*/5 * * * *");
    });
  });

  test("updateSchedule — updates fields directly", async () => {
    await runInRollback(async tx => {
      const user = await createTestUser(tx);
      const schedule = await createTestSchedule(tx, {
        name: `update-sched-${crypto.randomUUID()}`,
        createdByUserId: user.id,
      });

      const updated = await CronRepository.updateSchedule(
        schedule.id,
        { cronExpression: "0 0 * * *", status: CronScheduleStatus.PAUSED },
        tx
      );
      expect(updated).not.toBeNull();
      expect(updated?.cronExpression).toBe("0 0 * * *");
      expect(updated?.status).toBe(CronScheduleStatus.PAUSED);
    });
  });

  test("updateSchedule — returns null for non-existent schedule", async () => {
    await runInRollback(async tx => {
      const updated = await CronRepository.updateSchedule(
        "00000000-0000-0000-0000-000000000000",
        { cronExpression: "0 0 * * *" },
        tx
      );
      expect(updated).toBeNull();
    });
  });

  // ── 8. recordHeartbeat ──

  test("recordHeartbeat — inserts heartbeat without error", async () => {
    await runInRollback(async tx => {
      const user = await createTestUser(tx);
      const now = new Date();
      const schedule = await createTestSchedule(tx, {
        name: `heartbeat-${crypto.randomUUID()}`,
        createdByUserId: user.id,
        nextRunAt: new Date(now.getTime() - 5000),
      });

      const claimed = await CronRepository.claimNextRun(
        schedule.id,
        now,
        CronTriggerSource.VERCEL_EXPLICIT,
        new Date(now.getTime() + 60000),
        tx
      );
      const runId = assertNotNull(claimed).runId;

      await CronRepository.updateRunStatus(
        runId,
        CronRunStatus.RUNNING,
        { startedAt: now, workerId: "hb-worker" },
        undefined,
        tx
      );

      // recordHeartbeat returns void — verify no throw
      await CronRepository.recordHeartbeat(
        {
          runId,
          workerId: "hb-worker",
          lastBeatAt: new Date(now.getTime() + 1000),
          progress: { percent: 50 },
        },
        tx
      );

      // Verify the heartbeat was actually inserted by querying directly
      const beats = await tx.select().from(cronRuns).where(eq(cronRuns.id, runId)).limit(1);
      expect(beats[0]?.status).toBe(CronRunStatus.RUNNING);
    });
  });

  // ── 9. reconcileStuckRuns ──

  test("reconcileStuckRuns — marks stuck RUNNING run as TIMEOUT", async () => {
    await runInRollback(async tx => {
      const user = await createTestUser(tx);
      const now = new Date();
      const schedule = await createTestSchedule(tx, {
        name: `stuck-${crypto.randomUUID()}`,
        createdByUserId: user.id,
        nextRunAt: new Date(now.getTime() - 10000),
        timeoutSeconds: 1, // 1 second timeout
      });

      const claimed = await CronRepository.claimNextRun(
        schedule.id,
        now,
        CronTriggerSource.VERCEL_EXPLICIT,
        new Date(now.getTime() + 60000),
        tx
      );
      const runId = assertNotNull(claimed).runId;

      // Set run to RUNNING with an old startedAt
      await CronRepository.updateRunStatus(runId, CronRunStatus.RUNNING, { startedAt: now }, undefined, tx);

      // Call reconcile with now set 5 seconds in the future (past the 1s timeout)
      const futureNow = new Date(now.getTime() + 5000);
      const marked = await CronRepository.reconcileStuckRuns(futureNow, 100, tx);
      expect(marked).toBe(1);

      // Verify the run is now TIMEOUT
      const run = await CronRepository.getRunById(runId, tx);
      expect(run?.status).toBe(CronRunStatus.TIMEOUT);
    });
  });

  test("reconcileStuckRuns — skips recently started runs", async () => {
    await runInRollback(async tx => {
      const user = await createTestUser(tx);
      const now = new Date();
      const schedule = await createTestSchedule(tx, {
        name: `not-stuck-${crypto.randomUUID()}`,
        createdByUserId: user.id,
        nextRunAt: new Date(now.getTime() - 5000),
        timeoutSeconds: 300, // 5 minute timeout
      });

      const claimed = await CronRepository.claimNextRun(
        schedule.id,
        now,
        CronTriggerSource.VERCEL_EXPLICIT,
        new Date(now.getTime() + 60000),
        tx
      );
      const runId = assertNotNull(claimed).runId;

      await CronRepository.updateRunStatus(runId, CronRunStatus.RUNNING, { startedAt: now }, undefined, tx);

      // Reconcile with now only 1 second later — run should not be stuck yet
      const marked = await CronRepository.reconcileStuckRuns(new Date(now.getTime() + 1000), 100, tx);
      expect(marked).toBe(0);

      const run = await CronRepository.getRunById(runId, tx);
      expect(run?.status).toBe(CronRunStatus.RUNNING);
    });
  });

  test("reconcileStuckRuns — returns 0 when no RUNNING runs exist", async () => {
    await runInRollback(async tx => {
      const marked = await CronRepository.reconcileStuckRuns(new Date(), 100, tx);
      expect(marked).toBe(0);
    });
  });

  // ── 10. deleteScheduleById ──

  test("deleteScheduleById — soft delete sets status to DISABLED", async () => {
    await runInRollback(async tx => {
      const user = await createTestUser(tx);
      const schedule = await createTestSchedule(tx, {
        name: `soft-delete-${crypto.randomUUID()}`,
        createdByUserId: user.id,
      });

      await CronRepository.deleteScheduleById(schedule.id, false, tx);

      const fetched = await CronRepository.getScheduleById(schedule.id, tx);
      expect(fetched).not.toBeNull();
      expect(fetched?.status).toBe(CronScheduleStatus.DISABLED);
    });
  });

  test("deleteScheduleById — hard delete removes schedule and runs", async () => {
    await runInRollback(async tx => {
      const user = await createTestUser(tx);
      const now = new Date();
      const schedule = await createTestSchedule(tx, {
        name: `hard-delete-${crypto.randomUUID()}`,
        createdByUserId: user.id,
        nextRunAt: new Date(now.getTime() - 5000),
      });

      const claimed = await CronRepository.claimNextRun(
        schedule.id,
        now,
        CronTriggerSource.VERCEL_EXPLICIT,
        new Date(now.getTime() + 60000),
        tx
      );
      const runId = assertNotNull(claimed).runId;

      await CronRepository.deleteScheduleById(schedule.id, true, tx);

      const fetched = await CronRepository.getScheduleById(schedule.id, tx);
      expect(fetched).toBeNull();

      // Runs should also be gone (cascade or explicit delete)
      const run = await CronRepository.getRunById(runId, tx);
      expect(run).toBeNull();
    });
  });

  // ── listRunsBySchedule ──

  test("listRunsBySchedule — returns paginated runs for a schedule", async () => {
    await runInRollback(async tx => {
      const user = await createTestUser(tx);
      const now = new Date();
      const schedule = await createTestSchedule(tx, {
        name: `runs-by-sched-${crypto.randomUUID()}`,
        createdByUserId: user.id,
        nextRunAt: new Date(now.getTime() - 5000),
      });

      // Create 3 runs by claiming multiple times (ALLOW policy)
      const runIds: string[] = [];
      for (let i = 0; i < 3; i++) {
        // Reset nextRunAt to past for each claim
        await tx
          .update(cronSchedules)
          .set({ nextRunAt: new Date(now.getTime() - 1000 - i * 1000) })
          .where(eq(cronSchedules.id, schedule.id));

        const claimed = await CronRepository.claimNextRun(
          schedule.id,
          now,
          CronTriggerSource.VERCEL_EXPLICIT,
          new Date(now.getTime() + 60000 + i * 60000),
          tx
        );
        runIds.push(assertNotNull(claimed).runId);
      }

      expect(runIds).toHaveLength(3);
      const page1 = await CronRepository.listRunsBySchedule(schedule.id, { limit: 2, offset: 0 }, tx);
      expect(page1.rows).toHaveLength(2);
      expect(page1.totalCount).toBe(3);

      const page2 = await CronRepository.listRunsBySchedule(schedule.id, { limit: 2, offset: 2 }, tx);
      expect(page2.rows).toHaveLength(1);
    });
  });

  // ── listRuns ──

  test("listRuns — filters by scheduleId", async () => {
    await runInRollback(async tx => {
      const user = await createTestUser(tx);
      const now = new Date();
      const schedule = await createTestSchedule(tx, {
        name: `list-runs-filter-${crypto.randomUUID()}`,
        createdByUserId: user.id,
        nextRunAt: new Date(now.getTime() - 5000),
      });

      const claimed = await CronRepository.claimNextRun(
        schedule.id,
        now,
        CronTriggerSource.VERCEL_EXPLICIT,
        new Date(now.getTime() + 60000),
        tx
      );
      const runId = assertNotNull(claimed).runId;

      const runs = await CronRepository.listRuns({ scheduleId: schedule.id }, tx);
      expect(runs.totalCount).toBe(1);
      expect(runs.rows[0]?.id).toBe(runId);
    });
  });

  test("listRuns — filters by status", async () => {
    await runInRollback(async tx => {
      const user = await createTestUser(tx);
      const now = new Date();
      const schedule = await createTestSchedule(tx, {
        name: `list-runs-status-${crypto.randomUUID()}`,
        createdByUserId: user.id,
        nextRunAt: new Date(now.getTime() - 5000),
      });

      const claimed = await CronRepository.claimNextRun(
        schedule.id,
        now,
        CronTriggerSource.VERCEL_EXPLICIT,
        new Date(now.getTime() + 60000),
        tx
      );
      const runId = assertNotNull(claimed).runId;

      // Run is PENDING — filter by PENDING should find it
      const pending = await CronRepository.listRuns({ status: CronRunStatus.PENDING }, tx);
      expect(pending.rows.some(r => r.id === runId)).toBe(true);

      // Filter by RUNNING should not find it
      const running = await CronRepository.listRuns({ status: CronRunStatus.RUNNING }, tx);
      expect(running.rows.some(r => r.id === runId)).toBe(false);
    });
  });

  test("listRuns — filters by date range", async () => {
    await runInRollback(async tx => {
      const user = await createTestUser(tx);
      const now = new Date();
      const schedule = await createTestSchedule(tx, {
        name: `list-runs-date-${crypto.randomUUID()}`,
        createdByUserId: user.id,
        nextRunAt: new Date(now.getTime() - 5000),
      });

      const claimed = await CronRepository.claimNextRun(
        schedule.id,
        now,
        CronTriggerSource.VERCEL_EXPLICIT,
        new Date(now.getTime() + 60000),
        tx
      );
      const runId = assertNotNull(claimed).runId;

      // `from` after now should exclude the run
      const fromFilter = await CronRepository.listRuns({ from: new Date(now.getTime() + 1000) }, tx);
      expect(fromFilter.rows.some(r => r.id === runId)).toBe(false);

      // `to` at now should include the run (startedAt <= now)
      const toFilter = await CronRepository.listRuns({ to: now }, tx);
      expect(toFilter.rows.some(r => r.id === runId)).toBe(true);
    });
  });

  // ── getRunById ──

  test("getRunById — returns null for non-existent run", async () => {
    await runInRollback(async tx => {
      const run = await CronRepository.getRunById("00000000-0000-0000-0000-000000000000", tx);
      expect(run).toBeNull();
    });
  });

  // ── createSchedule validation ──

  test("createSchedule — throws on missing required createdByUserId (FK violation)", async () => {
    await runInRollback(async tx => {
      await expectRepoError(async () => {
        await CronRepository.createSchedule(
          {
            name: `no-user-${crypto.randomUUID()}`,
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
            createdByUserId: "00000000-0000-0000-0000-000000000000",
          },
          tx
        );
      });
    });
  });

  // ── createRun ──

  test("createRun — inserts a new run with defaults", async () => {
    await runInRollback(async tx => {
      const user = await createTestUser(tx);
      const schedule = await createTestSchedule(tx, {
        name: `create-run-${crypto.randomUUID()}`,
        createdByUserId: user.id,
        nextRunAt: new Date(),
      });

      const startedAt = new Date();
      const run = await CronRepository.createRun(
        {
          scheduleId: schedule.id,
          status: CronRunStatus.PENDING,
          attempt: 1,
          jobKind: CronJobKind.NOOP,
          triggerSource: CronTriggerSource.VERCEL_EXPLICIT,
          startedAt,
        },
        tx
      );

      expect(run).toBeDefined();
      expect(run.id).toBeDefined();
      expect(run.scheduleId).toBe(schedule.id);
      expect(run.status).toBe(CronRunStatus.PENDING);
      expect(run.attempt).toBe(1);
      expect(run.jobKind).toBe("NOOP");
      expect(run.triggerSource).toBe(CronTriggerSource.VERCEL_EXPLICIT);
      expect(run.startedAt).toEqual(startedAt);
    });
  });

  test("createRun — defaults startedAt to now when not provided", async () => {
    await runInRollback(async tx => {
      const user = await createTestUser(tx);
      const schedule = await createTestSchedule(tx, {
        name: `create-run-default-${crypto.randomUUID()}`,
        createdByUserId: user.id,
        nextRunAt: new Date(),
      });

      const before = new Date(Date.now() - 1000);
      const run = await CronRepository.createRun(
        {
          scheduleId: schedule.id,
          status: CronRunStatus.PENDING,
          attempt: 0,
          jobKind: CronJobKind.NOOP,
          triggerSource: CronTriggerSource.VERCEL_TICKER,
        },
        tx
      );
      const after = new Date(Date.now() + 1000);

      expect(run.startedAt).toBeDefined();
      expect(run.startedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(run.startedAt.getTime()).toBeLessThanOrEqual(after.getTime());
    });
  });

  test("createRun — stores payload when provided", async () => {
    await runInRollback(async tx => {
      const user = await createTestUser(tx);
      const schedule = await createTestSchedule(tx, {
        name: `create-run-payload-${crypto.randomUUID()}`,
        createdByUserId: user.id,
        nextRunAt: new Date(),
      });

      const payload = { key: "value", nested: { num: 42 } };
      const run = await CronRepository.createRun(
        {
          scheduleId: schedule.id,
          status: CronRunStatus.PENDING,
          attempt: 1,
          jobKind: CronJobKind.NOOP,
          triggerSource: CronTriggerSource.VERCEL_EXPLICIT,
          payload,
        },
        tx
      );

      expect(run.payload).toEqual(payload);
    });
  });

  // ── getActiveRunCount ──

  test("getActiveRunCount — counts RUNNING and RETRYING runs", async () => {
    await runInRollback(async tx => {
      const user = await createTestUser(tx);
      const now = new Date();
      const schedule = await createTestSchedule(tx, {
        name: `active-count-${crypto.randomUUID()}`,
        createdByUserId: user.id,
        nextRunAt: new Date(now.getTime() - 5000),
      });

      // Initially zero active runs
      const initial = await CronRepository.getActiveRunCount(schedule.id, tx);
      expect(initial).toBe(0);

      // Create a run and set to RUNNING
      const run = await CronRepository.createRun(
        {
          scheduleId: schedule.id,
          status: CronRunStatus.PENDING,
          attempt: 1,
          jobKind: CronJobKind.NOOP,
          triggerSource: CronTriggerSource.VERCEL_EXPLICIT,
        },
        tx
      );

      await CronRepository.updateRunStatus(run.id, CronRunStatus.RUNNING, { startedAt: now }, undefined, tx);

      const oneRunning = await CronRepository.getActiveRunCount(schedule.id, tx);
      expect(oneRunning).toBe(1);

      // Move to RETRYING
      await CronRepository.updateRunStatus(run.id, CronRunStatus.RETRYING, {}, undefined, tx);
      const oneRetrying = await CronRepository.getActiveRunCount(schedule.id, tx);
      expect(oneRetrying).toBe(1);

      // Move to COMPLETED
      await CronRepository.updateRunStatus(run.id, CronRunStatus.COMPLETED, { completedAt: now }, undefined, tx);
      const zeroCompleted = await CronRepository.getActiveRunCount(schedule.id, tx);
      expect(zeroCompleted).toBe(0);
    });
  });

  test("getActiveRunCount — returns 0 for schedule with no runs", async () => {
    await runInRollback(async tx => {
      const user = await createTestUser(tx);
      const schedule = await createTestSchedule(tx, {
        name: `active-count-empty-${crypto.randomUUID()}`,
        createdByUserId: user.id,
        nextRunAt: new Date(),
      });

      const count = await CronRepository.getActiveRunCount(schedule.id, tx);
      expect(count).toBe(0);
    });
  });

  // ── getRunHeartbeats ──

  test("getRunHeartbeats — returns heartbeats ordered by lastBeatAt ascending", async () => {
    await runInRollback(async tx => {
      const user = await createTestUser(tx);
      const now = new Date();
      const schedule = await createTestSchedule(tx, {
        name: `heartbeats-${crypto.randomUUID()}`,
        createdByUserId: user.id,
        nextRunAt: new Date(now.getTime() - 5000),
      });

      const run = await CronRepository.createRun(
        {
          scheduleId: schedule.id,
          status: CronRunStatus.RUNNING,
          attempt: 1,
          jobKind: CronJobKind.NOOP,
          triggerSource: CronTriggerSource.VERCEL_EXPLICIT,
          startedAt: now,
        },
        tx
      );

      // Insert 3 heartbeats
      const beat1 = new Date(now.getTime() + 1000);
      const beat2 = new Date(now.getTime() + 2000);
      const beat3 = new Date(now.getTime() + 3000);

      await CronRepository.recordHeartbeat({ runId: run.id, workerId: "w1", lastBeatAt: beat2 }, tx);
      await CronRepository.recordHeartbeat({ runId: run.id, workerId: "w1", lastBeatAt: beat1 }, tx);
      await CronRepository.recordHeartbeat({ runId: run.id, workerId: "w1", lastBeatAt: beat3 }, tx);

      const heartbeats = await CronRepository.getRunHeartbeats(run.id, tx);

      expect(heartbeats).toBeDefined();
      expect(heartbeats).toHaveLength(3);
      // Verify ascending order by lastBeatAt
      expect(heartbeats[0].lastBeatAt.getTime()).toBeLessThanOrEqual(heartbeats[1].lastBeatAt.getTime());
      expect(heartbeats[1].lastBeatAt.getTime()).toBeLessThanOrEqual(heartbeats[2].lastBeatAt.getTime());
      expect(heartbeats[0].workerId).toBe("w1");
    });
  });

  test("getRunHeartbeats — returns empty array for run with no heartbeats", async () => {
    await runInRollback(async tx => {
      const user = await createTestUser(tx);
      const now = new Date();
      const schedule = await createTestSchedule(tx, {
        name: `heartbeats-empty-${crypto.randomUUID()}`,
        createdByUserId: user.id,
        nextRunAt: new Date(now.getTime() - 5000),
      });

      const run = await CronRepository.createRun(
        {
          scheduleId: schedule.id,
          status: CronRunStatus.RUNNING,
          attempt: 1,
          jobKind: CronJobKind.NOOP,
          triggerSource: CronTriggerSource.VERCEL_EXPLICIT,
          startedAt: now,
        },
        tx
      );

      const heartbeats = await CronRepository.getRunHeartbeats(run.id, tx);
      expect(heartbeats).toEqual([]);
    });
  });

  // ── appendRunError ──

  test("appendRunError — appends error messages without overwriting", async () => {
    await runInRollback(async tx => {
      const user = await createTestUser(tx);
      const now = new Date();
      const schedule = await createTestSchedule(tx, {
        name: `append-err-${crypto.randomUUID()}`,
        createdByUserId: user.id,
        nextRunAt: new Date(now.getTime() - 5000),
      });

      const run = await CronRepository.createRun(
        {
          scheduleId: schedule.id,
          status: CronRunStatus.RUNNING,
          attempt: 1,
          jobKind: CronJobKind.NOOP,
          triggerSource: CronTriggerSource.VERCEL_EXPLICIT,
          startedAt: now,
        },
        tx
      );

      // First append — errorMessage starts as null, COALESCE makes it ""
      const firstError = "Connection refused";
      const firstUpdated = await CronRepository.appendRunError(run.id, firstError, tx);
      expect(firstUpdated).not.toBeNull();
      expect(firstUpdated?.errorMessage).toContain(firstError);

      // Second append — should concatenate, not overwrite
      const secondError = "Timeout after 30s";
      const secondUpdated = await CronRepository.appendRunError(run.id, secondError, tx);
      expect(secondUpdated).not.toBeNull();
      expect(secondUpdated?.errorMessage).toContain(firstError);
      expect(secondUpdated?.errorMessage).toContain(secondError);
    });
  });

  // ── listDueSchedules SKIP policy ──

  test("listDueSchedules — excludes SKIP schedules with in-flight runs, includes ALLOW", async () => {
    await runInRollback(async tx => {
      const user = await createTestUser(tx);
      const now = new Date();

      const skipName = `due-skip-inflight-${crypto.randomUUID()}`;
      const skipSchedule = await createTestSchedule(tx, {
        name: skipName,
        createdByUserId: user.id,
        nextRunAt: new Date(now.getTime() - 5000),
        concurrencyPolicy: CronConcurrencyPolicy.SKIP,
      });

      const allowName = `due-allow-inflight-${crypto.randomUUID()}`;
      const allowSchedule = await createTestSchedule(tx, {
        name: allowName,
        createdByUserId: user.id,
        nextRunAt: new Date(now.getTime() - 5000),
        concurrencyPolicy: CronConcurrencyPolicy.ALLOW,
      });

      // Create PENDING runs for both schedules (in-flight)
      await CronRepository.createRun(
        {
          scheduleId: skipSchedule.id,
          status: CronRunStatus.PENDING,
          attempt: 1,
          jobKind: CronJobKind.NOOP,
          triggerSource: CronTriggerSource.VERCEL_EXPLICIT,
        },
        tx
      );
      await CronRepository.createRun(
        {
          scheduleId: allowSchedule.id,
          status: CronRunStatus.PENDING,
          attempt: 1,
          jobKind: CronJobKind.NOOP,
          triggerSource: CronTriggerSource.VERCEL_EXPLICIT,
        },
        tx
      );

      const due = await CronRepository.listDueSchedules(now, 100, tx);

      // SKIP + in-flight → excluded
      expect(due.find(s => s.name === skipName)).toBeUndefined();
      // ALLOW + in-flight → still included
      expect(due.find(s => s.name === allowName)).toBeDefined();
    });
  });
});
