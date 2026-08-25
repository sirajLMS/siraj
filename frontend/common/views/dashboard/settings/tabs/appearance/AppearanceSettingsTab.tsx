"use client";

import { useMutation } from "@apollo/client/react";
import { Box, Button, Chip, Divider, Stack, Typography } from "@mui/material";
import { useNotifications } from "@toolpad/core/useNotifications";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { RequirePermission } from "@/frontend/common/components/auth/RequirePermission";
import { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql";
import {
  publishAppearanceMutationDocument,
  resetAppearanceDraftMutationDocument,
  saveAppearanceDraftMutationDocument,
} from "@/frontend/common/graphql/sharedDocuments/settings/site-appearance-settings.documents";
import { useAppearanceLogoUpload } from "@/frontend/common/hooks/useAppearanceLogoUpload";
import { APPEARANCE_PRESETS, type AppearancePreset } from "@/frontend/common/providers/theme/presets";
import { useAppearancePreviewStore } from "@/frontend/common/stores/appearancePreviewStore";
import { logger } from "@/frontend/common/utils/logger";
import { AppearanceResetDialog } from "@/frontend/common/views/dashboard/appearance/shared/AppearanceResetDialog";
import { exportAppearanceJson } from "@/frontend/common/views/dashboard/appearance/shared/exportAppearanceJson";
import { prepareDraftForAction } from "@/frontend/common/views/dashboard/appearance/shared/resolveDraftLogoForSave";
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
 * The action bar wires to the same `saveAppearanceDraft` /
 * `publishAppearance` / `resetAppearanceDraft` GraphQL mutations used by
 * the customize overlay toolbar (Task 6.2). Because this form view does
 * not track the server `updatedAt` snapshot (it has no live query), the
 * mutations are sent with `expectedUpdatedAt: undefined` — i.e. the
 * optimistic-concurrency check (AC-33) is bypassed here; the full
 * conflict Reload/Overwrite dialog is owned by the customize overlay.
 * The customizer overlay UI (sidebar, toolbar, live preview) is scoped
 * to Task 9; this tab is only the landing/form view.
 */
export function AppearanceSettingsTab() {
  const t = useAppTranslation(Translation.Dashboard.Settings).appearance;
  const router = useRouter();
  const notifications = useNotifications();
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const draft = useAppearancePreviewStore(s => s.draft);
  const dirty = useAppearancePreviewStore(s => s.dirty);
  const markSaved = useAppearancePreviewStore(s => s.markSaved);
  const setColors = useAppearancePreviewStore(s => s.setColors);
  const setField = useAppearancePreviewStore(s => s.setField);
  const { uploadLogo } = useAppearanceLogoUpload();
  const [saveDraft, { loading: saveLoading }] = useMutation(saveAppearanceDraftMutationDocument);
  const [publish, { loading: publishLoading }] = useMutation(publishAppearanceMutationDocument);
  const [resetDraft, { loading: resetLoading }] = useMutation(resetAppearanceDraftMutationDocument);

  const handleEnterCustomizeMode = () => {
    const url = new URL(window.location.href);
    url.searchParams.set("customize", "1");
    router.push(url.pathname + url.search);
  };

  const handleApplyPreset = (preset: AppearancePreset): void => {
    // Set both mode pairs in a single undo step (uses setColors instead of
    // two setModeColors calls which would create 2 undo entries).
    setColors({ light: { ...preset.light }, dark: { ...preset.dark } });
    notifications.show(`${preset.name} preset applied — enter customize mode to refine`, {
      severity: "success",
    });
  };

  const handleSaveDraft = async () => {
    try {
      const input = await prepareDraftForAction(draft, uploadLogo, setField);
      await saveDraft({ variables: { input, expectedUpdatedAt: undefined } });
      markSaved();
      notifications.show(t.saveDraftSuccess, { severity: "success" });
    } catch (error) {
      logger.error("Failed to save appearance draft from settings tab", { error });
      notifications.show(t.saveDraftError, { severity: "error" });
    }
  };

  const handlePublish = async () => {
    try {
      const input = await prepareDraftForAction(draft, uploadLogo, setField);
      // Save the in-memory edits into the server draft first so the
      // publish actually reflects what the admin sees on screen.
      if (dirty) {
        await saveDraft({ variables: { input, expectedUpdatedAt: undefined } });
      }
      await publish({ variables: { expectedUpdatedAt: undefined } });
      markSaved();
      notifications.show(t.publishSuccess, { severity: "success" });
    } catch (error) {
      logger.error("Failed to publish appearance from settings tab", { error });
      notifications.show(t.publishError, { severity: "error" });
    }
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

  const handleResetConfirm = async () => {
    setResetDialogOpen(false);
    try {
      await resetDraft();
      // Mark saved - the server's draft_fields now match the published
      // columns, so the local `dirty` flag should clear. The customizer
      // provider (Task 9) will re-sync the local draft from the refetched
      // `appearanceSettings` query; until then, the user can still undo
      // via the store's history stack if needed.
      markSaved();
      notifications.show(t.resetSuccess, { severity: "success" });
    } catch (error) {
      logger.error("Failed to reset appearance draft from settings tab", { error });
      notifications.show(t.resetError, { severity: "error" });
    }
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
          <Typography sx={{ typography: "titleSm", mb: 1.5 }}>{t.currentBrandColors}</Typography>
          <Typography sx={theme => ({ typography: "bodyMd", color: theme.palette.text.secondary, mb: 2 })}>
            {t.currentBrandColorsHint}
          </Typography>
          <Stack direction={{ xs: "column", sm: "row" }} sx={{ gap: 2 }}>
            <BrandColorPreviewCard
              label={t.lightMode}
              primaryLabel={t.primaryColor}
              secondaryLabel={t.secondaryColor}
              primary={draft.colors.light.primaryMain}
              secondary={draft.colors.light.secondaryMain}
            />
            <BrandColorPreviewCard
              label={t.darkMode}
              primaryLabel={t.primaryColor}
              secondaryLabel={t.secondaryColor}
              primary={draft.colors.dark.primaryMain}
              secondary={draft.colors.dark.secondaryMain}
            />
          </Stack>
          <Divider sx={{ mt: 3, mb: 2 }} />
          <Typography sx={{ typography: "titleSm", mb: 1.5 }}>{t.quickPresets}</Typography>
          <Typography sx={theme => ({ typography: "bodyMd", color: theme.palette.text.secondary, mb: 2 })}>
            {t.quickPresetsHint}
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
          <Button variant="outlined" color="primary" onClick={handleSaveDraft} disabled={!dirty || saveLoading}>
            {t.saveDraft}
          </Button>
          <Button variant="contained" color="primary" onClick={handlePublish} disabled={publishLoading}>
            {t.publishNow}
          </Button>
          <Button variant="text" color="inherit" onClick={() => setResetDialogOpen(true)} disabled={resetLoading}>
            {t.resetToDefaults}
          </Button>
          <Box sx={{ flexGrow: 1 }} />
          <Button variant="text" color="inherit" onClick={handleExportJson}>
            {t.exportJson}
          </Button>
        </Stack>
      </Stack>

      <AppearanceResetDialog
        open={resetDialogOpen}
        loading={resetLoading}
        labels={t}
        onClose={() => setResetDialogOpen(false)}
        onConfirm={handleResetConfirm}
      />
    </RequirePermission>
  );
}

/**
 * BrandColorPreviewCard — visual swatch card showing the primary + secondary
 * brand colors for one mode, with hex labels.
 *
 * Added as a styling enhancement (mandatory feature improvement): gives
 * admins an at-a-glance visual reference of their current draft palette
 * without needing to enter the full customize overlay.
 */
function BrandColorPreviewCard({
  label,
  primaryLabel,
  secondaryLabel,
  primary,
  secondary,
}: {
  readonly label: string;
  readonly primaryLabel: string;
  readonly secondaryLabel: string;
  readonly primary: string;
  readonly secondary: string;
}) {
  return (
    <Box
      sx={{
        flex: 1,
        p: 2,
        borderRadius: 2,
        border: "1px solid var(--mui-palette-outlineVariant)",
        backgroundColor: "var(--mui-palette-background-paper)",
      }}
    >
      <Typography
        sx={{
          typography: "caption",
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          color: "var(--mui-palette-text-secondary)",
          mb: 1.5,
        }}
      >
        {label}
      </Typography>
      <Stack direction="row" sx={{ gap: 2 }}>
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0.5 }}>
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: 1.5,
              backgroundColor: primary,
              border: "2px solid var(--mui-palette-outlineVariant)",
              boxShadow: theme => `0 2px 8px ${theme.palette.mode === "dark" ? "rgba(0,0,0,0.3)" : "rgba(0,0,0,0.1)"}`,
            }}
          />
          <Typography
            sx={{ typography: "caption", fontFamily: "monospace", color: "var(--mui-palette-text-secondary)" }}
          >
            {primary}
          </Typography>
          <Typography sx={{ typography: "caption", color: "var(--mui-palette-text-disabled)", fontSize: 10 }}>
            {primaryLabel}
          </Typography>
        </Box>
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0.5 }}>
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: 1.5,
              backgroundColor: secondary,
              border: "2px solid var(--mui-palette-outlineVariant)",
              boxShadow: theme => `0 2px 8px ${theme.palette.mode === "dark" ? "rgba(0,0,0,0.3)" : "rgba(0,0,0,0.1)"}`,
            }}
          />
          <Typography
            sx={{ typography: "caption", fontFamily: "monospace", color: "var(--mui-palette-text-secondary)" }}
          >
            {secondary}
          </Typography>
          <Typography sx={{ typography: "caption", color: "var(--mui-palette-text-disabled)", fontSize: 10 }}>
            {secondaryLabel}
          </Typography>
        </Box>
      </Stack>
    </Box>
  );
}
