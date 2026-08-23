"use client";

import { Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, Stack, Typography } from "@mui/material";
import { useNotifications } from "@toolpad/core/useNotifications";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { RequirePermission } from "@/frontend/common/components/auth/RequirePermission";
import { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql";
import { APPEARANCE_PRESETS, type AppearancePreset } from "@/frontend/common/providers/theme/presets";
import { useAppearancePreviewStore } from "@/frontend/common/stores/appearancePreviewStore";
import { exportAppearanceJson } from "@/frontend/common/views/dashboard/appearance/shared/exportAppearanceJson";
import { PresetSwatch } from "@/frontend/common/views/dashboard/components/customize/PresetThemeSection";
import { Translation, useAppTranslation } from "@/shared/locale";

/**
 * AppearanceSettingsTab — form-view entry point for site appearance
 * customization.
 *
 * Renders a hero (title + subtitle), a published/draft status row, a
 * "Quick Presets" picker (Task 9.4 — applies a built-in preset theme to
 * the in-memory draft and writes the brand CSS vars for instant visual
 * preview), an "Enter Customize Mode" CTA that opens the customizer
 * overlay via the `?customize=1` search param, and an action bar with
 * Save Draft / Publish Now / Reset to Defaults / Export JSON buttons.
 *
 * Action handlers are stubs that fire toast notifications using the i18n
 * strings defined in `SettingsAppearanceTabLabels`. The actual GraphQL
 * mutations (save draft, publish, reset) are wired in Phase 6 — see
 * implementation.md §11 (AppearanceSettings service).
 *
 * The customizer overlay UI (sidebar, toolbar, live preview) is scoped to
 * Task 9; this tab is only the landing/form view.
 */
export function AppearanceSettingsTab() {
  const t = useAppTranslation(Translation.Dashboard.Settings).appearance;
  const router = useRouter();
  const notifications = useNotifications();
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const draft = useAppearancePreviewStore(s => s.draft);
  const setModeColors = useAppearancePreviewStore(s => s.setModeColors);

  const handleEnterCustomizeMode = () => {
    const url = new URL(window.location.href);
    url.searchParams.set("customize", "1");
    router.push(url.pathname + url.search);
  };

  const handleApplyPreset = (preset: AppearancePreset): void => {
    // Writes both per-mode pairs into the draft. The store's `setModeColors`
    // also writes the active-mode brand CSS vars on `<html>` for instant
    // visual preview even before the admin enters customize mode. Undo
    // history is preserved (each `setModeColors` pushes the prior draft
    // onto the undo stack).
    setModeColors("light", { ...preset.light });
    setModeColors("dark", { ...preset.dark });
    notifications.show(`${preset.name} preset applied — enter customize mode to refine`, {
      severity: "success",
    });
  };

  const handleSaveDraft = () => {
    // Phase 6: wire to `saveAppearanceDraft` GraphQL mutation.
    notifications.show(t.saveDraftSuccess, { severity: "success" });
  };

  const handlePublish = () => {
    // Phase 6: wire to `publishAppearance` GraphQL mutation.
    notifications.show(t.publishSuccess, { severity: "success" });
  };

  const handleExportJson = () => {
    // Task 9.3 (AC-28) — serializes the in-memory draft as JSON with a
    // `$schema` header pointing to `shared/schemas/appearance.schema.json`
    // and triggers a browser download (`appearance-settings.json`). The
    // exported file is IDE-autocompletion-ready (VS Code `json.schemas`
    // glob from Task 9.1 covers `*appearance*.json` as a fallback).
    exportAppearanceJson(draft);
    notifications.show(t.exportJson, { severity: "success" });
  };

  const handleResetConfirm = () => {
    setResetDialogOpen(false);
    // Phase 6: wire to `resetAppearanceDraft` GraphQL mutation.
    notifications.show(t.resetSuccess, { severity: "success" });
  };

  return (
    <RequirePermission
      permissions={AppPermission.SettingsAppearanceManage}
      fallback={
        <Box sx={{ py: 4 }}>
          <Typography sx={theme => ({ typography: "bodyMd", color: theme.palette.text.secondary })}>
            {t.noPermission}
          </Typography>
        </Box>
      }
    >
      <Stack sx={{ gap: 3 }}>
        <Box>
          <Typography sx={{ typography: "titleLg", mb: 1 }}>{t.title}</Typography>
          <Typography sx={theme => ({ typography: "bodyMd", color: theme.palette.text.secondary })}>
            {t.subtitle}
          </Typography>
        </Box>

        <Stack direction={{ xs: "column", sm: "row" }} sx={{ gap: 2, alignItems: { xs: "flex-start", sm: "center" } }}>
          <Stack direction="row" sx={{ gap: 1, alignItems: "center", flexWrap: "wrap" }}>
            <Chip size="small" color="success" variant="outlined" label={t.publishedBadge} />
            <Typography sx={theme => ({ typography: "bodyMd", color: theme.palette.text.secondary })}>
              {t.lastPublishedBy("administrator", "2 days ago")}
            </Typography>
          </Stack>

          <Box sx={{ flexGrow: 1 }} />

          <Stack direction="row" sx={{ gap: 1, alignItems: "center", flexWrap: "wrap" }}>
            <Chip size="small" color="warning" variant="outlined" label={t.draftBadge} />
            <Typography sx={theme => ({ typography: "bodyMd", color: theme.palette.text.secondary })}>
              {t.draftUpdatedJustNow}
            </Typography>
          </Stack>

          <Button variant="contained" color="primary" onClick={handleEnterCustomizeMode}>
            {t.enterCustomizeMode}
          </Button>
        </Stack>

        <Typography sx={theme => ({ typography: "bodyMd", color: theme.palette.text.secondary })}>
          {t.enterCustomizeModeHint}
        </Typography>

        <Box>
          <Typography sx={{ typography: "titleSm", mb: 1 }}>Quick Presets</Typography>
          <Typography sx={theme => ({ typography: "bodyMd", color: theme.palette.text.secondary, mb: 2 })}>
            Click a preset to preview it instantly. Open customize mode to fine-tune.
          </Typography>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr 1fr", sm: "repeat(3, 1fr)" },
              gap: 1.5,
            }}
          >
            {APPEARANCE_PRESETS.map(preset => (
              <PresetSwatch key={preset.id} preset={preset} onSelect={() => handleApplyPreset(preset)} />
            ))}
          </Box>
        </Box>

        <Stack direction={{ xs: "column", sm: "row" }} sx={{ gap: 2, mt: 2 }}>
          <Button variant="outlined" color="primary" onClick={handleSaveDraft}>
            {t.saveDraft}
          </Button>
          <Button variant="contained" color="primary" onClick={handlePublish}>
            {t.publishNow}
          </Button>
          <Button variant="text" color="inherit" onClick={() => setResetDialogOpen(true)}>
            {t.resetToDefaults}
          </Button>
          <Box sx={{ flexGrow: 1 }} />
          <Button variant="text" color="inherit" onClick={handleExportJson}>
            {t.exportJson}
          </Button>
        </Stack>
      </Stack>

      <Dialog open={resetDialogOpen} onClose={() => setResetDialogOpen(false)}>
        <DialogTitle>{t.resetConfirmTitle}</DialogTitle>
        <DialogContent>{t.resetConfirmBody}</DialogContent>
        <DialogActions>
          <Button onClick={() => setResetDialogOpen(false)}>{t.resetConfirmCancel}</Button>
          <Button onClick={handleResetConfirm} color="error" variant="contained">
            {t.resetConfirmConfirm}
          </Button>
        </DialogActions>
      </Dialog>
    </RequirePermission>
  );
}
