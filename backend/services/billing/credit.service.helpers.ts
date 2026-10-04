import { createHash } from "node:crypto";
import { CreditRepository } from "@/backend/db/repo/billing";
import { StudentRepository } from "@/backend/db/repo/students";
import { TeacherRepository } from "@/backend/db/repo/teachers";
import { CreditReason } from "@/backend/enum";
import { DomainError, logger, NotFoundError, sanitizeRichText } from "@/backend/lib";
import { QuotaService } from "@/backend/services/billing/quota.service";
import type {
  CreditAdjustmentReturnType,
  CreditTransactionReturnType,
  CreditTransactionSelectType,
  DBTransaction,
  IdempotentBookingLedgerOp,
} from "@/backend/types";
import type { ErrorsLabels } from "@/shared/locale";

function deriveBookingIdempotencyKey(input: {
  studentId: string;
  classInstanceId: string;
  operation: "deduct" | "refund";
  /** Ledger discriminator — hour keys must never collide with class keys. */
  unit?: "classes" | "hours";
}): string {
  const parts = [input.studentId, input.classInstanceId, input.operation];
  if (input.unit === "hours") parts.push("hour-unit");
  return createHash("sha256").update(parts.join(":")).digest("hex");
}

/** Type guard for objects with a string `code` property (e.g. Postgres errors). */
function hasErrorCode(error: unknown): error is { code: string } {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof (error as Record<string, unknown>).code === "string"
  );
}

/** Detects a Postgres unique-constraint violation (SQLSTATE 23505). */
export function isUniqueViolation(error: unknown): boolean {
  return hasErrorCode(error) && error.code === "23505";
}

/** Throws NotFoundError for the entity kind when the lookup returned nothing. */
function assertRecordExists(found: unknown, kind: "STUDENT" | "TEACHER", message: () => string): void {
  if (!found) throw new NotFoundError(kind, message());
}

export async function assertStudentExists(studentId: string, tErrors: ErrorsLabels): Promise<void> {
  assertRecordExists(await StudentRepository.findById(studentId), "STUDENT", () => tErrors.studentNotFound(studentId));
}

/**
 * Adjustments must not target students whose account was removed — a
 * soft-deleted student user is treated as not found, with zero writes.
 * Runs inside the adjustment transaction (after the advisory lock).
 */
export async function assertActiveStudentExists(
  studentId: string,
  tErrors: ErrorsLabels,
  tx: DBTransaction
): Promise<void> {
  assertRecordExists(await StudentRepository.findActiveById(studentId, tx), "STUDENT", () =>
    tErrors.studentNotFound(studentId)
  );
}

/** Type guard: narrows a `string` to `CreditReason` enum. */
function isCreditReason(value: string): value is CreditReason {
  return (Object.values(CreditReason) as readonly string[]).includes(value);
}

export function mapToReturnType(row: CreditTransactionSelectType): CreditTransactionReturnType {
  const reason = isCreditReason(row.reason) ? row.reason : CreditReason.ADJUSTMENT;
  return { ...row, reason };
}

/** Maps an adjustment ledger row to the operator-facing return shape. */
export function mapToAdjustmentReturnType(row: CreditTransactionSelectType): CreditAdjustmentReturnType {
  return mapToReturnType(row);
}

/** Sanitizes the rich-text reason before persistence; blank reasons persist as NULL. */
export function sanitizeAdjustmentNotes(notes: string | null | undefined): string | null {
  if (!notes?.trim()) return null;
  const sanitized = sanitizeRichText(notes);
  return sanitized.length === 0 ? null : sanitized;
}

/**
 * Normalizes the internal note: trimmed, blank values persist as NULL.
 * Unlike `notes`, the content is stored verbatim — it is plain text visible
 * only in accounting contexts, never rendered as rich text.
 */
export function normalizeInternalNotes(internalNotes: string | null | undefined): string | null {
  const trimmed = internalNotes?.trim();
  if (!trimmed) return null;
  return trimmed;
}

export async function assertTeacherExists(teacherId: string, tErrors: ErrorsLabels, tx: DBTransaction): Promise<void> {
  assertRecordExists(await TeacherRepository.findActiveById(teacherId, tx), "TEACHER", () =>
    tErrors.teacher.teacherNotFound(teacherId)
  );
}

/**
 * Fails the adjustment when the student's remaining class credits cannot cover
 * the subtraction. Runs inside the adjustment transaction, after the per-student
 * advisory lock, so concurrent subtractions cannot observe a stale balance.
 */
export async function assertSufficientClasses(
  tx: DBTransaction,
  studentId: string,
  hours: number,
  tErrors: ErrorsLabels
): Promise<void> {
  const balance = await CreditRepository.getBalance(tx, studentId);
  if (balance.classesRemaining < hours) {
    throw new DomainError(
      "INSUFFICIENT_CLASSES",
      tErrors.credit.insufficientBalance({ studentId, remaining: balance.classesRemaining })
    );
  }
}

/**
 * Builds ledger idempotency keys for batch refunds.
 */
export function buildRefundIdempotencyKeys(
  refunds: Array<{
    studentId: string;
    classInstanceId: string;
    creditedByUserId: string;
    idempotencyKey: string;
  }>
): { ledgerKeyByRefund: Map<number, string>; allKeys: string[] } {
  const allKeys: string[] = [];
  const ledgerKeyByRefund = new Map<number, string>();
  refunds.forEach((refund, idx) => {
    const ledgerKey = deriveBookingIdempotencyKey({
      studentId: refund.studentId,
      classInstanceId: refund.classInstanceId,
      operation: "refund",
    });
    ledgerKeyByRefund.set(idx, ledgerKey);
    allKeys.push(ledgerKey, refund.idempotencyKey);
  });
  return { ledgerKeyByRefund, allKeys };
}

/**
 * Filters refunds to only those not already persisted (idempotency check).
 */
export async function filterUnseenRefunds(
  refunds: Array<{
    studentId: string;
    classInstanceId: string;
    creditedByUserId: string;
    idempotencyKey: string;
  }>,
  ledgerKeyByRefund: Map<number, string>,
  allKeys: string[],
  tx: DBTransaction
): Promise<
  Array<{
    studentId: string;
    classInstanceId: string;
    creditedByUserId: string;
    idempotencyKey: string;
  }>
> {
  const existing = await CreditRepository.findByIdempotencyKeys(
    [...new Set(allKeys)].toSorted((a, b) => a.localeCompare(b)),
    tx
  );
  const existingKeys = new Set(existing.map(r => r.idempotencyKey));
  const toInsert: Array<{
    studentId: string;
    classInstanceId: string;
    creditedByUserId: string;
    idempotencyKey: string;
  }> = [];
  refunds.forEach((refund, idx) => {
    const ledgerKey = ledgerKeyByRefund.get(idx);
    if (ledgerKey !== undefined && !existingKeys.has(ledgerKey) && !existingKeys.has(refund.idempotencyKey)) {
      toInsert.push({
        studentId: refund.studentId,
        classInstanceId: refund.classInstanceId,
        creditedByUserId: refund.creditedByUserId,
        idempotencyKey: ledgerKey,
      });
    }
  });
  return toInsert;
}

/**
 * Inserts refund ledger rows for the filtered batch.
 */
export async function insertRefundLedgerRows(
  toInsert: Array<{
    studentId: string;
    classInstanceId: string;
    creditedByUserId: string;
    idempotencyKey: string;
  }>,
  tx: DBTransaction
): Promise<void> {
  const insertRows = toInsert.map(r => ({
    studentId: r.studentId,
    changeAmount: 1,
    reason: CreditReason.REFUND,
    sourcePaymentId: null,
    classInstanceId: r.classInstanceId,
    notes: null,
    creditedByUserId: r.creditedByUserId,
    idempotencyKey: r.idempotencyKey,
  }));
  await CreditRepository.insertBatch(tx, insertRows);
}

/**
 * Groups refunds by student and updates each student's balance + on-demand instances.
 */
export async function updateStudentBalances(
  toInsert: Array<{
    studentId: string;
    classInstanceId: string;
    creditedByUserId: string;
    idempotencyKey: string;
  }>,
  tx: DBTransaction,
  tErrors: ErrorsLabels
): Promise<void> {
  const byStudent = new Map<string, number>();
  for (const r of toInsert) {
    byStudent.set(r.studentId, (byStudent.get(r.studentId) ?? 0) + 1);
  }
  await Promise.all(
    [...byStudent].map(async ([studentId, count]) => {
      await StudentRepository.addClasses(studentId, tErrors, count, undefined, tx);
      await QuotaService.refreshStudentOndemandInstances(studentId, tx);
    })
  );
}

export async function runIdempotentBookingLedgerOp(op: IdempotentBookingLedgerOp): Promise<void> {
  const ledgerKey = deriveBookingIdempotencyKey({
    studentId: op.studentId,
    classInstanceId: op.classInstanceId,
    operation: op.operation,
    unit: op.unit,
  });

  const logContext = {
    studentId: op.studentId,
    classInstanceId: op.classInstanceId,
    creditedByUserId: op.creditedByUserId,
  };

  try {
    const existing = await CreditRepository.findByIdempotencyKeys([ledgerKey, op.idempotencyKey], op.tx);
    if (existing.length === 0) {
      await op.applyLedgerChange(ledgerKey);
      await op.adjustStudentClasses();
    }

    logger.info(op.successLogMessage, logContext);
  } catch (error) {
    logger.error(op.errorLogMessage, {
      ...logContext,
      error,
    });
    throw error;
  }
}
