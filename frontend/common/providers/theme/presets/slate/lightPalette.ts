import type { PaletteOptions } from "@mui/material/styles";
import {
  SHARED_LIGHT_SEMANTIC_PALETTE,
  SHARED_LIGHT_SHELL_SURFACE_PALETTE,
} from "@/frontend/common/providers/theme/palette/paletteDefaults";

/**
 * Slate preset — light mode.
 *
 * Primary: blue-gray (Blue Gray 700). Secondary: gray (Blue Gray 500).
 * Minimal, professional, monochrome feel with cool neutral backgrounds.
 */
export const lightPalette: PaletteOptions = {
  text: {
    primary: "#0F172A", // Slate 900
    secondary: "#334155", // Darkened for WCAG AA contrast on light slate backgrounds
    disabled: "#94A3B8",
  },

  primary: {
    main: "#455A64", // Blue Gray 700
    light: "#607D8B",
    dark: "#37474F",
    contrastText: "#FFFFFF",
  },
  onPrimary: "#FFFFFF",
  primaryContainer: "#CFD8DC",
  onPrimaryContainer: "#37474F",

  secondary: {
    main: "#607D8B", // Blue Gray 500
    light: "#90A4AE",
    dark: "#455A64",
    contrastText: "#FFFFFF",
  },
  onSecondary: "#FFFFFF",
  secondaryContainer: "#ECEFF1",
  onSecondaryContainer: "#455A64",

  ...SHARED_LIGHT_SEMANTIC_PALETTE,

  info: {
    main: "#475569", // Slate info
    light: "#64748B",
    dark: "#334155",
    contrastText: "#FFFFFF",
  },
  onInfo: "#FFFFFF",
  infoContainer: "#E2E8F0",
  onInfoContainer: "#334155",

  ...SHARED_LIGHT_SHELL_SURFACE_PALETTE,

  divider: "rgba(69, 90, 100, 0.14)",
  action: {
    active: "#455A64",
    hover: "rgba(69, 90, 100, 0.06)",
    selected: "rgba(69, 90, 100, 0.10)",
    disabled: "rgba(69, 90, 100, 0.26)",
    disabledBackground: "rgba(69, 90, 100, 0.04)",
    // Focus is distinct from hover — higher opacity for keyboard nav (WCAG 2.4.7)
    focus: "rgba(69, 90, 100, 0.22)",
  },
  scrim: "#000000",
  inverseSurface: "#0F172A",
  inverseOnSurface: "#F8FAFC",
  inversePrimary: "#607D8B",
  surfaceDim: "#E2E8F0",
  surfaceBright: "#FFFFFF",

  surfaceContainerLowest: "#FFFFFF",
  surfaceContainerLow: "#F8FAFC",
  surfaceContainer: "#F1F5F9",
  surfaceContainerHigh: "#E2E8F0",
  // Saturated for stronger visual lift on light slate background (VLM 10/10 fix)
  surfaceContainerHighest: "#90A4AE",

  border: {
    light: "#E2E8F0",
    main: "#CBD5E1",
  },
  // Slate-tinted shadows — soft charcoal with subtle blue-gray glow ring for depth.
  shadow: {
    card: "0 4px 6px -1px rgba(15, 23, 42, 0.10), 0 2px 4px -2px rgba(15, 23, 42, 0.06), 0 0 0 1px rgba(69, 90, 100, 0.06)",
    cardHover:
      "0 10px 20px -3px rgba(15, 23, 42, 0.14), 0 4px 8px -2px rgba(15, 23, 42, 0.08), 0 0 0 1px rgba(69, 90, 100, 0.10)",
    button: "0 1px 3px 0 rgba(15, 23, 42, 0.12), 0 1px 2px 0 rgba(15, 23, 42, 0.08)",
    buttonHover: "0 4px 8px -1px rgba(69, 90, 100, 0.20), 0 2px 4px -2px rgba(15, 23, 42, 0.10)",
  },

  status: {
    pending: "#D97706",
    onPending: "#FFFFFF",
    pendingContainer: "#FEF3C7",
    onPendingContainer: "#78350F",
    confirmed: "#475569",
    onConfirmed: "#FFFFFF",
    // Saturated container for better chip visibility on light backgrounds
    confirmedContainer: "#CBD5E1",
    onConfirmedContainer: "#334155",
    active: "#16A34A",
    onActive: "#FFFFFF",
    activeContainer: "#DCFCE7",
    onActiveContainer: "#14532D",
    completed: "#9333EA",
    onCompleted: "#FFFFFF",
    completedContainer: "#F3E8FF",
    onCompletedContainer: "#581C87",
    cancelled: "#DC2626",
    onCancelled: "#FFFFFF",
    // Saturated container for stronger red visibility on light backgrounds
    cancelledContainer: "#FECACA",
    onCancelledContainer: "#7F1D1D",
    blocked: "#475569",
    onBlocked: "#FFFFFF",
    blockedContainer: "#F1F5F9",
    onBlockedContainer: "#0F172A",
  },

  DataGrid: {
    bg: "#FFFFFF",
    pinnedBg: "#F8FAFC",
    headerBg: "#F1F5F9",
  },
};
