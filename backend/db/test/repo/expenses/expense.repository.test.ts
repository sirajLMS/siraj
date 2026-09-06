import { describe, expect, test } from "bun:test";
import { randomUUID } from "node:crypto";
import { ExpenseRepository } from "@/backend/db/repo/expenses";
import { createTestUser, setupTeacher } from "@/backend/db/test/entity-setup";
import { runInRollback } from "@/backend/db/test/test-utils";
import { ExpenseType } from "@/backend/enum";
import type { DBTransaction, ExpenseFilters, ExpenseInsertType, ExpenseListRow } from "@/backend/types";
import { CurrencyCode } from "@/shared/constants/currency.enum";

const PAGE = { limit: 50, offset: 0 };

function buildExpenseInput(createdByUserId: string, overrides: Partial<ExpenseInsertType> = {}): ExpenseInsertType {
  return {
    title: "Office rent",
    type: ExpenseType.MARKETING,
    expenseValue: "100.00",
    expenseCurrency: CurrencyCode.SAR,
    paymentDate: "2026-01-15",
    expenseDate: "2026-01",
    createdByUserId,
    ...overrides,
  };
}

async function createExpense(
  tx: DBTransaction,
  overrides: Partial<ExpenseInsertType> = {}
): Promise<ExpenseListRow & { userId: string; userName: string }> {
  const user = await createTestUser(tx, {});
  const row = await ExpenseRepository.create(buildExpenseInput(user.id, overrides), tx);
  return { ...row, createdByName: user.name, userId: user.id, userName: user.name };
}

async function createLinkedExpense(tx: DBTransaction, teacherName: string) {
  const { teacher, user: teacherUser } = await setupTeacher(tx, { name: teacherName });
  const row = await createExpense(tx, {
    title: "January salary payout",
    type: ExpenseType.SALARIES,
    teacherId: teacher.id,
    teacherName: teacherUser.name,
    sourceEntity: "carryover_balances",
    sourceEntityId: randomUUID(),
  });
  return { teacher, teacherUser, expense: row };
}

function expectIds(rows: ReadonlyArray<{ id: string }>, ids: string[]): void {
  expect(rows.map(row => row.id).toSorted((a, b) => a.localeCompare(b))).toEqual(
    ids.toSorted((a, b) => a.localeCompare(b))
  );
}

function filterWith(filters: ExpenseFilters): (tx: DBTransaction) => Promise<ExpenseListRow[]> {
  return async tx => (await ExpenseRepository.findFiltered(filters, PAGE, tx)).rows;
}

describe("ExpenseRepository.create + getById", () => {
  test("creates an expense with database defaults applied", async () => {
    await runInRollback(async tx => {
      const created = await createExpense(tx);
      expect(created.id).toBeDefined();
      expect(created.title).toBe("Office rent");
      expect(created.type).toBe(ExpenseType.MARKETING);
      expect(created.expenseValue).toBe("100.00");
      expect(created.expenseCurrency).toBe(CurrencyCode.SAR);
      expect(created.expenseDate).toBe("2026-01");
      expect(created.teacherId).toBeNull();
      expect(created.teacherName).toBeNull();
      expect(created.sourceEntity).toBeNull();
      expect(created.sourceEntityId).toBeNull();
      expect(created.note).toBeNull();
      expect(created.deletedAt).toBeNull();
      expect(created.deletedByUserId).toBeNull();
      expect(created.deletedReason).toBeNull();
      expect(created.createdAt).toBeInstanceOf(Date);
      expect(created.updatedAt).toBeInstanceOf(Date);

      const fetched = await ExpenseRepository.getById(created.id, tx);
      expect(fetched?.id).toBe(created.id);
      expect(fetched?.createdByUserId).toBe(created.userId);
    });
  });

  test("creates a salaries expense with carryover provenance and the teacher snapshot", async () => {
    await runInRollback(async tx => {
      const { teacher, teacherUser, expense } = await createLinkedExpense(tx, "Karim Resolved");
      expect(expense.teacherId).toBe(teacher.id);
      expect(expense.teacherName).toBe(teacherUser.name);
      expect(expense.sourceEntity).toBe("carryover_balances");
      expect(expense.sourceEntityId).toBeDefined();
      expect(expense.type).toBe(ExpenseType.SALARIES);
    });
  });

  test("getById returns null for an unknown id", async () => {
    await runInRollback(async tx => {
      expect(await ExpenseRepository.getById(randomUUID(), tx)).toBeNull();
    });
  });
});

describe("ExpenseRepository.getByIdForUpdate", () => {
  test("locks and returns the row inside the caller transaction", async () => {
    await runInRollback(async tx => {
      const created = await createExpense(tx);
      const locked = await ExpenseRepository.getByIdForUpdate(created.id, tx);
      expect(locked?.id).toBe(created.id);
    });
  });

  test("returns null for an unknown id", async () => {
    await runInRollback(async tx => {
      expect(await ExpenseRepository.getByIdForUpdate(randomUUID(), tx)).toBeNull();
    });
  });
});

describe("ExpenseRepository.update", () => {
  test("applies a partial patch and bumps updatedAt", async () => {
    await runInRollback(async tx => {
      const created = await createExpense(tx, { note: "initial note" });
      const updated = await ExpenseRepository.update(
        created.id,
        { title: "Updated rent", expenseValue: "250.75", note: null },
        tx
      );
      expect(updated).not.toBeNull();
      expect(updated?.title).toBe("Updated rent");
      expect(updated?.expenseValue).toBe("250.75");
      expect(updated?.note).toBeNull();
      expect(updated?.type).toBe(ExpenseType.MARKETING);
      expect(updated?.updatedAt.getTime()).toBeGreaterThanOrEqual(created.updatedAt.getTime());
    });
  });

  test("returns null when updating an unknown id", async () => {
    await runInRollback(async tx => {
      expect(await ExpenseRepository.update(randomUUID(), { title: "ghost" }, tx)).toBeNull();
    });
  });
});

describe("ExpenseRepository.softDelete", () => {
  test("sets deletedAt, deletedByUserId and deletedReason", async () => {
    await runInRollback(async tx => {
      const created = await createExpense(tx);
      const actor = await createTestUser(tx, {});
      const deleted = await ExpenseRepository.softDelete(created.id, actor.id, "duplicate entry", tx);
      expect(deleted).not.toBeNull();
      expect(deleted?.deletedAt).toBeInstanceOf(Date);
      expect(deleted?.deletedByUserId).toBe(actor.id);
      expect(deleted?.deletedReason).toBe("duplicate entry");

      const reread = await ExpenseRepository.getById(created.id, tx);
      expect(reread?.deletedAt?.getTime()).toBe(deleted?.deletedAt?.getTime());
    });
  });

  test("returns null when soft-deleting an unknown id", async () => {
    await runInRollback(async tx => {
      expect(await ExpenseRepository.softDelete(randomUUID(), randomUUID(), null, tx)).toBeNull();
    });
  });
});

describe("ExpenseRepository.bulkSoftDelete", () => {
  test("soft-deletes every requested row and skips unknown ids", async () => {
    await runInRollback(async tx => {
      const first = await createExpense(tx, { title: "First" });
      const second = await createExpense(tx, { title: "Second" });
      const actor = await createTestUser(tx, {});
      const deleted = await ExpenseRepository.bulkSoftDelete([first.id, second.id, randomUUID()], actor.id, null, tx);
      expect(deleted).toHaveLength(2);
      expectIds(deleted, [first.id, second.id]);
      for (const row of deleted) {
        expect(row.deletedAt).toBeInstanceOf(Date);
        expect(row.deletedByUserId).toBe(actor.id);
      }
    });
  });

  test("returns an empty array for an empty id list", async () => {
    await runInRollback(async tx => {
      expect(await ExpenseRepository.bulkSoftDelete([], randomUUID(), null, tx)).toEqual([]);
    });
  });
});

describe("ExpenseRepository.findFiltered", () => {
  test("returns the page shape with the creator name resolved by join", async () => {
    await runInRollback(async tx => {
      const created = await createExpense(tx, { title: "Ledger row one" });
      const page = await ExpenseRepository.findFiltered({ title: "ledger row" }, PAGE, tx);
      expect(page.totalCount).toBe(1);
      expect(page.rows).toHaveLength(1);
      expect(page.rows[0]?.id).toBe(created.id);
      expect(page.rows[0]?.createdByName).toBe(created.userName);
    });
  });

  test("filters by title case-insensitively with wildcard characters escaped", async () => {
    await runInRollback(async tx => {
      const pct = await createExpense(tx, { title: "Discount 100% rent" });
      await createExpense(tx, { title: "Discount 5000 rent" });
      const rowsOnly = await filterWith({ title: "100%" })(tx);
      expect(rowsOnly).toHaveLength(1);
      expect(rowsOnly[0]?.id).toBe(pct.id);
    });
  });

  test("filters by a multi-type set", async () => {
    await runInRollback(async tx => {
      const marketing = await createExpense(tx, { type: ExpenseType.MARKETING });
      const logistics = await createExpense(tx, { type: ExpenseType.LOGISTICS });
      const tech = await createExpense(tx, { type: ExpenseType.TECHNOLOGY });
      await createLinkedExpense(tx, "Salaries Row Teacher");

      const rowsOnly = await filterWith({ types: [ExpenseType.LOGISTICS, ExpenseType.TECHNOLOGY] })(tx);
      expectIds(rowsOnly, [logistics.id, tech.id]);
      expect(rowsOnly.some(row => row.id === marketing.id)).toBe(false);
    });
  });

  test("filters by expense month", async () => {
    await runInRollback(async tx => {
      const jan = await createExpense(tx, { expenseDate: "2026-01" });
      await createExpense(tx, { expenseDate: "2026-02" });
      expectIds(await filterWith({ expenseDate: "2026-01" })(tx), [jan.id]);
    });
  });

  test("filters by payment date range (lexicographic ISO text)", async () => {
    await runInRollback(async tx => {
      const early = await createExpense(tx, { paymentDate: "2026-01-05" });
      const middle = await createExpense(tx, { paymentDate: "2026-01-20" });
      const late = await createExpense(tx, { paymentDate: "2026-03-01" });
      const ranged = await filterWith({ paymentDateFrom: "2026-01-01", paymentDateTo: "2026-02-01" })(tx);
      expectIds(ranged, [early.id, middle.id]);
      const fromOnly = await filterWith({ paymentDateFrom: "2026-01-10" })(tx);
      expectIds(fromOnly, [middle.id, late.id]);
      const toOnly = await filterWith({ paymentDateTo: "2026-01-19" })(tx);
      expectIds(toOnly, [early.id]);
    });
  });

  test("hides soft-deleted rows by default and shows them with includeDeleted", async () => {
    await runInRollback(async tx => {
      const alive = await createExpense(tx, { title: "Alive row" });
      const deleted = await createExpense(tx, { title: "Deleted row" });
      await ExpenseRepository.softDelete(deleted.id, deleted.userId, "cleanup", tx);

      const def = await filterWith({ title: "row" })(tx);
      expectIds(def, [alive.id]);
      const all = await filterWith({ title: "row", includeDeleted: true })(tx);
      expectIds(all, [alive.id, deleted.id]);
      const deletedRow = all.find(row => row.id === deleted.id);
      expect(deletedRow?.deletedAt).toBeInstanceOf(Date);
    });
  });

  test("paginates with limit/offset while totalCount covers the filtered set", async () => {
    await runInRollback(async tx => {
      const ids: string[] = [];
      await ["a", "b", "c", "d", "e"].reduce<Promise<unknown>>(
        (chain, suffix, index) =>
          chain.then(async () => {
            const row = await createExpense(tx, {
              title: `Paged ${suffix}`,
              createdAt: new Date(2026, 0, 1, 12, index),
            });
            ids.push(row.id);
            return row.id;
          }),
        Promise.resolve()
      );
      const firstPage = await ExpenseRepository.findFiltered({ title: "Paged" }, { limit: 2, offset: 0 }, tx);
      const secondPage = await ExpenseRepository.findFiltered({ title: "Paged" }, { limit: 2, offset: 2 }, tx);
      const thirdPage = await ExpenseRepository.findFiltered({ title: "Paged" }, { limit: 2, offset: 4 }, tx);
      expect(firstPage.totalCount).toBe(5);
      expect(secondPage.totalCount).toBe(5);
      expect(thirdPage.totalCount).toBe(5);
      expect(firstPage.rows).toHaveLength(2);
      expect(secondPage.rows).toHaveLength(2);
      expect(thirdPage.rows).toHaveLength(1);
      // Newest first: explicit createdAt ladder means page 1 holds e and d.
      expect(firstPage.rows.map(row => row.id)).toEqual([ids[4], ids[3]]);
      expect(secondPage.rows.map(row => row.id)).toEqual([ids[2], ids[1]]);
      expect(thirdPage.rows.map(row => row.id)).toEqual([ids[0]]);
    });
  });

  test("supports the report aggregates over the filtered rows", async () => {
    await runInRollback(async tx => {
      const base = { expenseDate: "2026-04" };
      await createExpense(tx, { ...base, title: "Agg A", type: ExpenseType.MARKETING, expenseValue: "100.00" });
      await createExpense(tx, { ...base, title: "Agg B", type: ExpenseType.TECHNOLOGY, expenseValue: "50.00" });
      await createExpense(tx, {
        title: "Agg other month",
        expenseDate: "2026-03",
        expenseValue: "999.00",
        expenseCurrency: CurrencyCode.USD,
      });

      const page = await ExpenseRepository.findFiltered({ title: "Agg", expenseDate: "2026-04" }, PAGE, tx);
      expect(page.totalCount).toBe(2);
      const totalValue = page.rows.reduce((sum, row) => sum + Number(row.expenseValue), 0).toFixed(2);
      expect(totalValue).toBe("150.00");
      const rowCountByType = page.rows.reduce<Record<string, number>>((counts, row) => {
        counts[row.type] = (counts[row.type] ?? 0) + 1;
        return counts;
      }, {});
      expect(rowCountByType[ExpenseType.MARKETING]).toBe(1);
      expect(rowCountByType[ExpenseType.TECHNOLOGY]).toBe(1);
      const currencyCounts = page.rows.reduce<Map<string, number>>((counts, row) => {
        counts.set(row.expenseCurrency, (counts.get(row.expenseCurrency) ?? 0) + 1);
        return counts;
      }, new Map());
      const dominant = [...currencyCounts.entries()].toSorted((a, b) => b[1] - a[1])[0]?.[0];
      expect(dominant).toBe(CurrencyCode.SAR);
    });
  });
});
