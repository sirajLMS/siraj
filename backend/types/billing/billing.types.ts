import type {
  currencyExchangeAuditLogs,
  currencyExchangeRates,
  currencyHedges,
  fxSyncRuns,
  invoiceCoverageMonths,
  invoicePaymentSubmissions,
  invoices,
  payments,
} from "@/backend/db/schema";
import type {
  FxProvider,
  FxProviderConfigSource,
  FxSyncStatus,
  FxSyncTrigger,
  InvoicePaymentSubmissionStatus,
  InvoiceStatus,
  InvoiceType,
  PaymentMethodType,
} from "@/backend/enum";
import type { PageInfo, PaymentMethodTransactionSnapshot, PaymentProofTransactionSnapshot } from "@/backend/types";
import type { CurrencyCode } from "@/shared/constants/currency.enum";

export type InvoiceSelectType = typeof invoices.$inferSelect;
export type InvoiceInsertType = typeof invoices.$inferInsert;

export type PaymentSelectType = typeof payments.$inferSelect;
export type PaymentInsertType = typeof payments.$inferInsert;

/** Result of resolving the accounting low-hours threshold system setting. */
export interface LowHoursThresholdResolution {
  /** Unparsed setting string (or built-in default) for message interpolation. */
  rawValue: string;
  /** Parsed threshold applied by notifiers and the balance payload; null when unparseable. */
  value: number | null;
}

export type PaymentReturnType = PaymentSelectType & {
  readonly displayAmount?: DisplayAmountReturnType | null;
  readonly precomputedPaymentMethodSnapshot?: unknown;
};

export type PaymentRecordInput = Omit<PaymentInsertType, "id" | "createdAt" | "updatedAt">;

export type CurrencyExchangeRateSelectType = typeof currencyExchangeRates.$inferSelect;
export type CurrencyExchangeRateInsertType = typeof currencyExchangeRates.$inferInsert;

export type CurrencyExchangeRateSubmitInput = Omit<CurrencyExchangeRateInsertType, "id" | "createdAt" | "updatedAt">;

export type CurrencyExchangeRateReturnType = Omit<CurrencyExchangeRateSelectType, "providerResponse">;

export type FxSyncRunSelectType = typeof fxSyncRuns.$inferSelect;

export type FxSyncRunReturnType = Omit<FxSyncRunSelectType, "providerResponse"> & {
  provider: FxProvider;
  status: FxSyncStatus;
};

export type FxRatePair = {
  readonly fromCurrency: CurrencyCode;
  readonly toCurrency: CurrencyCode;
  readonly rate: string;
  readonly source: string;
};

export type FxProviderFetchResult = {
  readonly provider: FxProvider;
  readonly base: CurrencyCode;
  readonly timestamp: Date;
  readonly rates: ReadonlyMap<CurrencyCode, string>;
  readonly rawResponse: unknown;
};

export type RefreshExchangeRatesInput = {
  readonly triggeredByUserId: string | null;
  readonly trigger: FxSyncTrigger;
  readonly force?: boolean;
  readonly locale?: string;
};

export type RefreshExchangeRatesResult = {
  readonly id: string;
  readonly success: boolean;
  readonly pairsWritten: number;
  readonly pairsFailed: number;
  readonly syncRunId: string;
  readonly errorMessage?: string;
};

export type FxSyncHealthReturnType = {
  readonly id: string;
  readonly isStale: boolean;
  readonly status: FxSyncStatus | null;
  readonly finishedAt: Date | null;
};

export type FxProviderConfigReturnType = {
  readonly id: string;
  readonly activeProvider: FxProvider;
  readonly source: FxProviderConfigSource;
  readonly updatedAt: Date | null;
  readonly updatedByUserId: string | null;
  readonly updatedByName: string | null;
};

export type UpsertManualExchangeRateInput = {
  readonly fromCurrency: CurrencyCode;
  readonly toCurrency: CurrencyCode;
  readonly rate: string;
  readonly effectiveDate?: string | null;
};

export type UpsertManualExchangeRateResult = {
  readonly id: string;
  readonly rate: CurrencyExchangeRateReturnType;
};

export type CurrencyHedgeSelectType = typeof currencyHedges.$inferSelect;
export type CurrencyHedgeInsertType = typeof currencyHedges.$inferInsert;

export type CurrencyHedgeSubmitInput = Omit<CurrencyHedgeInsertType, "id" | "createdAt" | "updatedAt">;

export type CurrencyHedgeUpdateInput = Partial<
  Pick<CurrencyHedgeInsertType, "currency" | "amount" | "hedgeType" | "notes">
>;

export type ExchangeRateHistoryRow = {
  readonly id: string;
  readonly fromCurrency: CurrencyCode;
  readonly toCurrency: CurrencyCode;
  readonly rate: string;
  readonly source: string | null;
  readonly effectiveDate: Date;
};

/**
 * Repository-level row for overdue invoice queries (unpaid + past due).
 */
export type OverdueInvoiceRow = {
  readonly invoiceId: string;
  readonly parentId: string;
  readonly amount: string;
  readonly currency: CurrencyCode;
  readonly dueDate: string;
};

/**
 * Repository-level row for parent-user join lookups used in
 * unpaid-invoice summary grouping.
 */
export type ParentUserRow = {
  readonly parentId: string;
  readonly userId: string | null;
  readonly userName: string | null;
  readonly userEmail: string | null;
};

export type ExchangeRateHistoryPaginatedResult = {
  readonly id: string;
  readonly rows: ExchangeRateHistoryRow[];
  readonly totalCount: number;
  readonly pageInfo: PageInfo | null;
};

export type UnpaidInvoiceSummaryItem = {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  totalUnpaidAmount: string;
  currency: CurrencyCode;
  overdueCount: number;
  oldestDueDate: string;
  amountsByCurrency: BillingCurrencyTotal[];
  displayAmount?: DisplayAmountReturnType | null;
};

export type UnpaidInvoicesSummaryResult = {
  id: string;
  totalOverdueInvoices: number;
  totalOverdueAmount: string;
  overdueAmountsByCurrency: BillingCurrencyTotal[];
  items: UnpaidInvoiceSummaryItem[];
};

export type InvoiceHistoryPaginatedResult = {
  readonly id: string;
  readonly rows: InvoiceHistoryRow[];
  readonly totalCount: number;
  readonly pageInfo: PageInfo | null;
};

export type InvoicePaymentSubmissionSelectType = typeof invoicePaymentSubmissions.$inferSelect;
export type InvoicePaymentSubmissionInsertType = typeof invoicePaymentSubmissions.$inferInsert;

export type InvoicePaymentSubmissionReturnType = {
  readonly id: string;
  readonly invoiceId: string;
  readonly fileId: string;
  readonly filePath: string;
  readonly mimeType: string;
  readonly status: InvoicePaymentSubmissionStatus;
  readonly submittedByUserId: string;
  readonly submittedAt: string;
  readonly reviewedByUserId: string | null;
  readonly reviewedAt: string | null;
  readonly rejectionReason: string | null;
};

export type InvoiceHistoryRow = {
  readonly id: string;
  readonly issueDate: string;
  readonly dueDate: string;
  readonly paidDate: string | null;
  readonly amount: string;
  readonly currency: CurrencyCode;
  readonly status: InvoiceStatus;
  readonly invoiceType: InvoiceType;
  readonly studentId: string | null;
  readonly studentName: string | null;
  readonly parentId: string;
  readonly parentUserId: string | null;
  readonly hasPaymentProof: boolean;
  readonly hasRejectedSubmission: boolean;
  readonly displayAmount?: DisplayAmountReturnType | null;
};

export type BillingCurrencyTotal = {
  readonly id: string;
  readonly currency: CurrencyCode;
  readonly amount: string;
  readonly subjectUserId?: string | null;
  readonly displayAmount?: DisplayAmountReturnType | null;
};

export type AdminBillingSummaryResult = {
  readonly id: string;
  readonly totalOutstanding: string;
  readonly pendingCount: number;
  readonly mtdRevenue: string;
  readonly negativeBalanceCount: number;
  readonly outstandingByCurrency: readonly BillingCurrencyTotal[];
  readonly mtdRevenueByCurrency: readonly BillingCurrencyTotal[];
};

export type StudentCreditRow = {
  readonly id: string;
  readonly studentName: string;
  readonly parentEmail: string;
  readonly planType: InvoiceType;
  readonly classesRemaining: number;
  readonly classesTotal: number;
  readonly status: import("@/backend/enum").StudentStatus;
};

export type NextUnpaidInvoiceSummary = {
  readonly id: string;
  readonly amount: string;
  readonly currency: CurrencyCode;
  readonly dueDate: string;
  readonly studentName: string | null;
};

export type ParentBillingSummaryResult = {
  readonly id: string;
  readonly outstandingBalance: string;
  readonly paidThisTerm: string;
  readonly nextDueDate: string | null;
  readonly activeStudents: number;
  readonly nextUnpaidInvoice: NextUnpaidInvoiceSummary | null;
  readonly pendingPaymentCount: number;
  readonly outstandingByCurrency: readonly BillingCurrencyTotal[];
  readonly paidThisTermByCurrency: readonly BillingCurrencyTotal[];
};

/** FX-converted amount for UI display (Decision 3A read path). */
export type DisplayAmountReturnType = {
  readonly id: string;
  readonly amount: string | null;
  readonly currency: CurrencyCode;
  readonly stale: boolean;
};

export type ManualInvoiceResult = {
  readonly id: string;
  readonly parentId: string;
  readonly studentId: string | null;
  readonly amount: string;
  readonly currency: CurrencyCode;
  readonly status: InvoiceStatus;
  readonly invoiceType: InvoiceType;
  readonly issueDate: string;
  readonly dueDate: string;
  readonly paidDate: string | null;
  readonly version: number;
  readonly createdAt: Date;
  readonly displayAmount?: DisplayAmountReturnType | null;
};

export type SendPaymentReminderResult = {
  readonly id: string;
  readonly success: boolean;
};

export type CreateManualInvoiceInput = {
  readonly parentId: string;
  readonly studentId?: string | null;
  readonly amount: string;
  readonly currency: CurrencyCode;
  readonly invoiceType: string;
  readonly issueDate: string;
  readonly dueDate: string;
  readonly exchangeRateSnapshot?: string | null;
  readonly exchangeRateSource?: string | null;
  readonly billingMonths?: readonly { readonly year: number; readonly month: number }[] | null;
  readonly sendEmail?: boolean | null;
  readonly idempotencyKey?: string;
};

export type ManualInvoiceInsertType = Omit<InvoiceInsertType, "id" | "createdAt" | "updatedAt">;

export type InvoiceCoverageMonthSelectType = typeof invoiceCoverageMonths.$inferSelect;

export type InvoiceCoverageMonthInput = Pick<InvoiceCoverageMonthSelectType, "invoiceId" | "year" | "month">;

export type CurrencyExchangeAuditLogInsertType = typeof currencyExchangeAuditLogs.$inferInsert;

export type ExchangeAuditLogInput = Omit<CurrencyExchangeAuditLogInsertType, "id">;

export type MarkInvoicePaidReturnType = {
  readonly id: string;
  readonly parentId: string;
  readonly status: InvoiceStatus;
  readonly paidDate: string | null;
  readonly version: number;
  readonly notificationSummaryUpdated: boolean;
};

export type DeleteInvoiceReturnType = {
  readonly id: string;
  readonly parentId: string;
  readonly version: number;
  readonly notificationSummaryUpdated: boolean;
};

/**
 * Shape shared by `AdminBillingSummaryResult` and `ParentBillingSummaryResult`
 * for display-amount enrichment. Both summaries carry at least one array
 * of `BillingCurrencyTotal` keyed by a string property.
 */
export type BillingSummaryWithCurrencyTotals = {
  readonly id: string;
  readonly outstandingByCurrency: readonly BillingCurrencyTotal[];
  readonly [key: string]: unknown;
};

/**
 * Args for parent-scoped billing resolvers where either `parentId` or
 * `userId` may be supplied (but not both required).
 */
export interface ParentScopedResolverArgs {
  parentId?: string | null;
  userId?: string | null;
}

/**
 * Input for selecting a billing month (year + month).
 */
export type BillingMonthInput = {
  readonly year: number;
  readonly month: number;
};

/**
 * Union of transaction snapshot types stored in the `payment_method_snapshot`
 * JSONB column of `payments` and `teacher_payments`.
 */
export type SnapshotUnion = PaymentMethodTransactionSnapshot | PaymentProofTransactionSnapshot;

/**
 * Shared shape covering the fields common to PaymentReturnType and
 * TeacherPaymentReturnType. Constraining the field builder's `expose`/`field`
 * calls so they type-check correctly.
 */
export interface PaymentFieldShape {
  readonly amount: string;
  readonly currency: CurrencyCode;
  readonly displayAmount?: DisplayAmountReturnType | null;
  readonly paymentDate: Date;
  readonly userPaymentMethodId: string | null;
  readonly paymentMethodType: PaymentMethodType;
  readonly paymentMethodSnapshot: SnapshotUnion | null;
  readonly createdAt: Date;
}
