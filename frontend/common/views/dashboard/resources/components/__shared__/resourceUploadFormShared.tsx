"use client";

import { CloudUploadOutlined, DescriptionOutlined } from "@mui/icons-material";
import { Box, TextField, Typography } from "@mui/material";
import type { ComponentType } from "react";
import type { ResourceUploadFormProps } from "@/frontend/common/views/dashboard/resources/types/resourcesTypes";

export interface ResourceUploadFormConfig {
  /** Vertical gap between form sections */
  readonly gap: number;
  /** Padding-y on the submit button */
  readonly actionPaddingY: number;
  /** Tier-specific primary action button */
  readonly PrimaryAction: ComponentType<{
    readonly fullWidth?: boolean;
    readonly disabled?: boolean;
    readonly onClick?: () => void;
    readonly children?: React.ReactNode;
    readonly sx?: object;
  }>;
  /** Tier-specific dropzone component */
  readonly Dropzone: ComponentType<{
    readonly labels: ResourceUploadFormProps["labels"];
    readonly selectedFileName: string;
    readonly onFileSelect: (file: File) => void;
  }>;
}

export function createResourceUploadForm(config: ResourceUploadFormConfig) {
  return function ResourceUploadForm({
    labels,
    documentName,
    isUploading,
    canManage,
    onDocumentNameChange,
    onFormSubmit,
    onFileSelect,
    selectedFileName,
  }: Readonly<Omit<ResourceUploadFormProps, "variant">>) {
    const { PrimaryAction, Dropzone, gap, actionPaddingY } = config;

    if (!canManage) {
      return null;
    }

    return (
      <Box sx={{ display: "flex", flexDirection: "column", gap }}>
        <Typography variant="titleLg">{labels.upload.sectionTitle}</Typography>

        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
          <Typography
            variant="labelMd"
            sx={theme => ({ color: theme.palette.onSurfaceVariant, textTransform: "uppercase" })}
          >
            {labels.upload.documentName}
          </Typography>
          <TextField
            value={documentName}
            onChange={e => {
              onDocumentNameChange(e.target.value);
            }}
            placeholder={labels.upload.documentNamePlaceholder}
            fullWidth
            disabled={isUploading}
            slotProps={{ htmlInput: { autoComplete: "off" } }}
          />
        </Box>

        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
          <Dropzone labels={labels} selectedFileName={selectedFileName} onFileSelect={onFileSelect} />
        </Box>

        <PrimaryAction fullWidth disabled={isUploading} onClick={onFormSubmit} sx={{ py: actionPaddingY }}>
          {labels.upload.submit}
        </PrimaryAction>

        {selectedFileName ? (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <DescriptionOutlined sx={theme => ({ color: theme.palette.primary.main })} />
            <Typography variant="bodyMd">{selectedFileName}</Typography>
          </Box>
        ) : (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, opacity: 0.6 }}>
            <CloudUploadOutlined fontSize="small" />
            <Typography variant="labelMd">{labels.upload.supportedFormats}</Typography>
          </Box>
        )}
      </Box>
    );
  };
}
