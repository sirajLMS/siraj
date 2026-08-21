"use client";

import { create } from "zustand";
import { SuggestionStatus } from "@/frontend/common/graphql/generated/gql/graphql";

interface AdminSuggestionsState {
  readonly searchQuery: string;
  readonly activeTab: SuggestionStatus;
  readonly markingReviewedId: string;
  readonly isMarkingReviewed: boolean;
  readonly respondingToId: string;
  readonly isResponding: boolean;
  readonly deleteDialogOpen: boolean;
  readonly deletingId: string;
  readonly isDeleting: boolean;
  readonly duplicateDialogOpen: boolean;
  readonly markingDuplicateId: string;
  readonly isMarkingDuplicate: boolean;
  readonly respondDialogOpen: string;
  setSearchQuery: (query: string) => void;
  setActiveTab: (tab: SuggestionStatus) => void;
  setMarkingReviewedId: (id: string) => void;
  setIsMarkingReviewed: (value: boolean) => void;
  resetMarkingReviewed: () => void;
  setRespondingToId: (id: string) => void;
  setIsResponding: (value: boolean) => void;
  resetResponding: () => void;
  openDeleteDialog: (id: string) => void;
  closeDeleteDialog: () => void;
  setIsDeleting: (value: boolean) => void;
  openDuplicateDialog: (id: string) => void;
  closeDuplicateDialog: () => void;
  setMarkingDuplicateId: (id: string) => void;
  setIsMarkingDuplicate: (value: boolean) => void;
  resetMarkingDuplicate: () => void;
  openRespondDialog: (id: string) => void;
  closeRespondDialog: () => void;
}

export type { AdminSuggestionsState };

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
