import type {
  ParentBillingSummary,
  ParentInvoiceRow,
} from "@/frontend/views/dashboard/billing/types/parentBillingTypes";
import type { buildParentMetrics } from "@/frontend/views/dashboard/billing/utils/billingMetrics";
import type { BillingLabels } from "@/shared/messages/types/dashboard/billing";

export type { UserBillingProfileState } from "@/frontend/stores/userBillingProfileStore";
export { DEFAULT_PAGE_SIZE } from "@/frontend/stores/userBillingProfileStore";

export interface UserBillingProfileContainerProps {
  readonly userId: string;
}

export interface UserBillingProfileViewProps {
  readonly labels: BillingLabels;
  readonly summary: ParentBillingSummary;
  readonly metrics: ReturnType<typeof buildParentMetrics>;
  readonly invoices: readonly ParentInvoiceRow[];
  readonly searchQuery: string;
  readonly canManage: boolean;
  readonly canView: boolean;
  readonly canCreate: boolean;
  readonly onSearchChange: (value: string) => void;
  readonly onPayNow: (id: string) => void;
  readonly onDownloadPdf: (id: string) => void;
  readonly onQuickPay: () => void;
  readonly page: number;
  readonly pageSize: number;
  readonly totalCount: number;
  readonly onPageChange: (page: number) => void;
  readonly loading: boolean;
}

export type UserBillingProfileDesktopViewProps = UserBillingProfileViewProps;

export type UserBillingProfileMobileViewProps = UserBillingProfileViewProps;
