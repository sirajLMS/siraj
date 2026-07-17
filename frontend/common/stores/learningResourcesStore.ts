import { create } from "zustand";
import type { ResourceFilterType, ResourceSortBy } from "@/frontend/common/types/shared.types";

interface LearningResourcesState {
  readonly searchQuery: string;
  readonly filterType: ResourceFilterType;
  readonly sortBy: ResourceSortBy;
  readonly pendingDeleteId: string | null;
  readonly pendingDeleteTitle: string | null;
  readonly isUploading: boolean;
  readonly isDeleting: boolean;
  readonly canManage: boolean;
  readonly documentName: string;
  setSearchQuery: (query: string) => void;
  setFilterType: (type: ResourceFilterType) => void;
  setSortBy: (sort: ResourceSortBy) => void;
  openDeleteDialog: (id: string, title: string) => void;
  closeDeleteDialog: () => void;
  setUploading: (value: boolean) => void;
  setDeleting: (value: boolean) => void;
  setDocumentName: (name: string) => void;
  setCanManage: (value: boolean) => void;
}

export const useLearningResourcesStore = create<LearningResourcesState>(set => ({
  searchQuery: "",
  filterType: "all",
  sortBy: "date",
  pendingDeleteId: null,
  pendingDeleteTitle: null,
  isUploading: false,
  isDeleting: false,
  canManage: false,
  documentName: "",
  setSearchQuery: query => set({ searchQuery: query }),
  setFilterType: type => set({ filterType: type }),
  setSortBy: sort => set({ sortBy: sort }),
  openDeleteDialog: (id, title) => set({ pendingDeleteId: id, pendingDeleteTitle: title }),
  closeDeleteDialog: () => set({ pendingDeleteId: null, pendingDeleteTitle: null }),
  setUploading: value => set({ isUploading: value }),
  setDeleting: value => set({ isDeleting: value }),
  setDocumentName: name => set({ documentName: name }),
  setCanManage: value => set({ canManage: value }),
}));
