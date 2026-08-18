"use client";

import { CloudUploadOutlined, DeleteOutlined, DescriptionOutlined, EditOutlined } from "@mui/icons-material";
import { alpha, Box, Button, CircularProgress, IconButton, Typography } from "@mui/material";
import type { Theme } from "@mui/material/styles";
import Image from "next/image";
import { useCallback, useRef } from "react";
import { type Control, Controller, type FieldPath, type FieldValues } from "react-hook-form";
import {
  AvatarConicRing,
  AvatarFrostedContainer,
} from "@/frontend/common/components/ui/input/avatarImageField/avatarRingShared";
import { ACCEPTED_TYPES, DEFAULT_MAX_SIZE_MB, useImageUpload } from "@/frontend/common/hooks/useImageUpload";
import { Translation, useAppTranslation } from "@/shared/locale";

type AvatarImageFieldBaseProps = {
  readonly label: string;
  readonly title?: string;
  readonly onUploadAvatar: (file: File) => Promise<{ url: string }>;
  readonly disabled?: boolean;
};

type AvatarImageFieldFormProps<T extends FieldValues> = AvatarImageFieldBaseProps & {
  readonly control: Control<T>;
  readonly name: FieldPath<T>;
  readonly value?: never;
  readonly onChange?: never;
};

type AvatarImageFieldControlledProps = AvatarImageFieldBaseProps & {
  readonly control?: never;
  readonly name?: never;
  readonly value: string | null | undefined;
  readonly onChange: (url: string | null) => void;
};

export type AvatarImageFieldProps<T extends FieldValues = FieldValues> =
  | AvatarImageFieldFormProps<T>
  | AvatarImageFieldControlledProps;

const AVATAR_SIZE_PX = 128;

type UploadStatusTexts = {
  readonly upload: string;
  readonly uploading: string;
  readonly remove: string;
};

function avatarHeadingSx(theme: Theme, displayValue: Record<string, string>) {
  return {
    typography: "titleLg" as const,
    color: theme.palette.onSurface,
    mb: { xs: 2, md: 2.5 },
    textAlign: { xs: "center", md: "start" } as const,
    display: displayValue,
  };
}

function FieldHeading({ label, title }: { readonly label: string; readonly title: string }): React.ReactNode {
  return (
    <>
      <Typography sx={theme => avatarHeadingSx(theme, { xs: "block", md: "none" })}>{label}</Typography>
      <Typography sx={theme => avatarHeadingSx(theme, { xs: "none", md: "block" })}>{title}</Typography>
    </>
  );
}

type UploadProgressOverlayProps = {
  readonly isUploading: boolean;
};

function UploadProgressOverlay({ isUploading }: Readonly<UploadProgressOverlayProps>): React.ReactNode {
  if (!isUploading) {
    return null;
  }
  return (
    <Box
      sx={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: (theme: Theme) => alpha(theme.palette.scrim, 0.45),
      }}
    >
      <CircularProgress size={28} />
    </Box>
  );
}

type AvatarRingProps = {
  readonly previewUrl: string | null;
  readonly isUploading: boolean;
  readonly alt: string;
};

function AvatarRing({ previewUrl, isUploading, alt }: Readonly<AvatarRingProps>): React.ReactNode {
  return (
    <AvatarConicRing size={{ xs: 112, md: AVATAR_SIZE_PX }}>
      {previewUrl ? (
        <Image src={previewUrl} alt={alt} fill priority unoptimized style={{ objectFit: "cover" }} />
      ) : (
        <CloudUploadOutlined sx={theme => ({ fontSize: 40, color: theme.palette.text.secondary })} />
      )}
      <UploadProgressOverlay isUploading={isUploading} />
    </AvatarConicRing>
  );
}

type AvatarEditIconButtonProps = {
  readonly onClick: () => void;
  readonly disabled: boolean;
  readonly ariaLabel: string;
};

function AvatarEditIconButton({ onClick, disabled, ariaLabel }: Readonly<AvatarEditIconButtonProps>): React.ReactNode {
  return (
    <IconButton
      size="small"
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      sx={theme => ({
        position: "absolute",
        top: 4,
        right: 4,
        width: 32,
        height: 32,
        backgroundColor: theme.palette.surfaceContainerHighest,
        color: theme.palette.onSurface,
        border: `1px solid ${theme.palette.outlineVariant}`,
        boxShadow: theme.palette.shadow.card,
        "&:hover": {
          backgroundColor: theme.palette.surfaceContainerHigh,
        },
        display: { xs: "none", md: "inline-flex" },
      })}
    >
      <EditOutlined sx={{ fontSize: 16 }} />
    </IconButton>
  );
}

type AvatarSlotProps = AvatarRingProps & {
  readonly triggerFileInput: () => void;
  readonly editDisabled: boolean;
  readonly uploadAriaLabel: string;
};

function AvatarSlot({
  previewUrl,
  isUploading,
  alt,
  triggerFileInput,
  editDisabled,
  uploadAriaLabel,
}: Readonly<AvatarSlotProps>): React.ReactNode {
  return (
    <Box sx={{ position: "relative", flexShrink: 0 }}>
      <AvatarRing previewUrl={previewUrl} isUploading={isUploading} alt={alt} />
      <AvatarEditIconButton onClick={triggerFileInput} disabled={editDisabled} ariaLabel={uploadAriaLabel} />
    </Box>
  );
}

type AvatarActionsStackProps = {
  readonly triggerFileInput: () => void;
  readonly onRemove: () => void;
  readonly disabled: boolean;
  readonly isUploading: boolean;
  readonly previewUrl: string | null;
  readonly helperText: string;
  readonly localError: string | null;
  readonly texts: UploadStatusTexts;
};

function AvatarActionsStack({
  triggerFileInput,
  onRemove,
  disabled,
  isUploading,
  previewUrl,
  helperText,
  localError,
  texts,
}: Readonly<AvatarActionsStackProps>): React.ReactNode {
  return (
    <Box
      sx={theme => ({
        flex: 1,
        width: "100%",
        minWidth: 0,
        display: "flex",
        flexDirection: "column",
        gap: 1.25,
        alignItems: { xs: "stretch", md: "flex-start" },
        p: { xs: 1.5, md: 0 },
        borderRadius: theme.layout.radius.card,
        backgroundColor: {
          xs: alpha(theme.palette.surfaceContainerHighest, 0.55),
          md: "transparent",
        },
      })}
    >
      <Button
        variant="contained"
        startIcon={<CloudUploadOutlined />}
        onClick={triggerFileInput}
        disabled={disabled || isUploading}
        fullWidth
        sx={theme => ({
          maxWidth: { md: 240 },
          borderRadius: theme.layout.radius.button,
          fontWeight: 700,
          py: 1.15,
          color: theme.palette.onPrimary,
          background: `linear-gradient(135deg, ${theme.palette.primary.light}, ${theme.palette.primary.main})`,
          "&:hover": {
            background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
          },
        })}
      >
        {isUploading ? texts.uploading : texts.upload}
      </Button>
      <Button
        variant="outlined"
        color="primary"
        startIcon={<DeleteOutlined />}
        onClick={onRemove}
        disabled={disabled || isUploading || !previewUrl}
        fullWidth
        sx={theme => ({
          maxWidth: { md: 240 },
          borderRadius: theme.layout.radius.button,
          fontWeight: 700,
          py: 1.15,
        })}
      >
        {texts.remove}
      </Button>
      <Typography
        sx={theme => ({
          typography: "bodyMd",
          color: theme.palette.text.secondary,
          display: "flex",
          alignItems: "center",
          justifyContent: { xs: "center", md: "flex-start" },
          gap: 0.75,
          mt: 0.25,
        })}
      >
        <DescriptionOutlined sx={{ fontSize: 16 }} />
        {helperText}
      </Typography>
      {localError ? (
        <Typography sx={theme => ({ typography: "bodyMd", color: theme.palette.error.main })}>{localError}</Typography>
      ) : null}
    </Box>
  );
}

type AvatarEditorBodyProps = {
  readonly imageUrl: string | null | undefined;
  readonly onImageUrlChange: (url: string | null) => void;
  readonly onUploadAvatar: (file: File) => Promise<{ url: string }>;
  readonly label: string;
  readonly title: string;
  readonly disabled: boolean;
};

function AvatarEditorBody({
  imageUrl,
  onImageUrlChange,
  onUploadAvatar,
  label,
  title,
  disabled,
}: Readonly<AvatarEditorBodyProps>): React.ReactNode {
  const tUpload = useAppTranslation(Translation.Ui.CatalogImageUpload);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const upload = useImageUpload({
    onImageUrlChangeAction: onImageUrlChange,
    onUploadAction: onUploadAvatar,
  });

  const triggerFileInput = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const previewUrl = upload.previewUrl ?? imageUrl ?? null;
  const helperText = tUpload.helperText(DEFAULT_MAX_SIZE_MB);
  const texts: UploadStatusTexts = {
    upload: tUpload.upload,
    uploading: tUpload.uploading,
    remove: tUpload.remove,
  };
  const editDisabled = disabled || upload.isUploading;

  return (
    <AvatarFrostedContainer px={{ xs: 2, md: 3 }} py={{ xs: 2.5, md: 3 }}>
      <FieldHeading label={label} title={title} />
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          alignItems: "center",
          gap: { xs: 2.5, md: 3 },
        }}
      >
        <AvatarSlot
          previewUrl={previewUrl}
          isUploading={upload.isUploading}
          alt={label}
          triggerFileInput={triggerFileInput}
          editDisabled={editDisabled}
          uploadAriaLabel={tUpload.upload}
        />
        <AvatarActionsStack
          triggerFileInput={triggerFileInput}
          onRemove={upload.handleRemove}
          disabled={disabled}
          isUploading={upload.isUploading}
          previewUrl={previewUrl}
          helperText={helperText}
          localError={upload.localError}
          texts={texts}
        />
      </Box>
      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED_TYPES.join(",")}
        onChange={upload.handleFileSelect}
        disabled={disabled}
        hidden
      />
    </AvatarFrostedContainer>
  );
}

export function AvatarImageField<T extends FieldValues>(props: Readonly<AvatarImageFieldProps<T>>): React.ReactNode {
  const { label, onUploadAvatar, disabled = false } = props;
  const title = props.title ?? label;

  if ("control" in props && props.control && props.name) {
    return (
      <Controller
        name={props.name}
        control={props.control}
        render={({ field }) => (
          <AvatarEditorBody
            imageUrl={field.value ?? null}
            onImageUrlChange={url => field.onChange(url ?? undefined)}
            onUploadAvatar={onUploadAvatar}
            label={label}
            title={title}
            disabled={disabled}
          />
        )}
      />
    );
  }

  return (
    <AvatarEditorBody
      imageUrl={props.value}
      onImageUrlChange={url => props.onChange?.(url)}
      onUploadAvatar={onUploadAvatar}
      label={label}
      title={title}
      disabled={disabled}
    />
  );
}
