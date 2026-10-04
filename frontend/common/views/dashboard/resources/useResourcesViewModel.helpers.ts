import type { ResourceFilterType, ResourceSortBy } from "@/frontend/common/types/shared.types";
import type { LearningResourceRow } from "@/frontend/common/views/dashboard/resources/types/resourcesTypes";
import type { ResourcesViewModel } from "@/frontend/common/views/dashboard/resources/useResourcesViewModel";
import type { ResourcesLabels } from "@/shared/locale";

export interface ResourceStoreSlice {
  readonly searchQuery: string;
  readonly filterType: ResourceFilterType;
  readonly sortBy: ResourceSortBy;
  readonly pendingDeleteId: string | null;
  readonly pendingDeleteTitle: string | null;
  readonly isUploading: boolean;
  readonly isDeleting: boolean;
  readonly canManage: boolean;
  readonly documentName: string;
  readonly setDocumentName: (value: string) => void;
  readonly setSearchQuery: (value: string) => void;
  readonly setFilterType: (value: ResourceFilterType) => void;
  readonly setSortBy: (value: ResourceSortBy) => void;
  readonly openDeleteDialog: (id: string, title: string) => void;
  readonly closeDeleteDialog: () => void;
  readonly setUploading: (value: boolean) => void;
  readonly setDeleting: (value: boolean) => void;
}

export function buildResourcesViewModel(params: {
  readonly t: ResourcesLabels;
  readonly resources: readonly LearningResourceRow[];
  readonly store: ResourceStoreSlice;
  readonly selectedFileName: string;
  readonly uploadMutationLoading: boolean;
  readonly deleteMutationLoading: boolean;
  readonly handleFormSubmit: () => Promise<void>;
  readonly onFileSelect: (file: File) => void;
  readonly onDeleteRequest: (id: string) => void;
  readonly onDeleteCancel: () => void;
  readonly onDeleteConfirm: () => Promise<void>;
  readonly onCardClick: (id: string) => void;
  readonly canResourcesList: boolean;
  readonly canResourcesDelete: boolean;
}): ResourcesViewModel {
  const {
    t,
    resources,
    store,
    selectedFileName,
    uploadMutationLoading,
    deleteMutationLoading,
    handleFormSubmit,
    onFileSelect,
    onDeleteRequest,
    onDeleteCancel,
    onDeleteConfirm,
    onCardClick,
    canResourcesList,
    canResourcesDelete,
  } = params;
  return {
    labels: t,
    resources,
    searchQuery: store.searchQuery,
    filterType: store.filterType,
    sortBy: store.sortBy,
    pendingDeleteId: store.pendingDeleteId,
    pendingDeleteTitle: store.pendingDeleteTitle,
    isUploading: uploadMutationLoading || store.isUploading,
    isDeleting: deleteMutationLoading || store.isDeleting,
    canManage: store.canManage,
    documentName: store.documentName,
    selectedFileName,
    onSearchChange: store.setSearchQuery,
    onFilterTypeChange: store.setFilterType,
    onSortByChange: store.setSortBy,
    onDocumentNameChange: store.setDocumentName,
    onFormSubmit: handleFormSubmit,
    onFileSelect,
    onUpload: () => {}, // Upload is handled by handleFormSubmit; kept for interface compatibility
    onDeleteRequest,
    onDeleteCancel,
    onDeleteConfirm,
    onCardClick,
    canResourcesList,
    canResourcesDelete,
  };
}
