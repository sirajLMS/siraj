"use client";

import { CloudUploadOutlined, DeleteOutlined, ErrorOutlined, LinkOutlined } from "@mui/icons-material";
import { Box, Button, CircularProgress, Divider, InputAdornment, TextField, Typography } from "@mui/material";
import Image from "next/image";
import type * as React from "react";
import { useCallback, useRef } from "react";
import type {
  CatalogImageUploadSharedProps,
  CatalogImageUploadSlotProps,
  ErrorDisplayProps,
  PreviewBoxProps,
  UploadButtonsProps,
  UrlFallbackFieldProps,
} from "@/frontend/common/components/ui/input/catalogImageUpload/types/catalogImageUploadShared.types";
import { ACCEPTED_TYPES, DEFAULT_MAX_SIZE_MB, useImageUpload } from "@/frontend/common/hooks/useImageUpload";
import { Translation, useAppTranslation } from "@/shared/locale";

export const PREVIEW_SIZE = 96;

export const PreviewBox: React.FC<PreviewBoxProps> = ({
  previewUrl,
  label,
  showError,
  isUploading,
  previewAlt,
  previewShape,
}): React.ReactNode => (
  <Box
    sx={theme => ({
      position: "relative",
      width: PREVIEW_SIZE,
      height: PREVIEW_SIZE,
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
      <CloudUploadOutlined sx={theme => ({ fontSize: 36, color: theme.palette.text.secondary })} />
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
        <CircularProgress size={28} />
      </Box>
    ) : null}
  </Box>
);

export const UploadButtons: React.FC<UploadButtonsProps> = ({
  onUploadClick,
  onRemoveClick,
  disabled,
  isUploading,
  hasPreview,
  uploadLabel,
  uploadingLabel,
  removeLabel,
  horizontal = false,
}): React.ReactNode => (
  <Box
    sx={{
      display: "flex",
      flexDirection: horizontal ? "row" : "column",
      flexWrap: "wrap",
      gap: 1,
      alignItems: horizontal ? "center" : "stretch",
    }}
  >
    <Button
      variant="contained"
      size="small"
      startIcon={<CloudUploadOutlined />}
      onClick={onUploadClick}
      disabled={disabled || isUploading}
      aria-label={uploadLabel}
      sx={theme => ({
        borderRadius: theme.layout.radius.button,
        ...(horizontal ? {} : { justifyContent: "flex-start" }),
      })}
    >
      {isUploading ? uploadingLabel : uploadLabel}
    </Button>
    <Button
      variant="outlined"
      size="small"
      startIcon={<DeleteOutlined />}
      onClick={onRemoveClick}
      disabled={disabled || isUploading || !hasPreview}
      aria-label={removeLabel}
      sx={theme => ({
        borderRadius: theme.layout.radius.button,
        ...(horizontal ? {} : { justifyContent: "flex-start" }),
      })}
    >
      {removeLabel}
    </Button>
  </Box>
);

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ errorMessage }): React.ReactNode => (
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

export interface CatalogImageUploadScaffoldProps {
  readonly props: CatalogImageUploadSharedProps;
  readonly slots?: CatalogImageUploadSlotProps;
}

interface CatalogImageUploadBodyProps {
  readonly previewUrl: string | null;
  readonly label: string | undefined;
  readonly showError: boolean;
  readonly isUploading: boolean;
  readonly resolvedError: string | null;
  readonly resolvedHelperText: string;
  readonly uploadLabel: string;
  readonly uploadingLabel: string;
  readonly removeLabel: string;
  readonly previewAlt: string;
  readonly previewShape: "square" | "circle";
  readonly onUploadClick: () => void;
  readonly onRemoveClick: () => void;
  readonly disabled: boolean;
  readonly fileInputRef: React.RefObject<HTMLInputElement | null>;
  readonly onFileSelect: (event: React.ChangeEvent<HTMLInputElement>) => void;
  readonly allowUrlFallback: boolean;
  readonly imageUrl: string | null;
  readonly onUrlChange: (value: string) => void;
  readonly logoUrlLabel: string | undefined;
  readonly optionalLabel: string | undefined;
}

function CatalogImageUploadBody({
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
  onUploadClick,
  onRemoveClick,
  disabled,
  fileInputRef,
  onFileSelect,
  allowUrlFallback,
  imageUrl,
  onUrlChange,
  logoUrlLabel,
  optionalLabel,
}: Readonly<CatalogImageUploadBodyProps>): React.ReactNode {
  return (
    <>
      {label ? (
        <Typography variant="labelMd" component="span" sx={theme => ({ color: theme.palette.text.secondary })}>
          {label}
        </Typography>
      ) : null}
      <Box
        sx={
          previewShape === "circle"
            ? {
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                gap: 1.5,
                minWidth: 0,
              }
            : {
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                gap: 2,
                minWidth: 0,
              }
        }
      >
        <PreviewBox
          previewUrl={previewUrl}
          label={label}
          showError={showError}
          isUploading={isUploading}
          previewAlt={previewAlt}
          previewShape={previewShape}
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
            horizontal={previewShape === "circle"}
          />
          <Typography
            sx={theme => ({
              typography: "bodySm",
              color: theme.palette.text.secondary,
            })}
          >
            {resolvedHelperText}
          </Typography>
          {showError && resolvedError ? <ErrorDisplay errorMessage={resolvedError} /> : null}
        </Box>
      </Box>
      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED_TYPES.join(",")}
        onChange={onFileSelect}
        disabled={disabled}
        hidden
        aria-label={label ?? uploadLabel}
      />
      {allowUrlFallback ? (
        <UrlFallbackField
          imageUrl={imageUrl}
          onUrlChange={onUrlChange}
          disabled={disabled || isUploading}
          showError={showError}
          errorMessage={resolvedError}
          label={logoUrlLabel}
          optionalLabel={optionalLabel}
        />
      ) : null}
    </>
  );
}

export function CatalogImageUploadScaffold({
  props,
  slots,
}: Readonly<CatalogImageUploadScaffoldProps>): React.ReactNode {
  const {
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
    previewShape = "square",
  } = props;

  const t = useAppTranslation(Translation.Ui.CatalogImageUpload);
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

  const body = (
    <CatalogImageUploadBody
      previewUrl={resolvedPreview}
      label={label}
      showError={showError}
      isUploading={upload.isUploading}
      resolvedError={resolvedError}
      resolvedHelperText={resolvedHelperText}
      uploadLabel={t.upload}
      uploadingLabel={t.uploading}
      removeLabel={t.remove}
      previewAlt={t.previewAlt}
      previewShape={previewShape}
      onUploadClick={triggerFileInput}
      onRemoveClick={upload.handleRemove}
      disabled={disabled}
      fileInputRef={fileInputRef}
      onFileSelect={upload.handleFileSelect}
      allowUrlFallback={allowUrlFallback}
      imageUrl={imageUrl ?? null}
      onUrlChange={upload.handleUrlChange}
      logoUrlLabel={t.logoUrlLabel}
      optionalLabel={t.optional}
    />
  );

  const { ContainerWrapper } = slots ?? {};
  if (ContainerWrapper !== undefined) {
    return <ContainerWrapper>{body}</ContainerWrapper>;
  }
  return <Box sx={{ display: "flex", flexDirection: "column", gap: 1, minWidth: 0 }}>{body}</Box>;
}
