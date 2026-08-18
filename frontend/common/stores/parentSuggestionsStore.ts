"use client";

import { create } from "zustand";

export interface ParentSuggestionsState {
  isSubmitting: boolean;
  setSubmitting: (value: boolean) => void;
}

export const useParentSuggestionsStore = create<ParentSuggestionsState>(set => ({
  isSubmitting: false,
  setSubmitting: value => {
    set({ isSubmitting: value });
  },
}));
