import { CurrencyCode } from "@/frontend/common/graphql/generated/gql/graphql";
import type { FxDisplayMessages } from "@/frontend/common/lib/buildFxDisplayMessages";
import {
  formatBillingCurrencyTotals,
  mapBillingCurrencyBuckets,
} from "@/frontend/common/lib/formatBillingCurrencyTotals";
import { formatCurrencyForDisplay } from "@/frontend/common/lib/fx-render";
import type {
  BuildInvoiceRowOptions,
  DisplayAmountShape,
  InvoiceRowShape,
  SummaryQueryShape,
} from "@/frontend/common/views/dashboard/billing/__shared__/billingViewModelHelpers.types";
import type {
  ParentBillingSummary,
  ParentInvoiceRow,
} from "@/frontend/common/views/dashboard/billing/types/parentBillingTypes";
import {
  formatBillingDate,
  formatBillingMonth,
} from "@/frontend/common/views/dashboard/billing/utils/formatBillingDate";
import { deriveParentInvoiceDisplayStatus } from "@/frontend/common/views/dashboard/billing/utils/invoiceDisplayStatus";

export { resolveQuickPayAction } from "@/frontend/common/views/dashboard/billing/__shared__/billingViewModelHelpers.quickPay";
export type { BuildInvoiceRowOptions } from "@/frontend/common/views/dashboard/billing/__shared__/billingViewModelHelpers.types";

/**
 * Maps a raw GraphQL invoice row to a {@link ParentInvoiceRow}.
 * Shared by `useParentBillingViewModel` and `useUserBillingProfileViewModel`.
 */
export function buildInvoiceRow(
  inv: InvoiceRowShape,
  locale: string,
  fxMessages: FxDisplayMessages,
  opts: BuildInvoiceRowOptions
): ParentInvoiceRow {
  const id = inv.id ?? "";
  const displayAmount: DisplayAmountShape | null = inv.displayAmount
    ? {
        amount: inv.displayAmount.amount,
        currency: inv.displayAmount.currency ?? opts.currencyDefault,
        stale: inv.displayAmount.stale ?? opts.staleDefault,
      }
    : null;

  return {
    id,
    invoiceNumber: id.slice(0, 8).toUpperCase(),
    month: formatBillingMonth(inv.issueDate, locale),
    issueDate: formatBillingDate(inv.issueDate, locale),
    dueDate: formatBillingDate(inv.dueDate, locale),
    paidDate: inv.paidDate ? formatBillingDate(inv.paidDate, locale) : "\u2014",
    hasPaymentProof: inv.hasPaymentProof ?? false,
    hasRejectedSubmission: inv.hasRejectedSubmission ?? false,
    fee: formatCurrencyForDisplay(
      inv.amount ?? "0",
      inv.currency ?? CurrencyCode.Usd,
      displayAmount,
      locale,
      fxMessages
    ),
    status: deriveParentInvoiceDisplayStatus(inv.status, inv.dueDate),
  };
}

/**
 * Builds a {@link ParentBillingSummary} from a summary query result.
 * `summaryData` is generic over the structural shape — both
 * `Operations.ParentBillingSummaryQuery` and `Operations.UserBillingProfileSummaryQuery`
 * satisfy it.
 */
export function buildParentBillingSummary(
  summaryData: SummaryQueryShape | undefined,
  locale: string,
  fxMessages: FxDisplayMessages
): ParentBillingSummary {
  const outstandingTotals = formatBillingCurrencyTotals(
    mapBillingCurrencyBuckets(summaryData?.parentBillingSummary?.outstandingByCurrency),
    locale,
    fxMessages
  );
  const paidThisTermTotals = formatBillingCurrencyTotals(
    mapBillingCurrencyBuckets(summaryData?.parentBillingSummary?.paidThisTermByCurrency),
    locale,
    fxMessages
  );

  return {
    outstandingBalance: outstandingTotals.primary,
    outstandingBalanceSubLabel: outstandingTotals.breakdown,
    paidThisTerm: paidThisTermTotals.primary,
    paidThisTermSubLabel: paidThisTermTotals.breakdown,
    nextDueDate: formatBillingDate(summaryData?.parentBillingSummary?.nextDueDate ?? null, locale),
    activeStudents: String(summaryData?.parentBillingSummary?.activeStudents ?? 0),
  };
}
