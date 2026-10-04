"use client";

import { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql";
import { useLearningResourcesStore } from "@/frontend/common/stores/learningResourcesStore";
import { useUserStore } from "@/frontend/common/stores/userStore";
import type { ResourceFilterType, ResourceSortBy } from "@/frontend/common/types/shared.types";
import type {
  LearningResourceRow,
  ResourceUploadFormData,
} from "@/frontend/common/views/dashboard/resources/types/resourcesTypes";
import { useDeleteHandlers } from "@/frontend/common/views/dashboard/resources/useResourcesViewModel.delete.hooks";
import {
  buildResourcesViewModel,
  type ResourceStoreSlice,
} from "@/frontend/common/views/dashboard/resources/useResourcesViewModel.helpers";
import {
  useCardClick,
  useFileSelection,
  useResourcesQuery,
  useUploadHandlers,
} from "@/frontend/common/views/dashboard/resources/useResourcesViewModel.hooks";
import { type ResourcesLabels, Translation, useAppTranslation } from "@/shared/locale";

export interface ResourcesViewModel {
  readonly labels: ResourcesLabels;
  readonly resources: readonly LearningResourceRow[];
  readonly searchQuery: string;
  readonly filterType: ResourceFilterType;
  readonly sortBy: ResourceSortBy;
  readonly pendingDeleteId: string | null;
  readonly pendingDeleteTitle: string | null;
  readonly isUploading: boolean;
  readonly isDeleting: boolean;
  readonly canManage: boolean;
  readonly documentName: string;
  readonly selectedFileName: string;
  readonly onSearchChange: (query: string) => void;
  readonly onFilterTypeChange: (type: ResourceFilterType) => void;
  readonly onSortByChange: (sort: ResourceSortBy) => void;
  readonly onDocumentNameChange: (name: string) => void;
  readonly onFormSubmit: () => void;
  readonly onFileSelect: (file: File) => void;
  readonly onUpload: (data: ResourceUploadFormData, file: File) => void;
  readonly onDeleteRequest: (id: string) => void;
  readonly onDeleteCancel: () => void;
  readonly onDeleteConfirm: () => void;
  readonly onCardClick: (id: string) => void;
  /** Lifted permission gates consumed by the tier card components. */
  readonly canResourcesList: boolean;
  readonly canResourcesDelete: boolean;
}

export type UseResourcesViewModelProps = Record<string, never>;

function useResourcePermissions(): { canResourcesList: boolean; canResourcesDelete: boolean } {
  const hasPermission = useUserStore(state => state.hasPermission);
  const canResourcesList = hasPermission(AppPermission.ResourcesList);
  const canResourcesDelete = hasPermission(AppPermission.ResourcesDelete);
  return { canResourcesList, canResourcesDelete };
}

function useLearningResourcesStoreSlice(): ResourceStoreSlice {
  return useLearningResourcesStore();
}

export function useResourcesViewModel(_props: Readonly<UseResourcesViewModelProps>): ResourcesViewModel {
  const t = useAppTranslation(Translation.Dashboard.Resources);
  const { canResourcesList, canResourcesDelete } = useResourcePermissions();
  const store = useLearningResourcesStoreSlice();

  const resources = useResourcesQuery(store.searchQuery);
  const { selectedFileName, selectedFileRef, setSelectedFileName, onFileSelect } = useFileSelection();
  const { uploading: uploadMutationLoading, handleFormSubmit } = useUploadHandlers({
    documentName: store.documentName,
    selectedFileRef,
    setSelectedFileName,
    setUploading: store.setUploading,
    setDeleting: store.setDeleting,
    setDocumentName: store.setDocumentName,
  });
  const {
    onDeleteRequest,
    onDeleteCancel,
    onDeleteConfirm,
    deleting: deleteMutationLoading,
  } = useDeleteHandlers({
    resources,
    pendingDeleteId: store.pendingDeleteId,
    openDeleteDialog: store.openDeleteDialog,
    closeDeleteDialog: store.closeDeleteDialog,
    setDeleting: store.setDeleting,
  });
  const onCardClick = useCardClick(resources);

  return buildResourcesViewModel({
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
  });
}
