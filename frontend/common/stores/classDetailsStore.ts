"use client";

import { create } from "zustand";
import type { CurrencyCode } from "@/frontend/common/graphql/generated/gql/graphql";
import type { ActionFeedbackState } from "@/frontend/common/views/dashboard/classes/details/types";

interface ClassDetailsState {
  readonly isWarningDismissed: boolean;
  readonly feedbackState: ActionFeedbackState | null;
  readonly shouldLoadEvents: boolean;
  readonly deleteDialogOpen: boolean;
  readonly overrideDialogOpen: boolean;
  readonly overrideRateAmount: string;
  readonly overrideRateCurrency: CurrencyCode | null;
  setIsWarningDismissed: (value: boolean) => void;
  setFeedbackState: (state: ActionFeedbackState | null) => void;
  setShouldLoadEvents: (value: boolean) => void;
  setDeleteDialogOpen: (value: boolean) => void;
  setOverrideDialogOpen: (value: boolean) => void;
  setOverrideRateAmount: (value: string) => void;
  setOverrideRateCurrency: (value: CurrencyCode | null) => void;
  openOverrideDialog: (amount: string, currency: CurrencyCode | null) => void;
  reset: () => void;
}

const initialState = {
  isWarningDismissed: false,
  feedbackState: null as ActionFeedbackState | null,
  shouldLoadEvents: false,
  deleteDialogOpen: false,
  overrideDialogOpen: false,
  overrideRateAmount: "",
  overrideRateCurrency: null as CurrencyCode | null,
};

export const useClassDetailsStore = create<ClassDetailsState>(set => ({
  ...initialState,
  setIsWarningDismissed: (value: boolean) => set({ isWarningDismissed: value }),
  setFeedbackState: (state: ActionFeedbackState | null) => set({ feedbackState: state }),
  setShouldLoadEvents: (value: boolean) => set({ shouldLoadEvents: value }),
  setDeleteDialogOpen: (value: boolean) => set({ deleteDialogOpen: value }),
  setOverrideDialogOpen: (value: boolean) => set({ overrideDialogOpen: value }),
  setOverrideRateAmount: (value: string) => set({ overrideRateAmount: value }),
  setOverrideRateCurrency: (value: CurrencyCode | null) => set({ overrideRateCurrency: value }),
  // Opening the dialog (re)seeds the form from the instance so a previous edit never leaks in.
  openOverrideDialog: (amount: string, currency: CurrencyCode | null) =>
    set({ overrideDialogOpen: true, overrideRateAmount: amount, overrideRateCurrency: currency }),
  reset: () => set(initialState),
}));
