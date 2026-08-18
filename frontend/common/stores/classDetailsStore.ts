"use client";

import { create } from "zustand";
import type { ActionFeedbackState } from "@/frontend/common/views/dashboard/classes/details/types";

interface ClassDetailsState {
  readonly isWarningDismissed: boolean;
  readonly feedbackState: ActionFeedbackState | null;
  readonly shouldLoadEvents: boolean;
  readonly deleteDialogOpen: boolean;
  setIsWarningDismissed: (value: boolean) => void;
  setFeedbackState: (state: ActionFeedbackState | null) => void;
  setShouldLoadEvents: (value: boolean) => void;
  setDeleteDialogOpen: (value: boolean) => void;
  reset: () => void;
}

const initialState = {
  isWarningDismissed: false,
  feedbackState: null as ActionFeedbackState | null,
  shouldLoadEvents: false,
  deleteDialogOpen: false,
};

export const useClassDetailsStore = create<ClassDetailsState>(set => ({
  ...initialState,
  setIsWarningDismissed: (value: boolean) => set({ isWarningDismissed: value }),
  setFeedbackState: (state: ActionFeedbackState | null) => set({ feedbackState: state }),
  setShouldLoadEvents: (value: boolean) => set({ shouldLoadEvents: value }),
  setDeleteDialogOpen: (value: boolean) => set({ deleteDialogOpen: value }),
  reset: () => set(initialState),
}));
