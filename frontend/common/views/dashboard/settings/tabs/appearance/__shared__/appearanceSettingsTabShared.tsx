"use client";

import { Box, Button, Stack, Typography } from "@mui/material";
import type { ComponentType } from "react";
import { StatusBadge } from "@/frontend/common/components/ui";
import { AppearanceResetDialog } from "@/frontend/common/views/dashboard/appearance/shared/AppearanceResetDialog";
import { PresetSwatch } from "@/frontend/common/views/dashboard/components/customize/PresetThemeSection";
import { BrandColorPreviewCard } from "@/frontend/common/views/dashboard/settings/tabs/appearance/__shared__/brandColorPreviewCard";
import type {
  AppearanceSectionPanelSlotProps,
  AppearanceSettingsViewModel,
} from "@/frontend/common/views/dashboard/settings/types/appearanceSettings.types";

export interface AppearanceSettingsTabSharedProps {
  readonly viewModel: AppearanceSettingsViewModel;
  /**
   * Tier section chrome: desktop passes `DesktopSectionPanel`, mobile passes
   * `MobileSectionPanel`. Both satisfy {@link AppearanceSectionPanelSlotProps}.
   */
  readonly SectionPanel: ComponentType<AppearanceSectionPanelSlotProps>;
}

/**
 * Tier-agnostic scaffold for the Settings → Appearance tab: hero, published /
 * draft status row, brand-color preview cards, quick preset grid, action bar,
 * and the reset confirmation dialog.
 *
 * Both tiers pass their section panel via the `SectionPanel` slot; all copy
 * and behavior come from the ViewModel (scaffold never calls hooks).
 */
export function AppearanceSettingsTabShared({ viewModel, SectionPanel }: Readonly<AppearanceSettingsTabSharedProps>) {
  return (
    <Stack sx={{ gap: 3 }}>
      <Box>
        <Typography sx={{ typography: "titleLg", mb: 1 }}>{viewModel.labels.title}</Typography>
        <Typography sx={theme => ({ typography: "bodyMd", color: theme.palette.text.secondary })}>
          {viewModel.labels.subtitle}
        </Typography>
        <Typography sx={theme => ({ typography: "bodyMd", color: theme.palette.text.secondary, mt: 1 })}>
          {viewModel.labels.enterCustomizeModeHint}
        </Typography>
      </Box>

      <SectionPanel
        actions={
          <Button variant="contained" color="primary" onClick={viewModel.onEnterCustomizeMode}>
            {viewModel.labels.enterCustomizeMode}
          </Button>
        }
      >
        <Stack sx={{ gap: 2 }}>
          <Stack direction="row" sx={{ gap: 1, alignItems: "center", flexWrap: "wrap" }}>
            <StatusBadge category="syncStatus" status="success" label={viewModel.labels.publishedBadge} />
            <Typography sx={theme => ({ typography: "bodyMd", color: theme.palette.text.secondary })}>
              {viewModel.publishedMetaLabel}
            </Typography>
          </Stack>
          <Stack direction="row" sx={{ gap: 1, alignItems: "center", flexWrap: "wrap" }}>
            <StatusBadge category="syncStatus" status="partial" label={viewModel.labels.draftBadge} />
            <Typography sx={theme => ({ typography: "bodyMd", color: theme.palette.text.secondary })}>
              {viewModel.draftMetaLabel}
            </Typography>
          </Stack>
        </Stack>
      </SectionPanel>

      <SectionPanel title={viewModel.labels.currentBrandColors} subTitle={viewModel.labels.currentBrandColorsHint}>
        <Stack direction={{ xs: "column", sm: "row" }} sx={{ gap: 2 }}>
          <BrandColorPreviewCard
            label={viewModel.labels.lightMode}
            primaryLabel={viewModel.labels.primaryColor}
            secondaryLabel={viewModel.labels.secondaryColor}
            primary={viewModel.draft.colors.light.primaryMain}
            secondary={viewModel.draft.colors.light.secondaryMain}
          />
          <BrandColorPreviewCard
            label={viewModel.labels.darkMode}
            primaryLabel={viewModel.labels.primaryColor}
            secondaryLabel={viewModel.labels.secondaryColor}
            primary={viewModel.draft.colors.dark.primaryMain}
            secondary={viewModel.draft.colors.dark.secondaryMain}
          />
        </Stack>
      </SectionPanel>

      <SectionPanel title={viewModel.labels.quickPresets} subTitle={viewModel.labels.quickPresetsHint}>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr 1fr", sm: "repeat(3, 1fr)" },
            gap: 1.5,
          }}
        >
          {viewModel.presets.map(preset => (
            <PresetSwatch
              key={preset.id}
              preset={preset}
              selected={preset.id === viewModel.presetId}
              onSelect={() => viewModel.onApplyPreset(preset)}
            />
          ))}
        </Box>
      </SectionPanel>

      <Stack direction={{ xs: "column", sm: "row" }} sx={{ gap: 2 }}>
        <Button
          variant="outlined"
          color="primary"
          onClick={viewModel.onSaveDraft}
          disabled={viewModel.saveDraftDisabled}
        >
          {viewModel.labels.saveDraft}
        </Button>
        <Button variant="contained" color="primary" onClick={viewModel.onPublish} disabled={viewModel.publishLoading}>
          {viewModel.labels.publishNow}
        </Button>
        <Button variant="text" color="inherit" onClick={viewModel.onOpenResetDialog} disabled={viewModel.resetLoading}>
          {viewModel.labels.resetToDefaults}
        </Button>
        <Box sx={{ flexGrow: 1 }} />
        <Button variant="text" color="inherit" onClick={viewModel.onExportJson}>
          {viewModel.labels.exportJson}
        </Button>
      </Stack>

      <AppearanceResetDialog
        open={viewModel.resetDialogOpen}
        loading={viewModel.resetLoading}
        labels={viewModel.labels}
        onClose={viewModel.onCloseResetDialog}
        onConfirm={viewModel.onResetConfirm}
      />
    </Stack>
  );
}
