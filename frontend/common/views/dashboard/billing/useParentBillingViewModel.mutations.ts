import { useMutation } from "@apollo/client/react";
import { useCallback } from "react";
import {
  markInvoicePaidMutationDocument,
  submitPaymentProofMutationDocument,
} from "@/frontend/common/graphql/sharedDocuments";
import { logger } from "@/frontend/common/utils/logger";
import type {
  BillingStoreState,
  BillingTranslations,
} from "@/frontend/common/views/dashboard/billing/useParentBillingViewModel.state";

interface BillingMutations {
  submittingProof: boolean;
  markingPaid: boolean;
  submitPaymentProof: (invoiceId: string, proofFileId: string) => void;
}

export function useBillingMutations(
  translations: BillingTranslations,
  store: BillingStoreState,
  refreshBillingData: () => void
): BillingMutations {
  const { labels } = translations;
  const { setProofTarget, showFeedback } = store;

  const [submitPaymentProofMutation, { loading: submittingProof }] = useMutation(submitPaymentProofMutationDocument, {
    onCompleted: () => {
      setProofTarget(null);
      showFeedback(labels.submitProofSuccess, "success");
      refreshBillingData();
    },
    onError: error => {
      setProofTarget(null);
      showFeedback(labels.submitProofDialog.errorGeneric, "error");
      logger.error("Parent submit payment proof failed:", { error });
    },
  });

  const [, { loading: markingPaid }] = useMutation(markInvoicePaidMutationDocument, {
    onCompleted: () => {
      setProofTarget(null);
      showFeedback(labels.markAsPaidSuccess, "success");
      refreshBillingData();
    },
    onError: error => {
      setProofTarget(null);
      showFeedback(labels.submitProofDialog.errorGeneric, "error");
      logger.error("Parent mark invoice paid failed:", { error });
    },
  });

  const submitPaymentProof = useCallback(
    (invoiceId: string, proofFileId: string) => {
      submitPaymentProofMutation({
        variables: { invoiceId, proofFileId, expectedVersion: null },
      }).catch(() => {});
    },
    [submitPaymentProofMutation]
  );

  return { submittingProof, markingPaid, submitPaymentProof };
}
