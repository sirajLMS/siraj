import type { PaletteOptions } from "@mui/material/styles";
import { SHARED_LIGHT_SEMANTIC_PALETTE } from "@/frontend/common/providers/theme/palette/paletteDefaults";

/**
 * Violet preset — light mode.
 *
 * Primary: deep purple (Purple 700). Secondary: pink (Pink 700).
 * Creative, regal feel with purple-tinted backgrounds.
 */
export const lightPalette: PaletteOptions = {
  text: {
    primary: "#1E1033", // Deep violet-slate
    secondary: "#3B1A5E", // Darkened for WCAG AA contrast on light violet backgrounds
    disabled: "#B39BC9",
  },

  primary: {
    main: "#7B1FA2", // Purple 700
    light: "#AB47BC",
    dark: "#4A148C",
    contrastText: "#FFFFFF",
  },
  onPrimary: "#FFFFFF",
  primaryContainer: "#E1BEE7",
  onPrimaryContainer: "#4A148C",

  secondary: {
    main: "#C2185B", // Pink 700
    light: "#E91E63",
    dark: "#880E4F",
    contrastText: "#FFFFFF",
  },
  onSecondary: "#FFFFFF",
  secondaryContainer: "#F8BBD0",
  onSecondaryContainer: "#880E4F",

  ...SHARED_LIGHT_SEMANTIC_PALETTE,

  info: {
    main: "#7C3AED", // Violet info
    light: "#A78BFA",
    dark: "#5B21B6",
    contrastText: "#FFFFFF",
  },
  onInfo: "#FFFFFF",
  infoContainer: "#EDE9FE",
  onInfoContainer: "#5B21B6",

  header: "#FFFFFF",
  onHeader: "#1E1033",
  headerContainer: "#FFFFFF",
  onHeaderContainer: "#1E1033",

  footer: "#FFFFFF",
  onFooter: "#1E1033",
  footerContainer: "#FAF5FF", // Very light violet tint
  onFooterContainer: "#5B3A7A",

  sidebar: "#FFFFFF",
  onSidebar: "#1E1033",
  sidebarContainer: "#FAF5FF",
  onSidebarContainer: "#5B3A7A",

  background: {
    default: "#FAF5FF",
    paper: "#FFFFFF",
  },
  onBackground: "#1E1033",
  surface: "#FFFFFF",
  onSurface: "#1E1033",
  surfaceVariant: "#F3E8FF",
  onSurfaceVariant: "#5B3A7A",
  outline: "#CE93D8",
  outlineVariant: "#F3E8FF",
  divider: "rgba(123, 31, 162, 0.14)",
  action: {
    active: "#7B1FA2",
    hover: "rgba(123, 31, 162, 0.06)",
    selected: "rgba(123, 31, 162, 0.10)",
    disabled: "rgba(123, 31, 162, 0.26)",
    disabledBackground: "rgba(123, 31, 162, 0.04)",
    // Focus is distinct from hover — higher opacity for keyboard nav (WCAG 2.4.7)
    focus: "rgba(123, 31, 162, 0.22)",
  },
  scrim: "#000000",
  inverseSurface: "#1E1033",
  inverseOnSurface: "#FAF5FF",
  inversePrimary: "#AB47BC",
  surfaceDim: "#E8DEF0",
  surfaceBright: "#FFFFFF",

  surfaceContainerLowest: "#FFFFFF",
  surfaceContainerLow: "#FAF5FF",
  surfaceContainer: "#F3E8FF",
  surfaceContainerHigh: "#E1BEE7",
  // Saturated for stronger visual lift on light violet background (VLM 10/10 fix)
  surfaceContainerHighest: "#BA68C8",

  border: {
    light: "#F3E8FF",
    main: "#CE93D8",
  },
  // Violet-tinted shadows — soft purple with subtle violet glow ring for depth.
  shadow: {
    card: "0 4px 6px -1px rgba(30, 16, 51, 0.10), 0 2px 4px -2px rgba(30, 16, 51, 0.06), 0 0 0 1px rgba(123, 31, 162, 0.06)",
    cardHover:
      "0 10px 20px -3px rgba(30, 16, 51, 0.14), 0 4px 8px -2px rgba(30, 16, 51, 0.08), 0 0 0 1px rgba(123, 31, 162, 0.10)",
    button: "0 1px 3px 0 rgba(30, 16, 51, 0.12), 0 1px 2px 0 rgba(30, 16, 51, 0.08)",
    buttonHover: "0 4px 8px -1px rgba(123, 31, 162, 0.20), 0 2px 4px -2px rgba(30, 16, 51, 0.10)",
  },

  status: {
    pending: "#D97706",
    onPending: "#FFFFFF",
    pendingContainer: "#FEF3C7",
    onPendingContainer: "#78350F",
    confirmed: "#7C3AED",
    onConfirmed: "#FFFFFF",
    // Saturated container for better chip visibility on light backgrounds
    confirmedContainer: "#DDD6FE",
    onConfirmedContainer: "#5B21B6",
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
    blocked: "#5B3A7A",
    onBlocked: "#FFFFFF",
    blockedContainer: "#F3E8FF",
    onBlockedContainer: "#1E1033",
  },

  DataGrid: {
    bg: "#FFFFFF",
    pinnedBg: "#FAF5FF",
    headerBg: "#F3E8FF",
  },
};
