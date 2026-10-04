import { CreditRepository } from "@/backend/db/repo/billing";
import { StudentRepository } from "@/backend/db/repo/students";
import { ConflictError, ValidationError } from "@/backend/lib";
import { runIdempotentBookingLedgerOp } from "@/backend/services/billing/credit.service.helpers";
import { QuotaService } from "@/backend/services/billing/quota.service";
import type { DBTransaction } from "@/backend/types";
import type { ErrorsLabels } from "@/shared/locale";

/** Consumes HOURS for an hour-billed class instance. */
export async function deductHoursForBookingFlow(
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
export async function refundHoursOnCancelFlow(
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

/** Consumes one class credit for a booking. */
export async function deductForBookingFlow(
  studentId: string,
  classInstanceId: string,
  creditedByUserId: string,
  idempotencyKey: string,
  tx: DBTransaction,
  tErrors: ErrorsLabels
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

/** Restores one class credit when a booking is cancelled pre-start. */
export async function refundOnCancelFlow(
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
