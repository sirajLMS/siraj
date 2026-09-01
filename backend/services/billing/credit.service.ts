import { createHash } from "node:crypto";
import { db } from "@/backend/db/drizzleDb";
import { CreditRepository } from "@/backend/db/repo/billing";
import { acquireAdvisoryLock } from "@/backend/db/repo/shared";
import { StudentRepository } from "@/backend/db/repo/students";
import { TeacherRepository } from "@/backend/db/repo/teachers";
import { AppPermission, CreditAdjustmentType, CreditReason } from "@/backend/enum";
import { ConflictError, DomainError, logger, NotFoundError, sanitizeRichText, ValidationError } from "@/backend/lib";
import { maybeInsertCarryoverBalanceEntry } from "@/backend/services/billing/carryover-handoff";
import { deriveAdjustmentIdempotencyKey } from "@/backend/services/billing/credit-adjustment.idempotency";
import { assertAssociatedOrManage, requirePermission } from "@/backend/services/billing/permission-utils";
import { QuotaService } from "@/backend/services/billing/quota.service";
import { AuditService } from "@/backend/services/system/audit.service";
import type {
  CreateAuditLogInput,
  CreditAdjustmentInput,
  CreditAdjustmentReturnType,
  CreditBalanceReturnType,
  CreditHourBalanceReturnType,
  CreditTransactionReturnType,
  CreditTransactionSelectType,
  CreditTransactionSubmitInput,
  DBTransaction,
  PaginationArgs,
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
function isUniqueViolation(error: unknown): boolean {
  return hasErrorCode(error) && error.code === "23505";
}

async function assertStudentExists(studentId: string, tErrors: ErrorsLabels): Promise<void> {
  const existing = await StudentRepository.findById(studentId);
  if (!existing) {
    throw new NotFoundError("STUDENT", tErrors.studentNotFound(studentId));
  }
}

/**
 * Adjustments must not target students whose account was removed — a
 * soft-deleted student user is treated as not found, with zero writes.
 * Runs inside the adjustment transaction (after the advisory lock).
 */
async function assertActiveStudentExists(studentId: string, tErrors: ErrorsLabels, tx: DBTransaction): Promise<void> {
  const existing = await StudentRepository.findActiveById(studentId, tx);
  if (!existing) {
    throw new NotFoundError("STUDENT", tErrors.studentNotFound(studentId));
  }
}

/** Type guard: narrows a `string` to `CreditReason` enum. */
function isCreditReason(value: string): value is CreditReason {
  return (Object.values(CreditReason) as readonly string[]).includes(value);
}

function mapToReturnType(row: CreditTransactionSelectType): CreditTransactionReturnType {
  const reason = isCreditReason(row.reason) ? row.reason : CreditReason.ADJUSTMENT;
  return { ...row, reason };
}

/** Maps an adjustment ledger row to the operator-facing return shape. */
function mapToAdjustmentReturnType(row: CreditTransactionSelectType): CreditAdjustmentReturnType {
  return mapToReturnType(row);
}

/** Fully-present carryover block of an adjustment input. */
interface CarryoverBlock {
  teacherId: string;
  fromDate: string;
  toDate: string;
  paymentDate: string;
}

/** Narrows the optional carryover fields, failing validation when any is missing. */
function requireCarryoverBlock(input: CreditAdjustmentInput, tErrors: ErrorsLabels): CarryoverBlock {
  const { carryoverTeacherId, carryoverFromDate, carryoverToDate, carryoverPaymentDate } = input;
  const teacherId = carryoverTeacherId?.trim();
  if (!teacherId || !carryoverFromDate || !carryoverToDate || !carryoverPaymentDate) {
    throw new ValidationError(tErrors.credit.invalidInput);
  }
  return {
    teacherId,
    fromDate: carryoverFromDate,
    toDate: carryoverToDate,
    paymentDate: carryoverPaymentDate,
  };
}

function validateAdjustmentInput(input: CreditAdjustmentInput, tErrors: ErrorsLabels): void {
  if (!input.studentId?.trim()) {
    throw new ValidationError(tErrors.credit.invalidInput);
  }
  if (!Number.isInteger(input.hours) || input.hours < 1 || input.hours > 100_000) {
    throw new ValidationError(tErrors.credit.invalidInput);
  }
  if ((input.internalNotes?.trim().length ?? 0) > INTERNAL_NOTES_MAX_LENGTH) {
    throw new ValidationError(tErrors.tooLong);
  }
  if (input.adjustmentType !== CreditAdjustmentType.SUBTRACT_WITH_CARRYOVER) return;

  const carryover = requireCarryoverBlock(input, tErrors);
  if (new Date(carryover.fromDate) > new Date(carryover.toDate)) {
    throw new ValidationError(tErrors.credit.invalidInput);
  }
  const maxPaymentDate = new Date();
  maxPaymentDate.setDate(maxPaymentDate.getDate() + 1);
  if (new Date(carryover.paymentDate) > maxPaymentDate) {
    throw new ValidationError(tErrors.credit.invalidInput);
  }
}

/** Sanitizes the rich-text reason before persistence; blank reasons persist as NULL. */
function sanitizeAdjustmentNotes(notes: string | null | undefined): string | null {
  if (!notes?.trim()) return null;
  const sanitized = sanitizeRichText(notes);
  return sanitized.length === 0 ? null : sanitized;
}

/** Sanity cap for the operator-internal plain-text note (accounting-only). */
const INTERNAL_NOTES_MAX_LENGTH = 2000;

/**
 * Normalizes the internal note: trimmed, blank values persist as NULL.
 * Unlike `notes`, the content is stored verbatim — it is plain text visible
 * only in accounting contexts, never rendered as rich text.
 */
function normalizeInternalNotes(internalNotes: string | null | undefined): string | null {
  const trimmed = internalNotes?.trim();
  if (!trimmed) return null;
  return trimmed;
}

async function assertTeacherExists(teacherId: string, tErrors: ErrorsLabels, tx: DBTransaction): Promise<void> {
  const existing = await TeacherRepository.findActiveById(teacherId, tx);
  if (!existing) {
    throw new NotFoundError("TEACHER", tErrors.teacher.teacherNotFound(teacherId));
  }
}

/**
 * Fails the adjustment when the student's remaining class credits cannot cover
 * the subtraction. Runs inside the adjustment transaction, after the per-student
 * advisory lock, so concurrent subtractions cannot observe a stale balance.
 */
async function assertSufficientClasses(
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
 * Resolves a concurrent-insert race on the idempotency key: the competing
 * request won the insert, so its committed row is the canonical result.
 */
async function resolveDuplicateAdjustment(idempotencyKey: string): Promise<CreditAdjustmentReturnType | null> {
  const resolved = await CreditRepository.findByIdempotencyKeys([idempotencyKey]);
  const row = resolved[0];
  return row ? mapToAdjustmentReturnType(row) : null;
}

/** Shared parameters of a single adjustment transaction. */
interface AdjustmentTxParams {
  actorUserId: string;
  input: CreditAdjustmentInput;
  tErrors: ErrorsLabels;
  idempotencyKey: string;
  /** Signed class-credit delta for the ledger row. */
  signedHours: number;
  reason: CreditReason;
  /** Present only for subtract-with-carryover adjustments. */
  carryover?: CarryoverBlock;
}

/** Outcome of an adjustment transaction: the committed/returned row and whether it was newly persisted. */
interface AdjustmentTxResult {
  row: CreditAdjustmentReturnType;
  /** False when the idempotency pre-check replayed an earlier persisted row. */
  createdNewRow: boolean;
}

/**
 * Executes one adjustment atomically: a per-student advisory lock serializes
 * concurrent adjustments, then the idempotency pre-check runs FIRST — ahead
 * of every existence/balance guard — so a replayed submission returns the
 * originally persisted row even when the state that guarded the first write
 * has since changed. The balance guard runs under the lock (no
 * read-modify-write race). Subtractions may carry a carryover block that is
 * mirrored to the payouts table when it exists.
 */
async function executeAdjustmentTransaction(params: AdjustmentTxParams): Promise<AdjustmentTxResult> {
  const { input, tErrors } = params;

  return db.transaction(async tx => {
    await acquireAdvisoryLock(tx, `student_${input.studentId}`);

    const existing = await CreditRepository.findByIdempotencyKeys([params.idempotencyKey], tx);
    const existingRow = existing[0];
    if (existingRow) return { row: mapToAdjustmentReturnType(existingRow), createdNewRow: false };

    await assertActiveStudentExists(input.studentId, tErrors, tx);
    if (params.carryover) {
      await assertTeacherExists(params.carryover.teacherId, tErrors, tx);
    }
    if (params.signedHours < 0) {
      await assertSufficientClasses(tx, input.studentId, input.hours, tErrors);
    }

    const ledgerRow = await CreditRepository.createAdjustment(tx, {
      studentId: input.studentId,
      changeAmount: params.signedHours,
      reason: params.reason,
      adjustmentType: input.adjustmentType,
      notes: sanitizeAdjustmentNotes(input.notes),
      internalNotes: normalizeInternalNotes(input.internalNotes),
      creditedByUserId: params.actorUserId,
      carryoverTeacherId: params.carryover?.teacherId,
      carryoverFromDate: params.carryover?.fromDate,
      carryoverToDate: params.carryover?.toDate,
      carryoverPaymentDate: params.carryover?.paymentDate,
      idempotencyKey: params.idempotencyKey,
    });

    if (params.signedHours < 0) {
      await StudentRepository.deductClasses(input.studentId, tErrors, input.hours, undefined, tx);
    } else {
      await StudentRepository.addClasses(input.studentId, tErrors, input.hours, undefined, tx);
    }
    await QuotaService.refreshStudentOndemandInstances(input.studentId, tx);

    if (params.carryover) {
      await maybeInsertCarryoverBalanceEntry(tx, {
        creditTransactionId: ledgerRow.id,
        teacherId: params.carryover.teacherId,
        studentId: input.studentId,
        fromDate: params.carryover.fromDate,
        toDate: params.carryover.toDate,
        paymentDate: params.carryover.paymentDate,
        hours: input.hours,
        approvedByUserId: params.actorUserId,
      });
    }

    return { row: mapToAdjustmentReturnType(ledgerRow), createdNewRow: true };
  });
}

/**
 * Runs an adjustment and resolves same-key concurrent inserts to the winning
 * row. The success log and audit entry are emitted only when the transaction
 * actually persisted a new ledger row — replayed submissions (in-tx or
 * recovered from a unique violation) return the first row without producing
 * duplicate observability records.
 */
async function runAdjustment(params: AdjustmentTxParams, logMessage: string): Promise<CreditAdjustmentReturnType> {
  try {
    // Success is reported only once the transaction commits — a rolled-back
    // adjustment produces neither a success log nor an audit entry.
    const { row, createdNewRow } = await executeAdjustmentTransaction(params);
    if (createdNewRow) {
      logger.info(logMessage, {
        actorUserId: params.actorUserId,
        studentId: params.input.studentId,
        adjustmentType: params.input.adjustmentType,
        changeAmount: params.signedHours,
        carryoverTeacherId: params.carryover?.teacherId,
      });
      await emitAdjustmentAudit(params, row);
    }
    return row;
  } catch (error) {
    if (isUniqueViolation(error)) {
      const resolved = await resolveDuplicateAdjustment(params.idempotencyKey);
      if (resolved) return resolved;
    }
    throw error;
  }
}

/**
 * Best-effort audit emit for a committed adjustment — never throws: a failed
 * audit write must not fail an adjustment whose ledger row already committed.
 */
async function emitAdjustmentAudit(params: AdjustmentTxParams, created: CreditAdjustmentReturnType): Promise<void> {
  const { input } = params;
  const audit: CreateAuditLogInput = {
    actorUserId: params.actorUserId,
    actorType: "USER",
    entityType: "STUDENT",
    entityId: input.studentId,
    action: "UPDATE",
    description: `Credit adjustment ${input.adjustmentType}`,
    newState: {
      creditTransactionId: created.id,
      adjustmentType: input.adjustmentType,
      changeAmount: params.signedHours,
      carryoverTeacherId: params.carryover?.teacherId ?? null,
    },
  };

  try {
    await AuditService.createManyAuditLogs([audit]);
  } catch (error) {
    logger.error(
      `credit-service: audit write failed for adjustmentType=${input.adjustmentType} studentId=${input.studentId}: ${
        error instanceof Error ? error.message : String(error)
      }`,
      { actorUserId: params.actorUserId, studentId: input.studentId, adjustmentType: input.adjustmentType, error }
    );
  }
}

async function addCredit(
  actorUserId: string,
  input: CreditAdjustmentInput,
  tErrors: ErrorsLabels
): Promise<CreditAdjustmentReturnType> {
  return runAdjustment(
    {
      actorUserId,
      input,
      tErrors,
      idempotencyKey: deriveAdjustmentIdempotencyKey(actorUserId, input),
      signedHours: input.hours,
      reason: CreditReason.CREDIT_ADJUSTMENT_ADD,
    },
    "Credit adjustment Add recorded"
  );
}

async function subtractCredit(
  actorUserId: string,
  input: CreditAdjustmentInput,
  tErrors: ErrorsLabels
): Promise<CreditAdjustmentReturnType> {
  return runAdjustment(
    {
      actorUserId,
      input,
      tErrors,
      idempotencyKey: deriveAdjustmentIdempotencyKey(actorUserId, input),
      signedHours: -input.hours,
      reason: CreditReason.CREDIT_ADJUSTMENT_SUBTRACT,
    },
    "Credit adjustment Subtract recorded"
  );
}

async function subtractWithCarryover(
  actorUserId: string,
  input: CreditAdjustmentInput,
  tErrors: ErrorsLabels
): Promise<CreditAdjustmentReturnType> {
  const carryover = requireCarryoverBlock(input, tErrors);
  return runAdjustment(
    {
      actorUserId,
      input,
      tErrors,
      idempotencyKey: deriveAdjustmentIdempotencyKey(actorUserId, input),
      signedHours: -input.hours,
      reason: CreditReason.CREDIT_ADJUSTMENT_CARRYOVER,
      carryover,
    },
    "Credit adjustment Subtract-With-Carryover recorded"
  );
}

/** Shared purchase logic: insert ledger row, adjust student classes, refresh quotas. */
async function executePurchase(
  tx: DBTransaction,
  input: CreditTransactionSubmitInput,
  actorUserId: string,
  idempotencyKey: string,
  tErrors: ErrorsLabels
): Promise<CreditTransactionReturnType> {
  const ledgerRow = await CreditRepository.createPurchase(tx, {
    studentId: input.studentId,
    changeAmount: input.hours,
    sourcePaymentId: input.sourcePaymentId ?? null,
    notes: input.notes ?? null,
    creditedByUserId: actorUserId,
    idempotencyKey,
  });

  await StudentRepository.addClasses(input.studentId, tErrors, input.hours, undefined, tx);
  await QuotaService.refreshStudentOndemandInstances(input.studentId, tx);
  return mapToReturnType(ledgerRow);
}

export namespace CreditService {
  /**
   * Seed-only bootstrap: idempotent credit purchase that uses a *deterministic*
   * idempotency key (supplied by the caller, e.g. `seed-credit-purchase:0:10`)
   * so repeated seed runs are no-ops instead of creating duplicate rows.
   *
   * Bypasses the `CREDITS_MANAGE` permission check (the seed caller is an
   * admin user) and the `randomUUID`-based idempotency key generator used by
   * the public `recordPurchase` method.
   */
  function validatePurchaseInput(input: CreditTransactionSubmitInput, tErrors: ErrorsLabels): void {
    if (!input.studentId || input.studentId.trim().length === 0) {
      throw new ValidationError(tErrors.credit.invalidInput);
    }

    if (!Number.isFinite(input.hours) || input.hours <= 0) {
      throw new ValidationError(tErrors.credit.invalidInput);
    }
  }

  export async function recordPurchaseIfMissing(
    actorUserId: string,
    input: CreditTransactionSubmitInput,
    idempotencyKey: string,
    tErrors: ErrorsLabels
  ): Promise<CreditTransactionReturnType | null> {
    validatePurchaseInput(input, tErrors);

    // V3-078: Idempotency check is INSIDE the transaction to eliminate the
    // TOCTOU race — a concurrent purchase with the same key could insert
    // between a pre-tx check and the tx insert, producing a duplicate.
    try {
      const created = await db.transaction(async tx => {
        await assertStudentExists(input.studentId, tErrors);

        const existing = await CreditRepository.findByIdempotencyKeys([idempotencyKey], tx);
        if (existing.length > 0) {
          const existingRow = existing[0];
          if (existingRow) return mapToReturnType(existingRow);
          return null;
        }

        return executePurchase(tx, input, actorUserId, idempotencyKey, tErrors);
      });

      logger.info("Credit purchase seeded", {
        actorUserId,
        studentId: input.studentId,
        hours: input.hours,
        idempotencyKey,
      });

      return created;
    } catch (error) {
      if (isUniqueViolation(error)) {
        const resolved = await CreditRepository.findByIdempotencyKeys([idempotencyKey]);
        if (resolved.length > 0) {
          const row = resolved[0];
          if (row) return mapToReturnType(row);
        }
        return null;
      }
      throw error;
    }
  }

  // ─── Hour-based parallel ledger extensions (credit-hours system) ──────────
  // v1: unit-tested only — production callers arrive with Plan 6. Do NOT
  // remove as "unused"; they are the intended extension point.

  /**
   * Caller-owned-tx purchase into the HOUR ledger. Does NOT check permissions
   * and does NOT open a transaction (mirrors recordPurchaseIfMissing):
   * duplicates RETURN the existing row instead of throwing.
   */
  export async function recordHourPurchase(
    input: {
      studentId: string;
      hours: number;
      creditedByUserId: string;
      sourcePaymentId?: string | null;
      notes?: string | null;
    },
    idempotencyKey: string,
    tx: DBTransaction,
    tErrors: ErrorsLabels
  ): Promise<CreditTransactionReturnType | null> {
    if (!Number.isFinite(input.hours) || input.hours <= 0) {
      throw new ValidationError(tErrors.credit.invalidInput);
    }

    const existing = await CreditRepository.findByIdempotencyKeys([idempotencyKey], tx);
    if (existing.length > 0 && existing[0]) return mapToReturnType(existing[0]);

    const row = await CreditRepository.createHourPurchase(tx, {
      studentId: input.studentId,
      hours: input.hours,
      sourcePaymentId: input.sourcePaymentId ?? null,
      notes: input.notes ?? null,
      creditedByUserId: input.creditedByUserId,
      idempotencyKey,
    });
    await StudentRepository.addCreditHours(input.studentId, tErrors, input.hours, undefined, tx);
    return mapToReturnType(row);
  }

  /**
   * Seed-only bootstrap: idempotent HOUR purchase with a caller-supplied
   * deterministic idempotency key (e.g. `seed-hour-credit-purchase:0:10`).
   * Mirrors `recordPurchaseIfMissing` for the hour ledger — the idempotency
   * check runs INSIDE the transaction (no TOCTOU) and repeats return the
   * first persisted row instead of double-crediting. The core write
   * (hour ledger row + hour facet bump) is delegated to `recordHourPurchase`.
   */
  export async function recordHourPurchaseIfMissing(
    actorUserId: string,
    input: { studentId: string; hours: number; notes?: string | null },
    idempotencyKey: string,
    tErrors: ErrorsLabels
  ): Promise<CreditTransactionReturnType | null> {
    try {
      const created = await db.transaction(async tx => {
        await assertStudentExists(input.studentId, tErrors);

        return recordHourPurchase(
          {
            studentId: input.studentId,
            hours: input.hours,
            creditedByUserId: actorUserId,
            notes: input.notes ?? null,
          },
          idempotencyKey,
          tx,
          tErrors
        );
      });

      logger.info("Hour credit purchase seeded", {
        actorUserId,
        studentId: input.studentId,
        hours: input.hours,
        idempotencyKey,
      });

      return created;
    } catch (error) {
      if (isUniqueViolation(error)) {
        const resolved = await CreditRepository.findByIdempotencyKeys([idempotencyKey]);
        const row = resolved[0];
        return row ? mapToReturnType(row) : null;
      }
      throw error;
    }
  }

  /** Consumes HOURS for an hour-billed class instance (Plan 6 wiring point). */
  export async function deductHoursForBooking(
    studentId: string,
    classInstanceId: string,
    hours: number,
    creditedByUserId: string,
    idempotencyKey: string,
    tx: DBTransaction,
    tErrors: ErrorsLabels,
    _locale = "en"
  ): Promise<void> {
    if (!Number.isFinite(hours) || hours <= 0) {
      throw new ValidationError(tErrors.credit.invalidInput);
    }

    const balance = await CreditRepository.getHourBalance(tx, studentId);
    const remaining = Number(balance.creditHoursRemaining);
    if (remaining < hours) {
      throw new ConflictError(tErrors.credit.insufficientHours({ studentId, remaining, required: hours }));
    }

    await runIdempotentBookingLedgerOp({
      studentId,
      classInstanceId,
      creditedByUserId,
      idempotencyKey,
      tx,
      operation: "deduct",
      unit: "hours",
      successLogMessage: "Credit hours deducted for booking",
      errorLogMessage: "Failed to deduct credit hours for booking",
      applyLedgerChange: async effectiveIdempotencyKey =>
        CreditRepository.deductHoursForBooking(tx, {
          studentId,
          classInstanceId,
          hours,
          creditedByUserId,
          idempotencyKey: effectiveIdempotencyKey,
        }),
      adjustStudentClasses: async () => {
        await StudentRepository.deductCreditHours(studentId, tErrors, hours, undefined, tx);
      },
    });
  }

  /** Restores HOURS when an hour-billed instance is cancelled pre-start. */
  export async function refundHoursOnCancel(
    studentId: string,
    classInstanceId: string,
    hours: number,
    creditedByUserId: string,
    idempotencyKey: string,
    tx: DBTransaction,
    tErrors: ErrorsLabels
  ): Promise<void> {
    if (!Number.isFinite(hours) || hours <= 0) {
      throw new ValidationError(tErrors.credit.invalidInput);
    }

    await runIdempotentBookingLedgerOp({
      studentId,
      classInstanceId,
      creditedByUserId,
      idempotencyKey,
      tx,
      operation: "refund",
      unit: "hours",
      successLogMessage: "Credit hours refunded on cancel",
      errorLogMessage: "Failed to refund credit hours on cancel",
      applyLedgerChange: async effectiveIdempotencyKey =>
        CreditRepository.refundHoursOnCancel(tx, {
          studentId,
          classInstanceId,
          hours,
          creditedByUserId,
          idempotencyKey: effectiveIdempotencyKey,
        }),
      adjustStudentClasses: async () => {
        await StudentRepository.addCreditHours(studentId, tErrors, hours, undefined, tx);
      },
    });
  }

  export async function getStudentHourBalance(
    actorUserId: string,
    studentId: string,
    tErrors: ErrorsLabels
  ): Promise<CreditHourBalanceReturnType> {
    await assertStudentExists(studentId, tErrors);
    await assertAssociatedOrManage(actorUserId, studentId, tErrors, AppPermission.CREDITS_MANAGE);
    return await StudentRepository.getCreditHourBalance(studentId);
  }

  export async function recordPurchase(
    actorUserId: string,
    input: CreditTransactionSubmitInput,
    tErrors: ErrorsLabels
  ): Promise<CreditTransactionReturnType> {
    await requirePermission(actorUserId, AppPermission.CREDITS_MANAGE, tErrors);

    validatePurchaseInput(input, tErrors);

    const idempotencyKey = CreditRepository.generateIdempotencyKey({
      studentId: input.studentId,
      hours: input.hours,
      notes: input.notes ?? undefined,
      sourcePaymentId: input.sourcePaymentId,
    });

    try {
      const created = await db.transaction(async tx => {
        await assertStudentExists(input.studentId, tErrors);

        const existing = await CreditRepository.findByIdempotencyKeys([idempotencyKey], tx);
        if (existing.length > 0) {
          throw new ConflictError(tErrors.credit.duplicatePurchase);
        }

        return executePurchase(tx, input, actorUserId, idempotencyKey, tErrors);
      });

      logger.info("Credit purchase recorded", {
        actorUserId,
        studentId: input.studentId,
        hours: input.hours,
      });

      return created;
    } catch (error) {
      // Catch raw Postgres unique-violation (23505) from a concurrent purchase
      // with the same idempotency key that slipped between the pre-check and
      // the insert (TOCTOU). Surface as a friendly duplicatePurchase error so
      // callers see a domain error instead of the raw Postgres constraint name.
      if (isUniqueViolation(error)) {
        throw new ConflictError(tErrors.credit.duplicatePurchase, { cause: error });
      }
      logger.error("Failed to record credit purchase", {
        actorUserId,
        studentId: input.studentId,
        error,
      });
      throw error;
    }
  }

  export async function getStudentBalance(
    actorUserId: string,
    studentId: string,
    tErrors: ErrorsLabels
  ): Promise<CreditBalanceReturnType> {
    await assertStudentExists(studentId, tErrors);

    // V3-013: Use shared IDOR-scoping helper
    await assertAssociatedOrManage(actorUserId, studentId, tErrors, AppPermission.CREDITS_MANAGE);

    const balance = await CreditRepository.getBalance(db, studentId);
    return {
      studentId,
      classesTotal: balance.classesTotal,
      classesRemaining: balance.classesRemaining,
    };
  }

  export async function getStudentTransactions(
    actorUserId: string,
    studentId: string,
    paginationArgs: PaginationArgs | null,
    tErrors: ErrorsLabels,
    opts?: { hoursOnly?: boolean }
  ): Promise<{ rows: CreditTransactionReturnType[]; totalCount: number }> {
    await assertStudentExists(studentId, tErrors);

    // V3-013: Use shared IDOR-scoping helper
    await assertAssociatedOrManage(actorUserId, studentId, tErrors, AppPermission.CREDITS_MANAGE);

    const [rows, totalCount] = await Promise.all([
      CreditRepository.getTransactions(db, studentId, paginationArgs, opts),
      CreditRepository.countTransactions(db, studentId, opts),
    ]);

    return {
      rows: rows.map(mapToReturnType),
      totalCount,
    };
  }

  export async function deductForBooking(
    studentId: string,
    classInstanceId: string,
    creditedByUserId: string,
    idempotencyKey: string,
    tx: DBTransaction,
    tErrors: ErrorsLabels,
    _locale = "en"
  ): Promise<void> {
    const balance = await CreditRepository.getBalance(tx, studentId);
    if (balance.classesRemaining < 1) {
      throw new Error(tErrors.insufficientClasses({ id: studentId, remaining: balance.classesRemaining, required: 1 }));
    }

    await runIdempotentBookingLedgerOp({
      studentId,
      classInstanceId,
      creditedByUserId,
      idempotencyKey,
      tx,
      operation: "deduct",
      successLogMessage: "Credit deducted for booking",
      errorLogMessage: "Failed to deduct credit for booking",
      applyLedgerChange: async effectiveIdempotencyKey =>
        CreditRepository.deductForBooking(tx, {
          studentId,
          classInstanceId,
          creditedByUserId,
          idempotencyKey: effectiveIdempotencyKey,
        }),
      adjustStudentClasses: async () => {
        await StudentRepository.deductClasses(studentId, tErrors, 1, undefined, tx);
        await QuotaService.refreshStudentOndemandInstances(studentId, tx);
      },
    });
  }

  export async function refundOnCancel(
    studentId: string,
    classInstanceId: string,
    creditedByUserId: string,
    idempotencyKey: string,
    tx: DBTransaction,
    tErrors: ErrorsLabels
  ): Promise<void> {
    await runIdempotentBookingLedgerOp({
      studentId,
      classInstanceId,
      creditedByUserId,
      idempotencyKey,
      tx,
      operation: "refund",
      successLogMessage: "Credit refunded on cancel",
      errorLogMessage: "Failed to refund credit on cancel",
      applyLedgerChange: async effectiveIdempotencyKey =>
        CreditRepository.refundOnCancel(tx, {
          studentId,
          classInstanceId,
          creditedByUserId,
          idempotencyKey: effectiveIdempotencyKey,
        }),
      adjustStudentClasses: async () => {
        await StudentRepository.addClasses(studentId, tErrors, 1, undefined, tx);
        await QuotaService.refreshStudentOndemandInstances(studentId, tx);
      },
    });
  }

  /**
   * Batch version of `refundOnCancel` that refunds credits for multiple
   * instances in a single transaction. Groups refunds by `studentId` so
   * `StudentRepository.addClasses` and `QuotaService.refreshStudentOndemandInstances`
   * are each called at most once per student instead of once per instance.
   *
   * Each refund in `refunds` produces a ledger insert with:
   *   changeAmount=1, reason=REFUND, classInstanceId=refund.classInstanceId
   * — identical to the single-instance `refundOnCancel` path.
   *
   * Returns the number of refunds actually inserted (idempotency-filtered).
   *
   * Errors bubble up to the caller so the shared transaction is rolled back.
   */
  export async function refundOnCancelBatch(
    tx: DBTransaction,
    refunds: Array<{
      studentId: string;
      classInstanceId: string;
      creditedByUserId: string;
      idempotencyKey: string;
    }>,
    tErrors: ErrorsLabels
  ): Promise<number> {
    if (refunds.length === 0) return 0;

    const { ledgerKeyByRefund, allKeys } = buildRefundIdempotencyKeys(refunds);
    const toInsert = await filterUnseenRefunds(refunds, ledgerKeyByRefund, allKeys, tx);

    if (toInsert.length === 0) return 0;

    await insertRefundLedgerRows(toInsert, tx);
    await updateStudentBalances(toInsert, tx, tErrors);

    logger.info("Batch credit refund completed", {
      totalRequested: refunds.length,
      totalInserted: toInsert.length,
      uniqueStudents: new Set(toInsert.map(r => r.studentId)).size,
    });

    return toInsert.length;
  }

  /**
   * Records a manual credit adjustment (Add / Subtract / Subtract With
   * Carryover). Requires the ACCOUNTING_CREDITS_MANAGE permission; validates
   * the operator-supplied input, then dispatches to the matching adjustment
   * flow. Double-submits collapse onto the first persisted ledger row via the
   * derived idempotency key.
   */
  export async function recordAdjustment(
    actorUserId: string,
    input: CreditAdjustmentInput,
    tErrors: ErrorsLabels
  ): Promise<CreditAdjustmentReturnType> {
    await requirePermission(actorUserId, AppPermission.ACCOUNTING_CREDITS_MANAGE, tErrors);
    validateAdjustmentInput(input, tErrors);

    switch (input.adjustmentType) {
      case CreditAdjustmentType.ADD:
        return addCredit(actorUserId, input, tErrors);
      case CreditAdjustmentType.SUBTRACT:
        return subtractCredit(actorUserId, input, tErrors);
      case CreditAdjustmentType.SUBTRACT_WITH_CARRYOVER:
        return subtractWithCarryover(actorUserId, input, tErrors);
      default:
        throw new ValidationError(tErrors.credit.invalidInput);
    }
  }
}

/**
 * Builds ledger idempotency keys for batch refunds.
 */
function buildRefundIdempotencyKeys(
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
async function filterUnseenRefunds(
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
async function insertRefundLedgerRows(
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
async function updateStudentBalances(
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

interface IdempotentBookingLedgerOp {
  studentId: string;
  classInstanceId: string;
  creditedByUserId: string;
  idempotencyKey: string;
  tx: DBTransaction;
  operation: "deduct" | "refund";
  unit?: "classes" | "hours";
  successLogMessage: string;
  errorLogMessage: string;
  applyLedgerChange: (effectiveIdempotencyKey: string) => Promise<unknown>;
  adjustStudentClasses: () => Promise<unknown>;
}

async function runIdempotentBookingLedgerOp(op: IdempotentBookingLedgerOp): Promise<void> {
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
