import type { CurrencyHedgesLabels } from "@/shared/locale/types/dashboard/billing/currencyHedges";
import type { ExchangeRatesLabels } from "@/shared/locale/types/dashboard/billing/exchangeRates";
import type { BillingManualLabels } from "@/shared/locale/types/dashboard/billing/manual";
import type { PaymentComponentLabels } from "@/shared/locale/types/dashboard/billing/payment";
import type { SupportedCurrenciesLabels } from "@/shared/locale/types/dashboard/billing/supportedCurrencies";
import type { AdminInvoiceStatus, StudentCreditStatus } from "@/shared/types/billing-view";

export interface BillingLabels extends PaymentComponentLabels {
  readonly adminPageTitle: string;
  readonly adminPageSubtitle: string;
  readonly parentPageTitle: string;
  readonly parentPageSubtitle: string;
  readonly manualInvoice: string;
  readonly exchangeRatesLink: string;
  readonly quickPay: string;
  readonly viewAllNegativeBalance: string;
  readonly requiresAttention: string;
  readonly showingResults: (shown: number, total: number) => string;
  readonly invalidUserId: string;
  readonly billingProfileTitle: string;
  readonly profileForUser: (userId: string) => string;
  readonly reminderSent: string;
  readonly reminderFailed: string;
  readonly adminMetrics: {
    readonly totalOutstanding: string;
    readonly pendingInvoices: string;
    readonly negativeBalance: (count: number) => string;
    readonly mtdRevenue: string;
  };
  readonly parentMetrics: {
    readonly outstandingBalance: string;
    readonly paidThisTerm: string;
    readonly nextDueDate: string;
    readonly activeStudents: string;
  };
  readonly sections: {
    readonly recentInvoices: string;
    readonly studentCreditStatus: string;
    readonly invoiceHistory: string;
    readonly invoiceHistorySubtitle: string;
  };
  readonly search: {
    readonly invoicesPlaceholder: string;
    readonly parentPlaceholder: string;
    readonly searching: string;
  };
  readonly adminTable: {
    readonly invoiceId: string;
    readonly studentName: string;
    readonly dateIssued: string;
    readonly amount: string;
    readonly status: string;
    readonly actions: string;
    readonly markAsPaid: string;
    readonly quickPay: string;
    readonly reviewSubmission: string;
    readonly viewRejection: string;
    readonly deleteInvoice: string;
    readonly noEntries: string;
  };
  readonly creditTable: {
    readonly student: string;
    readonly parentContact: string;
    readonly planType: string;
    readonly classesLeft: string;
    readonly status: string;
    readonly quickAction: string;
    readonly sendReminder: string;
    readonly negativeBalance: string;
    readonly activeCredit: string;
    readonly noEntries: string;
    readonly showingNegativeBalanceOnly: string;
    readonly clearFilter: string;
  };
  readonly parentTable: {
    readonly invoiceNumber: string;
    readonly month: string;
    readonly issueDate: string;
    readonly dueDate: string;
    readonly paidDate: string;
    readonly fee: string;
    readonly status: string;
    readonly options: string;
    readonly viewDetails: string;
    readonly downloadPdf: string;
    readonly payNow: string;
    readonly viewSubmission: string;
    readonly viewFeedback: string;
    readonly noEntries: string;
    readonly emptyTitle: string;
    readonly emptySubtitle: string;
  };
  readonly invoiceStatus: Record<AdminInvoiceStatus, string>;
  readonly creditStatus: Record<StudentCreditStatus, string>;
  readonly manual: BillingManualLabels;
  readonly markAsPaidSuccess: string;
  readonly submitProofSuccess: string;
  readonly approveProofSuccess: string;
  readonly rejectProofSuccess: string;
  readonly deleteInvoiceSuccess: string;
  readonly deleteInvoiceDialog: {
    readonly title: string;
    readonly body: (invoiceId: string) => string;
    readonly confirm: string;
  };
  readonly noUnpaidInvoices: string;
  readonly submitProofDialog: {
    readonly titleSubmit: string;
    readonly titleMarkPaid: string;
    readonly confirm: string;
    readonly confirmMarkPaid: string;
    readonly confirming: string;
    readonly selectFile: string;
    readonly fileHint: string;
    readonly invalidFileType: string;
    readonly fileTooLarge: (maxMb: number) => string;
    readonly cancel: string;
    readonly errorGeneric: string;
    readonly invoiceNumber: string;
    readonly amount: string;
    readonly dueDate: string;
    readonly student: string;
    readonly uploadFailed: string;
    readonly uploadPrepareFailed: string;
    readonly impersonationBlocked: string;
  };
  readonly paymentDetailsDialog: {
    readonly title: string;
    readonly empty: string;
    readonly pending: string;
    readonly approve: string;
    readonly reject: string;
    readonly rejecting: string;
    readonly approving: string;
    readonly rejected: string;
    readonly rejectionReason: string;
    readonly rejectionReasonPlaceholder: string;
    readonly viewProof: string;
    readonly viewProofFailed: string;
    readonly noProof: string;
    readonly loadFailed: string;
    readonly close: string;
    readonly amount: string;
    readonly date: string;
    readonly submittedAt: string;
    readonly reviewActions: string;
    readonly tryAgain: string;
    readonly confirmReject: string;
    readonly confirmRejectMessage: string;
  };
  readonly notifications: {
    readonly popupBlocked: string;
    readonly paymentPendingReview: string;
  };
  readonly hasPaymentProofHint: string;
  readonly errors: {
    readonly invalidId: string;
    readonly retry: string;
  };
  readonly exchangeRates: ExchangeRatesLabels;
  readonly fxStaleBanner: {
    readonly adminBody: string;
    readonly userBody: string;
    readonly adminCta: string;
    readonly userCta: string;
  };
  readonly displayCurrencyHint: {
    readonly title: string;
    readonly body: string;
    readonly cta: string;
    readonly dismiss: string;
    readonly subject: {
      readonly title: string;
      readonly body: string;
      readonly cta: string;
      readonly dismiss: string;
    };
  };
  readonly fxConversionNote: (code: string) => string;
  readonly fxConversionNoteSubject: (code: string) => string;
  readonly adminBillingFxNote: string;
  readonly displayCurrencyMixed: (values: { lockedAmount: string; lockedCurrency: string }) => string;
  readonly displayCurrencyNotSet: (values: { lockedAmount: string; lockedCurrency: string }) => string;
  readonly displayCurrencyStale: (values: { lockedAmount: string; lockedCurrency: string }) => string;
  readonly currencyHedges: CurrencyHedgesLabels;
  readonly supportedCurrencies: SupportedCurrenciesLabels;
}
