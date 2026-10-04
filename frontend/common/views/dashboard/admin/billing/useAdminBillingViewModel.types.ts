import type { SnackbarSeverity } from "@/frontend/common/stores/__shared__";
import type {
  AdminBillingSummary,
  AdminInvoiceRow,
  CreditFilter,
  MarkPaidInvoiceTarget,
  PaymentDetailsTarget,
  StudentCreditRow,
} from "@/frontend/common/views/dashboard/billing/types/billingViewTypes";
import type { buildBillingLabels } from "@/frontend/common/views/dashboard/billing/utils/buildBillingLabels";

export type UseAdminBillingViewModelProps = Record<string, never>;

export interface AdminBillingViewModel {
  readonly labels: ReturnType<typeof buildBillingLabels>;
  readonly summary: AdminBillingSummary;
  readonly summaryLoading: boolean;
  readonly summaryError: Error | null;
  readonly invoices: readonly AdminInvoiceRow[];
  readonly invoicesLoading: boolean;
  readonly invoicesError: Error | null;
  readonly creditRows: readonly StudentCreditRow[];
  readonly creditLoading: boolean;
  readonly creditError: Error | null;
  readonly sendingReminderId: string | null;
  readonly searchQuery: string;
  readonly isSearchPending: boolean;
  readonly billingActionsDisabled: boolean;
  readonly creditFilter: CreditFilter;
  readonly canManage: boolean;
  readonly canCreate: boolean;
  readonly canDelete: boolean;
  readonly canViewExchangeRates: boolean;
  readonly deletingInvoice: boolean;
  readonly page: number;
  readonly pageSize: number;
  readonly totalCount: number | undefined;
  readonly onSearchChange: (value: string) => void;
  readonly onMarkAsPaid: (invoice: MarkPaidInvoiceTarget) => void;
  readonly onViewPaymentDetails: (target: PaymentDetailsTarget) => void;
  readonly onSendReminder: (studentId: string) => void;
  readonly onViewAllNegativeBalance: () => void;
  readonly onClearCreditFilter: () => void;
  readonly onManualInvoice: () => void;
  readonly onDeleteInvoice: (invoiceId: string) => void;
  readonly onConfirmDeleteInvoice: () => void;
  readonly onPageChange: (page: number) => void;
  readonly onProofSuccess: () => void;
  readonly onProofError: (message: string) => void;
  readonly onDetailsSuccess: (action: "approve" | "reject") => void;
  readonly refreshBillingData: () => void;
  readonly refetchSummary: () => void;
  readonly refetchCredit: () => void;
  readonly proofTarget: MarkPaidInvoiceTarget | null;
  readonly detailsTarget: PaymentDetailsTarget | null;
  readonly deleteTargetId: string | null;
  readonly snackbarOpen: boolean;
  readonly snackbarMessage: string;
  readonly snackbarSeverity: SnackbarSeverity;
  readonly onCloseSnackbar: () => void;
  readonly onCloseProofDialog: () => void;
  readonly onCloseDetailsDialog: () => void;
  readonly onCloseDeleteDialog: () => void;
}
