import { createTheme, type PaletteMode, responsiveFontSizes } from "@mui/material/styles";
import "@mui/x-data-grid/themeAugmentation";
import { arEG as muiArEg, enUS as muiEnUS } from "@mui/material/locale";
import { arSD as dataGridArSD, enUS as dataGridEnUS } from "@mui/x-data-grid/locales";
import { components } from "@/frontend/common/providers/theme/components";
import { layoutSettings } from "@/frontend/common/providers/theme/layoutSettings";
import { darkPalette } from "@/frontend/common/providers/theme/palette/darkPalette";
import { lightPalette } from "@/frontend/common/providers/theme/palette/lightPalette";
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

// Autofill tokens are mode-specific; only the dark variants are baked into the
// single shared component overrides tree because cssVars renders one stylesheet
// for both modes (component overrides reference `theme.palette.*` CSS vars, which
// resolve per active mode at runtime; the mode-fixed autofill strings below match
// the project's default dark scheme — see the migration report for details).
const autofillTokens = {
  light: {
    autofillBackground: "#ffffff",
    autofillText: "#191c1e",
  },
  dark: {
    autofillBackground: "#161d1d",
    autofillText: "#dde4e3",
  },
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
    borderRadius: 16, // Use rounded system
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
 */
export function createAppCssVarsTheme(direction: "rtl" | "ltr" = "ltr", locale: string = "en") {
  // Dark tokens are used because the app's default scheme is "dark"
  // (see `getThemeFromCookies` in `frontend/lib/theme-detection.ts`).
  const isLight = false;
  const autofillTokensForDefault = autofillTokens.dark;

  const themeWithLocale = createTheme(
    {
      cssVariables: {
        // Use a `data-*` attribute selector (rather than the default `media`)
        // so `useColorScheme().setMode()` can toggle the mode manually. The
        // matching `attribute="data"` on `<InitColorSchemeScript />` in the
        // root layout keeps SSR and client in sync without flicker.
        colorSchemeSelector: "data",
      },
      colorSchemes: {
        light: { palette: { mode: "light", ...lightPalette } },
        dark: { palette: { mode: "dark", ...darkPalette } },
      },

      ...sharedFoundation(direction),

      components: components({
        isLight,
        autofillBackground: autofillTokensForDefault.autofillBackground,
        autofillText: autofillTokensForDefault.autofillText,
      }),
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
export function createAppTheme(mode: PaletteMode, direction: "rtl" | "ltr" = "ltr", locale: string = "en") {
  const isLight = mode === "light";
  const palette = isLight ? lightPalette : darkPalette;
  const autofillBackground = isLight ? autofillTokens.light.autofillBackground : autofillTokens.dark.autofillBackground;
  const autofillText = isLight ? autofillTokens.light.autofillText : autofillTokens.dark.autofillText;

  const themeWithLocale = createTheme(
    {
      ...sharedFoundation(direction),

      palette: {
        mode,
        ...palette,
      },

      components: components({
        isLight,
        autofillBackground,
        autofillText,
      }),
    },
    ...locales(locale)
  );

  return responsiveFontSizes(themeWithLocale);
}

export const appTheme = createAppTheme("dark");
