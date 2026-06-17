import type { AdminBillingSummary, AdminInvoiceRow, StudentCreditRow } from "@/frontend/stores/mockAdminBillingStore";
import type { ParentBillingSummary, ParentInvoiceRow } from "@/frontend/stores/moackParentBillingStore";
import type { BillingLabels } from "@/shared/messages/types/dashboard/billing";

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
