"use client";

import { CloudUploadOutlined, DeleteOutlined, ErrorOutlined, LinkOutlined } from "@mui/icons-material";
import { alpha, Box, Button, CircularProgress, Divider, InputAdornment, TextField, Typography } from "@mui/material";
import type { Theme } from "@mui/material/styles";
import Image from "next/image";
import type * as React from "react";
import { useCallback, useRef } from "react";
import type {
  CatalogImageUploadButtonLayout,
  CatalogImageUploadSharedProps,
  CatalogImageUploadSlotProps,
  ErrorDisplayProps,
  PreviewBoxProps,
  UploadButtonsProps,
  UrlFallbackFieldProps,
} from "@/frontend/common/components/ui/input/catalogImageUpload/types/catalogImageUploadShared.types";
import { ACCEPTED_TYPES, DEFAULT_MAX_SIZE_MB, useImageUpload } from "@/frontend/common/hooks/useImageUpload";
import { Translation, useAppTranslation } from "@/shared/locale";

const DEFAULT_PREVIEW_SIZE = 96;
const DEFAULT_HELPER_TEXT_VARIANT = "bodyMd";
const DEFAULT_BUTTON_LAYOUT: CatalogImageUploadButtonLayout = "vertical";

export const PreviewBox: React.FC<PreviewBoxProps> = ({
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

function getButtonContainerSx(layout: CatalogImageUploadButtonLayout): React.CSSProperties {
  if (layout === "horizontal") {
    return { display: "flex", flexDirection: "row", flexWrap: "wrap", gap: 1, alignItems: "center" };
  }
  if (layout === "fullWidth") {
    return { display: "flex", gap: 1, width: "100%" };
  }
  return { display: "flex", flexDirection: "column", flexWrap: "wrap", gap: 1, alignItems: "stretch" };
}

function getButtonSx(layout: CatalogImageUploadButtonLayout) {
  return (theme: Theme) => ({
    borderRadius: String(theme.layout.radius.button),
    ...(layout === "fullWidth" ? { flex: 1 } : {}),
    ...(layout === "vertical" ? { justifyContent: "flex-start" } : {}),
  });
}

export const UploadButtons: React.FC<UploadButtonsProps> = ({
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
  urlFieldSize,
  urlFieldFullWidth,
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
  readonly previewSize: number;
  readonly buttonSize: "small" | "medium" | "large" | undefined;
  readonly buttonLayout: CatalogImageUploadButtonLayout;
  readonly helperTextTypography: string;
  readonly fileInputAriaLabel: boolean;
  readonly urlFieldSize: "small" | "medium" | undefined;
  readonly urlFieldFullWidth: boolean;
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

function getPreviewContentSx(
  previewShape: "square" | "circle",
  buttonLayout: CatalogImageUploadButtonLayout
): React.CSSProperties {
  const isColumn = previewShape === "circle" || buttonLayout === "vertical";
  return {
    display: "flex",
    flexDirection: isColumn ? "column" : "row",
    alignItems: isColumn ? "flex-start" : "center",
    gap: isColumn ? 1.5 : 2,
    minWidth: 0,
  };
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
  previewSize,
  buttonSize,
  buttonLayout,
  helperTextTypography,
  fileInputAriaLabel,
  urlFieldSize,
  urlFieldFullWidth,
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
      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED_TYPES.join(",")}
        onChange={onFileSelect}
        disabled={disabled}
        hidden
        aria-label={fileInputAriaLabel ? (label ?? uploadLabel) : undefined}
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
          urlFieldSize={urlFieldSize}
          urlFieldFullWidth={urlFieldFullWidth}
        />
      ) : null}
    </>
  );
}

function getButtonLayout(
  slots: CatalogImageUploadSlotProps | undefined,
  previewShape: "square" | "circle"
): CatalogImageUploadButtonLayout {
  if (slots?.buttonLayout !== undefined) return slots.buttonLayout;
  return previewShape === "circle" ? "horizontal" : DEFAULT_BUTTON_LAYOUT;
}

function getContainerSx(slots: CatalogImageUploadSlotProps | undefined): React.CSSProperties {
  if (slots?.ContainerWrapper !== undefined) {
    return { display: "flex", flexDirection: "column", gap: 1.5 };
  }
  return { display: "flex", flexDirection: "column", gap: 1, minWidth: 0 };
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

  const previewSize = slots?.previewSize ?? DEFAULT_PREVIEW_SIZE;
  const buttonSize = slots?.buttonSize;
  const buttonLayout = getButtonLayout(slots, previewShape);
  const helperTextTypography = slots?.helperTextVariant ?? DEFAULT_HELPER_TEXT_VARIANT;
  const fileInputAriaLabel = slots?.fileInputAriaLabel ?? true;
  const urlFieldSize = slots?.urlFieldSize;
  const urlFieldFullWidth = slots?.urlFieldFullWidth ?? false;

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
      previewSize={previewSize}
      buttonSize={buttonSize}
      buttonLayout={buttonLayout}
      helperTextTypography={helperTextTypography}
      fileInputAriaLabel={fileInputAriaLabel}
      urlFieldSize={urlFieldSize}
      urlFieldFullWidth={urlFieldFullWidth}
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
  return <Box sx={getContainerSx(slots)}>{body}</Box>;
}
