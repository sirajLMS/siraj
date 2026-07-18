// NEW FOR PLAN v5: Unified Base Props + Base Labels for the
// admin-invoices card-list (mobile) / data-grid (desktop) pair per
// specs.md §4.3. The label sets genuinely diverge (desktop data-grid
// needs per-column header labels that the mobile card-list doesn't show
// because rows supply those values inline). Each tier's interface extends
// `BaseAdminInvoicesListProps` with the extra labels it needs and is tagged
// with a `// VARIANT JUSTIFICATION: extra field <name>` line.
import type {
  AdminInvoiceRow,
  AdminInvoiceStatus,
  MarkPaidInvoiceTarget,
  PaymentDetailsTarget,
} from "@/frontend/common/views/dashboard/billing/types/billingViewTypes";

export interface BaseAdminInvoicesListLabels {
  readonly markAsPaid: string;
  readonly quickPay: string;
  readonly reviewSubmission: string;
  readonly viewRejection: string;
  readonly viewDetails: string;
  readonly deleteInvoice: string;
  readonly statusLabels: Record<AdminInvoiceStatus, string>;
}

export interface BaseAdminInvoicesListProps {
  readonly rows: readonly AdminInvoiceRow[];
  readonly canManage: boolean;
  readonly canDelete?: boolean;
  readonly billingActionsDisabled?: boolean;
  readonly loading?: boolean;
  readonly onMarkAsPaid: (invoice: MarkPaidInvoiceTarget) => void;
  readonly onViewPaymentDetails?: (target: PaymentDetailsTarget) => void;
  readonly onDeleteInvoice?: (invoiceId: string) => void;
  readonly page?: number;
  readonly pageSize?: number;
  readonly totalCount?: number;
  readonly onPageChange?: (page: number) => void;
}
