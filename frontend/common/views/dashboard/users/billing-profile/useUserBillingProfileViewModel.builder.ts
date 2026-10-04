import type { UserBillingProfileInvoiceHistoryQuery } from "@/frontend/common/graphql/generated/gql/graphql";
import type { SnackbarSeverity } from "@/frontend/common/stores/__shared__";
import type {
  MarkPaidInvoiceTarget,
  PaymentDetailsTarget,
} from "@/frontend/common/views/dashboard/billing/types/billingViewTypes";
import type {
  ParentBillingSummary,
  ParentInvoiceRow,
} from "@/frontend/common/views/dashboard/billing/types/parentBillingTypes";
import type { buildParentMetrics } from "@/frontend/common/views/dashboard/billing/utils/billingMetrics";
import type { UserBillingProfileViewModel } from "@/frontend/common/views/dashboard/users/billing-profile/useUserBillingProfileViewModel";
import type {
  ProofMode,
  useBillingProfileDialogs,
} from "@/frontend/common/views/dashboard/users/billing-profile/useUserBillingProfileViewModel.helpers";
import type { BillingLabels } from "@/shared/locale";

export interface BuildUserBillingProfileViewModelArgs {
  readonly labels: BillingLabels;
  readonly summary: ParentBillingSummary;
  readonly summaryLoading: boolean;
  readonly metrics: ReturnType<typeof buildParentMetrics>;
  readonly invoices: readonly ParentInvoiceRow[];
  readonly searchQuery: string;
  readonly permissions: {
    readonly canManage: boolean;
    readonly canSubmitProof: boolean;
    readonly canCreate: boolean;
    readonly canView: boolean;
  };
  readonly billingActionsDisabled: boolean;
  readonly isSearchPending: boolean;
  readonly handleSearchChange: (value: string) => void;
  readonly handlePayNow: (invoice: MarkPaidInvoiceTarget) => void;
  readonly handleMarkAsPaid: (invoice: MarkPaidInvoiceTarget) => void;
  readonly handleDownloadPdf: (invoiceId: string) => void;
  readonly handleQuickPay: () => void;
  readonly page: number;
  readonly pageSize: number;
  readonly data: UserBillingProfileInvoiceHistoryQuery | undefined;
  readonly loading: boolean;
  readonly setPage: (page: number) => void;
  readonly userId: string;
  readonly dialogs: ReturnType<typeof useBillingProfileDialogs>;
  readonly refreshAfterDialogClose: () => void;
  readonly handleProofSuccess: () => void;
  readonly handleProofError: (message: string) => void;
  readonly handleDetailsSuccess: (action: "approve" | "reject") => void;
}

/**
 * Dialog state and handlers needed by the view in addition to the base
 * `UserBillingProfileViewModel` prop contract.
 */
type UserBillingProfileViewModelWithDialogs = UserBillingProfileViewModel & {
  readonly proofTarget: MarkPaidInvoiceTarget | null;
  readonly proofMode: ProofMode;
  readonly detailsTarget: PaymentDetailsTarget | null;
  readonly snackbarOpen: boolean;
  readonly snackbarMessage: string;
  readonly snackbarSeverity: SnackbarSeverity;
  readonly setProofTarget: (target: MarkPaidInvoiceTarget | null) => void;
  readonly setProofMode: (mode: ProofMode) => void;
  readonly setDetailsTarget: (target: PaymentDetailsTarget | null) => void;
  readonly setSnackbarOpen: (open: boolean) => void;
  readonly refreshAfterDialogClose: () => void;
  readonly handleProofSuccess: () => void;
  readonly handleProofError: (message: string) => void;
  readonly handleDetailsSuccess: (action: "approve" | "reject") => void;
};

/**
 * Keys of the dialog portion of the combined view model.
 */
type DialogViewModelKeys =
  | "proofTarget"
  | "proofMode"
  | "detailsTarget"
  | "snackbarOpen"
  | "snackbarMessage"
  | "snackbarSeverity"
  | "setProofTarget"
  | "setProofMode"
  | "setDetailsTarget"
  | "setSnackbarOpen"
  | "refreshAfterDialogClose"
  | "handleProofSuccess"
  | "handleProofError"
  | "handleDetailsSuccess";

type CoreViewModelFields = Omit<UserBillingProfileViewModelWithDialogs, DialogViewModelKeys>;
type DialogViewModelFields = Pick<UserBillingProfileViewModelWithDialogs, DialogViewModelKeys>;

/**
 * Base (non-dialog) view model fields: summary, metrics, invoice paging and
 * permission-gated actions mapped onto the `UserBillingProfileViewModel` prop
 * contract consumed by the tier views.
 */
function buildCoreViewModelFields(args: BuildUserBillingProfileViewModelArgs): CoreViewModelFields {
  const { permissions, dialogs } = args;
  return {
    labels: args.labels,
    summary: args.summary,
    summaryLoading: args.summaryLoading,
    metrics: args.metrics,
    invoices: args.invoices,
    searchQuery: args.searchQuery,
    canManage: permissions.canManage,
    canSubmitProof: permissions.canSubmitProof,
    canView: permissions.canView,
    canCreate: permissions.canCreate,
    billingActionsDisabled: args.billingActionsDisabled,
    isSearchPending: args.isSearchPending,
    onSearchChange: args.handleSearchChange,
    onPayNow: args.handlePayNow,
    onMarkAsPaid: permissions.canManage ? args.handleMarkAsPaid : undefined,
    onViewPaymentDetails: dialogs.setDetailsTarget,
    onDownloadPdf: args.handleDownloadPdf,
    onQuickPay: args.handleQuickPay,
    page: args.page,
    pageSize: args.pageSize,
    totalCount: args.data?.parentInvoiceHistory?.totalCount ?? 0,
    onPageChange: args.setPage,
    loading: args.loading || args.isSearchPending,
    userId: args.userId,
  };
}

/**
 * Dialog state and handlers (proof upload, payment details, snackbar
 * feedback) forwarded from the dialog hooks to the tier views.
 */
function buildDialogViewModelFields(args: BuildUserBillingProfileViewModelArgs): DialogViewModelFields {
  const { dialogs, refreshAfterDialogClose, handleProofSuccess, handleProofError, handleDetailsSuccess } = args;
  return {
    proofTarget: dialogs.proofTarget,
    proofMode: dialogs.proofMode,
    detailsTarget: dialogs.detailsTarget,
    snackbarOpen: dialogs.snackbarOpen,
    snackbarMessage: dialogs.snackbarMessage,
    snackbarSeverity: dialogs.snackbarSeverity,
    setProofTarget: dialogs.setProofTarget,
    setProofMode: dialogs.setProofMode,
    setDetailsTarget: dialogs.setDetailsTarget,
    setSnackbarOpen: dialogs.setSnackbarOpen,
    refreshAfterDialogClose,
    handleProofSuccess,
    handleProofError,
    handleDetailsSuccess,
  };
}

/**
 * Composes the flat view model passed to the billing-profile tier views from
 * the base contract and the dialog state/handlers.
 */
export function buildUserBillingProfileViewModel(
  args: BuildUserBillingProfileViewModelArgs
): UserBillingProfileViewModelWithDialogs {
  return {
    ...buildCoreViewModelFields(args),
    ...buildDialogViewModelFields(args),
  };
}
