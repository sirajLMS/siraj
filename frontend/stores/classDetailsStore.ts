import { create } from "zustand";

export interface ClassDetailsState {
  isWarningDismissed: boolean;
  dismissWarning: () => void;
}

export const useClassDetailsStore = create<ClassDetailsState>(set => ({
  isWarningDismissed: false,
  dismissWarning: () => {
    set({ isWarningDismissed: true });
  },
}));
