"use client";

import { Grid } from "@mui/material";
import { BaseCard, PageContainer, PageHeader } from "@/frontend/common/components/ui";
import { ResourceDeleteDialog } from "@/frontend/common/views/dashboard/resources/components/ResourceDeleteDialog";
import { ResourceGovernancePanel } from "@/frontend/common/views/dashboard/resources/components/ResourceGovernancePanel";
import { ResourceLibraryGrid } from "@/frontend/common/views/dashboard/resources/components/ResourceLibraryGrid";
import { ResourceUploadForm } from "@/frontend/common/views/dashboard/resources/components/ResourceUploadForm";
import { ResourceUploadGuidelines } from "@/frontend/common/views/dashboard/resources/components/ResourceUploadGuidelines";
import type { ResourcesViewModel } from "@/frontend/common/views/dashboard/resources/useResourcesViewModel";

export function ResourcesDesktopView({
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
  selectedFileName,
  onFilterTypeChange,
  onSortByChange,
  onDocumentNameChange,
  onFormSubmit,
  onFileSelect,
  onDeleteRequest,
  onDeleteCancel,
  onDeleteConfirm,
  onCardClick,
}: Readonly<ResourcesViewModel>) {
  return (
    <PageContainer>
      <PageHeader title={labels.pageTitle} subtitle={labels.pageSubtitle} />

      <Grid container spacing={4}>
        {canManage ? (
          <Grid size={{ xs: 12, xl: 4 }}>
            <BaseCard>
              <ResourceUploadForm
                labels={labels}
                documentName={documentName}
                selectedFileName={selectedFileName}
                isUploading={isUploading}
                canManage={canManage}
                onDocumentNameChange={onDocumentNameChange}
                onFormSubmit={onFormSubmit}
                onFileSelect={onFileSelect}
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
            onCardClick={onCardClick}
          />
        </Grid>
      </Grid>

      <ResourceDeleteDialog
        labels={labels}
        open={Boolean(pendingDeleteId)}
        resourceTitle={pendingDeleteTitle}
        onCancel={onDeleteCancel}
        onConfirm={onDeleteConfirm}
        loading={isDeleting}
      />
    </PageContainer>
  );
}
