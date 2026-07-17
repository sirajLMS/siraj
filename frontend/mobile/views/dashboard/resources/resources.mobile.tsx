"use client";

import { CloudUploadOutlined, ExpandMoreOutlined } from "@mui/icons-material";
import { Accordion, AccordionDetails, AccordionSummary, Box } from "@mui/material";
import type { ResourcesViewModel } from "@/frontend/common/views/dashboard/resources/useResourcesViewModel";
import { MobileContentStack, MobilePageContainer, MobilePageHeader } from "@/frontend/mobile/components/ui";
import { MobileBaseCard } from "@/frontend/mobile/components/ui/card";
import { ResourceDeleteDialogMobile } from "@/frontend/mobile/views/dashboard/resources/components/resourceDeleteDialog.mobile";
import { ResourceGovernancePanelMobile } from "@/frontend/mobile/views/dashboard/resources/components/resourceGovernancePanel.mobile";
import { ResourceLibraryListMobile } from "@/frontend/mobile/views/dashboard/resources/components/resourceLibraryList.mobile";
import { ResourceUploadFormMobile } from "@/frontend/mobile/views/dashboard/resources/components/resourceUploadForm.mobile";
import { ResourceUploadGuidelinesMobile } from "@/frontend/mobile/views/dashboard/resources/components/resourceUploadGuidelines.mobile";

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
    <MobilePageContainer>
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
              <MobileBaseCard sx={{ border: "none", boxShadow: "none", p: 0 }}>
                <ResourceUploadFormMobile
                  labels={labels}
                  documentName={documentName}
                  selectedFileName={selectedFileName}
                  isUploading={isUploading}
                  canManage={canManage}
                  onDocumentNameChange={onDocumentNameChange}
                  onFormSubmit={onFormSubmit}
                  onFileSelect={onFileSelect}
                />
                <ResourceGovernancePanelMobile labels={labels} />
              </MobileBaseCard>
            </AccordionDetails>
          </Accordion>
        ) : null}

        <ResourceLibraryListMobile
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

        {canManage ? <ResourceUploadGuidelinesMobile labels={labels} /> : null}
      </MobileContentStack>

      <ResourceDeleteDialogMobile
        labels={labels}
        open={Boolean(pendingDeleteId)}
        resourceTitle={pendingDeleteTitle}
        onCancel={onDeleteCancel}
        onConfirm={onDeleteConfirm}
        loading={isDeleting}
      />
    </MobilePageContainer>
  );
}
