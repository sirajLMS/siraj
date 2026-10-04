"use client";

import { useCallback } from "react";
import { resolveQuickPayAction } from "@/frontend/common/views/dashboard/billing/__shared__/billingViewModelHelpers";
import { useDownloadInvoicePdf } from "@/frontend/common/views/dashboard/billing/hooks/useDownloadInvoicePdf";
import type { MarkPaidInvoiceTarget } from "@/frontend/common/views/dashboard/billing/types/billingViewTypes";
import type { BillingProfileActionsParams } from "@/frontend/common/views/dashboard/users/billing-profile/useUserBillingProfileViewModel.helpers";
import {
  useProofDialogActions,
  useProofFeedbackActions,
} from "@/frontend/common/views/dashboard/users/billing-profile/useUserBillingProfileViewModel.proofDialog";

type QuickPayFlowArgs = Pick<
  BillingProfileActionsParams,
  | "billingActionsDisabled"
  | "summaryLoading"
  | "summaryData"
  | "locale"
  | "fxMessages"
  | "labels"
  | "tErrors"
  | "tc"
  | "showFeedback"
> & { readonly handlePayNow: (invoice: MarkPaidInvoiceTarget) => void };

function runQuickPayFlow(args: QuickPayFlowArgs): void {
  resolveQuickPayAction({ ...args, tcLoading: args.tc.loading });
}

/** Refresh callbacks that re-run both billing queries. */
function useBillingProfileRefresh(refetch: () => void, refetchSummary: () => void) {
  const refreshBillingData = useCallback(() => {
    refetch();
    refetchSummary();
  }, [refetch, refetchSummary]);

  return {
    refreshBillingData,
    refreshAfterDialogClose: refreshBillingData,
  };
}

/** Invoice PDF download and quick-pay flow handlers. */
function useInvoiceActions(
  params: BillingProfileActionsParams & { readonly handlePayNow: (invoice: MarkPaidInvoiceTarget) => void }
) {
  const { billingActionsDisabled, summaryLoading, summaryData, locale, fxMessages, labels, tErrors, tc, showFeedback } =
    params;

  const handleDownloadPdf = useDownloadInvoicePdf({
    showFeedback,
    popupBlockedLabel: labels.notifications.popupBlocked,
  });

  const handleQuickPay = useCallback(() => {
    runQuickPayFlow({
      billingActionsDisabled,
      summaryLoading,
      summaryData,
      locale,
      fxMessages,
      labels,
      tErrors,
      tc,
      showFeedback,
      handlePayNow: params.handlePayNow,
    });
  }, [
    billingActionsDisabled,
    summaryLoading,
    summaryData,
    locale,
    fxMessages,
    params.handlePayNow,
    showFeedback,
    tErrors,
    tc,
    labels,
  ]);

  return { handleDownloadPdf, handleQuickPay };
}

/** Mutating handlers and refresh callbacks. */
export function useBillingProfileActions(params: BillingProfileActionsParams) {
  const { refreshBillingData, refreshAfterDialogClose } = useBillingProfileRefresh(
    params.refetch,
    params.refetchSummary
  );
  const proofDialog = useProofDialogActions(params);
  const feedback = useProofFeedbackActions({ ...params, refreshBillingData });
  const invoice = useInvoiceActions({ ...params, handlePayNow: proofDialog.handlePayNow });

  return {
    refreshBillingData,
    refreshAfterDialogClose,
    handlePayNow: proofDialog.handlePayNow,
    handleMarkAsPaid: proofDialog.handleMarkAsPaid,
    handleProofSuccess: feedback.handleProofSuccess,
    handleProofError: feedback.handleProofError,
    handleDetailsSuccess: feedback.handleDetailsSuccess,
    handleDownloadPdf: invoice.handleDownloadPdf,
    handleQuickPay: invoice.handleQuickPay,
  };
}
