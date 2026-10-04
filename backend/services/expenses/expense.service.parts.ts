/**
 * Expense service row mapping, audit emission, and idempotency replay.
 *
 * Extracted from `expense.service.ts` to keep the service module within the
 * file-size limit. `ExpenseService` and `expense.service.operations.ts` import
 * these helpers; nothing here is part of the public module surface.
 */
import { AuditRepository, ExpenseRepository, TeacherRepository, UserRepository } from "@/backend/db/repo";
import { logger, NotFoundError, sanitizePlainText } from "@/backend/lib";
import { EXPENSE_TEACHER_NAME_MAX_LENGTH } from "@/backend/services/expenses/expense-helpers";
import { readAuditMetadataKey } from "@/backend/services/shared";
import { AuditService } from "@/backend/services/system/audit.service";
import type {
  AuditLogReturnType,
  CreateAuditLogInput,
  CreateExpenseInput,
  DBTransaction,
  ExpenseRow,
  ExpenseSelectType,
} from "@/backend/types";
import type { ErrorsLabels } from "@/shared/locale";

/** Duplicate submissions inside this window collapse onto the first-applied result. */
const IDEMPOTENCY_WINDOW_SECONDS = 60;

/** Replay lookups page through the audit window in chunks of this size. */
const REPLAY_LOOKUP_PAGE_SIZE = 500;

/** Defensive bound on replay-scan pages; the window holds far fewer rows in practice. */
const REPLAY_LOOKUP_MAX_PAGES = 10;

export const EXPENSE_AUDIT_ENTITY_TYPE = "EXPENSE";
export const EXPENSE_ACTION_CREATE = "EXPENSE_CREATE";
export const EXPENSE_ACTION_UPDATE = "EXPENSE_UPDATE";
export const EXPENSE_ACTION_DELETE = "EXPENSE_DELETE";

export function toExpenseRow(row: ExpenseSelectType, createdByName: string): ExpenseRow {
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

export async function toExpenseRowWithCreator(
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
export async function resolveTeacherName(
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

export async function emitExpenseAuditLog(tx: DBTransaction, input: CreateAuditLogInput): Promise<string | null> {
  const inserted = await AuditService.createManyAuditLogs([input], tx);
  return inserted[0]?.id ?? null;
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
    if (readAuditMetadataKey(log.metadata) === idempotencyKey) matches.push(log);
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
export async function findReplayExpense(
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
