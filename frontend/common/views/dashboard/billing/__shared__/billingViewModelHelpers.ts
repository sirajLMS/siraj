import { CurrencyCode } from "@/frontend/common/graphql/generated/gql/graphql-types";
import type { FxDisplayMessages } from "@/frontend/common/lib/buildFxDisplayMessages";
import {
  formatBillingCurrencyTotals,
  mapBillingCurrencyBuckets,
} from "@/frontend/common/lib/formatBillingCurrencyTotals";
import { formatCurrencyForDisplay } from "@/frontend/common/lib/fx-render";
import type { MarkPaidInvoiceTarget } from "@/frontend/common/views/dashboard/billing/types/billingViewTypes";
import type {
  ParentBillingSummary,
  ParentInvoiceRow,
} from "@/frontend/common/views/dashboard/billing/types/parentBillingTypes";
import {
  formatBillingDate,
  formatBillingMonth,
} from "@/frontend/common/views/dashboard/billing/utils/formatBillingDate";
import { deriveParentInvoiceDisplayStatus } from "@/frontend/common/views/dashboard/billing/utils/invoiceDisplayStatus";
import type { BillingLabels, ErrorsLabels } from "@/shared/locale";

/** Structural shape of the display-amount sub-field on an invoice row. */
interface DisplayAmountShape {
  readonly amount: string | null;
  readonly currency: CurrencyCode | null;
  readonly stale: boolean | null;
}

/** Structural shape of an invoice row shared by both billing ViewModels. */
interface InvoiceRowShape {
  readonly id: string | null;
  readonly issueDate: string | null;
  readonly dueDate: string | null;
  readonly paidDate: string | null | undefined;
  readonly hasPaymentProof: boolean | null;
  readonly hasRejectedSubmission: boolean | null;
  readonly amount: string | null;
  readonly currency: CurrencyCode | null;
  readonly displayAmount: {
    readonly amount: string | null;
    readonly currency: CurrencyCode | null;
    readonly stale: boolean | null;
  } | null;
  readonly status: string | null;
  readonly dueDate_status?: unknown;
}

/** Structural shape of the billing summary query result shared by both VMs. */
interface BillingSummaryShape {
  readonly outstandingByCurrency:
    | readonly {
        readonly currency: CurrencyCode | null;
        readonly amount: string | null;
        readonly displayAmount: {
          readonly amount: string | null;
          readonly currency: CurrencyCode | null;
          readonly stale: boolean | null;
        } | null;
      }[]
    | null;
  readonly paidThisTermByCurrency:
    | readonly {
        readonly currency: CurrencyCode | null;
        readonly amount: string | null;
        readonly displayAmount: {
          readonly amount: string | null;
          readonly currency: CurrencyCode | null;
          readonly stale: boolean | null;
        } | null;
      }[]
    | null;
  readonly nextDueDate: string | null;
  readonly activeStudents: number | null;
  readonly nextUnpaidInvoice: {
    readonly id: string | null;
    readonly amount: string | null;
    readonly currency: CurrencyCode | null;
    readonly dueDate: string | null;
    readonly studentName: string | null;
  } | null;
  readonly pendingPaymentCount: number | null;
}

interface SummaryQueryShape {
  readonly parentBillingSummary: BillingSummaryShape | null;
}

/** Options for {@link buildInvoiceRow}. */
export interface BuildInvoiceRowOptions {
  readonly staleDefault: boolean | null;
  readonly currencyDefault: CurrencyCode | null;
}

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

/** Severity for feedback messages (mirrors SnackbarSeverity in both VMs). */
type FeedbackSeverity = "success" | "error" | "info";

/** Args for {@link resolveQuickPayAction}. */
export interface ResolveQuickPayActionArgs<TSummary extends SummaryQueryShape | undefined> {
  readonly billingActionsDisabled: boolean;
  readonly summaryLoading: boolean;
  readonly summaryData: TSummary;
  readonly locale: string;
  readonly fxMessages: FxDisplayMessages;
  readonly labels: BillingLabels;
  readonly tErrors: ErrorsLabels;
  readonly tcLoading: string;
  readonly showFeedback: (message: string, severity: FeedbackSeverity) => void;
  readonly handlePayNow: (invoice: MarkPaidInvoiceTarget) => void;
}

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
