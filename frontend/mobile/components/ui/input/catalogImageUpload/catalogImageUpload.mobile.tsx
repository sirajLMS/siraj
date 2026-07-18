"use client";

import { CloudUploadOutlined, DeleteOutlined, ErrorOutlined, LinkOutlined } from "@mui/icons-material";
import { Box, Button, CircularProgress, Divider, InputAdornment, TextField, Typography } from "@mui/material";
import Image from "next/image";
import type * as React from "react";
import { useCallback, useRef } from "react";
import { ACCEPTED_TYPES, DEFAULT_MAX_SIZE_MB, useImageUpload } from "@/frontend/common/hooks/useImageUpload";
import { MobileContentStack } from "@/frontend/mobile/components/ui/container";
import { useAppTranslation } from "@/shared/locale";

export type CatalogImageUploadProps = {
  readonly imageUrl?: string | null;
  readonly onImageUrlChangeAction?: (url: string | null) => void;
  readonly onUploadAction?: (file: File) => Promise<{ url: string; filePath?: string }>;
  readonly onFilePathChangeAction?: (filePath: string | null) => void;
  readonly label?: string;
  readonly disabled?: boolean;
  readonly maxSizeMb?: number;
  readonly allowUrlFallback?: boolean;
  readonly helperText?: string;
  readonly error?: boolean;
  readonly errorMessage?: string;
};

type PreviewBoxProps = {
  readonly previewUrl: string | null;
  readonly label: string | undefined;
  readonly showError: boolean;
  readonly isUploading: boolean;
  readonly previewAlt: string;
};

type UploadButtonsProps = {
  readonly onUploadClick: () => void;
  readonly onRemoveClick: () => void;
  readonly disabled: boolean;
  readonly isUploading: boolean;
  readonly hasPreview: boolean;
  readonly uploadLabel: string;
  readonly uploadingLabel: string;
  readonly removeLabel: string;
};

type ErrorDisplayProps = {
  readonly errorMessage: string;
};

type UrlFallbackFieldProps = {
  readonly imageUrl: string | null;
  readonly onUrlChange: (value: string) => void;
  readonly disabled: boolean;
  readonly showError: boolean;
  readonly errorMessage: string | null;
  readonly label: string | undefined;
  readonly optionalLabel: string | undefined;
};

const PreviewBox: React.FC<PreviewBoxProps> = ({
  previewUrl,
  label,
  showError,
  isUploading,
  previewAlt,
}): React.ReactNode => (
  <Box
    sx={theme => ({
      position: "relative",
      width: 128,
      height: 128,
      flexShrink: 0,
      borderRadius: theme.layout.radius.card,
      overflow: "hidden",
      border: `1px solid ${showError ? theme.palette.error.main : theme.palette.outlineVariant}`,
      backgroundColor: theme.palette.surfaceContainerLow,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    })}
  >
    {previewUrl ? (
      <Image src={previewUrl} alt={label ?? previewAlt} fill unoptimized style={{ objectFit: "contain" }} />
    ) : (
      <CloudUploadOutlined sx={theme => ({ fontSize: 40, color: theme.palette.text.secondary })} />
    )}
    {isUploading ? (
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "rgba(0,0,0,0.5)",
        }}
      >
        <CircularProgress size={32} />
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
}): React.ReactNode => (
  <Box sx={{ display: "flex", gap: 1, width: "100%" }}>
    <Button
      variant="contained"
      startIcon={<CloudUploadOutlined />}
      onClick={onUploadClick}
      disabled={disabled || isUploading}
      aria-label={uploadLabel}
      fullWidth
      sx={theme => ({ flex: 1, borderRadius: theme.layout.radius.button })}
    >
      {isUploading ? uploadingLabel : uploadLabel}
    </Button>
    <Button
      variant="outlined"
      startIcon={<DeleteOutlined />}
      onClick={onRemoveClick}
      disabled={disabled || isUploading || !hasPreview}
      aria-label={removeLabel}
      fullWidth
      sx={theme => ({ flex: 1, borderRadius: theme.layout.radius.button })}
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

const UrlFallbackField: React.FC<UrlFallbackFieldProps> = ({
  imageUrl,
  onUrlChange,
  disabled,
  showError,
  errorMessage,
  label,
  optionalLabel,
}): React.ReactNode => (
  <>
    <Divider sx={{ my: 0 }}>
      <Typography variant="labelMd" component="span" sx={theme => ({ color: theme.palette.text.secondary })}>
        {optionalLabel}
      </Typography>
    </Divider>
    <TextField
      label={label}
      placeholder="https://cdn.example.com/logo.png"
      value={imageUrl ?? ""}
      onChange={event => onUrlChange(event.target.value)}
      disabled={disabled}
      error={showError}
      helperText={showError && errorMessage ? errorMessage : undefined}
      size="small"
      fullWidth
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

export const CatalogImageUploadMobile: React.FC<CatalogImageUploadProps> = ({
  imageUrl,
  onImageUrlChangeAction,
  onUploadAction,
  onFilePathChangeAction,
  label,
  disabled = false,
  maxSizeMb = DEFAULT_MAX_SIZE_MB,
  allowUrlFallback = false,
  helperText,
  error = false,
  errorMessage,
}): React.ReactNode => {
  const t = useAppTranslation().uiTranslations.catalogImageUpload;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const upload = useImageUpload({
    onImageUrlChangeAction,
    onUploadAction,
    onFilePathChangeAction,
    maxSizeMb,
  });

  const triggerFileInput = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const resolvedPreview = upload.previewUrl ?? imageUrl ?? null;
  const showError = error || upload.localError !== null;
  const resolvedError = errorMessage ?? upload.localError;
  const resolvedHelperText = helperText ?? t.helperText(maxSizeMb);

  return (
    <MobileContentStack gap={1.5} paddingBottom={0}>
      {label ? (
        <Typography variant="labelMd" component="span" sx={theme => ({ color: theme.palette.text.secondary })}>
          {label}
        </Typography>
      ) : null}
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
        <PreviewBox
          previewUrl={resolvedPreview}
          label={label}
          showError={showError}
          isUploading={upload.isUploading}
          previewAlt={t.previewAlt}
        />
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
          <UploadButtons
            onUploadClick={triggerFileInput}
            onRemoveClick={upload.handleRemove}
            disabled={disabled}
            isUploading={upload.isUploading}
            hasPreview={resolvedPreview !== null}
            uploadLabel={t.upload}
            uploadingLabel={t.uploading}
            removeLabel={t.remove}
          />
          <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.text.secondary })}>
            {resolvedHelperText}
          </Typography>
          {showError && resolvedError ? <ErrorDisplay errorMessage={resolvedError} /> : null}
        </Box>
      </Box>
      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED_TYPES.join(",")}
        onChange={upload.handleFileSelect}
        disabled={disabled}
        hidden
        aria-label={label ?? t.upload}
      />
      {allowUrlFallback ? (
        <UrlFallbackField
          imageUrl={imageUrl ?? null}
          onUrlChange={upload.handleUrlChange}
          disabled={disabled || upload.isUploading}
          showError={showError}
          errorMessage={resolvedError}
          label={t.logoUrlLabel}
          optionalLabel={t.optional}
        />
      ) : null}
    </MobileContentStack>
  );
};
