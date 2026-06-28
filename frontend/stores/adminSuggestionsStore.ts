import { create } from "zustand";
import { SuggestionStatus } from "@/frontend/graphql/generated/gql/graphql-types";
import type { AdminSuggestionsState } from "@/frontend/views/dashboard/suggestions/types/suggestions.types";

export const useAdminSuggestionsStore = create<AdminSuggestionsState>(set => ({
  searchQuery: "",
  activeTab: SuggestionStatus.Pending,
  markingReviewedId: "",
  isMarkingReviewed: false,
  respondingToId: "",
  isResponding: false,
  deleteDialogOpen: false,
  deletingId: "",
  isDeleting: false,
  duplicateDialogOpen: false,
  markingDuplicateId: "",
  isMarkingDuplicate: false,
  respondDialogOpen: "",
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
  setRespondingToId: id => {
    set({ respondingToId: id });
  },
  setIsResponding: value => {
    set({ isResponding: value });
  },
  resetResponding: () => {
    set({ respondingToId: "", isResponding: false });
  },
  openDeleteDialog: id => {
    set({ deleteDialogOpen: true, deletingId: id });
  },
  closeDeleteDialog: () => {
    set({ deleteDialogOpen: false, deletingId: "" });
  },
  setIsDeleting: value => {
    set({ isDeleting: value });
  },
  openDuplicateDialog: id => {
    set({ duplicateDialogOpen: true, markingDuplicateId: id });
  },
  closeDuplicateDialog: () => {
    set({ duplicateDialogOpen: false, markingDuplicateId: "" });
  },
  setMarkingDuplicateId: id => {
    set({ markingDuplicateId: id });
  },
  setIsMarkingDuplicate: value => {
    set({ isMarkingDuplicate: value });
  },
  resetMarkingDuplicate: () => {
    set({ markingDuplicateId: "", isMarkingDuplicate: false });
  },
  openRespondDialog: id => {
    set({ respondDialogOpen: id });
  },
  closeRespondDialog: () => {
    set({ respondDialogOpen: "" });
  },
}));
