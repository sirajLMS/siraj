"use client";

import { useRef, useState } from "react";
import { useLearningResourcesStore } from "@/frontend/stores/learningResourcesStore";
import type { ResourceFilterType, ResourceSortBy } from "@/frontend/types/shared.types";
import type {
  LearningResourceRow,
  ResourceUploadFormData,
} from "@/frontend/views/dashboard/resources/types/resourcesTypes";
import type { ResourcesLabels } from "@/shared/messages/types/dashboard/resources/main";

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
}

export interface UseResourcesViewModelProps {
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
  readonly onSearchChange: (query: string) => void;
  readonly onFilterTypeChange: (type: ResourceFilterType) => void;
  readonly onSortByChange: (sort: ResourceSortBy) => void;
  readonly onUpload: (data: ResourceUploadFormData, file: File) => void;
  readonly onDeleteRequest: (id: string) => void;
  readonly onDeleteCancel: () => void;
  readonly onDeleteConfirm: () => void;
  readonly onCardClick: (id: string) => void;
}

export function useResourcesViewModel(props: Readonly<UseResourcesViewModelProps>): ResourcesViewModel {
  const {
    labels,
    resources,
    searchQuery,
    filterType,
    sortBy,
    pendingDeleteId,
    pendingDeleteTitle,
    isUploading,
    isDeleting,
    canManage,
    onSearchChange,
    onFilterTypeChange,
    onSortByChange,
    onUpload,
    onDeleteRequest,
    onDeleteCancel,
    onDeleteConfirm,
    onCardClick,
  } = props;

  const documentName = useLearningResourcesStore(state => state.documentName);
  const setDocumentName = useLearningResourcesStore(state => state.setDocumentName);

  const selectedFileRef = useRef<File | null>(null);
  const [selectedFileName, setSelectedFileName] = useState("");

  const handleFileSelect = (file: File) => {
    selectedFileRef.current = file;
    setSelectedFileName(file.name);
  };

  const handleFormSubmit = () => {
    const file = selectedFileRef.current;
    if (!file || !documentName.trim()) {
      return;
    }
    onUpload({ documentName: documentName.trim(), fileName: file.name }, file);
    setDocumentName("");
    selectedFileRef.current = null;
    setSelectedFileName("");
  };

  return {
    labels,
    resources,
    searchQuery,
    filterType,
    sortBy,
    pendingDeleteId,
    pendingDeleteTitle,
    isUploading,
    isDeleting,
    canManage,
    documentName,
    selectedFileName,
    onSearchChange,
    onFilterTypeChange,
    onSortByChange,
    onDocumentNameChange: setDocumentName,
    onFormSubmit: handleFormSubmit,
    onFileSelect: handleFileSelect,
    onUpload,
    onDeleteRequest,
    onDeleteCancel,
    onDeleteConfirm,
    onCardClick,
  };
}
