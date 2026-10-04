import type { CurrencyCode } from "@/frontend/common/graphql/generated/gql/graphql";
import type { FxDisplayMessages } from "@/frontend/common/lib/buildFxDisplayMessages";
import type { MarkPaidInvoiceTarget } from "@/frontend/common/views/dashboard/billing/types/billingViewTypes";
import type { BillingLabels, ErrorsLabels } from "@/shared/locale";

/** Structural shape of the display-amount sub-field on an invoice row. */
export interface DisplayAmountShape {
  readonly amount: string | null;
  readonly currency: CurrencyCode | null;
  readonly stale: boolean | null;
}

/** Structural shape of an invoice row shared by both billing ViewModels. */
export interface InvoiceRowShape {
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

export interface SummaryQueryShape {
  readonly parentBillingSummary: BillingSummaryShape | null;
}

/** Options for {@link buildInvoiceRow}. */
export interface BuildInvoiceRowOptions {
  readonly staleDefault: boolean | null;
  readonly currencyDefault: CurrencyCode | null;
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
