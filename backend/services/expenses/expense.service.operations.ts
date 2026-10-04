/**
 * Expense service transaction-scoped operations: insert, update patch
 * building, teacher-link validation, salaries immutability, and the shared
 * soft-delete core.
 *
 * Extracted from `expense.service.ts`; `ExpenseService` composes these inside
 * its exported methods.
 */
import { CarryoverBalanceRepository, ExpenseRepository, TeacherRepository } from "@/backend/db/repo";
import { acquireAdvisoryLock } from "@/backend/db/repo/shared";
import { ExpenseType } from "@/backend/enum";
import { DomainError, logger, NotFoundError, sanitizePlainText } from "@/backend/lib";
import {
  EXPENSE_ACTION_DELETE,
  EXPENSE_AUDIT_ENTITY_TYPE,
  emitExpenseAuditLog,
  resolveTeacherName,
  toExpenseRowWithCreator,
} from "@/backend/services/expenses/expense.service.parts";
import {
  canonicalizeExpenseValue,
  EXPENSE_DELETE_REASON_MAX_LENGTH,
  EXPENSE_NOTE_MAX_LENGTH,
  EXPENSE_TEACHER_NAME_MAX_LENGTH,
  EXPENSE_TITLE_MAX_LENGTH,
} from "@/backend/services/expenses/expense-helpers";
import { deriveCreateIdempotencyKey } from "@/backend/services/expenses/expense-idempotency";
import type {
  CarryoverBalanceSelectType,
  CreateExpenseInput,
  DBTransaction,
  ExpenseInsertType,
  ExpenseRow,
  ExpenseSelectType,
  ExpenseUpdatePatch,
  SoftDeleteExpenseInput,
  UpdateExpenseInput,
} from "@/backend/types";
import { EXPENSE_SOURCE_CARRYOVER_BALANCES } from "@/shared/constants/expenses/expense-source.constants";
import type { ErrorsLabels } from "@/shared/locale";

/**
 * Key-scoped advisory lock serializing same-key submissions: two concurrent
 * creates carrying the same `clientRequestId` run back-to-back, so the
 * loser's replay scan sees the winner's audit row and returns the originally
 * persisted expense. Only the transaction-owning entry point acquires it —
 * `createInternal` never takes locks inside a caller's transaction (the
 * carryover settlement flow already holds its batch lock upstream).
 */
export async function acquireCreateReplayLock(tx: DBTransaction, input: CreateExpenseInput): Promise<void> {
  if (input.clientRequestId == null) return;
  await acquireAdvisoryLock(tx, `expense-create:${deriveCreateIdempotencyKey(input)}`);
}

/** Persists the sanitized expense row; a driver-level insert failure surfaces as a logged domain error. */
export async function insertExpense(
  tx: DBTransaction,
  input: CreateExpenseInput,
  tErrors: ErrorsLabels
): Promise<ExpenseSelectType> {
  const teacherName = await resolveTeacherName(input, tx, tErrors);
  const sanitized: ExpenseInsertType = {
    teacherId: input.teacherId ?? null,
    teacherName,
    title: sanitizePlainText(input.title, EXPENSE_TITLE_MAX_LENGTH),
    type: input.type,
    expenseValue: canonicalizeExpenseValue(input.expenseValue),
    expenseCurrency: input.expenseCurrency,
    paymentDate: input.paymentDate,
    expenseDate: input.expenseDate,
    note: input.note == null ? null : sanitizePlainText(input.note, EXPENSE_NOTE_MAX_LENGTH),
    sourceEntity: input.sourceEntity ?? null,
    sourceEntityId: input.sourceEntityId ?? null,
    createdByUserId: input.createdByUserId,
  };
  try {
    return await ExpenseRepository.create(sanitized, tx);
  } catch (error) {
    logger.error("Expense insert failed", {
      actorUserId: input.createdByUserId,
      type: input.type,
      error: error instanceof Error ? error.message : String(error),
    });
    throw new DomainError("EXPENSE_CREATE_FAILED", tErrors.expenses.createFailed, { cause: error });
  }
}

/**
 * A patch that links a teacher writes the FK, so the target must resolve —
 * otherwise the update fails with a raw driver error instead of the localized
 * not-found contract the create path uses.
 */
export async function assertTeacherLinkResolves(
  input: UpdateExpenseInput,
  tx: DBTransaction,
  tErrors: ErrorsLabels
): Promise<void> {
  if (input.teacherId == null) return;
  const teacher = await TeacherRepository.findById(input.teacherId, tx);
  if (teacher == null) {
    throw new NotFoundError("TEACHER", tErrors.teacher.teacherNotFound(input.teacherId));
  }
}

/**
 * `Salaries` rows are produced exclusively by the carryover settlement flow:
 * the type is immutable on an existing salary row, and a non-salary row must
 * never be re-typed INTO `Salaries` (that would mint a provenance-less salary
 * entry no settlement flow produced). Settled values are immutable too —
 * compared in the canonical two-decimal form the write path stores.
 */
export function assertSalariesImmutability(
  existing: ExpenseSelectType,
  input: UpdateExpenseInput,
  tErrors: ErrorsLabels
): void {
  if (input.type === ExpenseType.SALARIES && existing.type !== ExpenseType.SALARIES) {
    throw new DomainError("EXPENSE_SALARIES_VIA_CARRYOVER_ONLY", tErrors.expenses.salariesViaCarryoverOnly);
  }
  if (existing.type !== ExpenseType.SALARIES) return;
  if (input.type != null && input.type !== existing.type) {
    throw new DomainError("EXPENSE_TYPE_IMMUTABLE_FOR_SALARIES", tErrors.expenses.typeImmutableForSalaries);
  }
  if (input.expenseValue != null && canonicalizeExpenseValue(input.expenseValue) !== existing.expenseValue) {
    throw new DomainError("EXPENSE_VALUE_IMMUTABLE_FOR_SALARIES", tErrors.expenses.valueImmutableForSalaries);
  }
}

export function buildUpdatePatch(input: UpdateExpenseInput): ExpenseUpdatePatch {
  const patch: ExpenseUpdatePatch = {};
  if (input.title != null) patch.title = sanitizePlainText(input.title, EXPENSE_TITLE_MAX_LENGTH);
  if (input.type != null) patch.type = input.type;
  if (input.expenseValue != null) patch.expenseValue = canonicalizeExpenseValue(input.expenseValue);
  if (input.expenseCurrency != null) patch.expenseCurrency = input.expenseCurrency;
  if (input.paymentDate != null) patch.paymentDate = input.paymentDate;
  if (input.expenseDate != null) patch.expenseDate = input.expenseDate;
  if (input.note !== undefined) {
    patch.note = input.note == null ? null : sanitizePlainText(input.note, EXPENSE_NOTE_MAX_LENGTH);
  }
  if (input.teacherId !== undefined) patch.teacherId = input.teacherId;
  if (input.teacherName !== undefined) {
    patch.teacherName =
      input.teacherName == null ? null : sanitizePlainText(input.teacherName, EXPENSE_TEACHER_NAME_MAX_LENGTH);
  }
  return patch;
}

/**
 * Locks the carryover that produced the expense (when provenance points at
 * one) and returns it for the paid-state guard. The lock is what keeps a
 * concurrent unpay from racing the settlement-protection decision.
 */
async function lockLinkedCarryover(
  sourceEntity: string | null,
  sourceEntityId: string | null,
  tx: DBTransaction
): Promise<CarryoverBalanceSelectType | null> {
  if (sourceEntity !== EXPENSE_SOURCE_CARRYOVER_BALANCES || sourceEntityId == null) return null;
  const [carryover] = await CarryoverBalanceRepository.getByIdsForUpdate([sourceEntityId], tx);
  return carryover ?? null;
}

type SoftDeleteOutcome = {
  row: ExpenseRow;
  auditLogId: string | null;
};

/**
 * Shared soft-delete core. Re-running it on an already-deleted expense is a
 * successful no-op that returns the current row (idempotent retry), so both
 * the UI delete and the settlement unpay can safely re-apply.
 *
 * Lock order is canonical across the module: the linked carryover row is
 * locked BEFORE the expense row, matching the settlement unpay path (which
 * locks the carryover, unpays it, then soft-deletes its settled expense), so
 * a concurrent UI delete and unpay serialize instead of deadlocking.
 * Provenance columns are written once at insert and never patched, so a
 * non-locking pre-read safely supplies them; the state-dependent checks
 * (existence, `deletedAt`) re-read the locked expense row.
 */
export async function softDeleteInTx(
  tx: DBTransaction,
  input: SoftDeleteExpenseInput,
  tErrors: ErrorsLabels
): Promise<SoftDeleteOutcome> {
  const preview = await ExpenseRepository.getById(input.id, tx);
  if (preview == null) {
    throw new DomainError("EXPENSE_NOT_FOUND", tErrors.expenses.notFound);
  }
  const linkedCarryover = await lockLinkedCarryover(preview.sourceEntity, preview.sourceEntityId, tx);

  const existing = await ExpenseRepository.getByIdForUpdate(input.id, tx);
  if (existing == null) {
    throw new DomainError("EXPENSE_NOT_FOUND", tErrors.expenses.notFound);
  }
  if (existing.deletedAt != null) {
    return { row: await toExpenseRowWithCreator(existing, tx, tErrors), auditLogId: null };
  }
  if (linkedCarryover?.isPaid) {
    throw new DomainError("EXPENSE_DELETE_VIA_UNPAY", tErrors.expenses.deleteViaUnpay);
  }

  const reason = input.reason == null ? null : sanitizePlainText(input.reason, EXPENSE_DELETE_REASON_MAX_LENGTH);
  const updated = await ExpenseRepository.softDelete(input.id, input.actorUserId, reason, tx);
  if (updated == null) {
    throw new DomainError("EXPENSE_NOT_FOUND", tErrors.expenses.notFound);
  }

  const auditLogId = await emitExpenseAuditLog(tx, {
    actorUserId: input.actorUserId,
    actorType: "USER",
    entityType: EXPENSE_AUDIT_ENTITY_TYPE,
    entityId: input.id,
    action: EXPENSE_ACTION_DELETE,
    metadata: { reason },
  });

  logger.info("Expense soft-deleted", { actorUserId: input.actorUserId, expenseId: input.id, reason });
  return { row: await toExpenseRowWithCreator(updated, tx, tErrors), auditLogId };
}
