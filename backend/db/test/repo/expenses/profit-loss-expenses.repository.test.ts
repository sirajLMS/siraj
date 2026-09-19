import { describe, expect, test } from "bun:test";
import { randomUUID } from "node:crypto";
import { ExpenseRepository } from "@/backend/db/repo/expenses";
import { createTestUser, setupTeacher } from "@/backend/db/test/entity-setup";
import { runInRollback } from "@/backend/db/test/test-utils";
import { ExpenseType } from "@/backend/enum";
import type { DBTransaction, ExpenseInsertType, ProfitLossExpenseRow } from "@/backend/types";
import { CurrencyCode } from "@/shared/constants/currency.enum";

const MONTH = "2026-05";

type ProfitLossFilters = { month: string; limit: number; offset: number };

/** The repository read model: the ledger row without the service-layer conversion. */
type ProfitLossReadRow = Omit<ProfitLossExpenseRow, "convertedAmount">;

function buildExpenseInput(createdByUserId: string, overrides: Partial<ExpenseInsertType> = {}): ExpenseInsertType {
  return {
    title: "Reported spend",
    type: ExpenseType.MARKETING,
    expenseValue: "100.00",
    expenseCurrency: CurrencyCode.SAR,
    paymentDate: "2026-05-10",
    expenseDate: MONTH,
    createdByUserId,
    ...overrides,
  };
}

async function createExpense(
  tx: DBTransaction,
  overrides: Partial<ExpenseInsertType> = {}
): Promise<ProfitLossReadRow> {
  const user = await createTestUser(tx, {});
  const row = await ExpenseRepository.create(buildExpenseInput(user.id, overrides), tx);
  return {
    id: row.id,
    title: row.title,
    type: row.type,
    teacherName: row.teacherName,
    expenseValue: row.expenseValue,
    expenseCurrency: row.expenseCurrency,
    paymentDate: row.paymentDate,
    sourceEntity: row.sourceEntity,
    sourceEntityId: row.sourceEntityId,
    note: row.note,
  };
}

async function createSalaryExpense(tx: DBTransaction, teacherName: string): Promise<void> {
  const { teacher, user: teacherUser } = await setupTeacher(tx, { name: teacherName });
  await createExpense(tx, {
    title: "Salary payout",
    type: ExpenseType.SALARIES,
    teacherId: teacher.id,
    teacherName: teacherUser.name,
    expenseValue: "750.00",
    sourceEntity: "carryover_balances",
    sourceEntityId: randomUUID(),
  });
}

function fetchPage(
  filters: ProfitLossFilters
): (tx: DBTransaction) => Promise<{ rows: ProfitLossReadRow[]; totalCount: number }> {
  return async tx => ExpenseRepository.findProfitLossExpenses(filters, tx);
}

function expectIds(rows: ReadonlyArray<{ id: string }>, ids: string[]): void {
  expect(rows.map(row => row.id).toSorted((a, b) => a.localeCompare(b))).toEqual(
    ids.toSorted((a, b) => a.localeCompare(b))
  );
}

function countByType(rows: ReadonlyArray<{ type: ExpenseType }>): Record<ExpenseType, number> {
  const counts: Record<ExpenseType, number> = {
    [ExpenseType.SALARIES]: 0,
    [ExpenseType.MARKETING]: 0,
    [ExpenseType.LOGISTICS]: 0,
    [ExpenseType.TECHNOLOGY]: 0,
  };
  for (const row of rows) {
    counts[row.type] = (counts[row.type] ?? 0) + 1;
  }
  return counts;
}

describe("ExpenseRepository.findProfitLossExpenses", () => {
  test("returns the page shape with the dashboard display columns", async () => {
    await runInRollback(async tx => {
      const created = await createExpense(tx, {
        title: "Ledger row one",
        note: "renewable annual plan",
        sourceEntity: null,
      });
      const page = await fetchPage({ month: MONTH, limit: 50, offset: 0 })(tx);
      expect(page.totalCount).toBe(1);
      expect(page.rows).toHaveLength(1);
      const row = page.rows[0];
      expect(row?.id).toBe(created.id);
      expect(row?.title).toBe("Ledger row one");
      expect(row?.type).toBe(ExpenseType.MARKETING);
      expect(row?.teacherName).toBeNull();
      expect(row?.expenseValue).toBe("100.00");
      expect(row?.expenseCurrency).toBe(CurrencyCode.SAR);
      expect(row?.paymentDate).toBe("2026-05-10");
      expect(row?.sourceEntity).toBeNull();
      expect(row?.sourceEntityId).toBeNull();
      expect(row?.note).toBe("renewable annual plan");
    });
  });

  test("resolves the teacher snapshot and provenance linkage on salary rows", async () => {
    await runInRollback(async tx => {
      await createSalaryExpense(tx, "Karim Snapshot");
      const page = await fetchPage({ month: MONTH, limit: 50, offset: 0 })(tx);
      expect(page.rows).toHaveLength(1);
      const row = page.rows[0];
      expect(row?.type).toBe(ExpenseType.SALARIES);
      expect(row?.teacherName).toBe("Karim Snapshot");
      expect(row?.sourceEntity).toBe("carryover_balances");
      expect(row?.sourceEntityId).toBeDefined();
      expect(row?.expenseValue).toBe("750.00");
    });
  });

  test("filters by accounting month", async () => {
    await runInRollback(async tx => {
      const may = await createExpense(tx);
      await createExpense(tx, { expenseDate: "2026-04", paymentDate: "2026-04-10" });
      await createExpense(tx, { expenseDate: "2026-06", paymentDate: "2026-06-10" });

      const mayOnly = await fetchPage({ month: MONTH, limit: 50, offset: 0 })(tx);
      expect(mayOnly.totalCount).toBe(1);
      expectIds(mayOnly.rows, [may.id]);
      expect(await fetchPage({ month: "2030-01", limit: 50, offset: 0 })(tx)).toEqual({
        rows: [],
        totalCount: 0,
      });
    });
  });

  test("excludes soft-deleted rows from rows and totalCount", async () => {
    await runInRollback(async tx => {
      const alive = await createExpense(tx, { title: "Alive row" });
      const removed = await createExpense(tx, { title: "Removed row" });
      const removedSecond = await createExpense(tx, { title: "Removed second" });
      const actor = await createTestUser(tx, {});
      await ExpenseRepository.softDelete(removed.id, actor.id, "duplicate", tx);
      await ExpenseRepository.softDelete(removedSecond.id, actor.id, "duplicate", tx);

      const page = await fetchPage({ month: MONTH, limit: 50, offset: 0 })(tx);
      expectIds(page.rows, [alive.id]);
      expect(page.totalCount).toBe(1);
    });
  });

  test("paginates newest payout first while totalCount covers the month", async () => {
    await runInRollback(async tx => {
      const early = await createExpense(tx, { title: "Early payout", paymentDate: "2026-05-02" });
      const middle = await createExpense(tx, { title: "Middle payout", paymentDate: "2026-05-15" });
      const late = await createExpense(tx, { title: "Late payout", paymentDate: "2026-05-28" });
      const otherMonth = await createExpense(tx, { expenseDate: "2026-04", paymentDate: "2026-04-30" });

      const firstPage = await fetchPage({ month: MONTH, limit: 2, offset: 0 })(tx);
      const secondPage = await fetchPage({ month: MONTH, limit: 2, offset: 2 })(tx);
      expect(firstPage.totalCount).toBe(3);
      expect(secondPage.totalCount).toBe(3);
      expect(firstPage.rows).toHaveLength(2);
      expect(secondPage.rows).toHaveLength(1);
      // Newest payout first: page 1 holds late and middle, page 2 the early row.
      expect(firstPage.rows.map(row => row.id)).toEqual([late.id, middle.id]);
      expectIds(secondPage.rows, [early.id]);
      // The other-month row stays outside this month's rows and count.
      const allPageIds = [...firstPage.rows, ...secondPage.rows].map(row => row.id);
      expect(allPageIds).not.toContain(otherMonth.id);

      const pastEnd = await fetchPage({ month: MONTH, limit: 50, offset: 999 })(tx);
      expect(pastEnd.rows).toHaveLength(0);
      expect(pastEnd.totalCount).toBe(3);
    });
  });

  test("aggregates row counts per expense type for the month", async () => {
    await runInRollback(async tx => {
      await createSalaryExpense(tx, "Salaries Agg Teacher");
      await createExpense(tx, { type: ExpenseType.MARKETING, expenseValue: "100.00" });
      await createExpense(tx, { type: ExpenseType.MARKETING, expenseValue: "150.00" });
      await createExpense(tx, { type: ExpenseType.TECHNOLOGY, expenseValue: "50.00" });
      await createExpense(tx, { type: ExpenseType.LOGISTICS, expenseValue: "25.00", expenseDate: "2026-04" });

      const page = await fetchPage({ month: MONTH, limit: 50, offset: 0 })(tx);
      expect(page.totalCount).toBe(4);
      const counts = countByType(page.rows);
      expect(counts[ExpenseType.SALARIES]).toBe(1);
      expect(counts[ExpenseType.MARKETING]).toBe(2);
      expect(counts[ExpenseType.TECHNOLOGY]).toBe(1);
      // The month has no logistics rows — the per-type record zeroes them out.
      expect(counts[ExpenseType.LOGISTICS]).toBe(0);

      const totalValue = page.rows.reduce((sum, row) => sum + Number(row.expenseValue), 0).toFixed(2);
      expect(totalValue).toBe("1050.00");
      const dominant = [
        ...page.rows
          .reduce<Map<string, number>>((acc, row) => {
            acc.set(row.expenseCurrency, (acc.get(row.expenseCurrency) ?? 0) + 1);
            return acc;
          }, new Map())
          .entries(),
      ].toSorted((a, b) => b[1] - a[1])[0]?.[0];
      expect(dominant).toBe(CurrencyCode.SAR);
    });
  });

  test.each(["%", "%%", ".*", "2026-%", "2026-5", ""])(
    "a wildcard or malformed month %j matches no rows instead of widening the filter",
    async rawMonth => {
      await runInRollback(async tx => {
        await createExpense(tx);
        await createExpense(tx, { type: ExpenseType.TECHNOLOGY, expenseValue: "50.00" });

        const page = await fetchPage({ month: rawMonth, limit: 50, offset: 0 })(tx);

        expect(page.rows).toHaveLength(0);
        expect(page.totalCount).toBe(0);
      });
    }
  );
});
