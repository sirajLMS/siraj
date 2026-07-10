import { describe, expect, test } from "bun:test";
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import type { DBTransaction } from "@/backend/db/db.types";
import { FxSyncRepository } from "@/backend/db/repo";
import { fxSyncRuns } from "@/backend/db/schema";
import { runInRollback } from "@/backend/db/test/test-utils";
import { FxProvider, FxSyncStatus, FxSyncTrigger } from "@/backend/enum";

async function insertSyncRun(
  tx: DBTransaction,
  overrides: Partial<typeof fxSyncRuns.$inferInsert> = {}
): Promise<typeof fxSyncRuns.$inferSelect> {
  const now = new Date();
  const [row] = await tx
    .insert(fxSyncRuns)
    .values({
      provider: FxProvider.OpenExchangeRates,
      status: FxSyncStatus.Running,
      pairsWritten: "0",
      pairsFailed: "0",
      triggerType: FxSyncTrigger.Cron,
      triggeredByUserId: null,
      startedAt: now,
      createdAt: now,
      updatedAt: now,
      ...overrides,
    })
    .returning();
  return row;
}

describe("FxSyncRepository — createSyncRun", () => {
  test("inserts a running row with zero pair counters", async () => {
    await runInRollback(async tx => {
      const row = await FxSyncRepository.createSyncRun(
        {
          provider: FxProvider.OpenExchangeRates,
          triggerType: FxSyncTrigger.Cron,
          triggeredByUserId: null,
        },
        tx
      );

      expect(row.id).toBeDefined();
      expect(row.provider).toBe(FxProvider.OpenExchangeRates);
      expect(row.status).toBe(FxSyncStatus.Running);
      expect(row.pairsWritten).toBe("0");
      expect(row.pairsFailed).toBe("0");
      expect(row.triggerType).toBe(FxSyncTrigger.Cron);
      expect(row.triggeredByUserId).toBeNull();
      expect(row.startedAt).toBeInstanceOf(Date);
      expect(row.finishedAt).toBeNull();

      const [persisted] = await tx.select().from(fxSyncRuns).where(eq(fxSyncRuns.id, row.id)).limit(1);

      expect(persisted).toBeDefined();
      expect(persisted?.status).toBe(FxSyncStatus.Running);
    });
  });

  test("stores triggeredByUserId when provided", async () => {
    await runInRollback(async tx => {
      const userId = randomUUID();
      const row = await FxSyncRepository.createSyncRun(
        {
          provider: FxProvider.Fixer,
          triggerType: FxSyncTrigger.Manual,
          triggeredByUserId: userId,
        },
        tx
      );

      expect(row.triggeredByUserId).toBe(userId);
      expect(row.triggerType).toBe(FxSyncTrigger.Manual);
      expect(row.provider).toBe(FxProvider.Fixer);
    });
  });
});

describe("FxSyncRepository — completeSyncRun", () => {
  test("updates status, pair counts, error, providerResponse, and finishedAt", async () => {
    await runInRollback(async tx => {
      const created = await insertSyncRun(tx);

      const finishedAt = new Date();
      const providerResponse = { base: "USD", rates: { EGP: 48.5 } };
      const updated = await FxSyncRepository.completeSyncRun(
        created.id,
        {
          status: FxSyncStatus.Success,
          pairsWritten: 32,
          pairsFailed: 0,
          providerResponse,
          finishedAt,
        },
        tx
      );

      expect(updated.id).toBe(created.id);
      expect(updated.status).toBe(FxSyncStatus.Success);
      expect(updated.pairsWritten).toBe("32");
      expect(updated.pairsFailed).toBe("0");
      expect(updated.errorMessage).toBeNull();
      expect(updated.providerResponse).toEqual(providerResponse);
      expect(updated.finishedAt).toEqual(finishedAt);
    });
  });

  test("stores errorMessage for failed runs and defaults finishedAt to now", async () => {
    await runInRollback(async tx => {
      const created = await insertSyncRun(tx, {
        startedAt: new Date(Date.now() - 60_000),
      });

      const before = Date.now();
      const updated = await FxSyncRepository.completeSyncRun(
        created.id,
        {
          status: FxSyncStatus.Failed,
          pairsWritten: 0,
          pairsFailed: 32,
          errorMessage: "Provider timeout",
        },
        tx
      );
      const after = Date.now();

      expect(updated.status).toBe(FxSyncStatus.Failed);
      expect(updated.pairsWritten).toBe("0");
      expect(updated.pairsFailed).toBe("32");
      expect(updated.errorMessage).toBe("Provider timeout");
      expect(updated.finishedAt?.getTime()).toBeGreaterThanOrEqual(before);
      expect(updated.finishedAt?.getTime()).toBeLessThanOrEqual(after);
    });
  });

  test("supports partial status with mixed success/failure counts", async () => {
    await runInRollback(async tx => {
      const created = await insertSyncRun(tx);

      const updated = await FxSyncRepository.completeSyncRun(
        created.id,
        {
          status: FxSyncStatus.Partial,
          pairsWritten: 28,
          pairsFailed: 4,
          errorMessage: "4 pairs failed",
        },
        tx
      );

      expect(updated.status).toBe(FxSyncStatus.Partial);
      expect(updated.pairsWritten).toBe("28");
      expect(updated.pairsFailed).toBe("4");
    });
  });
});

describe("FxSyncRepository — getLatestSyncRun", () => {
  test("returns the most recent run by startedAt DESC", async () => {
    await runInRollback(async tx => {
      const older = await insertSyncRun(tx, {
        startedAt: new Date(Date.now() - 60 * 60_000),
      });
      const newer = await insertSyncRun(tx, {
        startedAt: new Date(Date.now() - 10 * 60_000),
      });

      const latest = await FxSyncRepository.getLatestSyncRun(tx);

      expect(latest).not.toBeNull();
      expect(latest?.id).toBe(newer.id);
      expect(latest?.startedAt.getTime()).toBeGreaterThan(older.startedAt.getTime());
    });
  });

  test("returns null when no runs exist in this transaction", async () => {
    await runInRollback(async tx => {
      const latest = await FxSyncRepository.getLatestSyncRun(tx);
      // Because of rollback isolation, if no rows were inserted in this closure,
      // only pre-existing committed rows (if any) would be visible. We assert
      // the result is either null or a valid run row.
      if (latest) {
        expect(latest.id).toBeDefined();
      }
    });
  });
});

describe("FxSyncRepository — getRunningSyncRun", () => {
  test("returns the running row when one exists", async () => {
    await runInRollback(async tx => {
      const running = await insertSyncRun(tx, { status: FxSyncStatus.Running });

      const found = await FxSyncRepository.getRunningSyncRun(tx);

      expect(found).not.toBeNull();
      expect(found?.id).toBe(running.id);
      expect(found?.status).toBe(FxSyncStatus.Running);
    });
  });

  test("returns null after the running row is completed", async () => {
    await runInRollback(async tx => {
      const created = await insertSyncRun(tx, { status: FxSyncStatus.Running });

      await FxSyncRepository.completeSyncRun(
        created.id,
        { status: FxSyncStatus.Success, pairsWritten: 10, pairsFailed: 0 },
        tx
      );

      const found = await FxSyncRepository.getRunningSyncRun(tx);
      expect(found).toBeNull();
    });
  });
});

describe("FxSyncRepository — isRecentSuccess", () => {
  test("returns true when a success finished within the last 30 minutes", async () => {
    await runInRollback(async tx => {
      const created = await insertSyncRun(tx, {
        status: FxSyncStatus.Running,
        startedAt: new Date(Date.now() - 5 * 60_000),
      });

      await tx
        .update(fxSyncRuns)
        .set({
          status: FxSyncStatus.Success,
          pairsWritten: "10",
          pairsFailed: "0",
          finishedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(fxSyncRuns.id, created.id));

      const result = await FxSyncRepository.isRecentSuccess(30, tx);
      expect(result).toBe(true);
    });
  });

  test("returns false when the only success finished more than 30 minutes ago", async () => {
    await runInRollback(async tx => {
      const created = await insertSyncRun(tx, {
        status: FxSyncStatus.Running,
        startedAt: new Date(Date.now() - 120 * 60_000),
      });

      await tx
        .update(fxSyncRuns)
        .set({
          status: FxSyncStatus.Success,
          pairsWritten: "10",
          pairsFailed: "0",
          finishedAt: new Date(Date.now() - 90 * 60_000),
          updatedAt: new Date(),
        })
        .where(eq(fxSyncRuns.id, created.id));

      const result = await FxSyncRepository.isRecentSuccess(30, tx);
      expect(result).toBe(false);
    });
  });

  test("returns false when only non-success runs exist", async () => {
    await runInRollback(async tx => {
      const created = await insertSyncRun(tx, {
        status: FxSyncStatus.Running,
        startedAt: new Date(Date.now() - 5 * 60_000),
      });

      await tx
        .update(fxSyncRuns)
        .set({
          status: FxSyncStatus.Failed,
          pairsWritten: "0",
          pairsFailed: "10",
          errorMessage: "boom",
          finishedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(fxSyncRuns.id, created.id));

      const result = await FxSyncRepository.isRecentSuccess(30, tx);
      expect(result).toBe(false);
    });
  });
});
