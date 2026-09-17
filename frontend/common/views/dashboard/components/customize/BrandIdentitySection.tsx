"use client";

import { Stack, TextField, Typography } from "@mui/material";
import { useAppearancePreviewStore } from "@/frontend/common/stores/appearancePreviewStore";
import { Translation, useAppTranslation } from "@/shared/locale";

/**
 * Brand Identity section of the CustomizeSidebar — site name / title /
 * description text fields.
 *
 * Wires each field to `appearancePreviewStore.setField(key, value)` for
 * live draft updates. The draft's `siteName` / `siteTitle` /
 * `siteDescription` are passed directly as the GraphQL
 * `saveAppearanceDraft` mutation input — no client-side mapping (per
 * `frontend/common/stores/AGENTS.md`).
 */
export function BrandIdentitySection() {
  const siteName = useAppearancePreviewStore(s => s.draft.siteName);
  const siteTitle = useAppearancePreviewStore(s => s.draft.siteTitle);
  const siteDescription = useAppearancePreviewStore(s => s.draft.siteDescription);
  const setField = useAppearancePreviewStore(s => s.setField);
  const t = useAppTranslation(Translation.Dashboard.Settings).appearance.customize;

  return (
    <Stack sx={{ gap: 2 }}>
      <Typography
        variant="caption"
        sx={{
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          color: "var(--mui-palette-text-secondary)",
        }}
      >
        {t.brandIdentity}
      </Typography>
      <TextField
        label={t.siteName}
        size="small"
        value={siteName}
        onChange={e => setField("siteName", e.target.value)}
        fullWidth
      />
      <TextField
        label={t.siteTitle}
        size="small"
        value={siteTitle}
        onChange={e => setField("siteTitle", e.target.value)}
        fullWidth
      />
      <TextField
        label={t.siteDescription}
        size="small"
        multiline
        minRows={2}
        value={siteDescription}
        onChange={e => setField("siteDescription", e.target.value)}
        fullWidth
      />
    </Stack>
  );
}
