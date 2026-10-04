"use client";

import { CloudUploadOutlined, DeleteOutlined, DescriptionOutlined, EditOutlined } from "@mui/icons-material";
import { alpha, Box, Button, CircularProgress, IconButton, Typography } from "@mui/material";
import type { Theme } from "@mui/material/styles";
import Image from "next/image";
import { AVATAR_SIZE_PX } from "@/frontend/common/components/ui/input/avatarImageField/AvatarImageField.constants";
import { AvatarConicRing } from "@/frontend/common/components/ui/input/avatarImageField/avatarRingShared";

function avatarHeadingSx(theme: Theme, displayValue: Record<string, string>) {
  return {
    typography: "titleLg" as const,
    color: theme.palette.onSurface,
    mb: { xs: 2, md: 2.5 },
    textAlign: { xs: "center", md: "start" } as const,
    display: displayValue,
  };
}

export function FieldHeading({ label, title }: { readonly label: string; readonly title: string }): React.ReactNode {
  return (
    <>
      <Typography sx={theme => avatarHeadingSx(theme, { xs: "block", md: "none" })}>{label}</Typography>
      <Typography sx={theme => avatarHeadingSx(theme, { xs: "none", md: "block" })}>{title}</Typography>
    </>
  );
}

interface UploadProgressOverlayProps {
  readonly isUploading: boolean;
}

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

interface AvatarRingProps {
  readonly previewUrl: string | null;
  readonly isUploading: boolean;
  readonly alt: string;
}

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

interface AvatarEditIconButtonProps {
  readonly onClick: () => void;
  readonly disabled: boolean;
  readonly ariaLabel: string;
}

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

export function AvatarSlot({
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

export type UploadStatusTexts = {
  readonly upload: string;
  readonly uploading: string;
  readonly remove: string;
};

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

export function AvatarActionsStack({
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
