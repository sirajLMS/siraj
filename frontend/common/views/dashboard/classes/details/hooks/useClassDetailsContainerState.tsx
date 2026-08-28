import { useClassDetailsStore } from "@/frontend/common/stores/classDetailsStore";

export function useClassDetailsContainerState() {
  const isWarningDismissed = useClassDetailsStore(state => state.isWarningDismissed);
  const feedbackState = useClassDetailsStore(state => state.feedbackState);
  const shouldLoadEvents = useClassDetailsStore(state => state.shouldLoadEvents);
  const deleteDialogOpen = useClassDetailsStore(state => state.deleteDialogOpen);
  const overrideDialogOpen = useClassDetailsStore(state => state.overrideDialogOpen);
  const overrideRateAmount = useClassDetailsStore(state => state.overrideRateAmount);
  const overrideRateCurrency = useClassDetailsStore(state => state.overrideRateCurrency);
  const setIsWarningDismissed = useClassDetailsStore(state => state.setIsWarningDismissed);
  const setFeedbackState = useClassDetailsStore(state => state.setFeedbackState);
  const setShouldLoadEvents = useClassDetailsStore(state => state.setShouldLoadEvents);
  const setDeleteDialogOpen = useClassDetailsStore(state => state.setDeleteDialogOpen);
  const setOverrideDialogOpen = useClassDetailsStore(state => state.setOverrideDialogOpen);
  const setOverrideRateAmount = useClassDetailsStore(state => state.setOverrideRateAmount);
  const setOverrideRateCurrency = useClassDetailsStore(state => state.setOverrideRateCurrency);
  const openOverrideDialog = useClassDetailsStore(state => state.openOverrideDialog);

  return {
    isWarningDismissed,
    setIsWarningDismissed,
    feedbackState,
    setFeedbackState,
    shouldLoadEvents,
    setShouldLoadEvents,
    deleteDialogOpen,
    setDeleteDialogOpen,
    overrideDialogOpen,
    setOverrideDialogOpen,
    overrideRateAmount,
    setOverrideRateAmount,
    overrideRateCurrency,
    setOverrideRateCurrency,
    openOverrideDialog,
  };
}
