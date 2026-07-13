"use client";

import { CloudUploadOutlined, ExpandMoreOutlined } from "@mui/icons-material";
import { Accordion, AccordionDetails, AccordionSummary, Box } from "@mui/material";
import { BaseCard, PageContainer } from "@/frontend/common/components/ui";
import { MobileContentStack, MobilePageHeader } from "@/frontend/mobile/components/ui";
import { ResourceDeleteDialog } from "@/frontend/views/dashboard/resources/components/ResourceDeleteDialog";
import { ResourceGovernancePanel } from "@/frontend/views/dashboard/resources/components/ResourceGovernancePanel";
import { ResourceLibraryList } from "@/frontend/views/dashboard/resources/components/ResourceLibraryList";
import { ResourceUploadForm } from "@/frontend/views/dashboard/resources/components/ResourceUploadForm";
import { ResourceUploadGuidelines } from "@/frontend/views/dashboard/resources/components/ResourceUploadGuidelines";
import type { ResourcesViewModel } from "@/frontend/views/dashboard/resources/useResourcesViewModel";

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
}: Readonly<ResourcesViewModel>) {
  return (
    <PageContainer>
      <MobilePageHeader title={labels.pageTitle} subtitle={labels.pageSubtitle} edgeToEdge={false} />

      <MobileContentStack gap={3} paddingBottom={4}>
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
      </MobileContentStack>

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
