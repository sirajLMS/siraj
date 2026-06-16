"use client";

import { CloudUploadOutlined, DescriptionOutlined } from "@mui/icons-material";
import { Box, TextField, Typography } from "@mui/material";
import type { Control, FieldErrors } from "react-hook-form";
import { Controller } from "react-hook-form";
import { PrimaryPageAction } from "@/frontend/components/ui";
import type { ResourcesLabels } from "@/shared/messages/types/dashboard/resources/main";
import type { ResourceUploadFormData } from "../schemas/resourceUploadSchema";
import { ResourceUploadDropzone } from "./ResourceUploadDropzone";

interface ResourceUploadFormProps {
  readonly labels: ResourcesLabels;
  readonly control: Control<ResourceUploadFormData>;
  readonly errors: FieldErrors<ResourceUploadFormData>;
  readonly isUploading: boolean;
  readonly canManage: boolean;
  readonly onFormSubmit: () => void;
  readonly onFileSelect: (fileName: string) => void;
  readonly selectedFileName: string;
  readonly variant: "desktop" | "mobile";
}

export function ResourceUploadForm({
  labels,
  control,
  errors,
  isUploading,
  canManage,
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
        <Controller
          name="documentName"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              placeholder={labels.upload.documentNamePlaceholder}
              fullWidth
              error={Boolean(errors.documentName)}
              helperText={errors.documentName?.message}
              slotProps={{ htmlInput: { autoComplete: "off" } }}
            />
          )}
        />
      </Box>

      <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
        <ResourceUploadDropzone
          labels={labels}
          selectedFileName={selectedFileName}
          hasError={Boolean(errors.fileName)}
          errorMessage={errors.fileName?.message}
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
