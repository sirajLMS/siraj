import { useState } from "react";
import type { ActionFeedbackState } from "@/frontend/views/dashboard/classes/details/types";

export function useClassDetailsContainerState() {
  const [isWarningDismissed, setIsWarningDismissed] = useState(false);
  const [feedbackState, setFeedbackState] = useState<ActionFeedbackState | null>(null);
  const [shouldLoadEvents, setShouldLoadEvents] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

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
