import { useClassDetailsStore } from "@/frontend/common/stores/classDetailsStore";
import type { ActionFeedbackState } from "@/frontend/common/views/dashboard/classes/details/types";

export function useClassDetailsContainerState() {
  const isWarningDismissed = useClassDetailsStore(state => state.isWarningDismissed);
  const feedbackState = useClassDetailsStore(state => state.feedbackState);
  const shouldLoadEvents = useClassDetailsStore(state => state.shouldLoadEvents);
  const deleteDialogOpen = useClassDetailsStore(state => state.deleteDialogOpen);
  const setIsWarningDismissed = useClassDetailsStore(state => state.setIsWarningDismissed);
  const setFeedbackState = useClassDetailsStore(state => state.setFeedbackState);
  const setShouldLoadEvents = useClassDetailsStore(state => state.setShouldLoadEvents);
  const setDeleteDialogOpen = useClassDetailsStore(state => state.setDeleteDialogOpen);

  return {
    isWarningDismissed,
    setIsWarningDismissed,
    feedbackState,
    setFeedbackState,
    shouldLoadEvents,
    setShouldLoadEvents,
    deleteDialogOpen,
    setDeleteDialogOpen,
  };
}

export type { ActionFeedbackState };
