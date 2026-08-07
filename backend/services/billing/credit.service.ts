import { createHash } from "node:crypto";
import type { DBTransaction } from "@/backend/db/db.types";
import { db } from "@/backend/db/drizzleDb";
import { CreditRepository, StudentRepository } from "@/backend/db/repo";
import { AppPermission, CreditReason } from "@/backend/enum";
import { ConflictError, DomainError, logger, NotFoundError, ValidationError } from "@/backend/lib";
import { assertAssociatedOrManage, requirePermission } from "@/backend/services/billing/permission-utils";
import { QuotaService } from "@/backend/services/billing/quota.service";
import type {
  CreditBalanceReturnType,
  CreditTransactionReturnType,
  CreditTransactionSelectType,
  CreditTransactionSubmitInput,
  PaginationArgs,
} from "@/backend/types";
import type { ErrorsLabels } from "@/shared/locale";
import { getServerTranslations } from "@/shared/locale/server-graphql";

function deriveBookingIdempotencyKey(input: {
  studentId: string;
  classInstanceId: string;
  operation: "deduct" | "refund";
}): string {
  const parts = [input.studentId, input.classInstanceId, input.operation];
  return createHash("sha256").update(parts.join(":")).digest("hex");
}

/** Detects a Postgres unique-constraint violation (SQLSTATE 23505). */
function isUniqueViolation(error: unknown): boolean {
  if (typeof error === "object" && error !== null && "code" in error) {
    return (error as { code: string }).code === "23505";
  }
  return false;
}

async function assertStudentExists(studentId: string, tErrors: ErrorsLabels): Promise<void> {
  const existing = await StudentRepository.findById(studentId);
  if (!existing) {
    throw new NotFoundError("STUDENT", tErrors.studentNotFound(studentId));
  }
}

function mapToReturnType(row: CreditTransactionSelectType): CreditTransactionReturnType {
  return { ...row, reason: row.reason as CreditTransactionReturnType["reason"] };
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
  export async function recordPurchaseIfMissing(
    actorUserId: string,
    input: CreditTransactionSubmitInput,
    idempotencyKey: string,
    tErrors: ErrorsLabels
  ): Promise<CreditTransactionReturnType | null> {
    if (!input.studentId || input.studentId.trim().length === 0) {
      throw new ValidationError(tErrors.credit.invalidInput);
    }

    if (!Number.isFinite(input.hours) || input.hours <= 0) {
      throw new ValidationError(tErrors.credit.invalidInput);
    }

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

  export async function recordPurchase(
    actorUserId: string,
    input: CreditTransactionSubmitInput,
    tErrors: ErrorsLabels
  ): Promise<CreditTransactionReturnType> {
    await requirePermission(actorUserId, AppPermission.CREDITS_MANAGE, tErrors);

    if (!input.studentId || input.studentId.trim().length === 0) {
      throw new ValidationError(tErrors.credit.invalidInput);
    }

    if (!Number.isFinite(input.hours) || input.hours <= 0) {
      throw new ValidationError(tErrors.credit.invalidInput);
    }

    const idempotencyKey = CreditRepository.generateIdempotencyKey({
      studentId: input.studentId,
      hours: input.hours,
      notes: input.notes,
      sourcePaymentId: input.sourcePaymentId,
    });

    try {
      const created = await db.transaction(async tx => {
        await assertStudentExists(input.studentId, tErrors);

        const existing = await CreditRepository.findByIdempotencyKeys([idempotencyKey], tx);
        if (existing.length > 0) {
          throw new ConflictError(tErrors.credit.duplicatePurchase);
        }

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

        return ledgerRow;
      });

      logger.info("Credit purchase recorded", {
        actorUserId,
        studentId: input.studentId,
        hours: input.hours,
      });

      return mapToReturnType(created);
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
    tErrors: ErrorsLabels
  ): Promise<{ rows: CreditTransactionReturnType[]; totalCount: number }> {
    await assertStudentExists(studentId, tErrors);

    // V3-013: Use shared IDOR-scoping helper
    await assertAssociatedOrManage(actorUserId, studentId, tErrors, AppPermission.CREDITS_MANAGE);

    const [rows, totalCount] = await Promise.all([
      CreditRepository.getTransactions(db, studentId, paginationArgs),
      CreditRepository.countTransactions(db, studentId),
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
    locale = "en"
  ): Promise<void> {
    const balance = await CreditRepository.getBalance(tx, studentId);
    if (balance.classesRemaining <= 0) {
      const { errorsTranslations } = getServerTranslations(locale);
      throw new DomainError(
        "INSUFFICIENT_CLASSES",
        errorsTranslations.credit.insufficientBalance({
          studentId,
          remaining: balance.classesRemaining,
        })
      );
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
