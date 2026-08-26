import type { PaletteOptions } from "@mui/material/styles";
import {
  SHARED_LIGHT_SEMANTIC_PALETTE,
  SHARED_LIGHT_SHELL_SURFACE_PALETTE,
  SHARED_LIGHT_STATUS_PALETTE,
} from "@/frontend/common/providers/theme/palette/paletteDefaults";

export const lightPalette: PaletteOptions = {
  // Standard MUI Text Palette (WCAG 2.1 AA Compliant high contrast for secondary text)
  text: {
    primary: "#0F172A", // Slate 900
    secondary: "#334155", // Slate 700 (~9.5:1 contrast ratio against #FFFFFF)
    disabled: "#94A3B8", // Slate 400
  },

  primary: {
    main: "#0D9488", // Deep Teal
    light: "#14B8A6",
    dark: "#0F766E",
    contrastText: "#FFFFFF",
  },
  onPrimary: "#FFFFFF",
  primaryContainer: "#CCFBF1", // Mint container background
  onPrimaryContainer: "#115E59", // Dark teal text (~7.8:1 contrast against container)

  secondary: {
    main: "#4F46E5", // Vivid Indigo
    light: "#818CF8",
    dark: "#3730A3",
    contrastText: "#FFFFFF",
  },
  onSecondary: "#FFFFFF",
  secondaryContainer: "#E0E7FF",
  onSecondaryContainer: "#312E81",

  ...SHARED_LIGHT_SEMANTIC_PALETTE,

  info: {
    main: "#2563EB",
    light: "#60A5FA",
    dark: "#1E40AF",
    contrastText: "#FFFFFF",
  },
  onInfo: "#FFFFFF",
  infoContainer: "#DBEAFE",
  onInfoContainer: "#1E3A8A",

  ...SHARED_LIGHT_SHELL_SURFACE_PALETTE,

  scrim: "#000000",
  inverseSurface: "#0F172A",
  inverseOnSurface: "#F8FAFC",
  inversePrimary: "#2DD4BF",
  surfaceDim: "#E2E8F0",
  surfaceBright: "#FFFFFF",

  // Material 3 Surface Containers
  surfaceContainerLowest: "#FFFFFF",
  surfaceContainerLow: "#F8FAFC",
  surfaceContainer: "#F1F5F9",
  surfaceContainerHigh: "#E2E8F0",
  surfaceContainerHighest: "#CBD5E1",

  border: {
    light: "#E2E8F0",
    main: "#CBD5E1", // Adds clear visual definition
  },
  shadow: {
    card: "0 4px 6px -1px rgba(15, 23, 42, 0.08), 0 2px 4px -2px rgba(15, 23, 42, 0.04)",
    cardHover: "0 10px 15px -3px rgba(15, 23, 42, 0.12), 0 4px 6px -2px rgba(15, 23, 42, 0.06)",
    button: "0 1px 3px 0 rgba(15, 23, 42, 0.1), 0 1px 2px 0 rgba(15, 23, 42, 0.06)",
    buttonHover: "0 4px 6px -1px rgba(15, 23, 42, 0.12), 0 2px 4px -2px rgba(15, 23, 42, 0.08)",
  },

  // High-Contrast Status Badge Pairings
  status: SHARED_LIGHT_STATUS_PALETTE,

  DataGrid: {
    bg: "#FFFFFF",
    pinnedBg: "#F8FAFC",
    headerBg: "#F1F5F9",
  },
};
