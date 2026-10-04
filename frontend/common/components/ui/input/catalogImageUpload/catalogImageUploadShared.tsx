"use client";

import { Box } from "@mui/material";
import type * as React from "react";
import { useCallback, useRef } from "react";
import {
  DEFAULT_HELPER_TEXT_VARIANT,
  DEFAULT_PREVIEW_SIZE,
} from "@/frontend/common/components/ui/input/catalogImageUpload/catalogImageUploadShared.constants";
import {
  getButtonLayout,
  getContainerSx,
} from "@/frontend/common/components/ui/input/catalogImageUpload/catalogImageUploadShared.helpers";
import {
  FilePreviewAndActions,
  UrlFallbackField,
} from "@/frontend/common/components/ui/input/catalogImageUpload/catalogImageUploadShared.parts";
import type {
  CatalogImageUploadPreviewAndActionsProps,
  CatalogImageUploadSharedProps,
  CatalogImageUploadSlotProps,
} from "@/frontend/common/components/ui/input/catalogImageUpload/types/catalogImageUploadShared.types";
import { ACCEPTED_TYPES, DEFAULT_MAX_SIZE_MB, useImageUpload } from "@/frontend/common/hooks/useImageUpload";
import { Translation, useAppTranslation } from "@/shared/locale";

export interface CatalogImageUploadScaffoldProps {
  readonly props: CatalogImageUploadSharedProps;
  readonly slots?: CatalogImageUploadSlotProps;
}

interface CatalogImageUploadBodyProps extends CatalogImageUploadPreviewAndActionsProps {
  readonly fileInputAriaLabel: boolean;
  readonly urlFieldSize: "small" | "medium" | undefined;
  readonly urlFieldFullWidth: boolean;
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
        <Box component="span" sx={theme => ({ typography: "labelMd", color: theme.palette.text.secondary })}>
          {label}
        </Box>
      ) : null}
      <FilePreviewAndActions
        previewUrl={previewUrl}
        label={label}
        showError={showError}
        isUploading={isUploading}
        resolvedError={resolvedError}
        resolvedHelperText={resolvedHelperText}
        uploadLabel={uploadLabel}
        uploadingLabel={uploadingLabel}
        removeLabel={removeLabel}
        previewAlt={previewAlt}
        previewShape={previewShape}
        previewSize={previewSize}
        buttonSize={buttonSize}
        buttonLayout={buttonLayout}
        helperTextTypography={helperTextTypography}
        onUploadClick={onUploadClick}
        onRemoveClick={onRemoveClick}
        disabled={disabled}
      />
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
