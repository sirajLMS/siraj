import type {
  MarkPaidInvoiceTarget,
  PaymentDetailsTarget,
} from "@/frontend/common/views/dashboard/billing/types/billingViewTypes";
import type {
  ParentBillingSummary,
  ParentInvoiceRow,
} from "@/frontend/common/views/dashboard/billing/types/parentBillingTypes";
import type { buildParentMetrics } from "@/frontend/common/views/dashboard/billing/utils/billingMetrics";
import type { BillingLabels } from "@/shared/locale";

export type { UserBillingProfileState } from "@/frontend/common/stores/userBillingProfileStore";
export { DEFAULT_PAGE_SIZE } from "@/frontend/common/stores/userBillingProfileStore";

export interface UserBillingProfileContainerProps {
  readonly userId: string;
}

export interface UserBillingProfileViewProps {
  readonly labels: BillingLabels;
  readonly summary: ParentBillingSummary;
  readonly summaryLoading?: boolean;
  readonly metrics: ReturnType<typeof buildParentMetrics>;
  readonly invoices: readonly ParentInvoiceRow[];
  readonly searchQuery: string;
  readonly canManage: boolean;
  readonly canSubmitProof: boolean;
  readonly canView: boolean;
  readonly canCreate: boolean;
  readonly billingActionsDisabled?: boolean;
  readonly isSearchPending?: boolean;
  readonly onSearchChange: (value: string) => void;
  readonly onPayNow: (invoice: MarkPaidInvoiceTarget) => void;
  readonly onMarkAsPaid?: (invoice: MarkPaidInvoiceTarget) => void;
  readonly onViewPaymentDetails?: (target: PaymentDetailsTarget) => void;
  readonly onDownloadPdf: (id: string) => void;
  readonly onQuickPay: () => void;
  readonly page: number;
  readonly pageSize: number;
  readonly totalCount: number;
  readonly onPageChange: (page: number) => void;
  readonly loading: boolean;
  readonly userId: string;
}

export type UserBillingProfileDesktopViewProps = UserBillingProfileViewProps;

export type UserBillingProfileMobileViewProps = UserBillingProfileViewProps;
