"use client";

import { CloudUploadOutlined, DescriptionOutlined } from "@mui/icons-material";
import { Box, TextField, Typography } from "@mui/material";
import { PrimaryPageAction } from "@/frontend/components/ui";
import type { ResourceUploadFormProps } from "@/frontend/views/dashboard/resources/types/resourcesTypes";
import { ResourceUploadDropzone } from "@/frontend/views/dashboard/resources/components/ResourceUploadDropzone";

export function ResourceUploadForm({
  labels,
  documentName,
  isUploading,
  canManage,
  onDocumentNameChange,
  onFormSubmit,
  onFileSelect,
  selectedFileName,
  variant,
}: Readonly<ResourceUploadFormProps>) {
  if (!canManage) {
    return null;
  }

  const isMobile = variant === "mobile";

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: isMobile ? 3 : 4 }}>
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
        <ResourceUploadDropzone
          labels={labels}
          selectedFileName={selectedFileName}
          onFileSelect={onFileSelect}
          variant={variant}
        />
      </Box>

      <PrimaryPageAction fullWidth disabled={isUploading} onClick={onFormSubmit} sx={{ py: isMobile ? 1.75 : 2 }}>
        {labels.upload.submit}
      </PrimaryPageAction>

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
}
