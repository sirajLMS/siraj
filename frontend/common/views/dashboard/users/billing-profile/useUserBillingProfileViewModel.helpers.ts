"use client";

import { useCallback, useState } from "react";
import { useDebouncedCallback } from "use-debounce";
import type {
  UserBillingProfileInvoiceHistoryQuery_parentInvoiceHistory_rows,
  UserBillingProfileSummaryQuery,
} from "@/frontend/common/graphql/generated/gql/graphql";
import type { FxDisplayMessages } from "@/frontend/common/lib/buildFxDisplayMessages";
import type { SnackbarSeverity } from "@/frontend/common/stores/__shared__";
import { useUserBillingProfileStore } from "@/frontend/common/stores/userBillingProfileStore";
import {
  buildInvoiceRow,
  buildParentBillingSummary,
} from "@/frontend/common/views/dashboard/billing/__shared__/billingViewModelHelpers";
import { useBillingPermissions } from "@/frontend/common/views/dashboard/billing/hooks/useBillingPermissions";
import type {
  MarkPaidInvoiceTarget,
  PaymentDetailsTarget,
} from "@/frontend/common/views/dashboard/billing/types/billingViewTypes";
import type {
  ParentBillingSummary,
  ParentInvoiceRow,
} from "@/frontend/common/views/dashboard/billing/types/parentBillingTypes";
import { useBillingFxMessages } from "@/frontend/common/views/dashboard/billing/utils/billingTranslationBase";
import type { BillingLabels, ErrorsLabels } from "@/shared/locale";

/** Which proof flow the dialog is currently hosting. */
export type ProofMode = "submit" | "markPaid";

export type SummaryRow = UserBillingProfileInvoiceHistoryQuery_parentInvoiceHistory_rows | undefined;

/**
 * Shared parameter bundle for the billing-profile action hooks: identity,
 * query results, translation slices, dialog setters, and refetch handles.
 */
export interface BillingProfileActionsParams {
  readonly userId: string;
  readonly billingActionsDisabled: boolean;
  readonly summaryLoading: boolean;
  readonly summaryData: UserBillingProfileSummaryQuery | undefined;
  readonly locale: string;
  readonly fxMessages: FxDisplayMessages;
  readonly labels: BillingLabels;
  readonly tErrors: ErrorsLabels;
  readonly tc: { loading: string };
  readonly showFeedback: (message: string, severity: SnackbarSeverity) => void;
  readonly setProofMode: (mode: ProofMode) => void;
  readonly setProofTarget: (target: MarkPaidInvoiceTarget | null) => void;
  readonly proofMode: ProofMode;
  readonly refetch: () => void;
  readonly refetchSummary: () => void;
}

export function mapInvoiceRow(
  inv: NonNullable<SummaryRow>,
  locale: string,
  fxMessages: FxDisplayMessages
): ParentInvoiceRow {
  return buildInvoiceRow(inv, locale, fxMessages, { staleDefault: null, currencyDefault: null });
}

export function buildSummary(
  summaryData: UserBillingProfileSummaryQuery | undefined,
  locale: string,
  fxMessages: FxDisplayMessages
): ParentBillingSummary {
  return buildParentBillingSummary(summaryData, locale, fxMessages);
}

/** FX display message cache memoized on the translation slices that feed it. */
export function useBillingProfileFxMessages(
  tProfile: { convertedAmount: (a: string, b: string, c: string, d: string) => string },
  tErrors: ErrorsLabels,
  tProfileRoot: { convertedTotalApprox: (a: string, b: string) => string }
): FxDisplayMessages {
  return useBillingFxMessages(tProfile, tErrors, tProfileRoot);
}

/** Local search input + debounced search-string derivation. */
export function useBillingProfileSearch() {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const setPage = useUserBillingProfileStore(state => state.setPage);

  const debouncedApplySearch = useDebouncedCallback((value: string) => {
    setDebouncedSearch(value.trim());
    setPage(0);
  }, 300);

  const handleSearchChange = useCallback(
    (value: string) => {
      setSearchQuery(value);
      debouncedApplySearch(value);
    },
    [debouncedApplySearch]
  );

  const isSearchPending = searchQuery.trim() !== debouncedSearch.trim();

  return {
    searchQuery,
    debouncedSearch,
    isSearchPending,
    handleSearchChange,
  };
}

/** Proof/details dialog + snackbar UI state. */
export function useBillingProfileDialogs() {
  const [proofTarget, setProofTarget] = useState<MarkPaidInvoiceTarget | null>(null);
  const [proofMode, setProofMode] = useState<ProofMode>("submit");
  const [detailsTarget, setDetailsTarget] = useState<PaymentDetailsTarget | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState<SnackbarSeverity>("success");

  const showFeedback = useCallback((message: string, severity: SnackbarSeverity) => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  }, []);

  const billingDialogsOpen = proofTarget !== null || detailsTarget !== null;

  return {
    proofTarget,
    setProofTarget,
    proofMode,
    setProofMode,
    detailsTarget,
    setDetailsTarget,
    snackbarOpen,
    snackbarMessage,
    snackbarSeverity,
    setSnackbarOpen,
    showFeedback,
    billingDialogsOpen,
  };
}

/** Permission gates derived once from the user store. */
export function useBillingProfilePermissions() {
  return useBillingPermissions();
}

/** Pagination slice from the shared Zustand store. */
export function useBillingProfilePagination() {
  const page = useUserBillingProfileStore(state => state.page);
  const pageSize = useUserBillingProfileStore(state => state.pageSize);
  const setPage = useUserBillingProfileStore(state => state.setPage);
  return { page, pageSize, setPage };
}
