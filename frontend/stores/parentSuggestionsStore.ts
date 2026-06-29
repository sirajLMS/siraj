import { create } from "zustand";

export const useParentSuggestionsStore = create<{
  isSubmitting: boolean;
  setSubmitting: (value: boolean) => void;
}>(set => ({
  isSubmitting: false,
  setSubmitting: value => {
    set({ isSubmitting: value });
  },
}));
