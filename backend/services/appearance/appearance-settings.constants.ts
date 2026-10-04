/**
 * Preset brand-color lookup for the appearance service.
 *
 * Maps each preset id to its atomic `primaryMain` + `secondaryMain` pairs
 * (light + dark). Used to derive the default appearance fields from the active
 * preset (via `APP_THEME_PRESET` env var) instead of hardcoding teal/indigo.
 *
 * Backend-safe mirror of the frontend preset catalog
 * (`frontend/common/providers/theme/presets/index.ts`). Kept as a plain hex
 * lookup (no MUI imports) so the backend service layer can read it without
 * crossing the frontend/backend boundary.
 */

interface PresetBrandColors {
  light: { primaryMain: string; secondaryMain: string };
  dark: { primaryMain: string; secondaryMain: string };
}

const PRESET_BRAND_COLORS: Record<string, PresetBrandColors> = {
  default: {
    light: { primaryMain: "#0D9488", secondaryMain: "#4F46E5" },
    dark: { primaryMain: "#2DD4BF", secondaryMain: "#818CF8" },
  },
  ocean: {
    light: { primaryMain: "#00838F", secondaryMain: "#0277BD" },
    dark: { primaryMain: "#26C6DA", secondaryMain: "#4FC3F7" },
  },
  emerald: {
    light: { primaryMain: "#2E7D32", secondaryMain: "#558B2F" },
    dark: { primaryMain: "#4CAF50", secondaryMain: "#9CCC65" },
  },
  violet: {
    light: { primaryMain: "#7B1FA2", secondaryMain: "#C2185B" },
    dark: { primaryMain: "#BA68C8", secondaryMain: "#F06292" },
  },
  crimson: {
    light: { primaryMain: "#C62828", secondaryMain: "#EF6C00" },
    dark: { primaryMain: "#EF5350", secondaryMain: "#FFA726" },
  },
  slate: {
    light: { primaryMain: "#455A64", secondaryMain: "#607D8B" },
    dark: { primaryMain: "#78909C", secondaryMain: "#B0BEC5" },
  },
};

/** The active preset's brand colors, read from `APP_THEME_PRESET` env var. */
export function getActivePresetBrandColors(): PresetBrandColors {
  const presetId = process.env.APP_THEME_PRESET ?? "default";
  return PRESET_BRAND_COLORS[presetId] ?? PRESET_BRAND_COLORS.default;
}
