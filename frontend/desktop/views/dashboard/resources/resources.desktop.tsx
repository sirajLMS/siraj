"use client";

import { Grid } from "@mui/material";
import { BaseCard } from "@/frontend/common/components/ui";
import type { ResourcesViewModel } from "@/frontend/common/views/dashboard/resources/useResourcesViewModel";
import { DesktopPageContainer, DesktopPageHeader } from "@/frontend/desktop/components/ui/container/page";
import { ResourceDeleteDialogDesktop } from "@/frontend/desktop/views/dashboard/resources/components/resourceDeleteDialog.desktop";
import { ResourceGovernancePanelDesktop } from "@/frontend/desktop/views/dashboard/resources/components/resourceGovernancePanel.desktop";
import { ResourceLibraryGridDesktop } from "@/frontend/desktop/views/dashboard/resources/components/resourceLibraryGrid.desktop";
import { ResourceUploadFormDesktop } from "@/frontend/desktop/views/dashboard/resources/components/resourceUploadForm.desktop";
import { ResourceUploadGuidelinesDesktop } from "@/frontend/desktop/views/dashboard/resources/components/resourceUploadGuidelines.desktop";

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
    <DesktopPageContainer>
      <DesktopPageHeader title={labels.pageTitle} subtitle={labels.pageSubtitle} />

      <Grid container spacing={4}>
        {canManage ? (
          <Grid size={{ xs: 12, xl: 4 }}>
            <BaseCard>
              <ResourceUploadFormDesktop
                labels={labels}
                documentName={documentName}
                selectedFileName={selectedFileName}
                isUploading={isUploading}
                canManage={canManage}
                onDocumentNameChange={onDocumentNameChange}
                onFormSubmit={onFormSubmit}
                onFileSelect={onFileSelect}
              />
              <ResourceGovernancePanelDesktop labels={labels} />
            </BaseCard>
            <ResourceUploadGuidelinesDesktop labels={labels} />
          </Grid>
        ) : null}

        <Grid size={{ xs: 12, xl: canManage ? 8 : 12 }}>
          <ResourceLibraryGridDesktop
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

      <ResourceDeleteDialogDesktop
        labels={labels}
        open={Boolean(pendingDeleteId)}
        resourceTitle={pendingDeleteTitle}
        onCancel={onDeleteCancel}
        onConfirm={onDeleteConfirm}
        loading={isDeleting}
      />
    </DesktopPageContainer>
  );
}
