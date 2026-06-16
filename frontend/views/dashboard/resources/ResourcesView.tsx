"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMediaQuery, useTheme } from "@mui/material";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { ResourcesDesktopView } from "./ResourcesDesktopView";
import { ResourcesMobileView } from "./ResourcesMobileView";
import { resourceUploadSchema } from "./schemas/resourceUploadSchema";
import type { ResourcesViewProps } from "./types/resourcesViewTypes";

export function ResourcesView({
  labels,
  resources,
  filterType,
  sortBy,
  pendingDeleteId,
  pendingDeleteTitle,
  isUploading,
  showUploadSuccess,
  canManage,
  onFilterTypeChange,
  onSortByChange,
  onUpload,
  onDismissSuccess,
  onDeleteRequest,
  onDeleteCancel,
  onDeleteConfirm,
}: Readonly<ResourcesViewProps>) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [selectedFileName, setSelectedFileName] = useState("");
  const schema = resourceUploadSchema(labels.validation);

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      documentName: "",
      fileName: "",
    },
  });

  useEffect(() => {
    if (!showUploadSuccess) {
      return undefined;
    }

    const timer = setTimeout(() => {
      onDismissSuccess();
    }, 4000);

    return () => {
      clearTimeout(timer);
    };
  }, [showUploadSuccess, onDismissSuccess]);

  const handleFileSelect = (fileName: string) => {
    setSelectedFileName(fileName);
    setValue("fileName", fileName, { shouldValidate: true });
  };

  const handleFormSubmit = () => {
    void handleSubmit(data => {
      onUpload(data);
      reset();
      setSelectedFileName("");
    })();
  };

  const viewProps = {
    labels,
    resources,
    filterType,
    sortBy,
    pendingDeleteId,
    pendingDeleteTitle,
    isUploading,
    showUploadSuccess,
    canManage,
    control,
    errors,
    selectedFileName,
    onFilterTypeChange,
    onSortByChange,
    onFormSubmit: handleFormSubmit,
    onFileSelect: handleFileSelect,
    onDismissSuccess,
    onDeleteRequest,
    onDeleteCancel,
    onDeleteConfirm,
  };

  if (isMobile) {
    return <ResourcesMobileView {...viewProps} />;
  }

  return <ResourcesDesktopView {...viewProps} />;
}
