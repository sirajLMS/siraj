"use client";

import { CloudUploadOutlined } from "@mui/icons-material";
import { Box, Typography } from "@mui/material";
import type { ResourceUploadDropzoneProps } from "../types/resourcesTypes";

export function ResourceUploadDropzone({
  labels,
  selectedFileName,
  hasError,
  onFileSelect,
  variant,
}: Readonly<ResourceUploadDropzoneProps>) {
  const isMobile = variant === "mobile";

  return (
    <Box>
      <Box
        component="label"
        sx={theme => ({
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          border: `2px dashed ${hasError ? theme.palette.error.main : theme.palette.outlineVariant}`,
          borderRadius: theme.layout.radius.card,
          p: isMobile ? 4 : 5,
          backgroundColor: theme.palette.surfaceContainerLow,
          cursor: "pointer",
          transition: "border-color 0.15s ease, background-color 0.15s ease",
          "&:hover": {
            borderColor: theme.palette.primary.main,
            backgroundColor: theme.palette.surfaceContainer,
          },
        })}
      >
        <input
          type="file"
          hidden
          accept=".pdf,.docx,.pptx,.xlsx"
          onChange={event => {
            const file = event.target.files?.[0];
            if (file) {
              onFileSelect(file);
            }
          }}
        />
        <CloudUploadOutlined
          sx={theme => ({ fontSize: isMobile ? 40 : 48, color: theme.palette.primary.main, mb: 1 })}
        />
        <Typography variant="titleLg" sx={{ textAlign: "center", mb: 0.5 }}>
          {labels.upload.dropzoneTitle}
        </Typography>
        <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.text.secondary, textAlign: "center" })}>
          {labels.upload.dropzoneHint}
        </Typography>
        {selectedFileName ? (
          <Typography variant="labelMd" sx={{ mt: 2, fontWeight: 700 }}>
            {selectedFileName}
          </Typography>
        ) : null}
      </Box>
      <Typography variant="labelMd" sx={theme => ({ color: theme.palette.text.secondary, mt: 1, display: "block" })}>
        {labels.upload.supportedFormats}
      </Typography>
    </Box>
  );
}
