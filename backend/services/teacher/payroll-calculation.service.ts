import { db } from "@/backend/db/drizzleDb";
import { SchedulingRepository } from "@/backend/db/repo/scheduling";
import { AppPermission } from "@/backend/enum";
import { requirePermission } from "@/backend/services/billing/permission-utils";
import { REPORT_AGGREGATE_ROW_CAP } from "@/backend/services/teacher/payroll-calculation.constants";
import {
  emitOverrideAuditLog,
  validateOverrideInput,
} from "@/backend/services/teacher/payroll-calculation.override.helpers";
import {
  buildRowCountByStatus,
  pickDominantCurrency,
  sumPaidAmounts,
} from "@/backend/services/teacher/payroll-calculation.report.helpers";
import {
  applyOverrideWithinTransaction,
  calculateWithinTransaction,
} from "@/backend/services/teacher/payroll-calculation.transaction.helpers";
import { deriveOverrideIdempotencyKey } from "@/backend/services/teacher/payroll-override.idempotency";
import type {
  DBTransaction,
  PayrollCalculationInput,
  PayrollCalculationResult,
  PayrollOverrideInput,
  PayrollOverrideResult,
  PayrollReportFilters,
  PayrollReportPage,
} from "@/backend/types";
import type { ErrorsLabels } from "@/shared/locale";

export namespace PayrollCalculationService {
  /**
   * Calculates (or re-calculates) the payroll snapshot for one class instance:
   * payable duration per the absence / grace / pro-rating rules, amount from
   * the resolved hourly rate, and an audit event for the status transition.
   *
   * Rows in an operator settlement state (PARTIALLY / REFUND / WAITING_PAID)
   * are returned untouched unless `forceRecalc` is set; PAID rows always
   * reject. Rate-resolution failures persist a NOT_CALCULATED snapshot with
   * the failure reason as the payroll note instead of throwing, so the
   * surrounding state transition never rolls back. Identical re-runs within
   * the idempotency window return the first result without duplicate writes.
   *
   * Pass the caller's transaction to embed the calculation in a wider write
   * (the scheduling state machine does this on terminal transitions). The
   * embedded run relies on the caller row lock and skips the teacher
   * advisory lock (see lockInstanceForPayroll for the lock-ordering rule).
   */
  export async function calculateForInstance(
    input: PayrollCalculationInput,
    tErrors: ErrorsLabels,
    tx?: DBTransaction
  ): Promise<PayrollCalculationResult> {
    await requirePermission(input.actorUserId, AppPermission.ACCOUNTING_PAYROLL_MANAGE, tErrors);
    // A caller-provided tx means the caller already holds the instance row
    // lock; taking the advisory there would invert the standalone
    // advisory-then-row order, so only standalone runs lock both.
    const calculate = (executor: DBTransaction) =>
      calculateWithinTransaction(executor, input, tErrors, { advisoryLock: tx == null });
    return tx ? calculate(tx) : db.transaction(calculate);
  }

  /**
   * Applies an operator override to one instance's payroll snapshot (Refund /
   * Calculated / Not Calculated / Partially) and appends a PAYROLL_OVERRIDE
   * audit event. PAID rows reject; WAITING_PAID rows reject unless `force` is
   * set. The identical override re-submitted within the idempotency window
   * returns the first-applied result without a duplicate event. After the
   * transaction commits, a fresh override is mirrored into the admin audit
   * log (best-effort — see emitOverrideAuditLog).
   */
  export async function applyOverride(
    input: PayrollOverrideInput,
    tErrors: ErrorsLabels
  ): Promise<PayrollOverrideResult> {
    await requirePermission(input.actorUserId, AppPermission.ACCOUNTING_PAYROLL_MANAGE, tErrors);
    validateOverrideInput(input, tErrors);
    const idempotencyKey = deriveOverrideIdempotencyKey(input);
    const { result, auditContext } = await db.transaction(tx =>
      applyOverrideWithinTransaction(tx, input, idempotencyKey, tErrors)
    );
    if (auditContext) {
      await emitOverrideAuditLog(input, auditContext);
    }
    return result;
  }

  /**
   * Reads one page of the payroll report plus aggregates over the full
   * filtered set: the exact decimal sum of paid amounts, the dominant
   * currency, and row counts per calculation status (every status key
   * present). The aggregate scan is bounded by the export ceiling.
   */
  export async function getReport(
    actorUserId: string,
    filters: PayrollReportFilters,
    pagination: { limit: number; offset: number },
    tErrors: ErrorsLabels
  ): Promise<PayrollReportPage> {
    await requirePermission(actorUserId, AppPermission.ACCOUNTING_PAYROLL_VIEW, tErrors);

    const page = await SchedulingRepository.findPayrollReportRows(filters, pagination);

    // Aggregates describe the filtered set, not just the requested page; when
    // the whole set already sits on this page no second scan is needed.
    const aggregateRows =
      pagination.offset === 0 && page.totalCount <= pagination.limit
        ? page.rows
        : (
            await SchedulingRepository.findPayrollReportRows(filters, {
              limit: REPORT_AGGREGATE_ROW_CAP,
              offset: 0,
            })
          ).rows;

    return {
      rows: page.rows,
      totalCount: page.totalCount,
      aggregates: {
        totalPaidAmount: sumPaidAmounts(aggregateRows),
        totalPaidCurrency: pickDominantCurrency(aggregateRows),
        rowCountByStatus: buildRowCountByStatus(aggregateRows),
      },
    };
  }
}
