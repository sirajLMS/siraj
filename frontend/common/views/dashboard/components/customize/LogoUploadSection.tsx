"use client";

import { Box, Button, CircularProgress, Stack, Typography } from "@mui/material";
import { useNotifications } from "@toolpad/core/useNotifications";
import { useState } from "react";
import { useAppearancePreviewStore } from "@/frontend/common/stores/appearancePreviewStore";
import { logger } from "@/frontend/common/utils/logger";

const LOGO_UPLOAD_ACCEPT = "image/png,image/jpeg,image/webp";

export function LogoUploadSection() {
  const logoUrl = useAppearancePreviewStore(s => s.draft.logoUrl ?? null);
  const setField = useAppearancePreviewStore(s => s.setField);
  const notifications = useNotifications();
  const [uploading, setUploading] = useState(false);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      notifications.show("Logo file exceeds 2MB limit", { severity: "error" });
      event.target.value = "";
      return;
    }
    setUploading(true);
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.addEventListener("load", () => {
          const result = reader.result;
          if (typeof result === "string") {
            resolve(result);
          } else {
            reject(new Error("File read returned unexpected type"));
          }
        });
        reader.addEventListener("error", () => reject(new Error("File read failed")));
        reader.readAsDataURL(file);
      });
      setField("logoUrl", dataUrl);
      notifications.show("Logo loaded — save draft or publish to persist", { severity: "success" });
    } catch (error) {
      logger.error("Appearance logo read failed", { error });
      notifications.show("Logo load failed", { severity: "error" });
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  return (
    <Stack sx={{ gap: 1.5 }}>
      <Typography
        variant="caption"
        sx={{
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          color: "var(--mui-palette-text-secondary)",
        }}
      >
        Logo
      </Typography>
      <Box
        sx={{
          border: "2px dashed var(--mui-palette-outlineVariant)",
          borderRadius: 2,
          p: 2,
          textAlign: "center",
        }}
      >
        <Button component="label" variant="text" size="small" fullWidth disabled={uploading}>
          {uploading ? "Loading…" : "Upload logo"}
          <input type="file" accept={LOGO_UPLOAD_ACCEPT} hidden disabled={uploading} onChange={handleFileChange} />
        </Button>
        <Typography variant="caption" sx={{ display: "block", color: "var(--mui-palette-text-disabled)", mt: 0.5 }}>
          PNG/JPEG/WebP · max 2MB
        </Typography>
      </Box>
      {uploading ? (
        <Stack direction="row" sx={{ justifyContent: "center", py: 0.5 }}>
          <CircularProgress size={20} />
        </Stack>
      ) : null}
      {logoUrl ? (
        <Stack direction="row" sx={{ gap: 1, alignItems: "center" }}>
          <Box component="img" src={logoUrl} alt="Logo" sx={{ height: 28, borderRadius: 0.5 }} />
          <Typography
            variant="caption"
            sx={{
              flex: 1,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {logoUrl.startsWith("data:") ? "In-memory preview" : (logoUrl.split("/").pop() ?? logoUrl)}
          </Typography>
          <Button size="small" color="error" onClick={() => setField("logoUrl", null)}>
            Remove
          </Button>
        </Stack>
      ) : null}
    </Stack>
  );
}
