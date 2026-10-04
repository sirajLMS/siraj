"use client";

import { useCallback } from "react";
import type { MarkPaidInvoiceTarget } from "@/frontend/common/views/dashboard/billing/types/billingViewTypes";
import type {
  BillingProfileActionsParams,
  ProofMode,
} from "@/frontend/common/views/dashboard/users/billing-profile/useUserBillingProfileViewModel.helpers";

/** Proof-dialog open/pay/mark-paid handlers. */
export function useProofDialogActions({
  userId,
  billingActionsDisabled,
  tErrors,
  showFeedback,
  setProofMode,
  setProofTarget,
}: BillingProfileActionsParams) {
  const openProofDialog = useCallback(
    (invoice: MarkPaidInvoiceTarget, mode: ProofMode) => {
      if (billingActionsDisabled) {
        showFeedback(tErrors.auth.impersonationNotAllowedDuringSession, "error");
        return;
      }
      setProofMode(mode);
      setProofTarget({
        ...invoice,
        parentUserId: userId,
      });
    },
    [billingActionsDisabled, showFeedback, tErrors, userId, setProofMode, setProofTarget]
  );

  const handlePayNow = useCallback(
    (invoice: MarkPaidInvoiceTarget) => {
      openProofDialog(invoice, "submit");
    },
    [openProofDialog]
  );

  const handleMarkAsPaid = useCallback(
    (invoice: MarkPaidInvoiceTarget) => {
      openProofDialog(invoice, "markPaid");
    },
    [openProofDialog]
  );

  return { openProofDialog, handlePayNow, handleMarkAsPaid };
}

/** Post-dialog success/error feedback handlers. */
export function useProofFeedbackActions({
  labels,
  showFeedback,
  proofMode,
  refreshBillingData,
}: BillingProfileActionsParams & { readonly refreshBillingData: () => void }) {
  const handleProofSuccess = useCallback(() => {
    refreshBillingData();
    showFeedback(proofMode === "markPaid" ? labels.markAsPaidSuccess : labels.submitProofSuccess, "success");
  }, [refreshBillingData, showFeedback, proofMode, labels]);

  const handleProofError = useCallback(
    (message: string) => {
      showFeedback(message, "error");
    },
    [showFeedback]
  );

  const handleDetailsSuccess = useCallback(
    (action: "approve" | "reject") => {
      refreshBillingData();
      showFeedback(action === "approve" ? labels.approveProofSuccess : labels.rejectProofSuccess, "success");
    },
    [refreshBillingData, showFeedback, labels]
  );

  return { handleProofSuccess, handleProofError, handleDetailsSuccess };
}
