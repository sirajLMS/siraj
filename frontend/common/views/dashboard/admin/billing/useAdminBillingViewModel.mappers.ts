import {
  type AdminBillingSummaryQuery_adminBillingSummary,
  type AdminInvoicesQuery_adminInvoices,
  CurrencyCode,
  type InvoiceType as GqlInvoiceType,
  type StudentStatus as GqlStudentStatus,
  type StudentCreditStatusQuery_studentCreditStatus,
} from "@/frontend/common/graphql/generated/gql/graphql";
import type { FxDisplayMessages } from "@/frontend/common/lib/buildFxDisplayMessages";
import {
  formatBillingCurrencyTotals,
  mapBillingCurrencyBuckets,
} from "@/frontend/common/lib/formatBillingCurrencyTotals";
import { formatCurrencyForDisplay } from "@/frontend/common/lib/fx-render";
import {
  deriveInitials,
  formatDate,
} from "@/frontend/common/views/dashboard/admin/billing/useAdminBillingViewModel.helpers";
import type {
  AdminBillingSummary,
  AdminInvoiceRow,
  StudentCreditRow,
} from "@/frontend/common/views/dashboard/billing/types/billingViewTypes";
import { deriveAdminInvoiceDisplayStatus } from "@/frontend/common/views/dashboard/billing/utils/invoiceDisplayStatus";

/** Maps the admin invoice page onto the display rows the grid renders. */
export function mapInvoiceRows(
  page: AdminInvoicesQuery_adminInvoices | null | undefined,
  locale: string,
  fxMessages: FxDisplayMessages
): AdminInvoiceRow[] {
  return (page?.rows ?? []).map(inv => ({
    id: inv.id ?? "",
    studentId: inv.studentId ?? null,
    studentName: inv.studentName ?? inv.studentId ?? "Student",
    studentInitials: deriveInitials(inv.studentName),
    dateIssued: formatDate(inv.issueDate, locale),
    dueDate: formatDate(inv.dueDate, locale),
    amount: formatCurrencyForDisplay(
      inv.amount ?? "0",
      inv.currency ?? CurrencyCode.Usd,
      inv.displayAmount
        ? {
            amount: inv.displayAmount.amount,
            currency: inv.displayAmount.currency ?? CurrencyCode.Usd,
            stale: inv.displayAmount.stale ?? true,
          }
        : null,
      locale,
      fxMessages
    ),
    status: deriveAdminInvoiceDisplayStatus(inv.status, inv.dueDate),
    parentUserId: inv.parentUserId ?? null,
    hasPaymentProof: inv.hasPaymentProof ?? false,
    hasRejectedSubmission: inv.hasRejectedSubmission ?? false,
  }));
}

/** Maps the billing summary buckets onto the four headline figures. */
export function mapBillingSummary(
  summary: AdminBillingSummaryQuery_adminBillingSummary | null | undefined,
  locale: string,
  fxMessages: FxDisplayMessages
): AdminBillingSummary {
  const outstandingTotals = formatBillingCurrencyTotals(
    mapBillingCurrencyBuckets(summary?.outstandingByCurrency),
    locale,
    fxMessages
  );
  const mtdRevenueTotals = formatBillingCurrencyTotals(
    mapBillingCurrencyBuckets(summary?.mtdRevenueByCurrency),
    locale,
    fxMessages
  );

  return {
    totalOutstanding: outstandingTotals.primary,
    totalOutstandingSubLabel: outstandingTotals.breakdown,
    pendingInvoices: summary?.pendingCount ?? 0,
    negativeBalanceCount: summary?.negativeBalanceCount ?? 0,
    mtdRevenue: mtdRevenueTotals.primary,
    mtdRevenueSubLabel: mtdRevenueTotals.breakdown,
  };
}

type CompleteCreditRow = {
  id: string;
  studentName: string;
  parentEmail: string;
  planType: GqlInvoiceType | null;
  classesRemaining: number;
  classesTotal: number;
  status: GqlStudentStatus;
};

function isCompleteCreditRow(row: StudentCreditStatusQuery_studentCreditStatus): row is CompleteCreditRow {
  return row.id != null && row.studentName != null && row.parentEmail != null && row.status != null;
}

/** Drops rows missing their identity fields and derives the credit status from the balance. */
export function mapCreditRows(
  rows: readonly StudentCreditStatusQuery_studentCreditStatus[] | null | undefined
): StudentCreditRow[] {
  return (rows ?? []).filter(isCompleteCreditRow).map(row => ({
    id: row.id,
    studentName: row.studentName,
    parentEmail: row.parentEmail,
    planType: row.planType,
    classesLeft: row.classesRemaining,
    classesTotal: row.classesTotal,
    status: row.classesRemaining === 0 ? ("negative_balance" as const) : ("active_credit" as const),
  }));
}
