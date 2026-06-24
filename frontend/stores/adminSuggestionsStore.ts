import { create } from "zustand";
import type { SuggestionStatus } from "@/frontend/views/dashboard/suggestions/types/suggestions.types";

interface AdminSuggestionsState {
  readonly searchQuery: string;
  readonly activeTab: SuggestionStatus;
  readonly markingReviewedId: string;
  readonly isMarkingReviewed: boolean;
  setSearchQuery: (query: string) => void;
  setActiveTab: (tab: SuggestionStatus) => void;
  setMarkingReviewedId: (id: string) => void;
  setIsMarkingReviewed: (value: boolean) => void;
  resetMarkingReviewed: () => void;
}

export const useAdminSuggestionsStore = create<AdminSuggestionsState>(set => ({
  searchQuery: "",
  activeTab: "PENDING",
  markingReviewedId: "",
  isMarkingReviewed: false,
  setSearchQuery: query => {
    set({ searchQuery: query });
  },
  setActiveTab: tab => {
    set({ activeTab: tab });
  },
  setMarkingReviewedId: id => {
    set({ markingReviewedId: id });
  },
  setIsMarkingReviewed: value => {
    set({ isMarkingReviewed: value });
  },
  resetMarkingReviewed: () => {
    set({ markingReviewedId: "", isMarkingReviewed: false });
  },
}));
