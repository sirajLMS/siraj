import type { BillingLabels } from "@/shared/messages/types/dashboard/billing";
import type { ParentBillingSummary, ParentInvoiceRow } from "./parentBillingTypes";

export type AdminInvoiceStatus = "overdue" | "pending" | "paid";

export type StudentCreditStatus = "negative_balance" | "active_credit";

export interface AdminBillingSummary {
  readonly totalOutstanding: string;
  readonly pendingInvoices: number;
  readonly negativeBalanceCount: string;
  readonly mtdRevenue: string;
}

export interface AdminInvoiceRow {
  readonly id: string;
  readonly studentName: string;
  readonly studentInitials: string;
  readonly dateIssued: string;
  readonly amount: string;
  readonly status: AdminInvoiceStatus;
}

export interface StudentCreditRow {
  readonly id: string;
  readonly studentName: string;
  readonly parentEmail: string;
  readonly planType: string;
  readonly classesLeft: number;
  readonly classesTotal: number;
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
  readonly searchQuery: string;
  readonly onSearchChange: (value: string) => void;
  readonly onMarkAsPaid: (id: string) => void;
  readonly onSendReminder: (id: string) => void;
  readonly onManualInvoice: () => void;
  readonly onDeleteInvoice?: (id: string) => void;
  readonly markingPaid?: boolean;
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
  readonly searchQuery: string;
  readonly onSearchChange: (value: string) => void;
  readonly onPayNow: (id: string) => void;
  readonly onDownloadPdf: (id: string) => void;
  readonly onQuickPay: () => void;
}
