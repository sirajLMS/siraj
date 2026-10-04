/**
 * ExpenseService — permission-gated expense ledger writes + reads.
 *
 * Row mapping, audit emission, and idempotency replay live in
 * `expense.service.parts.ts`; transaction-scoped operations live in
 * `expense.service.operations.ts`. This module keeps the public
 * `ExpenseService` surface unchanged.
 */
import { db } from "@/backend/db";
import { ExpenseRepository } from "@/backend/db/repo";
import { AppPermission, ExpenseType } from "@/backend/enum";
import { DomainError, logger } from "@/backend/lib";
import { requirePermission } from "@/backend/services/billing/permission-utils";
import {
  acquireCreateReplayLock,
  assertSalariesImmutability,
  assertTeacherLinkResolves,
  buildUpdatePatch,
  insertExpense,
  softDeleteInTx,
} from "@/backend/services/expenses/expense.service.operations";
import {
  EXPENSE_ACTION_CREATE,
  EXPENSE_ACTION_UPDATE,
  EXPENSE_AUDIT_ENTITY_TYPE,
  emitExpenseAuditLog,
  findReplayExpense,
  toExpenseRow,
  toExpenseRowWithCreator,
} from "@/backend/services/expenses/expense.service.parts";
import {
  assertExpenseIdShape,
  countExpensesByType,
  pickChanged,
  pickDominantExpenseCurrency,
  sumExpenseValues,
  validateCreateInput,
  validateUpdateInput,
} from "@/backend/services/expenses/expense-helpers";
import { deriveCreateIdempotencyKey } from "@/backend/services/expenses/expense-idempotency";
import type {
  BulkDeleteExpensesInput,
  BulkDeleteExpensesResult,
  CreateExpenseInput,
  DBTransaction,
  ExpenseFilters,
  ExpensePage,
  ExpenseRow,
  SoftDeleteExpenseInput,
  UpdateExpenseInput,
} from "@/backend/types";
import type { ErrorsLabels } from "@/shared/locale";

export namespace ExpenseService {
  /**
   * Manual (UI) expense creation. The acting user must hold
   * ACCOUNTING_EXPENSES_MANAGE; `Salaries` rows are rejected here — only the
   * carryover settlement flow may write them (`createInternal`). The creator
   * attribution is always the acting user, never a client-supplied id.
   *
   * A submission carrying a `clientRequestId` takes a key-scoped advisory lock
   * before the idempotency replay scan (lock-then-replay ordering), so two
   * concurrent identical submissions serialize onto the first write instead of
   * both inserting.
   */
  export async function create(
    input: CreateExpenseInput,
    actorUserId: string,
    tErrors: ErrorsLabels
  ): Promise<ExpenseRow> {
    await requirePermission(actorUserId, AppPermission.ACCOUNTING_EXPENSES_MANAGE, tErrors);
    if (input.type === ExpenseType.SALARIES) {
      throw new DomainError("EXPENSE_SALARIES_VIA_CARRYOVER_ONLY", tErrors.expenses.salariesViaCarryoverOnly);
    }
    const scopedInput: CreateExpenseInput = { ...input, createdByUserId: actorUserId };
    validateCreateInput(scopedInput, tErrors);
    return db.transaction(async tx => {
      await acquireCreateReplayLock(tx, scopedInput);
      return createInternal(scopedInput, tx, tErrors);
    });
  }

  /**
   * Internal creation entry point: skips the permission check (the caller owns
   * it) and writes inside the caller's transaction so settlement flows stay
   * atomic. Called by the carryover settlement flow with its own tx, and by
   * `create` after its permission check with a fresh tx.
   *
   * A re-submission carrying the same `clientRequestId` (and identical payload)
   * inside the replay window returns the originally persisted row. The caller
   * owns key-scoped serialization: `create` acquires the advisory lock itself;
   * the settlement flow is serialized by its own batch lock upstream, so this
   * callee deliberately takes no advisory locks inside a caller transaction.
   */
  export async function createInternal(
    input: CreateExpenseInput,
    tx: DBTransaction,
    tErrors: ErrorsLabels
  ): Promise<ExpenseRow> {
    validateCreateInput(input, tErrors);

    const idempotencyKey = input.clientRequestId == null ? null : deriveCreateIdempotencyKey(input);
    if (idempotencyKey != null) {
      const replayed = await findReplayExpense(tx, input, idempotencyKey, tErrors);
      if (replayed != null) return replayed;
    }

    const row = await insertExpense(tx, input, tErrors);

    await emitExpenseAuditLog(tx, {
      actorUserId: input.createdByUserId,
      actorType: "USER",
      entityType: EXPENSE_AUDIT_ENTITY_TYPE,
      entityId: row.id,
      action: EXPENSE_ACTION_CREATE,
      metadata: {
        idempotencyKey,
        type: row.type,
        value: row.expenseValue,
        currency: row.expenseCurrency,
        sourceEntity: row.sourceEntity,
        sourceEntityId: row.sourceEntityId,
      },
    });

    logger.info("Expense created", {
      actorUserId: input.createdByUserId,
      expenseId: row.id,
      type: row.type,
      value: row.expenseValue,
      currency: row.expenseCurrency,
      sourceEntity: row.sourceEntity,
    });
    return toExpenseRowWithCreator(row, tx, tErrors);
  }

  /**
   * Applies a partial patch to an existing expense under a row lock. A soft-
   * deleted expense is read-only; `Salaries` rows reject type and value
   * changes. Emits one audit row carrying the pre-edit values of the fields
   * that actually changed alongside the applied patch.
   */
  export async function update(input: UpdateExpenseInput, tErrors: ErrorsLabels): Promise<ExpenseRow> {
    await requirePermission(input.actorUserId, AppPermission.ACCOUNTING_EXPENSES_MANAGE, tErrors);
    assertExpenseIdShape(input.id, tErrors);
    validateUpdateInput(input, tErrors);

    return db.transaction(async tx => {
      const existing = await ExpenseRepository.getByIdForUpdate(input.id, tx);
      if (existing == null) {
        throw new DomainError("EXPENSE_NOT_FOUND", tErrors.expenses.notFound);
      }
      if (existing.deletedAt != null) {
        throw new DomainError("EXPENSE_ALREADY_DELETED", tErrors.expenses.alreadyDeleted);
      }
      assertSalariesImmutability(existing, input, tErrors);
      await assertTeacherLinkResolves(input, tx, tErrors);

      const patch = buildUpdatePatch(input);
      const updated = await ExpenseRepository.update(input.id, patch, tx);
      if (updated == null) {
        throw new DomainError("EXPENSE_NOT_FOUND", tErrors.expenses.notFound);
      }

      await emitExpenseAuditLog(tx, {
        actorUserId: input.actorUserId,
        actorType: "USER",
        entityType: EXPENSE_AUDIT_ENTITY_TYPE,
        entityId: input.id,
        action: EXPENSE_ACTION_UPDATE,
        metadata: {
          previousValues: pickChanged(existing, patch),
          newValues: patch,
        },
      });

      logger.info("Expense updated", { actorUserId: input.actorUserId, expenseId: input.id });
      return toExpenseRowWithCreator(updated, tx, tErrors);
    });
  }

  /**
   * Soft-deletes one expense. When the caller passes its own transaction, the
   * write joins it (the settlement unpay path) and the permission check is
   * skipped — the caller owns it; otherwise a fresh transaction is opened and
   * the acting user must hold ACCOUNTING_EXPENSES_MANAGE.
   */
  export async function softDelete(input: SoftDeleteExpenseInput, tErrors: ErrorsLabels): Promise<ExpenseRow> {
    assertExpenseIdShape(input.id, tErrors);
    if (input.tx != null) {
      const outcome = await softDeleteInTx(input.tx, input, tErrors);
      return outcome.row;
    }
    await requirePermission(input.actorUserId, AppPermission.ACCOUNTING_EXPENSES_MANAGE, tErrors);
    return db.transaction(async tx => {
      const outcome = await softDeleteInTx(tx, input, tErrors);
      return outcome.row;
    });
  }

  /**
   * Atomically soft-deletes a batch of expenses in one transaction: each id is
   * applied in sequence through the shared soft-delete core, and any rejection
   * (missing row, settlement-protected row) rolls the whole batch back.
   */
  export async function bulkDelete(
    input: BulkDeleteExpensesInput,
    tErrors: ErrorsLabels
  ): Promise<BulkDeleteExpensesResult> {
    await requirePermission(input.actorUserId, AppPermission.ACCOUNTING_EXPENSES_MANAGE, tErrors);
    const ids = [...new Set(input.ids)];
    for (const id of ids) {
      assertExpenseIdShape(id, tErrors);
    }

    return db.transaction(async tx => {
      const outcome = await ids.reduce<Promise<BulkDeleteExpensesResult>>(
        async (previous, id) => {
          const acc = await previous;
          const deleted = await softDeleteInTx(
            tx,
            { id, actorUserId: input.actorUserId, reason: input.reason },
            tErrors
          );
          acc.deleted.push(deleted.row.id);
          if (deleted.auditLogId != null) acc.auditLogIds.push(deleted.auditLogId);
          return acc;
        },
        Promise.resolve({ deleted: [], auditLogIds: [] })
      );
      logger.info("Expenses bulk-soft-deleted", {
        actorUserId: input.actorUserId,
        requested: ids.length,
        deleted: outcome.deleted.length,
      });
      return outcome;
    });
  }

  /**
   * Single-expense read for the drill-down view. Requires
   * ACCOUNTING_EXPENSES_VIEW; soft-deleted rows remain readable so the audit
   * timeline can explain the correction.
   */
  export async function getById(actorUserId: string, id: string, tErrors: ErrorsLabels): Promise<ExpenseRow> {
    await requirePermission(actorUserId, AppPermission.ACCOUNTING_EXPENSES_VIEW, tErrors);
    assertExpenseIdShape(id, tErrors);
    const row = await ExpenseRepository.getById(id);
    if (row == null) {
      throw new DomainError("EXPENSE_NOT_FOUND", tErrors.expenses.notFound);
    }
    return toExpenseRowWithCreator(row, undefined, tErrors);
  }

  /**
   * Paginated, filtered ledger read with page-derived aggregates: the summed
   * value (exact minor-unit math), the page's dominant currency, and row
   * counts per type. Aggregates describe the returned page, while `totalCount`
   * covers the whole filtered set for pagination controls.
   */
  export async function getReport(
    actorUserId: string,
    filters: ExpenseFilters,
    pagination: { limit: number; offset: number },
    tErrors: ErrorsLabels
  ): Promise<ExpensePage> {
    await requirePermission(actorUserId, AppPermission.ACCOUNTING_EXPENSES_VIEW, tErrors);
    const { rows, totalCount } = await ExpenseRepository.findFiltered(filters, pagination);
    return {
      rows: rows.map(row => toExpenseRow(row, row.createdByName)),
      totalCount,
      aggregates: {
        totalValue: sumExpenseValues(rows),
        dominantCurrency: pickDominantExpenseCurrency(rows),
        rowCountByType: countExpensesByType(rows),
      },
    };
  }
}
