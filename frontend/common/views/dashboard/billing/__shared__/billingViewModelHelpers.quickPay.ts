import { CurrencyCode } from "@/frontend/common/graphql/generated/gql/graphql";
import { formatCurrencyForDisplay } from "@/frontend/common/lib/fx-render";
import type {
  ResolveQuickPayActionArgs,
  SummaryQueryShape,
} from "@/frontend/common/views/dashboard/billing/__shared__/billingViewModelHelpers.types";
import { formatBillingDate } from "@/frontend/common/views/dashboard/billing/utils/formatBillingDate";

/**
 * Resolves the quick-pay flow: checks disabled/loading, finds the next unpaid
 * invoice, formats it, and triggers `handlePayNow`. Falls back to feedback
 * messages for pending or no-unpaid states.
 */
export function resolveQuickPayAction<TSummary extends SummaryQueryShape | undefined>(
  args: ResolveQuickPayActionArgs<TSummary>
): void {
  const {
    billingActionsDisabled,
    summaryLoading,
    summaryData,
    locale,
    fxMessages,
    labels,
    tErrors,
    tcLoading,
    showFeedback,
    handlePayNow,
  } = args;

  if (billingActionsDisabled) {
    showFeedback(tErrors.auth.impersonationNotAllowedDuringSession, "error");
    return;
  }

  if (summaryLoading) {
    showFeedback(tcLoading, "info");
    return;
  }

  const nextUnpaid = summaryData?.parentBillingSummary?.nextUnpaidInvoice;
  if (nextUnpaid?.id) {
    handlePayNow({
      id: nextUnpaid.id,
      amount: formatCurrencyForDisplay(
        nextUnpaid.amount ?? "0",
        nextUnpaid.currency ?? CurrencyCode.Usd,
        null,
        locale,
        fxMessages
      ),
      dueDate: formatBillingDate(nextUnpaid.dueDate, locale),
      invoiceNumber: nextUnpaid.id.slice(0, 8).toUpperCase(),
      studentName: nextUnpaid.studentName,
    });
    return;
  }

  const pendingCount = summaryData?.parentBillingSummary?.pendingPaymentCount ?? 0;
  if (pendingCount > 0) {
    showFeedback(labels.notifications.paymentPendingReview, "info");
    return;
  }

  showFeedback(labels.noUnpaidInvoices, "info");
}
