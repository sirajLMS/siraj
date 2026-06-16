import { create } from "zustand";
import { logger } from "@/frontend/utils/logger";
import type { SuggestionFormData } from "@/frontend/views/dashboard/suggestions/schemas/suggestionFormSchema";

interface ParentSuggestionsState {
  readonly isSubmitting: boolean;
  readonly showSuccess: boolean;
  setSubmitting: (value: boolean) => void;
  setShowSuccess: (value: boolean) => void;
  resetSuccess: () => void;
  submitSuggestion: (data: SuggestionFormData) => void;
}

export const useParentSuggestionsStore = create<ParentSuggestionsState>(set => ({
  isSubmitting: false,
  showSuccess: false,
  setSubmitting: value => {
    set({ isSubmitting: value });
  },
  setShowSuccess: value => {
    set({ showSuccess: value });
  },
  resetSuccess: () => {
    set({ showSuccess: false });
  },
  submitSuggestion: data => {
    logger.info("Parent suggestion submitted", { data });
    set({ showSuccess: true });
  },
}));
