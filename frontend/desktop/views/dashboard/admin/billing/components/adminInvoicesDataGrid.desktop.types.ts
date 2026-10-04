import type {
  AdminInvoiceRow,
  MarkPaidInvoiceTarget,
  PaymentDetailsTarget,
} from "@/frontend/common/views/dashboard/billing/types/billingViewTypes";
import type { AdminInvoiceStatus } from "@/shared/types";

/** Localized column headers and row-action labels for the admin invoices grid. */
export interface AdminInvoicesDataGridLabels {
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
  readonly viewDetails: string;
  readonly deleteInvoice: string;
  readonly noEntries: string;
  readonly statusLabels: Record<AdminInvoiceStatus, string>;
}

/** Per-row inputs for rendering the action cell of an admin invoice row. */
export interface RenderInvoiceActionConfig {
  readonly row: AdminInvoiceRow;
  readonly labels: AdminInvoicesDataGridLabels;
  readonly canManage: boolean;
  readonly canDelete: boolean;
  readonly billingActionsDisabled: boolean;
}

/** Handlers the action cell may invoke, mirroring the grid's callback props. */
export interface AdminInvoiceActionHandlers {
  readonly onMarkAsPaid: (invoice: MarkPaidInvoiceTarget) => void;
  readonly onViewPaymentDetails?: (target: PaymentDetailsTarget) => void;
  readonly onDeleteInvoice?: (invoiceId: string) => void;
}
