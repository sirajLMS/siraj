import { create } from "zustand";
import type { ResourceFilterType, ResourceSortBy } from "@/frontend/common/types/shared.types";

interface LearningResourcesState {
  readonly searchQuery: string;
  readonly filterType: ResourceFilterType;
  readonly sortBy: ResourceSortBy;
  readonly pendingDeleteId: string | null;
  readonly isUploading: boolean;
  readonly documentName: string;
  setSearchQuery: (query: string) => void;
  setFilterType: (type: ResourceFilterType) => void;
  setSortBy: (sort: ResourceSortBy) => void;
  openDeleteDialog: (id: string) => void;
  closeDeleteDialog: () => void;
  setUploading: (value: boolean) => void;
  setDocumentName: (name: string) => void;
}

export const useLearningResourcesStore = create<LearningResourcesState>(set => ({
  searchQuery: "",
  filterType: "all",
  sortBy: "date",
  pendingDeleteId: null,
  isUploading: false,
  documentName: "",
  setSearchQuery: query => set({ searchQuery: query }),
  setFilterType: type => set({ filterType: type }),
  setSortBy: sort => set({ sortBy: sort }),
  openDeleteDialog: id => set({ pendingDeleteId: id }),
  closeDeleteDialog: () => set({ pendingDeleteId: null }),
  setUploading: value => set({ isUploading: value }),
  setDocumentName: name => set({ documentName: name }),
}));
