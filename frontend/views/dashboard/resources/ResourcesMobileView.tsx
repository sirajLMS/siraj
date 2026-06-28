"use client";

import { CloudUploadOutlined, ExpandMoreOutlined } from "@mui/icons-material";
import { Accordion, AccordionDetails, AccordionSummary, Box } from "@mui/material";
import { BaseCard, PageContainer, PageHeader } from "@/frontend/components/ui";
import { ResourceDeleteDialog } from "./components/ResourceDeleteDialog";
import { ResourceGovernancePanel } from "./components/ResourceGovernancePanel";
import { ResourceLibraryList } from "./components/ResourceLibraryList";
import { ResourceUploadForm } from "./components/ResourceUploadForm";
import { ResourceUploadGuidelines } from "./components/ResourceUploadGuidelines";
import type { ResourcesLayoutViewProps } from "./types/resourcesViewTypes";

export function ResourcesMobileView({
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
}: Readonly<ResourcesLayoutViewProps>) {
  return (
    <PageContainer>
      <PageHeader title={labels.pageTitle} subtitle={labels.pageSubtitle} titleVariant="headlineMd" />

      <Box sx={{ display: "flex", flexDirection: "column", gap: 3, pb: 4 }}>
        {canManage ? (
          <Accordion defaultExpanded disableGutters elevation={0}>
            <AccordionSummary expandIcon={<ExpandMoreOutlined />}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <CloudUploadOutlined sx={theme => ({ color: theme.palette.primary.main })} />
                {labels.upload.sectionTitle}
              </Box>
            </AccordionSummary>
            <AccordionDetails sx={{ p: 0 }}>
              <BaseCard sx={{ border: "none", boxShadow: "none", p: 0 }}>
                <ResourceUploadForm
                  labels={labels}
                  documentName={documentName}
                  selectedFileName={selectedFileName}
                  isUploading={isUploading}
                  canManage={canManage}
                  onDocumentNameChange={onDocumentNameChange}
                  onFormSubmit={onFormSubmit}
                  onFileSelect={onFileSelect}
                  variant="mobile"
                />
                <ResourceGovernancePanel labels={labels} />
              </BaseCard>
            </AccordionDetails>
          </Accordion>
        ) : null}

        <ResourceLibraryList
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

        {canManage ? <ResourceUploadGuidelines labels={labels} /> : null}
      </Box>

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
