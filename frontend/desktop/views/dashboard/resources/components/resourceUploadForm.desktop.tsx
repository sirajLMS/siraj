"use client";

import { CloudUploadOutlined, DescriptionOutlined } from "@mui/icons-material";
import { Box, TextField, Typography } from "@mui/material";
import type { ResourceUploadFormProps } from "@/frontend/common/views/dashboard/resources/types/resourcesTypes";
import { DesktopPrimaryPageAction } from "@/frontend/desktop/components/ui/button";
import { ResourceUploadDropzoneDesktop } from "@/frontend/desktop/views/dashboard/resources/components/resourceUploadDropzone.desktop";

export function ResourceUploadFormDesktop({
  labels,
  documentName,
  isUploading,
  canManage,
  onDocumentNameChange,
  onFormSubmit,
  onFileSelect,
  selectedFileName,
}: Readonly<Omit<ResourceUploadFormProps, "variant">>) {
  if (!canManage) {
    return null;
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 4 }}>
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
        <ResourceUploadDropzoneDesktop
          labels={labels}
          selectedFileName={selectedFileName}
          onFileSelect={onFileSelect}
        />
      </Box>

      <DesktopPrimaryPageAction fullWidth disabled={isUploading} onClick={onFormSubmit} sx={{ py: 2 }}>
        {labels.upload.submit}
      </DesktopPrimaryPageAction>

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
