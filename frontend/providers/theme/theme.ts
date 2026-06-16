import { createTheme, type PaletteMode, responsiveFontSizes } from "@mui/material/styles";
import "@mui/x-data-grid/themeAugmentation";
import { arEG as muiArEg, enUS as muiEnUS } from "@mui/material/locale";
import { arSD as dataGridArSD, enUS as dataGridEnUS } from "@mui/x-data-grid/locales";
import { components } from "./components";
import { layoutSettings } from "./layoutSettings";
import { darkPalette } from "./palette/darkPalette";
import { lightPalette } from "./palette/lightPalette";
import { typography } from "./typography";

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

export function createAppTheme(mode: PaletteMode, direction: "rtl" | "ltr" = "ltr", locale: string = "en") {
  const isLight = mode === "light";
  const palette = isLight ? lightPalette : darkPalette;
  const autofillBackground = isLight ? "#ffffff" : "#161d1d";
  const autofillText = isLight ? "#191c1e" : "#dde4e3";

  const themeWithLocale = createTheme(
    {
      direction,

      palette: {
        mode,
        ...palette,
      },

      layout: layoutSettings,
      // Standard Overrides for spacing scaling factor
      spacing: (factor: number | string) => {
        if (typeof factor === "string") return factor;
        return `${factor * 8}px`; // Conserve 8px scale step while retaining easy access
      },
      shape: {
        borderRadius: 16, // Use rounded system
      },
      typography: typography,
      components: components({
        isLight: mode === "light",
        autofillBackground,
        autofillText,
      }),
    },
    ...locales(locale)
  );

  return responsiveFontSizes(themeWithLocale);
}

export const appTheme = createAppTheme("dark");
