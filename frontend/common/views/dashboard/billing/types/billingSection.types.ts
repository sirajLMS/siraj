import type {
  MarkPaidInvoiceTarget,
  PaymentDetailsTarget,
} from "@/frontend/common/views/dashboard/billing/types/billingViewTypes";
import type {
  ParentBillingSummary,
  ParentInvoiceRow,
} from "@/frontend/common/views/dashboard/billing/types/parentBillingTypes";
import type { BillingLabels } from "@/shared/locale";

export interface BillingSectionSharedProps {
  readonly labels: BillingLabels;
  readonly summary: ParentBillingSummary;
  readonly summaryLoading?: boolean;
  readonly invoices: readonly ParentInvoiceRow[];
  readonly searchQuery: string;
  readonly loading?: boolean;
  readonly isSearchPending?: boolean;
  readonly canView: boolean;
  readonly canSubmitProof: boolean;
  readonly canManage: boolean;
  readonly billingActionsDisabled?: boolean;
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
