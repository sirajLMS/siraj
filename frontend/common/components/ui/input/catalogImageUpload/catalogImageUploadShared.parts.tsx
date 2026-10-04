"use client";

import { CloudUploadOutlined, DeleteOutlined, ErrorOutlined, LinkOutlined } from "@mui/icons-material";
import { alpha, Box, Button, CircularProgress, Divider, InputAdornment, TextField, Typography } from "@mui/material";
import type { Theme } from "@mui/material/styles";
import Image from "next/image";
import type * as React from "react";
import {
  getButtonContainerSx,
  getButtonSx,
  getPreviewContentSx,
} from "@/frontend/common/components/ui/input/catalogImageUpload/catalogImageUploadShared.helpers";
import type {
  CatalogImageUploadPreviewAndActionsProps,
  ErrorDisplayProps,
  PreviewBoxProps,
  UploadButtonsProps,
  UrlFallbackFieldProps,
} from "@/frontend/common/components/ui/input/catalogImageUpload/types/catalogImageUploadShared.types";

const PreviewBox: React.FC<PreviewBoxProps> = ({
  previewUrl,
  label,
  showError,
  isUploading,
  previewAlt,
  previewShape,
  previewSize,
}): React.ReactNode => (
  <Box
    sx={theme => ({
      position: "relative",
      width: previewSize,
      height: previewSize,
      flexShrink: 0,
      borderRadius: previewShape === "circle" ? "50%" : theme.layout.radius.card,
      overflow: "hidden",
      border: `1px solid ${showError ? theme.palette.error.main : theme.palette.outlineVariant}`,
      backgroundColor: theme.palette.surfaceContainerLow,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    })}
  >
    {previewUrl ? (
      <Image
        src={previewUrl}
        alt={label ?? previewAlt}
        fill
        unoptimized
        style={{ objectFit: previewShape === "circle" ? "cover" : "contain" }}
      />
    ) : (
      <CloudUploadOutlined
        sx={theme => ({ fontSize: previewSize >= 128 ? 40 : 36, color: theme.palette.text.secondary })}
      />
    )}
    {isUploading ? (
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: (theme: Theme) => alpha(theme.palette.scrim, 0.5),
        }}
      >
        <CircularProgress size={previewSize >= 128 ? 32 : 28} />
      </Box>
    ) : null}
  </Box>
);

const UploadButtons: React.FC<UploadButtonsProps> = ({
  onUploadClick,
  onRemoveClick,
  disabled,
  isUploading,
  hasPreview,
  uploadLabel,
  uploadingLabel,
  removeLabel,
  buttonSize,
  buttonLayout,
}): React.ReactNode => (
  <Box sx={getButtonContainerSx(buttonLayout)}>
    <Button
      variant="contained"
      size={buttonSize}
      startIcon={<CloudUploadOutlined />}
      onClick={onUploadClick}
      disabled={disabled || isUploading}
      aria-label={uploadLabel}
      fullWidth={buttonLayout === "fullWidth"}
      sx={getButtonSx(buttonLayout)}
    >
      {isUploading ? uploadingLabel : uploadLabel}
    </Button>
    <Button
      variant="outlined"
      size={buttonSize}
      startIcon={<DeleteOutlined />}
      onClick={onRemoveClick}
      disabled={disabled || isUploading || !hasPreview}
      aria-label={removeLabel}
      fullWidth={buttonLayout === "fullWidth"}
      sx={getButtonSx(buttonLayout)}
    >
      {removeLabel}
    </Button>
  </Box>
);

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ errorMessage }): React.ReactNode => (
  <Typography
    variant="bodyMd"
    sx={theme => ({ display: "flex", alignItems: "center", gap: 0.5, color: theme.palette.error.main })}
  >
    <ErrorOutlined fontSize="small" />
    {errorMessage}
  </Typography>
);

export const UrlFallbackField: React.FC<UrlFallbackFieldProps> = ({
  imageUrl,
  onUrlChange,
  disabled,
  showError,
  errorMessage,
  label,
  optionalLabel,
  urlFieldSize,
  urlFieldFullWidth,
}): React.ReactNode => (
  <>
    <Divider sx={{ my: 0 }}>
      <Box component="span" sx={theme => ({ typography: "labelMd", color: theme.palette.text.secondary })}>
        {optionalLabel}
      </Box>
    </Divider>
    <TextField
      label={label}
      placeholder="https://cdn.example.com/logo.png"
      value={imageUrl ?? ""}
      onChange={event => onUrlChange(event.target.value)}
      disabled={disabled}
      error={showError}
      helperText={showError && errorMessage ? errorMessage : undefined}
      size={urlFieldSize}
      fullWidth={urlFieldFullWidth}
      slotProps={{
        input: {
          startAdornment: (
            <InputAdornment position="start">
              <LinkOutlined fontSize="small" />
            </InputAdornment>
          ),
        },
      }}
    />
  </>
);

export function FilePreviewAndActions({
  previewUrl,
  label,
  showError,
  isUploading,
  resolvedError,
  resolvedHelperText,
  uploadLabel,
  uploadingLabel,
  removeLabel,
  previewAlt,
  previewShape,
  previewSize,
  buttonSize,
  buttonLayout,
  helperTextTypography,
  onUploadClick,
  onRemoveClick,
  disabled,
}: Readonly<CatalogImageUploadPreviewAndActionsProps>): React.ReactNode {
  return (
    <Box sx={getPreviewContentSx(previewShape, buttonLayout)}>
      <PreviewBox
        previewUrl={previewUrl}
        label={label}
        showError={showError}
        isUploading={isUploading}
        previewAlt={previewAlt}
        previewShape={previewShape}
        previewSize={previewSize}
      />
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: 1,
          minWidth: 0,
          width: previewShape === "circle" ? "100%" : "auto",
        }}
      >
        <UploadButtons
          onUploadClick={onUploadClick}
          onRemoveClick={onRemoveClick}
          disabled={disabled}
          isUploading={isUploading}
          hasPreview={previewUrl !== null}
          uploadLabel={uploadLabel}
          uploadingLabel={uploadingLabel}
          removeLabel={removeLabel}
          buttonSize={buttonSize}
          buttonLayout={buttonLayout}
        />
        <Typography
          variant={helperTextTypography === "bodyMd" ? "bodyMd" : undefined}
          sx={theme => ({
            ...(helperTextTypography !== "bodyMd" ? { typography: helperTextTypography } : {}),
            color: theme.palette.text.secondary,
          })}
        >
          {resolvedHelperText}
        </Typography>
        {showError && resolvedError ? <ErrorDisplay errorMessage={resolvedError} /> : null}
      </Box>
    </Box>
  );
}
