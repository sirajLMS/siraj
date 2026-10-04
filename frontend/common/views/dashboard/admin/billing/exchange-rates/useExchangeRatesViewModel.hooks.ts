import { useMutation } from "@apollo/client/react";
import { useState } from "react";
import { refreshExchangeRatesMutationDocument } from "@/frontend/common/graphql/sharedDocuments";
import { serializeApolloError } from "@/frontend/common/utils/errorUtils";
import { logger } from "@/frontend/common/utils/logger";
import type { ExchangeRatesLabels } from "@/shared/locale";

type FeedbackFn = (message: string, severity: "success" | "error") => void;

type RefetchFn = () => Promise<unknown>;

export function useSnackbarFeedback() {
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState<"success" | "error">("success");

  const showFeedback: FeedbackFn = (message, severity) => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  return {
    showFeedback,
    snackbarState: { open: snackbarOpen, message: snackbarMessage, severity: snackbarSeverity },
    onSnackbarClose: () => setSnackbarOpen(false),
  };
}

type UseRefreshExchangeRatesMutationParams = {
  readonly labels: ExchangeRatesLabels;
  readonly refetchRates: RefetchFn;
  readonly refetchSync: RefetchFn;
  readonly showFeedback: FeedbackFn;
};

export function useRefreshExchangeRatesMutation({
  labels,
  refetchRates,
  refetchSync,
  showFeedback,
}: UseRefreshExchangeRatesMutationParams) {
  const [refreshMutation, { loading: refreshing }] = useMutation(refreshExchangeRatesMutationDocument, {
    onCompleted: result => {
      if (result.refreshExchangeRates?.success) {
        showFeedback(labels.refreshSuccess, "success");
        void refetchSync();
        void refetchRates();
      } else {
        showFeedback(result.refreshExchangeRates?.errorMessage ?? labels.refreshFailed, "error");
      }
    },
    onError: error => {
      logger.error("FX refresh failed", serializeApolloError(error));
      showFeedback(labels.refreshFailed, "error");
    },
  });

  return { refreshMutation, refreshing };
}

type UseManualOverrideControlsParams = {
  readonly billingActionsDisabled: boolean;
  readonly showFeedback: FeedbackFn;
  readonly labels: ExchangeRatesLabels;
  readonly refetchRates: RefetchFn;
};

export function useManualOverrideControls({
  billingActionsDisabled,
  showFeedback,
  labels,
  refetchRates,
}: UseManualOverrideControlsParams) {
  const [manualOverrideOpen, setManualOverrideOpen] = useState(false);

  const onOpenManualOverride = () => {
    if (!billingActionsDisabled) {
      setManualOverrideOpen(true);
    }
  };

  return {
    manualOverrideOpen: manualOverrideOpen && !billingActionsDisabled,
    onOpenManualOverride,
    onCloseManualOverride: () => setManualOverrideOpen(false),
    onSuccessManualOverride: () => {
      showFeedback(labels.manualOverride.success, "success");
      void refetchRates();
    },
    onErrorManualOverride: (message: string) => showFeedback(message, "error"),
  };
}
