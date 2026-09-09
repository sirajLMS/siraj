import { createTheme, type PaletteMode, responsiveFontSizes } from "@mui/material/styles";
import "@mui/x-data-grid/themeAugmentation";
import { arEG as muiArEg, enUS as muiEnUS } from "@mui/material/locale";
import { arSD as dataGridArSD, enUS as dataGridEnUS } from "@mui/x-data-grid/locales";
import { components } from "@/frontend/common/providers/theme/components";
import { layoutSettings } from "@/frontend/common/providers/theme/layoutSettings";
import type { AppearancePresetId } from "@/frontend/common/providers/theme/presets";
import { resolvePresetPalette, resolvePresetPalettes } from "@/frontend/common/providers/theme/presets/paletteFactory";
import { typography } from "@/frontend/common/providers/theme/typography";

const locales = (locale: string = "en") => {
  switch (locale) {
    case "ar":
      return [muiArEg, dataGridArSD];
    case "en":
      return [muiEnUS, dataGridEnUS];
    default:
      return [];
  }
};

const sharedFoundation = (direction: "rtl" | "ltr") => ({
  direction,
  layout: layoutSettings,
  // Standard Overrides for spacing scaling factor
  spacing: (factor: number | string) => {
    if (typeof factor === "string") return factor;
    return `${factor * 8}px`; // Conserve 8px scale step while retaining easy access
  },
  shape: {
    // FIX-26: Reduced from 16 to 8. MUI v9 multiplies numeric borderRadius
    // by this value — 16 produced 16px/32px/48px for borderRadius: 1/2/3 which
    // was way too round. 8 produces 8px/16px/24px which is professional + consistent.
    // String borderRadius values (e.g. "12px") are unaffected by this multiplier.
    borderRadius: 8,
  },
  typography,
});

/**
 * Build a CSS-variables-enabled theme for the App Router.
 *
 * Uses MUI v9's stable `cssVariables: true` + `colorSchemes` API (the
 * replacement for the deprecated `CssVarsProvider`). Both light and dark
 * palettes are bundled so the browser receives CSS variables for both modes,
 * enabling SSR-safe mode switching via `useColorScheme()` +
 * `<InitColorSchemeScript />` without the legacy custom `useState` mode
 * management.
 *
 * `forceThemeRerender: true` is set on the mounting `ThemeProvider` so that
 * `theme.palette.mode`-based component overrides (e.g. the DataGrid hover tint
 * in `components.ts`) continue to reflect the active mode, matching prior
 * behavior.
 *
 * `presetId` (optional) pins the palette pair to a specific catalog preset —
 * the root layout passes the preset resolved from the *published* appearance
 * row, so a preset published through the customize overlay persists after
 * reload instead of silently falling back to the `APP_THEME_PRESET` env var.
 * When omitted, `resolvePresetPalettes()` applies the env-preset fallback.
 */
export function createAppCssVarsTheme(
  direction: "rtl" | "ltr" = "ltr",
  locale: string = "en",
  defaultColorScheme: PaletteMode = "dark",
  presetId?: AppearancePresetId
) {
  const isLight = defaultColorScheme === "light";
  const palettes = resolvePresetPalettes(presetId);

  const themeWithLocale = createTheme(
    {
      cssVariables: {
        colorSchemeSelector: "data",
      },
      palette: {
        mode: defaultColorScheme,
        ...(isLight ? palettes.light : palettes.dark),
      },
      colorSchemes: isLight
        ? {
            light: { palette: { mode: "light", ...palettes.light } },
            dark: { palette: { mode: "dark", ...palettes.dark } },
          }
        : {
            dark: { palette: { mode: "dark", ...palettes.dark } },
            light: { palette: { mode: "light", ...palettes.light } },
          },

      ...sharedFoundation(direction),

      components: components(),
    },
    ...locales(locale)
  );

  return responsiveFontSizes(themeWithLocale);
}

/**
 * Build a single-mode theme (legacy shape, no `cssVariables`).
 *
 * Retained for Storybook (`StoryWrapper`) and component tests (`TestWrapper`)
 * which render a single preselected mode client-side and do not need the
 * cssVars / InitColorSchemeScript SSR machinery.
 */
export function createAppTheme(
  mode: PaletteMode,
  direction: "rtl" | "ltr" = "ltr",
  locale: string = "en",
  presetId?: AppearancePresetId
) {
  const palette = resolvePresetPalette(mode, presetId);

  const themeWithLocale = createTheme(
    {
      ...sharedFoundation(direction),

      palette: {
        mode,
        ...palette,
      },

      components: components(),
    },
    ...locales(locale)
  );

  return responsiveFontSizes(themeWithLocale);
}
