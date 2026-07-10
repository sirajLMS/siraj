import type { InvoiceType } from "@/frontend/graphql/generated/gql/graphql-types";
import type {
  ParentBillingSummary,
  ParentInvoiceRow,
} from "@/frontend/views/dashboard/billing/types/parentBillingTypes";
import type { BillingLabels } from "@/shared/messages/types/dashboard/billing";
import type { AdminInvoiceStatus, CoreInvoiceStatus, StudentCreditStatus } from "@/shared/types/billing-view";

export type { AdminInvoiceStatus, CoreInvoiceStatus, StudentCreditStatus };

export interface MarkPaidInvoiceTarget {
  readonly id: string;
  readonly parentUserId?: string | null;
}

export interface AdminBillingSummary {
  readonly totalOutstanding: string;
  readonly pendingInvoices: number;
  readonly negativeBalanceCount: string;
  readonly mtdRevenue: string;
}

export interface AdminInvoiceRow {
  readonly id: string;
  readonly studentId: string | null;
  readonly studentName: string;
  readonly studentInitials: string;
  readonly dateIssued: string;
  readonly amount: string;
  readonly status: AdminInvoiceStatus;
  readonly parentUserId: string | null;
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
  readonly canView: boolean;
  readonly canCreate: boolean;
}

export interface AdminBillingViewProps extends BillingCapabilityProps {
  readonly labels: BillingLabels;
  readonly summary: AdminBillingSummary;
  readonly invoices: readonly AdminInvoiceRow[];
  readonly creditRows: readonly StudentCreditRow[];
  readonly loading?: boolean;
  readonly searchQuery: string;
  readonly onSearchChange: (value: string) => void;
  readonly onMarkAsPaid: (invoice: MarkPaidInvoiceTarget) => void;
  readonly onViewPaymentDetails?: (invoiceId: string) => void;
  readonly onSendReminder: (id: string) => void;
  readonly onManualInvoice: () => void;
  readonly onDeleteInvoice?: (id: string) => void;
  readonly deletingInvoice?: boolean;
  readonly page?: number;
  readonly pageSize?: number;
  readonly totalCount?: number;
  readonly onPageChange?: (page: number) => void;
}

export interface ParentBillingViewProps extends BillingCapabilityProps {
  readonly labels: BillingLabels;
  readonly summary: ParentBillingSummary;
  readonly invoices: readonly ParentInvoiceRow[];
  readonly loading?: boolean;
  readonly searchQuery: string;
  readonly onSearchChange: (value: string) => void;
  readonly onPayNow: (invoice: MarkPaidInvoiceTarget) => void;
  readonly onViewPaymentDetails?: (invoiceId: string) => void;
  readonly onDownloadPdf: (id: string) => void;
  readonly onQuickPay: () => void;
  readonly page?: number;
  readonly pageSize?: number;
  readonly totalCount?: number;
  readonly onPageChange?: (page: number) => void;
}
