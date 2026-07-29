import type { InvoiceType } from "@/frontend/common/graphql/generated/gql/graphql-types";
import type {
  ParentBillingSummary,
  ParentInvoiceRow,
} from "@/frontend/common/views/dashboard/billing/types/parentBillingTypes";
import type { BillingLabels } from "@/shared/locale";
import type { AdminInvoiceStatus, StudentCreditStatus } from "@/shared/types/billing-view";

export interface MarkPaidInvoiceTarget {
  readonly id: string;
  readonly parentUserId?: string | null;
  readonly amount?: string;
  readonly studentName?: string | null;
  readonly dueDate?: string | null;
  readonly invoiceNumber?: string;
}

export interface PaymentDetailsTarget {
  readonly invoiceId: string;
  readonly parentUserId?: string | null;
}

export interface AdminBillingSummary {
  readonly totalOutstanding: string;
  readonly totalOutstandingSubLabel?: string;
  readonly pendingInvoices: number;
  readonly negativeBalanceCount: number;
  readonly mtdRevenue: string;
  readonly mtdRevenueSubLabel?: string;
}

export interface AdminInvoiceRow {
  readonly id: string;
  readonly studentId: string | null;
  readonly studentName: string;
  readonly studentInitials: string;
  readonly dateIssued: string;
  readonly dueDate: string;
  readonly amount: string;
  readonly status: AdminInvoiceStatus;
  readonly parentUserId: string | null;
  readonly hasPaymentProof: boolean;
  readonly hasRejectedSubmission: boolean;
}

export interface StudentCreditRow {
  readonly id: string;
  readonly studentName: string;
  readonly parentEmail: string;
  readonly planType: InvoiceType | null;
  readonly classesLeft: number | null;
  readonly classesTotal: number | null;
  readonly status: StudentCreditStatus;
}

export interface BillingCapabilityProps {
  readonly canManage: boolean;
  readonly canSubmitProof: boolean;
  readonly canView: boolean;
  readonly canCreate: boolean;
  readonly canViewExchangeRates?: boolean;
}

export type CreditFilter = "all" | "negative_balance";

export interface AdminBillingViewProps extends BillingCapabilityProps {
  readonly labels: BillingLabels;
  readonly summary: AdminBillingSummary;
  readonly summaryLoading?: boolean;
  readonly invoices: readonly AdminInvoiceRow[];
  readonly creditRows: readonly StudentCreditRow[];
  readonly loading?: boolean;
  readonly isSearchPending?: boolean;
  readonly billingActionsDisabled?: boolean;
  readonly creditFilter: CreditFilter;
  readonly searchQuery: string;
  readonly onSearchChange: (value: string) => void;
  readonly onMarkAsPaid: (invoice: MarkPaidInvoiceTarget) => void;
  readonly onViewPaymentDetails?: (target: PaymentDetailsTarget) => void;
  readonly onSendReminder: (id: string) => void;
  readonly onManualInvoice: () => void;
  readonly onViewAllNegativeBalance: () => void;
  readonly onClearCreditFilter: () => void;
  readonly onDeleteInvoice?: (id: string) => void;
  readonly canDelete?: boolean;
  readonly deletingInvoice?: boolean;
  readonly creditLoading?: boolean;
  readonly creditError?: Error | null;
  readonly sendingReminderId?: string | null;
  readonly page?: number;
  readonly pageSize?: number;
  readonly totalCount?: number;
  readonly onPageChange?: (page: number) => void;
}

export interface ParentBillingViewProps extends BillingCapabilityProps {
  readonly labels: BillingLabels;
  readonly summary: ParentBillingSummary;
  readonly summaryLoading?: boolean;
  readonly invoices: readonly ParentInvoiceRow[];
  readonly loading?: boolean;
  readonly isSearchPending?: boolean;
  readonly billingActionsDisabled?: boolean;
  readonly searchQuery: string;
  readonly onSearchChange: (value: string) => void;
  readonly onPayNow: (invoice: MarkPaidInvoiceTarget) => void;
  readonly onMarkAsPaid?: (invoice: MarkPaidInvoiceTarget) => void;
  readonly onViewPaymentDetails?: (target: PaymentDetailsTarget) => void;
  readonly onDownloadPdf: (id: string) => void;
  readonly onQuickPay: () => void;
  readonly page?: number;
  readonly pageSize?: number;
  readonly totalCount?: number;
  readonly onPageChange?: (page: number) => void;
}
