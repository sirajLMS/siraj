import { db } from "@/backend/db";
import {
  AuditRepository,
  CarryoverBalanceRepository,
  ExpenseRepository,
  TeacherRepository,
  UserRepository,
} from "@/backend/db/repo";
import { AppPermission, ExpenseType } from "@/backend/enum";
import { DomainError, logger, NotFoundError, sanitizePlainText } from "@/backend/lib";
import { requirePermission } from "@/backend/services/billing/permission-utils";
import {
  assertExpenseIdShape,
  countExpensesByType,
  EXPENSE_DELETE_REASON_MAX_LENGTH,
  EXPENSE_NOTE_MAX_LENGTH,
  EXPENSE_TEACHER_NAME_MAX_LENGTH,
  EXPENSE_TITLE_MAX_LENGTH,
  pickChanged,
  pickDominantExpenseCurrency,
  sumExpenseValues,
  validateCreateInput,
  validateUpdateInput,
} from "@/backend/services/expenses/expense-helpers";
import { deriveCreateIdempotencyKey } from "@/backend/services/expenses/expense-idempotency";
import { AuditService } from "@/backend/services/system/audit.service";
import type {
  AuditLogReturnType,
  BulkDeleteExpensesInput,
  BulkDeleteExpensesResult,
  CreateAuditLogInput,
  CreateExpenseInput,
  DBTransaction,
  ExpenseFilters,
  ExpenseInsertType,
  ExpensePage,
  ExpenseRow,
  ExpenseSelectType,
  ExpenseUpdatePatch,
  SoftDeleteExpenseInput,
  UpdateExpenseInput,
} from "@/backend/types";
import type { ErrorsLabels } from "@/shared/locale";

/** Duplicate submissions inside this window collapse onto the first-applied result. */
const IDEMPOTENCY_WINDOW_SECONDS = 60;

/** Replay lookups page through the audit window in chunks of this size. */
const REPLAY_LOOKUP_PAGE_SIZE = 500;

/** Defensive bound on replay-scan pages; the window holds far fewer rows in practice. */
const REPLAY_LOOKUP_MAX_PAGES = 10;

/** Provenance marker written by the carryover settlement flow. */
export const EXPENSE_SOURCE_CARRYOVER_BALANCES = "carryover_balances";

const EXPENSE_AUDIT_ENTITY_TYPE = "EXPENSE";
const EXPENSE_ACTION_CREATE = "EXPENSE_CREATE";
const EXPENSE_ACTION_UPDATE = "EXPENSE_UPDATE";
const EXPENSE_ACTION_DELETE = "EXPENSE_DELETE";

// ---------------------------------------------------------------------------
// Row mapping + display-name resolution
// ---------------------------------------------------------------------------

function toExpenseRow(row: ExpenseSelectType, createdByName: string): ExpenseRow {
  return {
    id: row.id,
    teacherId: row.teacherId,
    teacherName: row.teacherName,
    title: row.title,
    type: row.type,
    expenseValue: row.expenseValue,
    expenseCurrency: row.expenseCurrency,
    paymentDate: row.paymentDate,
    expenseDate: row.expenseDate,
    note: row.note,
    sourceEntity: row.sourceEntity,
    sourceEntityId: row.sourceEntityId,
    createdByUserId: row.createdByUserId,
    createdByName,
    deletedAt: row.deletedAt?.toISOString() ?? null,
    deletedByUserId: row.deletedByUserId,
    deletedReason: row.deletedReason,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

/** Creator display name; missing user rows fall back rather than failing the write. */
async function resolveCreatorName(
  userId: string,
  tx: DBTransaction | undefined,
  tErrors: ErrorsLabels
): Promise<string> {
  const usersById = await UserRepository.findByIds([userId], tx);
  return usersById.get(userId)?.name ?? tErrors.unknownName;
}

async function toExpenseRowWithCreator(
  row: ExpenseSelectType,
  tx: DBTransaction | undefined,
  tErrors: ErrorsLabels
): Promise<ExpenseRow> {
  return toExpenseRow(row, await resolveCreatorName(row.createdByUserId, tx, tErrors));
}

/**
 * Teacher display-name snapshot for the expense row. An explicit caller
 * snapshot (settlement flows pass one) wins; otherwise the name is resolved
 * from the teacher's user account. A dangling teacher reference is rejected —
 * persisting a bogus FK would surface as a raw driver error otherwise.
 */
async function resolveTeacherName(
  input: CreateExpenseInput,
  tx: DBTransaction,
  tErrors: ErrorsLabels
): Promise<string | null> {
  if (input.teacherName != null) {
    return sanitizePlainText(input.teacherName, EXPENSE_TEACHER_NAME_MAX_LENGTH);
  }
  if (input.teacherId == null) return null;
  const teacher = await TeacherRepository.findById(input.teacherId, tx);
  if (teacher == null) {
    throw new NotFoundError("TEACHER", tErrors.teacher.teacherNotFound(input.teacherId));
  }
  const usersById = await UserRepository.findByIds([teacher.userId], tx);
  return usersById.get(teacher.userId)?.name ?? tErrors.unknownName;
}

// ---------------------------------------------------------------------------
// Audit rows + idempotency replay lookup
// ---------------------------------------------------------------------------

async function emitExpenseAuditLog(tx: DBTransaction, input: CreateAuditLogInput): Promise<string | null> {
  const inserted = await AuditService.createManyAuditLogs([input], tx);
  return inserted[0]?.id ?? null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readMetadataKey(metadata: unknown): string | null {
  if (!isRecord(metadata)) return null;
  const key = metadata.idempotencyKey;
  return typeof key === "string" ? key : null;
}

/**
 * Pages the actor's EXPENSE_CREATE audit window (oldest page bound by the
 * idempotency window), collecting rows whose metadata hash matches the replay
 * key. Recursion keeps the sequential reads lint-clean.
 */
async function collectReplayMatches(
  tx: DBTransaction,
  actorUserId: string,
  idempotencyKey: string,
  windowStart: Date,
  matches: AuditLogReturnType[],
  offset: number,
  page: number
): Promise<void> {
  if (page >= REPLAY_LOOKUP_MAX_PAGES) return;
  const result = await AuditRepository.queryAuditLogs(
    {
      actorUserId,
      action: EXPENSE_ACTION_CREATE,
      startDate: windowStart,
      limit: REPLAY_LOOKUP_PAGE_SIZE,
      offset,
    },
    tx
  );
  for (const log of result.logs) {
    if (readMetadataKey(log.metadata) === idempotencyKey) matches.push(log);
  }
  if (!result.hasMore) return;
  await collectReplayMatches(
    tx,
    actorUserId,
    idempotencyKey,
    windowStart,
    matches,
    offset + result.logs.length,
    page + 1
  );
}

/** Newest match first, with the id tiebreak keeping equal timestamps deterministic. */
function compareReplayLogs(a: AuditLogReturnType, b: AuditLogReturnType): number {
  const byTime = b.createdAt.getTime() - a.createdAt.getTime();
  if (byTime !== 0) return byTime;
  if (a.id === b.id) return 0;
  return a.id < b.id ? 1 : -1;
}

/**
 * Reconstructs the original create result on a replay: re-reads the live
 * expense row by the audit row's entity id so the caller gets current state,
 * never a stale snapshot. A missing audit row (window scrolled past) or a
 * missing expense row falls through to normal processing.
 */
async function findReplayExpense(
  tx: DBTransaction,
  input: CreateExpenseInput,
  idempotencyKey: string,
  tErrors: ErrorsLabels
): Promise<ExpenseRow | null> {
  const windowStart = new Date(Date.now() - IDEMPOTENCY_WINDOW_SECONDS * 1000);
  const matches: AuditLogReturnType[] = [];
  await collectReplayMatches(tx, input.createdByUserId, idempotencyKey, windowStart, matches, 0, 0);
  const replayLog = matches.toSorted(compareReplayLogs)[0];
  if (replayLog == null) return null;
  const existing = await ExpenseRepository.getById(replayLog.entityId, tx);
  if (existing == null) return null;
  logger.info("Expense create replayed from idempotency key", {
    actorUserId: input.createdByUserId,
    expenseId: existing.id,
  });
  return toExpenseRowWithCreator(existing, tx, tErrors);
}

export namespace ExpenseService {
  /**
   * Manual (UI) expense creation. The acting user must hold
   * ACCOUNTING_EXPENSES_MANAGE; `Salaries` rows are rejected here — only the
   * carryover settlement flow may write them (`createInternal`). The creator
   * attribution is always the acting user, never a client-supplied id.
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
    return db.transaction(async tx => createInternal({ ...input, createdByUserId: actorUserId }, tx, tErrors));
  }

  /**
   * Internal creation entry point: skips the permission check (the caller owns
   * it) and writes inside the caller's transaction so settlement flows stay
   * atomic. Called by the carryover settlement flow with its own tx, and by
   * `create` after its permission check with a fresh tx.
   *
   * A re-submission carrying the same `clientRequestId` (and identical payload)
   * inside the replay window returns the originally persisted row.
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

  /** Persists the sanitized expense row; a driver-level insert failure surfaces as a logged domain error. */
  async function insertExpense(
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
      expenseValue: input.expenseValue.trim(),
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

  /** Salary rows keep their settled type and value; corrections go through unpay + re-settle. */
  function assertSalariesImmutability(
    existing: ExpenseSelectType,
    input: UpdateExpenseInput,
    tErrors: ErrorsLabels
  ): void {
    if (existing.type !== ExpenseType.SALARIES) return;
    if (input.type != null && input.type !== existing.type) {
      throw new DomainError("EXPENSE_TYPE_IMMUTABLE_FOR_SALARIES", tErrors.expenses.typeImmutableForSalaries);
    }
    if (input.expenseValue != null && input.expenseValue.trim() !== existing.expenseValue) {
      throw new DomainError("EXPENSE_VALUE_IMMUTABLE_FOR_SALARIES", tErrors.expenses.valueImmutableForSalaries);
    }
  }

  function buildUpdatePatch(input: UpdateExpenseInput): ExpenseUpdatePatch {
    const patch: ExpenseUpdatePatch = {};
    if (input.title != null) patch.title = sanitizePlainText(input.title, EXPENSE_TITLE_MAX_LENGTH);
    if (input.type != null) patch.type = input.type;
    if (input.expenseValue != null) patch.expenseValue = input.expenseValue.trim();
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
   * A `Salaries` expense linked to a carryover that is still marked paid is
   * protected: removing it must go through the carryover unpay flow so the
   * linked sessions revert too. The carryover row is locked while the guard
   * reads its paid flag so a concurrent unpay cannot race the decision.
   */
  async function assertNotSettlementProtected(
    existing: ExpenseSelectType,
    tx: DBTransaction,
    tErrors: ErrorsLabels
  ): Promise<void> {
    if (existing.sourceEntity !== EXPENSE_SOURCE_CARRYOVER_BALANCES || existing.sourceEntityId == null) return;
    const [carryover] = await CarryoverBalanceRepository.getByIdsForUpdate([existing.sourceEntityId], tx);
    if (carryover?.isPaid) {
      throw new DomainError("EXPENSE_DELETE_VIA_UNPAY", tErrors.expenses.deleteViaUnpay);
    }
  }

  interface SoftDeleteOutcome {
    row: ExpenseRow;
    auditLogId: string | null;
  }

  /**
   * Shared soft-delete core. Re-running it on an already-deleted expense is a
   * successful no-op that returns the current row (idempotent retry), so both
   * the UI delete and the settlement unpay can safely re-apply.
   */
  async function softDeleteInTx(
    tx: DBTransaction,
    input: SoftDeleteExpenseInput,
    tErrors: ErrorsLabels
  ): Promise<SoftDeleteOutcome> {
    const existing = await ExpenseRepository.getByIdForUpdate(input.id, tx);
    if (existing == null) {
      throw new DomainError("EXPENSE_NOT_FOUND", tErrors.expenses.notFound);
    }
    if (existing.deletedAt != null) {
      return { row: await toExpenseRowWithCreator(existing, tx, tErrors), auditLogId: null };
    }
    await assertNotSettlementProtected(existing, tx, tErrors);

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
