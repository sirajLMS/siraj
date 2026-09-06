import { describe, expect, test } from "bun:test";
import { randomUUID } from "node:crypto";
import { eq, sql } from "drizzle-orm";
import { db, isSqlite } from "@/backend/db";
import { CarryoverBalanceRepository } from "@/backend/db/repo/teachers";
import {
  carryoverBalanceItems,
  carryoverBalances,
  classInstances,
  classSubjects,
  teachers,
  users,
} from "@/backend/db/schema";
import {
  createMockClassInstance,
  ensureTestSubjectId,
  setupStudent,
  setupTeacher,
} from "@/backend/db/test/entity-setup";
import { runInRollback } from "@/backend/db/test/test-utils";
import { CalculationStatus } from "@/backend/enum";
import type {
  CarryoverBalanceInsertType,
  CarryoverBalanceItemInsertType,
  CarryoverBalancePageResult,
  CarryoverBalanceSelectType,
  CarryoverFilters,
  DBTransaction,
  TeacherSelectType,
  UserSelectType,
} from "@/backend/types";
import { CurrencyCode } from "@/shared/constants/currency.enum";

interface CarryoverFixture {
  user: UserSelectType;
  teacher: TeacherSelectType;
  carryover: CarryoverBalanceSelectType;
}

/** Placeholder for a resolve slot that is wired to a promise gate below. */
const pendingGate = (): void => undefined;

async function createCarryoverFixture(
  tx: DBTransaction,
  overrides: Partial<CarryoverBalanceInsertType> = {},
  teacherName?: string
): Promise<CarryoverFixture> {
  const { user, teacher } = await setupTeacher(tx, teacherName ? { name: teacherName } : {});
  const carryover = await CarryoverBalanceRepository.create(
    {
      teacherId: teacher.id,
      payable: "100.00",
      teacherCurrency: CurrencyCode.SAR,
      createdByUserId: user.id,
      ...overrides,
    },
    tx
  );
  return { user, teacher, carryover };
}

async function createSiblingCarryover(
  tx: DBTransaction,
  fixture: CarryoverFixture,
  overrides: Partial<CarryoverBalanceInsertType> = {}
): Promise<CarryoverBalanceSelectType> {
  return CarryoverBalanceRepository.create(
    {
      teacherId: fixture.teacher.id,
      payable: "100.00",
      teacherCurrency: CurrencyCode.SAR,
      createdByUserId: fixture.user.id,
      ...overrides,
    },
    tx
  );
}

function expectExactRowIds(page: CarryoverBalancePageResult, expectedIds: string[]): void {
  expect(page.totalCount).toBe(expectedIds.length);
  expect(page.rows).toHaveLength(expectedIds.length);
  for (const id of expectedIds) {
    expect(page.rows.some(row => row.id === id)).toBe(true);
  }
}

function pageForTeacher(
  fixture: CarryoverFixture,
  tx: DBTransaction,
  extraFilters: Partial<CarryoverFilters> = {},
  pagination = { limit: 50, offset: 0 }
): Promise<CarryoverBalancePageResult> {
  return CarryoverBalanceRepository.findFiltered({ teacherId: fixture.teacher.id, ...extraFilters }, pagination, tx);
}

function buildItem(
  carryoverId: string,
  classInstanceId: string,
  overrides: Partial<CarryoverBalanceItemInsertType> = {}
): CarryoverBalanceItemInsertType {
  return {
    carryoverId,
    classInstanceId,
    originalAmount: "25.00",
    originalCurrency: CurrencyCode.SAR,
    originalStatus: CalculationStatus.CALCULATED,
    ...overrides,
  };
}

describe("CarryoverBalanceRepository.create + getById", () => {
  test("creates a carryover with database defaults applied", async () => {
    await runInRollback(async tx => {
      const fixture = await createCarryoverFixture(tx);

      expect(fixture.carryover.id).toBeDefined();
      expect(fixture.carryover.teacherId).toBe(fixture.teacher.id);
      expect(fixture.carryover.payable).toBe("100.00");
      expect(fixture.carryover.paid).toBe("0");
      expect(fixture.carryover.isPaid).toBe(false);
      expect(fixture.carryover.isDisabledTeacher).toBe(false);
      expect(fixture.carryover.expenseId).toBeNull();
      expect(fixture.carryover.createdByUserId).toBe(fixture.user.id);

      const fetched = await CarryoverBalanceRepository.getById(fixture.carryover.id, tx);
      expect(fetched?.id).toBe(fixture.carryover.id);
    });
  });

  test("getById returns null for an unknown id", async () => {
    await runInRollback(async tx => {
      const found = await CarryoverBalanceRepository.getById(randomUUID(), tx);
      expect(found).toBeNull();
    });
  });
});

describe("CarryoverBalanceRepository.getByIdsForUpdate", () => {
  test("returns only the requested rows that exist", async () => {
    await runInRollback(async tx => {
      const fixture = await createCarryoverFixture(tx);
      const second = await createSiblingCarryover(tx, fixture);
      await createSiblingCarryover(tx, fixture);

      const locked = await CarryoverBalanceRepository.getByIdsForUpdate(
        [fixture.carryover.id, second.id, randomUUID()],
        tx
      );

      expect(locked).toHaveLength(2);
      expect(locked.some(row => row.id === fixture.carryover.id)).toBe(true);
      expect(locked.some(row => row.id === second.id)).toBe(true);
    });
  });

  test("returns rows ordered by id regardless of the input order (deterministic lock order)", async () => {
    await runInRollback(async tx => {
      const fixture = await createCarryoverFixture(tx);
      const second = await createSiblingCarryover(tx, fixture);
      const third = await createSiblingCarryover(tx, fixture);
      const ascending = [fixture.carryover.id, second.id, third.id].toSorted((a, b) => a.localeCompare(b));

      const locked = await CarryoverBalanceRepository.getByIdsForUpdate(
        [ascending[2] ?? "", ascending[0] ?? "", ascending[1] ?? ""],
        tx
      );

      expect(locked.map(row => row.id)).toEqual(ascending);
    });
  });

  test("returns an empty array for an empty ids list", async () => {
    await runInRollback(async tx => {
      const locked = await CarryoverBalanceRepository.getByIdsForUpdate([], tx);
      expect(locked).toEqual([]);
    });
  });
});

describe("CarryoverBalanceRepository.getByIdsForUpdate — row locking", () => {
  // SQLite has no FOR UPDATE clause; withForUpdate no-ops there by design.
  test.skipIf(isSqlite())("holds exclusive row locks that force a concurrent FOR UPDATE read to time out", async () => {
    // Committed fixture (outside runInRollback): lock contention needs a second
    // connection, which cannot see uncommitted rows.
    const fixture = await db.transaction(async tx => createCarryoverFixture(tx));

    try {
      let notifyLockHeld = pendingGate;
      const lockHeldPromise = new Promise<void>(resolve => {
        notifyLockHeld = resolve;
      });
      let releaseLock = pendingGate;
      const releasePromise = new Promise<void>(resolve => {
        releaseLock = resolve;
      });

      const blockerPromise = db.transaction(async tx => {
        const locked = await CarryoverBalanceRepository.getByIdsForUpdate([fixture.carryover.id], tx);
        expect(locked).toHaveLength(1);
        expect(locked[0]?.id).toBe(fixture.carryover.id);
        notifyLockHeld();
        await releasePromise;
      });

      await lockHeldPromise;

      let contenderError: unknown = null;
      try {
        await db.transaction(async contenderTx => {
          await contenderTx.execute(sql`SET LOCAL statement_timeout = '500'`);
          await CarryoverBalanceRepository.getByIdsForUpdate([fixture.carryover.id], contenderTx);
        });
      } catch (error) {
        contenderError = error;
      } finally {
        releaseLock();
      }
      await blockerPromise;

      if (!(contenderError instanceof Error)) {
        throw new Error("concurrent FOR UPDATE read should have failed with a lock timeout");
      }
      const causeMessage = contenderError.cause instanceof Error ? ` ${contenderError.cause.message}` : "";
      expect(`${contenderError.message}${causeMessage}`).toMatch(/statement timeout|lock/i);
    } finally {
      await db.delete(carryoverBalances).where(eq(carryoverBalances.id, fixture.carryover.id));
      await db.delete(teachers).where(eq(teachers.id, fixture.teacher.id));
      await db.delete(users).where(eq(users.id, fixture.user.id));
    }
  });
});

describe("CarryoverBalanceRepository.findByTeacherId", () => {
  test("returns only the given teacher's carryovers", async () => {
    await runInRollback(async tx => {
      const fixture = await createCarryoverFixture(tx);
      const second = await createSiblingCarryover(tx, fixture);
      const otherFixture = await createCarryoverFixture(tx);

      const rows = await CarryoverBalanceRepository.findByTeacherId(fixture.teacher.id, tx);

      expect(rows).toHaveLength(2);
      expect(rows.every(row => row.teacherId === fixture.teacher.id)).toBe(true);
      expect(rows.some(row => row.id === fixture.carryover.id)).toBe(true);
      expect(rows.some(row => row.id === second.id)).toBe(true);
      expect(rows.some(row => row.id === otherFixture.carryover.id)).toBe(false);
    });
  });

  test("returns an empty array when the teacher has no carryovers", async () => {
    await runInRollback(async tx => {
      await createCarryoverFixture(tx);
      const rows = await CarryoverBalanceRepository.findByTeacherId(randomUUID(), tx);
      expect(rows).toEqual([]);
    });
  });
});

describe("CarryoverBalanceRepository.insertItems + findLinkedSessions", () => {
  test("inserts snapshot items and resolves the linked class instances in time order", async () => {
    await runInRollback(async tx => {
      const fixture = await createCarryoverFixture(tx);
      const { student } = await setupStudent(tx);
      const base = new Date("2026-01-10T12:00:00Z");
      const laterInstance = await createMockClassInstance(tx, student.id, fixture.teacher.id, {
        scheduledStartAt: new Date(base.getTime() + 2 * 3_600_000),
        scheduledEndAt: new Date(base.getTime() + 3 * 3_600_000),
      });
      const earlierInstance = await createMockClassInstance(tx, student.id, fixture.teacher.id, {
        scheduledStartAt: base,
        scheduledEndAt: new Date(base.getTime() + 3_600_000),
      });

      const inserted = await CarryoverBalanceRepository.insertItems(
        [
          buildItem(fixture.carryover.id, laterInstance.id),
          buildItem(fixture.carryover.id, earlierInstance.id, { originalAmount: "40.00" }),
        ],
        tx
      );

      expect(inserted).toHaveLength(2);
      for (const item of inserted) {
        expect(item.carryoverId).toBe(fixture.carryover.id);
        expect(item.originalStatus).toBe(CalculationStatus.CALCULATED);
      }

      const sessions = await CarryoverBalanceRepository.findLinkedSessions(fixture.carryover.id, tx);
      expect(sessions).toHaveLength(2);
      expect(sessions[0]?.id).toBe(earlierInstance.id);
      expect(sessions[1]?.id).toBe(laterInstance.id);
    });
  });

  test("insertItems is a no-op for an empty list and links resolve empty for an itemless carryover", async () => {
    await runInRollback(async tx => {
      const fixture = await createCarryoverFixture(tx);

      const inserted = await CarryoverBalanceRepository.insertItems([], tx);
      expect(inserted).toEqual([]);

      const sessions = await CarryoverBalanceRepository.findLinkedSessions(fixture.carryover.id, tx);
      expect(sessions).toEqual([]);
    });
  });

  test("does not leak sessions linked to a different carryover", async () => {
    await runInRollback(async tx => {
      const fixture = await createCarryoverFixture(tx);
      const otherFixture = await createCarryoverFixture(tx);
      const { student } = await setupStudent(tx);
      const instance = await createMockClassInstance(tx, student.id, otherFixture.teacher.id);
      await CarryoverBalanceRepository.insertItems([buildItem(otherFixture.carryover.id, instance.id)], tx);

      const sessions = await CarryoverBalanceRepository.findLinkedSessions(fixture.carryover.id, tx);
      expect(sessions).toEqual([]);
    });
  });

  test("excludes soft-deleted sessions from the linked-session read", async () => {
    await runInRollback(async tx => {
      const fixture = await createCarryoverFixture(tx);
      const { student } = await setupStudent(tx);
      const liveInstance = await createMockClassInstance(tx, student.id, fixture.teacher.id);
      const deletedInstance = await createMockClassInstance(tx, student.id, fixture.teacher.id);
      await CarryoverBalanceRepository.insertItems(
        [buildItem(fixture.carryover.id, liveInstance.id), buildItem(fixture.carryover.id, deletedInstance.id)],
        tx
      );
      await tx.update(classInstances).set({ deletedAt: new Date() }).where(eq(classInstances.id, deletedInstance.id));

      const sessions = await CarryoverBalanceRepository.findLinkedSessions(fixture.carryover.id, tx);

      expect(sessions.map(session => session.id)).toEqual([liveInstance.id]);
    });
  });

  test("forUpdate locks the linked sessions and rejects a lock request without a transaction", async () => {
    await runInRollback(async tx => {
      const fixture = await createCarryoverFixture(tx);
      const { student } = await setupStudent(tx);
      const instance = await createMockClassInstance(tx, student.id, fixture.teacher.id);
      await CarryoverBalanceRepository.insertItems([buildItem(fixture.carryover.id, instance.id)], tx);

      const locked = await CarryoverBalanceRepository.findLinkedSessions(fixture.carryover.id, tx, {
        forUpdate: true,
      });

      expect(locked.map(session => session.id)).toEqual([instance.id]);
    });

    let caught: unknown = null;
    try {
      await CarryoverBalanceRepository.findLinkedSessions(randomUUID(), undefined, { forUpdate: true });
    } catch (error) {
      caught = error;
    }
    expect(caught).not.toBeNull();
    expect(caught instanceof Error ? caught.message : String(caught)).toContain("transaction");
  });
});

describe("CarryoverBalanceRepository.findLinkedSessionRows", () => {
  test("resolves display fields and keeps the item snapshot while the current status follows the session", async () => {
    await runInRollback(async tx => {
      const fixture = await createCarryoverFixture(tx);
      const { student } = await setupStudent(tx, {}, {}, { name: "Omar Khaled" });
      const subjectId = await ensureTestSubjectId(tx);
      const [subjectRow] = await tx
        .select({ name: classSubjects.name })
        .from(classSubjects)
        .where(eq(classSubjects.id, subjectId));
      const start = new Date("2026-03-01T09:00:00Z");
      const instance = await createMockClassInstance(tx, student.id, fixture.teacher.id, {
        subjectId,
        scheduledStartAt: start,
        scheduledEndAt: new Date(start.getTime() + 2 * 3_600_000),
        durationMinutes: 120,
        calculationStatus: CalculationStatus.WAITING_PAID,
      });
      await CarryoverBalanceRepository.insertItems([buildItem(fixture.carryover.id, instance.id)], tx);

      const rows = await CarryoverBalanceRepository.findLinkedSessionRows(fixture.carryover.id, tx);

      expect(rows).toHaveLength(1);
      const row = rows[0];
      expect(row?.id).toBe(instance.id);
      expect(row?.studentId).toBe(student.id);
      expect(row?.studentName).toBe("Omar Khaled");
      expect(row?.subjectName).toBe(subjectRow?.name);
      expect(row?.scheduledStartAt).toEqual(start);
      expect(row?.durationMinutes).toBe(120);
      expect(row?.originalAmount).toBe("25.00");
      expect(row?.originalCurrency).toBe(CurrencyCode.SAR);
      expect(row?.originalStatus).toBe(CalculationStatus.CALCULATED);
      expect(row?.currentStatus).toBe(CalculationStatus.WAITING_PAID);
    });
  });

  test("orders rows by scheduled start and stays empty for a carryover without items", async () => {
    await runInRollback(async tx => {
      const fixture = await createCarryoverFixture(tx);
      const emptyFixture = await createCarryoverFixture(tx);
      const { student } = await setupStudent(tx);
      const base = new Date("2026-04-10T12:00:00Z");
      const laterInstance = await createMockClassInstance(tx, student.id, fixture.teacher.id, {
        scheduledStartAt: new Date(base.getTime() + 4 * 3_600_000),
      });
      const earlierInstance = await createMockClassInstance(tx, student.id, fixture.teacher.id, {
        scheduledStartAt: base,
      });
      await CarryoverBalanceRepository.insertItems(
        [buildItem(fixture.carryover.id, laterInstance.id), buildItem(fixture.carryover.id, earlierInstance.id)],
        tx
      );

      const rows = await CarryoverBalanceRepository.findLinkedSessionRows(fixture.carryover.id, tx);
      expect(rows.map(row => row.id)).toEqual([earlierInstance.id, laterInstance.id]);

      const emptyRows = await CarryoverBalanceRepository.findLinkedSessionRows(emptyFixture.carryover.id, tx);
      expect(emptyRows).toEqual([]);
    });
  });
});

describe("CarryoverBalanceRepository.countLinkedSessionsByCarryoverIds", () => {
  test("returns per-carryover counts with zeroes for empty and unknown ids", async () => {
    await runInRollback(async tx => {
      const fixture = await createCarryoverFixture(tx);
      const emptyFixture = await createCarryoverFixture(tx);
      const { student } = await setupStudent(tx);
      const firstInstance = await createMockClassInstance(tx, student.id, fixture.teacher.id);
      const secondInstance = await createMockClassInstance(tx, student.id, fixture.teacher.id);
      await CarryoverBalanceRepository.insertItems(
        [buildItem(fixture.carryover.id, firstInstance.id), buildItem(fixture.carryover.id, secondInstance.id)],
        tx
      );

      const unknownId = randomUUID();
      const counts = await CarryoverBalanceRepository.countLinkedSessionsByCarryoverIds(
        [fixture.carryover.id, emptyFixture.carryover.id, unknownId],
        tx
      );

      expect(counts.size).toBe(3);
      expect(counts.get(fixture.carryover.id)).toBe(2);
      expect(counts.get(emptyFixture.carryover.id)).toBe(0);
      expect(counts.get(unknownId)).toBe(0);
    });
  });

  test("returns an empty map for an empty input without issuing a query", async () => {
    await runInRollback(async tx => {
      const counts = await CarryoverBalanceRepository.countLinkedSessionsByCarryoverIds([], tx);
      expect(counts.size).toBe(0);
    });
  });
});

describe("CarryoverBalanceRepository.update", () => {
  test("applies the patch, bumps updatedAt, and keeps untouched columns", async () => {
    await runInRollback(async tx => {
      const fixture = await createCarryoverFixture(tx, {
        fromDate: "2026-01-10",
        toDate: "2026-01-20",
        note: "before",
      });

      const updated = await CarryoverBalanceRepository.update(
        fixture.carryover.id,
        { payable: "175.50", note: "after" },
        tx
      );

      expect(updated).not.toBeNull();
      expect(updated?.payable).toBe("175.50");
      expect(updated?.note).toBe("after");
      expect(updated?.fromDate).toBe("2026-01-10");
      expect(updated?.teacherCurrency).toBe(CurrencyCode.SAR);
      expect(updated?.updatedAt.getTime()).toBeGreaterThanOrEqual(fixture.carryover.updatedAt.getTime());
    });
  });

  test("returns null when updating an unknown id", async () => {
    await runInRollback(async tx => {
      const updated = await CarryoverBalanceRepository.update(randomUUID(), { note: "nope" }, tx);
      expect(updated).toBeNull();
    });
  });
});

describe("CarryoverBalanceRepository.deleteById + bulkDelete", () => {
  test("deleteById removes the carryover and cascades its items", async () => {
    await runInRollback(async tx => {
      const fixture = await createCarryoverFixture(tx);
      const { student } = await setupStudent(tx);
      const instance = await createMockClassInstance(tx, student.id, fixture.teacher.id);
      await CarryoverBalanceRepository.insertItems([buildItem(fixture.carryover.id, instance.id)], tx);

      const removed = await CarryoverBalanceRepository.deleteById(fixture.carryover.id, tx);

      expect(removed?.id).toBe(fixture.carryover.id);
      const leftover = await CarryoverBalanceRepository.getById(fixture.carryover.id, tx);
      expect(leftover).toBeNull();
      const orphanItems = await tx
        .select()
        .from(carryoverBalanceItems)
        .where(eq(carryoverBalanceItems.carryoverId, fixture.carryover.id));
      expect(orphanItems).toEqual([]);
    });
  });

  test("deleteById returns null for an unknown id", async () => {
    await runInRollback(async tx => {
      const removed = await CarryoverBalanceRepository.deleteById(randomUUID(), tx);
      expect(removed).toBeNull();
    });
  });

  test("bulkDelete removes the existing ids and skips unknown ones", async () => {
    await runInRollback(async tx => {
      const fixture = await createCarryoverFixture(tx);
      const second = await createSiblingCarryover(tx, fixture);
      const survivor = await createSiblingCarryover(tx, fixture);

      const removed = await CarryoverBalanceRepository.bulkDelete([fixture.carryover.id, second.id, randomUUID()], tx);

      expect(removed).toHaveLength(2);
      const remaining = await CarryoverBalanceRepository.findByTeacherId(fixture.teacher.id, tx);
      expect(remaining).toHaveLength(1);
      expect(remaining[0]?.id).toBe(survivor.id);
    });
  });

  test("bulkDelete is a no-op for an empty ids list", async () => {
    await runInRollback(async tx => {
      const removed = await CarryoverBalanceRepository.bulkDelete([], tx);
      expect(removed).toEqual([]);
    });
  });
});

describe("CarryoverBalanceRepository.findFiltered — disabled-teacher filter", () => {
  test("excludes disabled-teacher rows by default and includes them when toggled on", async () => {
    await runInRollback(async tx => {
      const fixture = await createCarryoverFixture(tx, { isDisabledTeacher: true });

      const defaultPage = await pageForTeacher(fixture, tx);
      expectExactRowIds(defaultPage, []);

      const withDisabled = await pageForTeacher(fixture, tx, { includeDisabledTeachers: true });
      expectExactRowIds(withDisabled, [fixture.carryover.id]);

      const explicitOff = await pageForTeacher(fixture, tx, { includeDisabledTeachers: false });
      expectExactRowIds(explicitOff, []);
    });
  });
});

describe("CarryoverBalanceRepository.findFiltered — teacher + join fields", () => {
  test("filters by exact teacherId and resolves teacherName via the join", async () => {
    await runInRollback(async tx => {
      const teacherName = `CarryJoin-${randomUUID().slice(0, 8)}`;
      const fixture = await createCarryoverFixture(tx, {}, teacherName);
      await createCarryoverFixture(tx);

      const page = await pageForTeacher(fixture, tx);

      expectExactRowIds(page, [fixture.carryover.id]);
      expect(page.rows[0]?.teacherName).toBe(teacherName);
      expect(page.rows[0]?.teacherAvatarUrl).toBeNull();
    });
  });
});

describe("CarryoverBalanceRepository.findFiltered — paid status", () => {
  test("Paid / Unpaid / Both select the matching subsets", async () => {
    await runInRollback(async tx => {
      const fixture = await createCarryoverFixture(tx);
      const paidRow = await createSiblingCarryover(tx, fixture, {
        isPaid: true,
        paid: "100.00",
        paymentDate: "2026-02-15",
        paidAt: new Date("2026-02-15T10:00:00Z"),
        paidByUserId: fixture.user.id,
      });

      const paidPage = await pageForTeacher(fixture, tx, { paidStatus: "Paid" });
      expectExactRowIds(paidPage, [paidRow.id]);

      const unpaidPage = await pageForTeacher(fixture, tx, { paidStatus: "Unpaid" });
      expectExactRowIds(unpaidPage, [fixture.carryover.id]);

      const bothPage = await pageForTeacher(fixture, tx, { paidStatus: "Both" });
      expectExactRowIds(bothPage, [fixture.carryover.id, paidRow.id]);

      const nullStatusPage = await pageForTeacher(fixture, tx, { paidStatus: null });
      expectExactRowIds(nullStatusPage, [fixture.carryover.id, paidRow.id]);
    });
  });
});

describe("CarryoverBalanceRepository.findFiltered — date range", () => {
  test("applies inclusive from/to bounds on the carryover's own date range", async () => {
    await runInRollback(async tx => {
      const fixture = await createCarryoverFixture(tx, { fromDate: "2026-01-10", toDate: "2026-01-20" });

      const fromInclusive = await pageForTeacher(fixture, tx, { dateFrom: "2026-01-10" });
      expectExactRowIds(fromInclusive, [fixture.carryover.id]);

      const fromExcluded = await pageForTeacher(fixture, tx, { dateFrom: "2026-01-11" });
      expectExactRowIds(fromExcluded, []);

      const toInclusive = await pageForTeacher(fixture, tx, { dateTo: "2026-01-20" });
      expectExactRowIds(toInclusive, [fixture.carryover.id]);

      const toExcluded = await pageForTeacher(fixture, tx, { dateTo: "2026-01-19" });
      expectExactRowIds(toExcluded, []);

      const bothBounds = await pageForTeacher(fixture, tx, { dateFrom: "2026-01-01", dateTo: "2026-01-31" });
      expectExactRowIds(bothBounds, [fixture.carryover.id]);
    });
  });

  test("excludes rows with NULL date columns when a date filter is active", async () => {
    await runInRollback(async tx => {
      const fixture = await createCarryoverFixture(tx);

      const page = await pageForTeacher(fixture, tx, { dateFrom: "2026-01-01" });
      expectExactRowIds(page, []);
    });
  });
});

describe("CarryoverBalanceRepository.findFiltered — search", () => {
  test("matches teacher name case-insensitively", async () => {
    await runInRollback(async tx => {
      const teacherName = `CarrySearch-${randomUUID().slice(0, 8)}`;
      const fixture = await createCarryoverFixture(tx, {}, teacherName);

      const page = await pageForTeacher(fixture, tx, { search: teacherName.toLowerCase() });
      expectExactRowIds(page, [fixture.carryover.id]);
    });
  });

  test("matches studentsText case-insensitively", async () => {
    await runInRollback(async tx => {
      const marker = `CarryStu-${randomUUID().slice(0, 8)}`;
      const fixture = await createCarryoverFixture(tx, { studentsText: `${marker} and others` });

      const page = await pageForTeacher(fixture, tx, { search: marker.toLowerCase() });
      expectExactRowIds(page, [fixture.carryover.id]);
    });
  });

  test("ignores blank search terms", async () => {
    await runInRollback(async tx => {
      const fixture = await createCarryoverFixture(tx);

      const page = await pageForTeacher(fixture, tx, { search: "   " });
      expectExactRowIds(page, [fixture.carryover.id]);
    });
  });

  test("escapes LIKE wildcards instead of interpreting them", async () => {
    await runInRollback(async tx => {
      const teacherName = `CarryWild-${randomUUID().slice(0, 8)}`;
      const fixture = await createCarryoverFixture(tx, {}, teacherName);

      // Unescaped, the trailing "%" would match everything; escaped, it only
      // matches a literal "%" after the name — so the row must not be found.
      const page = await pageForTeacher(fixture, tx, { search: `${teacherName}%` });
      expectExactRowIds(page, []);

      const exact = await pageForTeacher(fixture, tx, { search: teacherName });
      expectExactRowIds(exact, [fixture.carryover.id]);
    });
  });

  test("treats SQL/quote/underscore injection payloads as literal text", async () => {
    await runInRollback(async tx => {
      const teacherName = `CarryInject-${randomUUID().slice(0, 8)}`;
      const fixture = await createCarryoverFixture(tx, {}, teacherName);

      const payloads = ["%", "_", "' OR '1'='1", `'; DROP TABLE carryover_balances; --`, "test\\%_"];
      // Sequential on purpose: the rollback transaction carries a single
      // connection, so queries must not interleave.
      await payloads.reduce(async (previous, payload) => {
        await previous;
        // None of the payloads occur literally in the fixture rows, so nothing
        // may match — a match would mean the pattern/payload was interpreted.
        const page = await CarryoverBalanceRepository.findFiltered(
          { teacherId: fixture.teacher.id, search: payload },
          { limit: 50, offset: 0 },
          tx
        );
        expectExactRowIds(page, []);
      }, Promise.resolve());

      // The table survived the DROP attempt and the plain search still works.
      const exact = await pageForTeacher(fixture, tx, { search: teacherName });
      expectExactRowIds(exact, [fixture.carryover.id]);
    });
  });

  test("matches Arabic/RTL text verbatim and treats a bidi-only term as literal", async () => {
    await runInRollback(async tx => {
      const teacherName = `سارة-${randomUUID().slice(0, 8)}`;
      const fixture = await createCarryoverFixture(tx, { studentsText: "خالد \u202eعمر\u202c" }, teacherName);

      const byTeacher = await pageForTeacher(fixture, tx, { search: "سارة" });
      expectExactRowIds(byTeacher, [fixture.carryover.id]);

      const byStudents = await pageForTeacher(fixture, tx, { search: "خالد" });
      expectExactRowIds(byStudents, [fixture.carryover.id]);

      const bidiOnly = await pageForTeacher(fixture, tx, { search: "\u202e\u202c" });
      expectExactRowIds(bidiOnly, []);
    });
  });

  // Evidence for the service-level identifier guard: the uuid column itself
  // rejects malformed ids with a database error, so the service must filter
  // them out before any query runs.
  test.skipIf(isSqlite())("a malformed uuid id fails at the database boundary", async () => {
    await runInRollback(async tx => {
      let caught: unknown = null;
      try {
        await CarryoverBalanceRepository.getById("not-a-uuid", tx);
      } catch (error) {
        caught = error;
      }
      expect(caught).not.toBeNull();
      const message = caught instanceof Error ? caught.message : String(caught);
      expect(message).toMatch(/invalid input syntax|uuid/i);
    });
  });
});

describe("CarryoverBalanceRepository.findFiltered — combined filters", () => {
  test("applies teacher + paidStatus + date range + search together", async () => {
    await runInRollback(async tx => {
      const marker = `CarryCombo-${randomUUID().slice(0, 8)}`;
      const fixture = await createCarryoverFixture(
        tx,
        { fromDate: "2026-02-01", toDate: "2026-02-28", studentsText: marker },
        marker
      );
      // Paid row matches teacher + dates + search but must be filtered out by paidStatus.
      await createSiblingCarryover(tx, fixture, {
        fromDate: "2026-02-01",
        toDate: "2026-02-28",
        studentsText: marker,
        isPaid: true,
        paid: "100.00",
      });

      const page = await pageForTeacher(fixture, tx, {
        paidStatus: "Unpaid",
        dateFrom: "2026-02-01",
        dateTo: "2026-02-28",
        search: marker,
      });
      expectExactRowIds(page, [fixture.carryover.id]);
    });
  });
});

describe("CarryoverBalanceRepository.findFiltered — pagination", () => {
  test("pages with limit/offset while totalCount reflects the full filtered set", async () => {
    await runInRollback(async tx => {
      const fixture = await createCarryoverFixture(tx);
      const second = await createSiblingCarryover(tx, fixture);
      const third = await createSiblingCarryover(tx, fixture);
      const allIds = [fixture.carryover.id, second.id, third.id];

      const firstPage = await pageForTeacher(fixture, tx, {}, { limit: 2, offset: 0 });
      expect(firstPage.rows).toHaveLength(2);
      expect(firstPage.totalCount).toBe(3);

      const secondPage = await pageForTeacher(fixture, tx, {}, { limit: 2, offset: 2 });
      expect(secondPage.rows).toHaveLength(1);
      expect(secondPage.totalCount).toBe(3);

      const combined = [...firstPage.rows, ...secondPage.rows].map(row => row.id);
      expect(combined).toHaveLength(3);
      for (const id of allIds) {
        expect(combined).toContain(id);
      }

      // Offset past the end: empty page, correct totalCount.
      const pastEnd = await pageForTeacher(fixture, tx, {}, { limit: 2, offset: 3 });
      expect(pastEnd.rows).toEqual([]);
      expect(pastEnd.totalCount).toBe(3);
    });
  });

  test("returns an empty page when the filter matches nothing", async () => {
    await runInRollback(async tx => {
      const fixture = await createCarryoverFixture(tx);

      const page = await pageForTeacher(fixture, tx, { search: `no-such-${randomUUID()}` });
      expectExactRowIds(page, []);
    });
  });
});

describe("CarryoverBalanceRepository.findFiltered — aggregate fidelity", () => {
  test("returned rows support correct payable/paid totals and paid-split counts", async () => {
    await runInRollback(async tx => {
      const fixture = await createCarryoverFixture(tx, { payable: "100.00" });
      await createSiblingCarryover(tx, fixture, {
        payable: "200.25",
        paid: "200.25",
        isPaid: true,
        paymentDate: "2026-03-01",
        paidAt: new Date("2026-03-01T09:00:00Z"),
        paidByUserId: fixture.user.id,
      });

      const { rows, totalCount } = await pageForTeacher(fixture, tx);

      expect(totalCount).toBe(2);
      expect(rows).toHaveLength(2);
      const totalPayable = rows.reduce((sum, row) => sum + Number(row.payable), 0).toFixed(2);
      const totalPaid = rows.reduce((sum, row) => sum + Number(row.paid), 0).toFixed(2);
      expect(totalPayable).toBe("300.25");
      expect(totalPaid).toBe("200.25");
      expect(rows.filter(row => row.isPaid)).toHaveLength(1);
      expect(rows.filter(row => !row.isPaid)).toHaveLength(1);
      expect(rows.every(row => row.teacherCurrency === CurrencyCode.SAR)).toBe(true);
    });
  });
});

describe("CarryoverBalanceRepository — non-transactional reads", () => {
  test("getById returns null without a transaction for an unknown id", async () => {
    const found = await CarryoverBalanceRepository.getById(randomUUID());
    expect(found).toBeNull();
  });

  test("findByTeacherId returns an empty array without a transaction for an unknown teacher", async () => {
    const rows = await CarryoverBalanceRepository.findByTeacherId(randomUUID());
    expect(rows).toEqual([]);
  });

  test("findLinkedSessionRows returns an empty array without a transaction for an unknown id", async () => {
    const rows = await CarryoverBalanceRepository.findLinkedSessionRows(randomUUID());
    expect(rows).toEqual([]);
  });

  test("countLinkedSessionsByCarryoverIds resolves an unknown id to zero without a transaction", async () => {
    const unknownId = randomUUID();
    const counts = await CarryoverBalanceRepository.countLinkedSessionsByCarryoverIds([unknownId]);
    expect(counts.get(unknownId)).toBe(0);
  });
});
