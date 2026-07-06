"use client";

import { CloudUploadOutlined } from "@mui/icons-material";
import {
  Avatar,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Typography,
} from "@mui/material";
import { useTranslations } from "next-intl";
import type React from "react";
import { useRef, useState } from "react";

interface AvatarUploadDialogProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly currentAvatarUrl?: string;
  readonly parentName: string;
  readonly onUpload: (file: File) => void;
}

const MAX_FILE_SIZE_MB = 2;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export function AvatarUploadDialog({
  open,
  onClose,
  currentAvatarUrl,
  parentName,
  onUpload,
}: Readonly<AvatarUploadDialogProps>) {
  const t = useTranslations("dashboard.parentProfile.actions");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setError(null);
    if (!file) return;

    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError(t("avatarFileTypeError"));
      return;
    }

    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      setError(t("avatarFileSizeError", { maxMb: String(MAX_FILE_SIZE_MB) }));
      return;
    }

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleConfirm = () => {
    if (selectedFile) {
      onUpload(selectedFile);
      handleClose();
    }
  };

  const handleClose = () => {
    setPreviewUrl(null);
    setSelectedFile(null);
    setError(null);
    onClose();
  };

  const displayUrl = previewUrl ?? currentAvatarUrl;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth aria-labelledby="avatar-upload-dialog-title">
      <DialogTitle id="avatar-upload-dialog-title">{t("editPicture")}</DialogTitle>
      <DialogContent>
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 2,
            py: 2,
          }}
        >
          <Box sx={{ position: "relative" }}>
            <Avatar
              src={displayUrl}
              alt={parentName}
              sx={theme => ({
                width: 120,
                height: 120,
                border: `4px solid ${theme.palette.primary.main}1A`,
              })}
            >
              {parentName
                .split(" ")
                .map(n => n[0])
                .join("")
                .toUpperCase()}
            </Avatar>
            <IconButton
              onClick={() => fileInputRef.current?.click()}
              sx={theme => ({
                position: "absolute",
                bottom: 0,
                right: 0,
                backgroundColor: theme.palette.primary.main,
                color: theme.palette.onPrimary,
                border: "none",
                borderRadius: "50%",
                width: 36,
                height: 36,
                "&:hover": { backgroundColor: theme.palette.primary.dark },
              })}
            >
              <CloudUploadOutlined sx={{ fontSize: 18 }} />
            </IconButton>
          </Box>

          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_TYPES.join(",")}
            onChange={handleFileSelect}
            style={{ display: "none" }}
          />

          <Button
            variant="outlined"
            onClick={() => fileInputRef.current?.click()}
            sx={theme => ({
              borderColor: theme.palette.border.light,
              color: theme.palette.primary.main,
            })}
          >
            {previewUrl ? t("changePicture") : t("selectPicture")}
          </Button>

          {error && (
            <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.error.main })}>
              {error}
            </Typography>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} variant="outlined">
          {t("cancel")}
        </Button>
        <Button onClick={handleConfirm} disabled={!selectedFile} variant="contained">
          {t("upload")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
