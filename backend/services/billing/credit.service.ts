import { db } from "@/backend/db/drizzleDb";
import { CreditRepository } from "@/backend/db/repo/billing";
import { StudentRepository } from "@/backend/db/repo/students";
import { AppPermission } from "@/backend/enum";
import { logger } from "@/backend/lib";
import { dispatchAdjustment, validateAdjustmentInput } from "@/backend/services/billing/credit.service.adjustments";
import {
  deductForBookingFlow,
  deductHoursForBookingFlow,
  refundHoursOnCancelFlow,
  refundOnCancelFlow,
} from "@/backend/services/billing/credit.service.bookings";
import {
  assertStudentExists,
  buildRefundIdempotencyKeys,
  filterUnseenRefunds,
  insertRefundLedgerRows,
  mapToReturnType,
  updateStudentBalances,
} from "@/backend/services/billing/credit.service.helpers";
import {
  recordHourPurchaseFlow,
  recordHourPurchaseIfMissingFlow,
  recordPurchaseFlow,
  recordPurchaseIfMissingFlow,
  validatePurchaseInput,
} from "@/backend/services/billing/credit.service.purchases";
import { assertAssociatedOrManage, requirePermission } from "@/backend/services/billing/permission-utils";
import type {
  CreditAdjustmentInput,
  CreditAdjustmentReturnType,
  CreditBalanceReturnType,
  CreditClassesSubmitInput,
  CreditHourBalanceReturnType,
  CreditHoursSubmitInput,
  CreditTransactionReturnType,
  DBTransaction,
  PaginationArgs,
} from "@/backend/types";
import type { ErrorsLabels } from "@/shared/locale";

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
    input: CreditClassesSubmitInput,
    idempotencyKey: string,
    tErrors: ErrorsLabels
  ): Promise<CreditTransactionReturnType | null> {
    validatePurchaseInput(input, tErrors);
    return recordPurchaseIfMissingFlow(actorUserId, input, idempotencyKey, tErrors);
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
    input: CreditHoursSubmitInput,
    idempotencyKey: string,
    tx: DBTransaction,
    tErrors: ErrorsLabels
  ): Promise<CreditTransactionReturnType | null> {
    return recordHourPurchaseFlow(input, idempotencyKey, tx, tErrors);
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
    input: Omit<CreditHoursSubmitInput, "creditedByUserId">,
    idempotencyKey: string,
    tErrors: ErrorsLabels
  ): Promise<CreditTransactionReturnType | null> {
    return recordHourPurchaseIfMissingFlow(actorUserId, input, idempotencyKey, tErrors);
  }

  /** Consumes HOURS for an hour-billed class instance. */
  export async function deductHoursForBooking(...args: Parameters<typeof deductHoursForBookingFlow>): Promise<void> {
    return deductHoursForBookingFlow(...args);
  }

  /** Restores HOURS when an hour-billed instance is cancelled pre-start. */
  export async function refundHoursOnCancel(...args: Parameters<typeof refundHoursOnCancelFlow>): Promise<void> {
    return refundHoursOnCancelFlow(...args);
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
    input: CreditClassesSubmitInput,
    tErrors: ErrorsLabels
  ): Promise<CreditTransactionReturnType> {
    await requirePermission(actorUserId, AppPermission.CREDITS_MANAGE, tErrors);

    validatePurchaseInput(input, tErrors);

    return recordPurchaseFlow(actorUserId, input, tErrors);
  }

  export async function getStudentBalance(
    actorUserId: string,
    studentId: string,
    tErrors: ErrorsLabels
  ): Promise<CreditBalanceReturnType> {
    await assertStudentExists(studentId, tErrors);

    // Use shared IDOR-scoping helper
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

    // Use shared IDOR-scoping helper
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

  /** Consumes one class credit for a booking. */
  export async function deductForBooking(...args: Parameters<typeof deductForBookingFlow>): Promise<void> {
    return deductForBookingFlow(...args);
  }

  /** Restores one class credit when a booking is cancelled pre-start. */
  export async function refundOnCancel(...args: Parameters<typeof refundOnCancelFlow>): Promise<void> {
    return refundOnCancelFlow(...args);
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

    return dispatchAdjustment(actorUserId, input, tErrors);
  }
}
