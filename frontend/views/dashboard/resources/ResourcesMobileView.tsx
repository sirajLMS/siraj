"use client";

import { CloudUploadOutlined, ExpandMoreOutlined } from "@mui/icons-material";
import { Accordion, AccordionDetails, AccordionSummary, Box } from "@mui/material";
import type { Control, FieldErrors } from "react-hook-form";
import { BaseCard, PageContainer, PageHeader } from "@/frontend/components/ui";
import { SubmissionSuccessBanner } from "@/frontend/views/dashboard/shared/SubmissionSuccessBanner";
import { ResourceDeleteDialog } from "./components/ResourceDeleteDialog";
import { ResourceGovernancePanel } from "./components/ResourceGovernancePanel";
import { ResourceLibraryList } from "./components/ResourceLibraryList";
import { ResourceUploadForm } from "./components/ResourceUploadForm";
import { ResourceUploadGuidelines } from "./components/ResourceUploadGuidelines";
import type { ResourceUploadFormData } from "./schemas/resourceUploadSchema";
import type { ResourcesViewProps } from "./types/resourcesViewTypes";

interface ResourcesMobileViewProps extends Omit<ResourcesViewProps, "onSearchChange" | "searchQuery" | "onUpload"> {
  readonly control: Control<ResourceUploadFormData>;
  readonly errors: FieldErrors<ResourceUploadFormData>;
  readonly selectedFileName: string;
  readonly onFormSubmit: () => void;
  readonly onFileSelect: (fileName: string) => void;
}

export function ResourcesMobileView({
  labels,
  resources,
  filterType,
  sortBy,
  pendingDeleteId,
  pendingDeleteTitle,
  isUploading,
  isDeleting,
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
}: Readonly<ResourcesMobileViewProps>) {
  return (
    <>
      {showUploadSuccess && canManage ? (
        <Box sx={{ px: 2, pt: 1 }}>
          <SubmissionSuccessBanner message={labels.upload.successMessage} onDismiss={onDismissSuccess} />
        </Box>
      ) : null}

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
                    control={control}
                    errors={errors}
                    isUploading={isUploading}
                    canManage={canManage}
                    onFormSubmit={onFormSubmit}
                    onFileSelect={onFileSelect}
                    selectedFileName={selectedFileName}
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
    </>
  );
}
