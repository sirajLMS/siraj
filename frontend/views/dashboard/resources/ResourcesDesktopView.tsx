"use client";

import { Grid } from "@mui/material";
import type { Control, FieldErrors } from "react-hook-form";
import { BaseCard, PageContainer, PageHeader } from "@/frontend/components/ui";
import { SubmissionSuccessBanner } from "@/frontend/views/dashboard/shared/SubmissionSuccessBanner";
import { ResourceDeleteDialog } from "./components/ResourceDeleteDialog";
import { ResourceGovernancePanel } from "./components/ResourceGovernancePanel";
import { ResourceLibraryGrid } from "./components/ResourceLibraryGrid";
import { ResourceUploadForm } from "./components/ResourceUploadForm";
import { ResourceUploadGuidelines } from "./components/ResourceUploadGuidelines";
import type { ResourceUploadFormData } from "./schemas/resourceUploadSchema";
import type { ResourcesViewProps } from "./types/resourcesViewTypes";

interface ResourcesDesktopViewProps extends Omit<ResourcesViewProps, "onSearchChange" | "searchQuery" | "onUpload"> {
  readonly control: Control<ResourceUploadFormData>;
  readonly errors: FieldErrors<ResourceUploadFormData>;
  readonly selectedFileName: string;
  readonly onFormSubmit: () => void;
  readonly onFileSelect: (fileName: string) => void;
}

export function ResourcesDesktopView({
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
  onFormSubmit,
  onFileSelect,
  onDismissSuccess,
  onDeleteRequest,
  onDeleteCancel,
  onDeleteConfirm,
}: Readonly<ResourcesDesktopViewProps>) {
  return (
    <PageContainer>
      {showUploadSuccess && canManage ? (
        <SubmissionSuccessBanner message={labels.upload.successMessage} onDismiss={onDismissSuccess} />
      ) : null}

      <PageHeader title={labels.pageTitle} subtitle={labels.pageSubtitle} />

      <Grid container spacing={4}>
        {canManage ? (
          <Grid size={{ xs: 12, xl: 4 }}>
            <BaseCard>
              <ResourceUploadForm
                labels={labels}
                control={control}
                errors={errors}
                isUploading={isUploading}
                canManage={canManage}
                onFormSubmit={onFormSubmit}
                onFileSelect={onFileSelect}
                selectedFileName={selectedFileName}
                variant="desktop"
              />
              <ResourceGovernancePanel labels={labels} />
            </BaseCard>
            <ResourceUploadGuidelines labels={labels} />
          </Grid>
        ) : null}

        <Grid size={{ xs: 12, xl: canManage ? 8 : 12 }}>
          <ResourceLibraryGrid
            resources={resources}
            labels={labels}
            filterType={filterType}
            sortBy={sortBy}
            canManage={canManage}
            onFilterTypeChange={onFilterTypeChange}
            onSortByChange={onSortByChange}
            onDeleteRequest={onDeleteRequest}
          />
        </Grid>
      </Grid>

      <ResourceDeleteDialog
        labels={labels}
        open={Boolean(pendingDeleteId)}
        resourceTitle={pendingDeleteTitle}
        onCancel={onDeleteCancel}
        onConfirm={onDeleteConfirm}
      />
    </PageContainer>
  );
}
