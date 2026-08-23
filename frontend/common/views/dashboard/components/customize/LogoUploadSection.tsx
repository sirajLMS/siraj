"use client";

import { Box, Button, CircularProgress, Stack, Typography } from "@mui/material";
import { useNotifications } from "@toolpad/core/useNotifications";
import { useState } from "react";
import { useAppearanceLogoUpload } from "@/frontend/common/hooks/useAppearanceLogoUpload";
import { useAppearancePreviewStore } from "@/frontend/common/stores/appearancePreviewStore";
import { logger } from "@/frontend/common/utils/logger";

/**
 * Logo upload section of the CustomizeSidebar.
 *
 * Task 7 wires the file input to the shared storage upload flow:
 *  1. `useAppearanceLogoUpload` calls `prepareUpload` (GraphQL) to mint a
 *     signed-URL session under the `public/appearance/logo-<uuid>.<ext>`
 *     key (decision §20 — UUID-randomized keys prevent overwrite attacks).
 *  2. The file body is streamed to the signed-URL PUT endpoint
 *     (`/api/storage/upload/[id]`), which re-hashes the body (SHA-256)
 *     and creates a `storage_files` DB row.
 *  3. The returned canonical public URL is written into the draft via
 *     `setField("logoUrl", url)` — the existing `publishAppearance`
 *     mutation (Task 2.3) copies draft → published, so the logo URL is
 *     persisted on publish with no special "publish logo" step.
 *
 * The accept attribute lists png / jpeg / webp (the image kinds in the
 * backend `mime-allowlist.ts`). SVG (`image/svg+xml`) is intentionally
 * omitted — the backend explicitly excludes it (stored XSS risk via
 * inline `<script>` / `onload`). Adding SVG requires DOMPurify
 * sanitization before writing to disk (decision §20.1.b); deferred to a
 * follow-up — see `7-outcome.md` Carry-Forward.
 *
 * Toast feedback uses `useNotifications` (Toolpad) — the same channel as
 * the `CustomizeToolbar` save/publish/reset confirmations (Task 6.2).
 * Inline English strings are placeholder until Task 9 introduces the
 * `customize.*` i18n namespace (per 6.3 outcome Carry-Forward).
 */
const LOGO_UPLOAD_ACCEPT = "image/png,image/jpeg,image/webp";

export function LogoUploadSection() {
  const logoUrl = useAppearancePreviewStore(s => s.draft.logoUrl ?? null);
  const setField = useAppearancePreviewStore(s => s.setField);
  const { uploadLogo } = useAppearanceLogoUpload();
  const notifications = useNotifications();
  const [uploading, setUploading] = useState(false);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { url } = await uploadLogo(file);
      setField("logoUrl", url);
      notifications.show("Logo uploaded", { severity: "success" });
    } catch (error) {
      logger.error("Appearance logo upload failed", { error });
      notifications.show("Logo upload failed", { severity: "error" });
    } finally {
      setUploading(false);
      // Reset the input so selecting the same file again re-fires onChange.
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
          {uploading ? "Uploading…" : "Upload logo"}
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
            {logoUrl.split("/").pop() ?? logoUrl}
          </Typography>
          <Button size="small" color="error" onClick={() => setField("logoUrl", null)}>
            Remove
          </Button>
        </Stack>
      ) : null}
    </Stack>
  );
}
