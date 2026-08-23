"use client";

import { Stack, TextField, Typography } from "@mui/material";
import { useAppearancePreviewStore } from "@/frontend/common/stores/appearancePreviewStore";

/**
 * Brand Identity section of the CustomizeSidebar — site name / title /
 * description text fields.
 *
 * Wires each field to `appearancePreviewStore.setField(key, value)` for
 * live draft updates. The draft's `siteName` / `siteTitle` /
 * `siteDescription` are passed directly as the GraphQL
 * `saveAppearanceDraft` mutation input — no client-side mapping (per
 * `frontend/common/stores/AGENTS.md`).
 *
 * Labels are inline English pending Task 9 (i18n namespace
 * `customize.*` per `shared/locale/types/dashboard/settings/appearance.ts`
 * header comment).
 */
export function BrandIdentitySection() {
  const siteName = useAppearancePreviewStore(s => s.draft.siteName);
  const siteTitle = useAppearancePreviewStore(s => s.draft.siteTitle);
  const siteDescription = useAppearancePreviewStore(s => s.draft.siteDescription);
  const setField = useAppearancePreviewStore(s => s.setField);

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
        Brand Identity
      </Typography>
      <TextField
        label="Site Name"
        size="small"
        value={siteName}
        onChange={e => setField("siteName", e.target.value)}
        fullWidth
      />
      <TextField
        label="Site Title"
        size="small"
        value={siteTitle}
        onChange={e => setField("siteTitle", e.target.value)}
        fullWidth
      />
      <TextField
        label="Site Description"
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
