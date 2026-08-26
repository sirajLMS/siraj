"use client";

import { Box, ButtonBase, Stack, Typography } from "@mui/material";
import { APPEARANCE_PRESETS, type AppearancePreset } from "@/frontend/common/providers/theme/presets";
import { useAppearancePreviewStore } from "@/frontend/common/stores/appearancePreviewStore";

/**
 * Preset Themes section of the CustomizeSidebar (Task 9.4, AC-29).
 *
 * Renders a 2-column grid of `PresetSwatch` cards (default / ocean /
 * emerald / violet / crimson / slate per locked decision §13). Clicking a
 * swatch dispatches `setModeColors("light", preset.light)` followed by
 * `setModeColors("dark", preset.dark)`, seeding both per-mode pairs in a
 * single user gesture.
 *
 * The store's `setModeColors` already pushes the prior draft onto the
 * undo stack and re-writes the active-mode CSS vars on `<html>`, so the
 * preset application gets live preview + undo for free — no local state
 * needed in this component.
 *
 * File split from `CustomizeSidebar.tsx` per the CodeScene 150-line
 * guideline (Task 6.3 sibling-section pattern). `PresetSwatch` is
 * exported so `AppearanceSettingsTab.tsx` can reuse the same card
 * without duplicating the 2x2 color grid markup.
 *
 * Swatch backgrounds use raw hex values from the preset catalog
 * (user-selectable brand-color data, NOT theme palette tokens), so the
 * "no hardcoded colors" rule in `frontend/AGENTS.md` does not apply —
 * same exemption as `ColorEditorSection` swatches.
 */
export function PresetThemeSection() {
  const applyPreset = useAppearancePreviewStore(s => s.applyPreset);
  const activePresetId = useAppearancePreviewStore(s => s.presetId);

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
        Preset Themes
      </Typography>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 1.5,
        }}
      >
        {APPEARANCE_PRESETS.map(preset => (
          <PresetSwatch
            key={preset.id}
            preset={preset}
            selected={preset.id === activePresetId}
            onSelect={() => applyPreset(preset)}
          />
        ))}
      </Box>
    </Stack>
  );
}

export interface PresetSwatchProps {
  readonly preset: AppearancePreset;
  readonly onSelect: () => void;
  readonly selected?: boolean;
}

/**
 * A single preset card — clickable button showing a 2x2 color grid.
 *
 * Wraps in MUI `ButtonBase` for keyboard accessibility (Space/Enter
 * triggers `onSelect`). The 2x2 grid is stacked: top row = light mode
 * (primary + secondary), bottom row = dark mode. The preset `name` is
 * rendered below the grid as a label.
 *
 * `aria-label` includes the preset name + "(applies light and dark
 * colors)" so screen readers announce the action consequence.
 *
 * Exported so the Settings tab (`AppearanceSettingsTab.tsx`) can reuse
 * the same card without duplicating the color-grid markup.
 */
export function PresetSwatch({ preset, onSelect, selected }: PresetSwatchProps) {
  return (
    <ButtonBase
      onClick={onSelect}
      aria-label={`${preset.name} preset (applies light and dark colors)`}
      aria-pressed={selected}
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: 1,
        p: 1,
        borderRadius: "12px",
        border: selected ? "2px solid var(--mui-palette-primary-main)" : "1px solid var(--mui-palette-outlineVariant)",
        backgroundColor: selected ? "var(--mui-palette-action-selected)" : "transparent",
        "&:hover": { backgroundColor: "var(--mui-palette-action-hover)" },
        "&:focus-visible": { outline: "2px solid var(--mui-palette-primary-main)" },
      }}
    >
      <Box
        component="span"
        sx={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gridTemplateRows: "1fr 1fr",
          width: "100%",
          height: 48,
          borderRadius: "8px",
          overflow: "hidden",
        }}
      >
        <ColorChip hex={preset.light.primaryMain} />
        <ColorChip hex={preset.light.secondaryMain} />
        <ColorChip hex={preset.dark.primaryMain} />
        <ColorChip hex={preset.dark.secondaryMain} />
      </Box>
      <Typography
        variant="caption"
        sx={{
          color: selected ? "var(--mui-palette-primary-main)" : "var(--mui-palette-text-secondary)",
          fontWeight: selected ? 700 : 400,
        }}
      >
        {preset.name}
      </Typography>
    </ButtonBase>
  );
}

interface ColorChipProps {
  readonly hex: string;
}

/**
 * Single color cell inside a `PresetSwatch` 2x2 grid.
 *
 * Renders a bare `<Box component="span">` with the hex as the background
 * color (raw brand-color data, NOT a theme token — see file header).
 * `aria-hidden` because the parent `ButtonBase` already exposes a
 * descriptive `aria-label`; individual color chips are decorative.
 */
function ColorChip({ hex }: ColorChipProps) {
  return <Box component="span" aria-hidden sx={{ backgroundColor: hex, width: "100%", height: "100%" }} />;
}
