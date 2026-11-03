import { db } from "@/backend/db/drizzleDb";
import { AccountingPaymentRepository, AccountingPaymentSupport, CreditRepository } from "@/backend/db/repo/billing";
import { acquireAdvisoryLock } from "@/backend/db/repo/shared";
import { StudentRepository } from "@/backend/db/repo/students";
import { AccountingPaymentHistoryKind, AppPermission, CreditReason } from "@/backend/enum";
import { logger, NotFoundError, ValidationError } from "@/backend/lib";
import { AccountingNotificationService } from "@/backend/services/billing/accounting-notification.service";
import {
  MAX_PAYMENT_AMOUNT,
  MAX_PAYMENT_CREDIT_HOURS,
  runRecordPaymentTransaction,
  runTogglePaidStatusTransaction,
} from "@/backend/services/billing/accounting-payment.helpers";
import { resolveLowHoursThreshold } from "@/backend/services/billing/accounting-settings.utils";
import { assertAssociatedOrManage, requirePermission } from "@/backend/services/billing/permission-utils";
import type {
  AccountingPaymentBalanceReturnType,
  AccountingPaymentFilter,
  AccountingPaymentHistoryEventReturnType,
  AccountingPaymentReturnType,
  AccountingPaymentSubmitInput,
  AccountingPaymentTogglePaidInput,
  AccountingPaymentUpdateInput,
  PaginationArgs,
} from "@/backend/types";
import type { ErrorsLabels } from "@/shared/locale";

/** Type guard for objects with a string `code` property (Postgres errors). */
function hasErrorCode(error: unknown): error is { code: string } {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof (error as Record<string, unknown>).code === "string"
  );
}

const isUniqueViolation = (error: unknown): boolean => hasErrorCode(error) && error.code === "23505";
/** String view of the purchase reason — avoids enum-vs-string comparison lint. */
const PURCHASE_REASON: string = CreditReason.PURCHASE;

export namespace AccountingPaymentService {
  export async function recordPayment(
    actorUserId: string,
    input: AccountingPaymentSubmitInput,
    tErrors: ErrorsLabels
  ): Promise<AccountingPaymentReturnType> {
    await requirePermission(actorUserId, AppPermission.ACCOUNTING_PAYMENTS_MANAGE, tErrors);

    if (!Number.isFinite(input.amount) || input.amount <= 0 || input.amount > MAX_PAYMENT_AMOUNT)
      throw new ValidationError(tErrors.package.invalidInput);
    if (!Number.isFinite(input.creditHours) || input.creditHours <= 0 || input.creditHours > MAX_PAYMENT_CREDIT_HOURS)
      throw new ValidationError(tErrors.package.invalidInput);

    // Strict existence check (pre-tx fast-fail; EC-8 cascades protect invariants).
    const studentBasic = await AccountingPaymentSupport.findStudentById(input.studentId);
    if (!studentBasic) {
      throw new NotFoundError("STUDENT", tErrors.studentNotFound(input.studentId));
    }
    if (!studentBasic.parentId) {
      // invoices.parent_id is NOT NULL — v1 requires parent-linked students.
      throw new ValidationError(tErrors.package.invalidInput);
    }
    // Hoist into a narrowed local so the tx closure keeps the string type.
    const parentId: string = studentBasic.parentId;

    const idempotencyKey = AccountingPaymentRepository.generateIdempotencyKey({
      studentId: input.studentId,
      packagePlanId: input.packagePlanId ?? null,
      amount: String(input.amount),
      currency: input.currency,
      paymentDate: input.paymentDate,
      paymentGateway: input.paymentGateway,
    });

    try {
      const created = await runRecordPaymentTransaction(actorUserId, input, tErrors, idempotencyKey, parentId);

      // Fire-and-forget (non-blocking) notification after a committed purchase.
      void AccountingNotificationService.notifyPaymentRecorded({
        studentId: input.studentId,
        packageName: created.packageName ?? input.packagePlanId ?? "",
        creditHours: String(input.creditHours),
        amount: String(input.amount),
        currency: input.currency,
      });

      return created;
    } catch (error) {
      // EC-1 concurrent duplicate: unique-violation → return the winner's row.
      if (isUniqueViolation(error)) {
        const resolved = await AccountingPaymentSupport.findByIdempotencyKeys([idempotencyKey]);
        if (resolved.length > 0 && resolved[0]) {
          const joined = await AccountingPaymentRepository.findById(resolved[0].id);
          if (joined) return joined;
        }
      }
      logger.error("Failed to record accounting payment", {
        actorUserId,
        studentId: input.studentId,
        error,
      });
      throw error;
    }
  }

  export async function togglePaidStatus(
    actorUserId: string,
    input: AccountingPaymentTogglePaidInput,
    tErrors: ErrorsLabels
  ): Promise<AccountingPaymentReturnType> {
    await requirePermission(actorUserId, AppPermission.ACCOUNTING_PAYMENTS_MANAGE, tErrors);

    const current = await AccountingPaymentRepository.findById(input.id);
    if (!current) {
      throw new NotFoundError("PAYMENT", tErrors.billing.invoiceNotFound(input.id));
    }

    const updated = await runTogglePaidStatusTransaction(input, tErrors, current);

    logger.info("Accounting payment paid-status toggled", {
      actorUserId,
      paymentId: current.id,
      isPaidStatusOn: input.isPaidStatusOn,
    });
    return updated;
  }

  export async function update(
    actorUserId: string,
    input: AccountingPaymentUpdateInput,
    tErrors: ErrorsLabels
  ): Promise<AccountingPaymentReturnType> {
    await requirePermission(actorUserId, AppPermission.ACCOUNTING_PAYMENTS_MANAGE, tErrors);

    const current = await AccountingPaymentRepository.findById(input.id);
    if (!current) {
      throw new NotFoundError("PAYMENT", tErrors.billing.invoiceNotFound(input.id));
    }

    const oldHours = current.creditHours === null ? 0 : Number(current.creditHours);
    const requestedHours = typeof input.creditHours === "number" ? input.creditHours : null;
    const hoursChanged = requestedHours !== null && Math.abs(requestedHours - oldHours) > 1e-9;
    if (!current.studentId) {
      // Accounting payments always reference a student; a missing id means the
      // row was tampered with outside supported flows.
      throw new NotFoundError("PAYMENT", tErrors.billing.invoiceNotFound(input.id));
    }
    const studentId: string = current.studentId;

    if (!hoursChanged) {
      // Gateway/note-only edits: single-statement update, no ledger effects.
      await db.transaction(async tx => {
        await AccountingPaymentRepository.update(tx, current.id, {
          paymentGateway: input.paymentGateway,
          paymentNote: input.paymentNote,
        });
      });
      const joined = await AccountingPaymentRepository.findById(current.id);
      if (!joined) throw new NotFoundError("PAYMENT", tErrors.billing.invoiceNotFound(current.id));
      return joined;
    }

    const newHours = requestedHours ?? oldHours;
    const updated = await db.transaction(async tx => {
      // EC-15/EC-16: serialized per student alongside recordPayment.
      await acquireAdvisoryLock(tx, `student_${current.studentId ?? ""}`);

      const delta = Number((newHours - oldHours).toFixed(2));
      if (delta > 0) {
        await StudentRepository.addCreditHours(studentId, tErrors, delta, undefined, tx);
      } else if (delta < 0) {
        await StudentRepository.deductCreditHours(studentId, tErrors, Math.abs(delta), undefined, tx);
        // Low-balance probe after a successful deduction (fire-and-forget).
        void AccountingNotificationService.maybeNotifyLowHours(studentId);
      }

      await CreditRepository.createHourAdjustment(tx, {
        studentId,
        delta,
        sourcePaymentId: current.id,
        creditedByUserId: actorUserId,
        notes: input.paymentNote ?? null,
        idempotencyKey: AccountingPaymentRepository.generateIdempotencyKey({
          studentId: current.studentId ?? "",
          packagePlanId: current.packagePlanId,
          amount: current.amount,
          currency: current.currency,
          paymentDate: current.updatedAt,
          paymentGateway: input.paymentGateway ?? current.paymentGateway,
        }).replace("acctpay-", "acct-edit-"),
      });

      await AccountingPaymentRepository.update(tx, current.id, {
        creditHours: String(newHours),
        paymentGateway: input.paymentGateway,
        paymentNote: input.paymentNote,
      });
      await AccountingPaymentSupport.updateInvoiceCreditHours(tx, current.invoiceId, String(newHours));

      const joined = await AccountingPaymentRepository.findById(current.id, tx);
      if (!joined) throw new Error("accounting payment post-update read failed");
      return joined;
    });

    logger.info("Accounting payment updated", { actorUserId, paymentId: current.id, oldHours, newHours });
    return updated;
  }

  export async function getById(
    actorUserId: string,
    id: string,
    tErrors: ErrorsLabels
  ): Promise<AccountingPaymentReturnType> {
    const row = await AccountingPaymentRepository.findById(id);
    if (!row) {
      throw new NotFoundError("PAYMENT", tErrors.billing.invoiceNotFound(id));
    }
    if (row.studentId) {
      await assertAssociatedOrManage(actorUserId, row.studentId, tErrors, AppPermission.ACCOUNTING_PAYMENTS_VIEW);
    } else {
      await requirePermission(actorUserId, AppPermission.ACCOUNTING_PAYMENTS_VIEW, tErrors);
    }
    return row;
  }

  export async function listPaginated(
    actorUserId: string,
    filter: AccountingPaymentFilter,
    paginationArgs: PaginationArgs | null,
    tErrors: ErrorsLabels
  ): Promise<{ rows: AccountingPaymentReturnType[]; totalCount: number }> {
    if (filter.studentId) {
      // Student-scoped list: associated users OR holders of VIEW.
      await assertAssociatedOrManage(actorUserId, filter.studentId, tErrors, AppPermission.ACCOUNTING_PAYMENTS_VIEW);
    } else {
      await requirePermission(actorUserId, AppPermission.ACCOUNTING_PAYMENTS_VIEW, tErrors);
    }

    const [rows, totalCount] = await Promise.all([
      AccountingPaymentRepository.listPaginated(filter, paginationArgs),
      AccountingPaymentRepository.countForFilter(filter),
    ]);
    return { rows, totalCount };
  }

  export async function getStudentBalance(
    actorUserId: string,
    studentId: string,
    tErrors: ErrorsLabels
  ): Promise<AccountingPaymentBalanceReturnType> {
    await assertAssociatedOrManage(actorUserId, studentId, tErrors, AppPermission.ACCOUNTING_PAYMENTS_VIEW);
    const [balance, threshold, lastPaymentCurrency] = await Promise.all([
      StudentRepository.getCreditHourBalance(studentId),
      resolveLowHoursThreshold(),
      AccountingPaymentRepository.findLastPaymentCurrency(studentId),
    ]);
    return {
      ...balance,
      lowHoursThreshold: threshold.value,
      lastPaymentCurrency,
    };
  }

  /**
   * Derived timeline for the payment detail page (v1 has no persisted event
   * log): payment creation, hour-ledger effects, and the invoice paid state.
   * Chronological ascending, so the view renders newest-first.
   */
  export async function getHistory(
    actorUserId: string,
    paymentId: string,
    tErrors: ErrorsLabels
  ): Promise<AccountingPaymentHistoryEventReturnType[]> {
    const payment = await getById(actorUserId, paymentId, tErrors);

    const events: AccountingPaymentHistoryEventReturnType[] = [
      {
        id: `recorded-${payment.id}`,
        kind: AccountingPaymentHistoryKind.PAYMENT_RECORDED,
        occurredAt: payment.createdAt,
        hoursDelta: null,
        notes: payment.paymentNote,
      },
    ];

    if (payment.isPaidStatusOn) {
      events.push({
        id: `paid-${payment.id}`,
        kind: AccountingPaymentHistoryKind.MARKED_PAID,
        occurredAt: payment.updatedAt,
        hoursDelta: null,
        notes: null,
      });
    }

    const ledgerRows = await CreditRepository.listBySourcePaymentId(paymentId);
    for (const row of ledgerRows) {
      const delta = row.changeAmountHours ?? row.changeAmount;
      const numericDelta = delta === null ? null : Number(delta);
      const isAdjustment = row.reason !== PURCHASE_REASON;
      const isNegative = numericDelta !== null && numericDelta < 0;
      events.push({
        id: row.id,
        kind:
          isNegative || isAdjustment
            ? AccountingPaymentHistoryKind.HOURS_ADJUSTED
            : AccountingPaymentHistoryKind.HOURS_CREDITED,
        occurredAt: row.createdAt,
        hoursDelta: delta === null ? null : String(delta),
        notes: row.notes,
      });
    }

    // Sort newly constructed events array in-place to prevent intermediate array allocation
    return events.sort((a, b) => a.occurredAt.getTime() - b.occurredAt.getTime());
  }
}
