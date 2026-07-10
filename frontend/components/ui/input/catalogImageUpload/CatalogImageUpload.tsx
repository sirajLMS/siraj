"use client";

import { CloudUploadOutlined, DeleteOutlined, ErrorOutlined, LinkOutlined } from "@mui/icons-material";
import {
  Box,
  Button,
  CircularProgress,
  Divider,
  IconButton,
  InputAdornment,
  TextField,
  Typography,
} from "@mui/material";
import { useNotifications } from "@toolpad/core/useNotifications";
import { useTranslations } from "next-intl";
import type * as React from "react";
import { useCallback, useEffect, useRef, useState } from "react";

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
const DEFAULT_MAX_SIZE_MB = 2;
const BYTES_PER_MB = 1024 * 1024;

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

type UploadState = "idle" | "uploading" | "ready" | "error";

export const CatalogImageUpload: React.FC<CatalogImageUploadProps> = ({
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
  const t = useTranslations("ui.catalogImageUpload");
  const notifications = useNotifications();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const objectUrlRef = useRef<string | null>(null);

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadState, setUploadState] = useState<UploadState>("idle");
  const [localError, setLocalError] = useState<string | null>(null);

  const maxBytes = maxSizeMb * BYTES_PER_MB;

  const resolvedPreview = previewUrl ?? imageUrl ?? null;
  const showError = error || localError !== null;
  const resolvedError = errorMessage ?? localError;
  const resolvedHelperText = helperText ?? t("helperText", { maxMb: String(maxSizeMb) });

  useEffect(() => {
    return () => {
      if (objectUrlRef.current !== null) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
    };
  }, []);

  const setLocalPreview = useCallback((file: File) => {
    if (objectUrlRef.current !== null) {
      URL.revokeObjectURL(objectUrlRef.current);
    }
    const url = URL.createObjectURL(file);
    objectUrlRef.current = url;
    setPreviewUrl(url);
  }, []);

  const handleFileSelect = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      event.target.value = "";
      if (!file) {
        return;
      }

      setLocalError(null);

      if (!ACCEPTED_TYPES.includes(file.type as (typeof ACCEPTED_TYPES)[number])) {
        const message = t("invalidType");
        setLocalError(message);
        notifications.show(message, { severity: "error" });
        return;
      }

      if (file.size > maxBytes) {
        const message = t("fileTooLarge", { maxMb: String(maxSizeMb) });
        setLocalError(message);
        notifications.show(message, { severity: "error" });
        return;
      }

      setLocalPreview(file);

      if (!onUploadAction) {
        return;
      }

      setUploadState("uploading");
      try {
        const result = await onUploadAction(file);
        onImageUrlChangeAction?.(result.url);
        onFilePathChangeAction?.(result.filePath ?? null);
        setUploadState("ready");
      } catch {
        const message = t("uploadFailed");
        setLocalError(message);
        notifications.show(message, { severity: "error" });
        setUploadState("error");
      }
    },
    [
      maxBytes,
      maxSizeMb,
      notifications,
      onFilePathChangeAction,
      onImageUrlChangeAction,
      onUploadAction,
      setLocalPreview,
      t,
    ]
  );

  const handleRemove = useCallback(() => {
    if (objectUrlRef.current !== null) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
    setPreviewUrl(null);
    setLocalError(null);
    setUploadState("idle");
    onImageUrlChangeAction?.(null);
    onFilePathChangeAction?.(null);
  }, [onFilePathChangeAction, onImageUrlChangeAction]);

  const handleUrlChange = useCallback(
    (value: string) => {
      onImageUrlChangeAction?.(value === "" ? null : value);
      onFilePathChangeAction?.(null);
    },
    [onFilePathChangeAction, onImageUrlChangeAction]
  );

  const triggerFileInput = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const isUploading = uploadState === "uploading";

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
      {label ? (
        <Typography variant="labelMd" component="span" sx={theme => ({ color: theme.palette.text.secondary })}>
          {label}
        </Typography>
      ) : null}
      <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2 }}>
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
          {resolvedPreview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={resolvedPreview}
              alt={label ?? t("previewAlt")}
              style={{ width: "100%", height: "100%", objectFit: "contain" }}
            />
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
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
          <Box sx={{ display: "flex", gap: 1 }}>
            <Button
              variant="contained"
              startIcon={<CloudUploadOutlined />}
              onClick={triggerFileInput}
              disabled={disabled || isUploading}
              aria-label={t("upload")}
              sx={theme => ({ borderRadius: theme.layout.radius.button })}
            >
              {isUploading ? t("uploading") : t("upload")}
            </Button>
            <Button
              variant="outlined"
              startIcon={<DeleteOutlined />}
              onClick={handleRemove}
              disabled={disabled || isUploading || !resolvedPreview}
              aria-label={t("remove")}
              sx={theme => ({ borderRadius: theme.layout.radius.button })}
            >
              {t("remove")}
            </Button>
          </Box>
          <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.text.secondary })}>
            {resolvedHelperText}
          </Typography>
          {showError && resolvedError ? (
            <Typography
              variant="bodyMd"
              sx={theme => ({ display: "flex", alignItems: "center", gap: 0.5, color: theme.palette.error.main })}
            >
              <ErrorOutlined fontSize="small" />
              {resolvedError}
            </Typography>
          ) : null}
        </Box>
      </Box>
      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED_TYPES.join(",")}
        onChange={handleFileSelect}
        disabled={disabled}
        hidden
      />
      {allowUrlFallback ? (
        <>
          <Divider sx={{ my: 0 }}>
            <Typography variant="labelMd" component="span" sx={theme => ({ color: theme.palette.text.secondary })}>
              {t("optional")}
            </Typography>
          </Divider>
          <TextField
            label={t("logoUrlLabel")}
            placeholder="https://cdn.example.com/logo.png"
            value={imageUrl ?? ""}
            onChange={event => handleUrlChange(event.target.value)}
            disabled={disabled || isUploading}
            error={showError}
            helperText={showError ? resolvedError : undefined}
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
      ) : null}
    </Box>
  );
};

// keep IconButton import referenced for future toolbar variant without unused import lint
void IconButton;
