"use client";

import { useMediaQuery, useTheme } from "@mui/material";
import { useState } from "react";
import { ResourcesDesktopView } from "./ResourcesDesktopView";
import { ResourcesMobileView } from "./ResourcesMobileView";
import type { ResourcesViewProps } from "./types/resourcesViewTypes";

export function ResourcesView({
  labels,
  resources,
  filterType,
  sortBy,
  pendingDeleteId,
  pendingDeleteTitle,
  isUploading,
  isDeleting,
  canManage,
  onFilterTypeChange,
  onSortByChange,
  onUpload,
  onDeleteRequest,
  onDeleteCancel,
  onDeleteConfirm,
  onCardClick,
}: Readonly<ResourcesViewProps>) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [documentName, setDocumentName] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
  };

  const handleFormSubmit = () => {
    if (!selectedFile || !documentName.trim()) {
      return;
    }
    onUpload({ documentName: documentName.trim(), fileName: selectedFile.name }, selectedFile);
    setDocumentName("");
    setSelectedFile(null);
  };

  const viewProps = {
    labels,
    resources,
    filterType,
    sortBy,
    pendingDeleteId,
    pendingDeleteTitle,
    isUploading,
    isDeleting,
    canManage,
    documentName,
    selectedFileName: selectedFile?.name ?? "",
    onFilterTypeChange,
    onSortByChange,
    onDocumentNameChange: setDocumentName,
    onFormSubmit: handleFormSubmit,
    onFileSelect: handleFileSelect,
    onDeleteRequest,
    onDeleteCancel,
    onDeleteConfirm,
    onCardClick,
  };

  if (isMobile) {
    return <ResourcesMobileView {...viewProps} />;
  }

  return <ResourcesDesktopView {...viewProps} />;
}
