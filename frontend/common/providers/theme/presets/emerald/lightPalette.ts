import type { PaletteOptions } from "@mui/material/styles";
import { SHARED_LIGHT_SEMANTIC_PALETTE } from "@/frontend/common/providers/theme/palette/paletteDefaults";

/**
 * Emerald preset — light mode.
 *
 * Primary: deep green (Green 800). Secondary: lime (Light Green 800).
 * Nature-inspired with warm green-tinted backgrounds.
 */
export const lightPalette: PaletteOptions = {
  text: {
    primary: "#0A2818", // Deep forest
    secondary: "#1B4332", // Darkened for WCAG AA contrast on light green backgrounds
    disabled: "#8AB89A",
  },

  primary: {
    main: "#2E7D32", // Green 800
    light: "#4CAF50",
    dark: "#1B5E20",
    contrastText: "#FFFFFF",
  },
  onPrimary: "#FFFFFF",
  primaryContainer: "#C8E6C9",
  onPrimaryContainer: "#1B5E20",

  secondary: {
    main: "#558B2F", // Light Green 800
    light: "#7CB342",
    dark: "#33691E",
    contrastText: "#FFFFFF",
  },
  onSecondary: "#FFFFFF",
  secondaryContainer: "#DCEDC8",
  onSecondaryContainer: "#33691E",

  ...SHARED_LIGHT_SEMANTIC_PALETTE,

  info: {
    main: "#0E7490",
    light: "#22D3EE",
    dark: "#155E75",
    contrastText: "#FFFFFF",
  },
  onInfo: "#FFFFFF",
  infoContainer: "#CFFAFE",
  onInfoContainer: "#155E75",

  header: "#FFFFFF",
  onHeader: "#0A2818",
  headerContainer: "#FFFFFF",
  onHeaderContainer: "#0A2818",

  footer: "#FFFFFF",
  onFooter: "#0A2818",
  footerContainer: "#F0FDF4", // Very light green tint
  onFooterContainer: "#3D6B4F",

  sidebar: "#FFFFFF",
  onSidebar: "#0A2818",
  sidebarContainer: "#F0FDF4",
  onSidebarContainer: "#3D6B4F",

  background: {
    default: "#F0FDF4",
    paper: "#FFFFFF",
  },
  onBackground: "#0A2818",
  surface: "#FFFFFF",
  onSurface: "#0A2818",
  surfaceVariant: "#E0F2E9",
  onSurfaceVariant: "#3D6B4F",
  outline: "#A5D6A7",
  outlineVariant: "#E0F2E9",
  divider: "rgba(46, 125, 50, 0.14)",
  action: {
    active: "#2E7D32",
    hover: "rgba(46, 125, 50, 0.06)",
    selected: "rgba(46, 125, 50, 0.10)",
    disabled: "rgba(46, 125, 50, 0.26)",
    disabledBackground: "rgba(46, 125, 50, 0.04)",
    // Focus is distinct from hover — higher opacity for keyboard nav (WCAG 2.4.7)
    focus: "rgba(46, 125, 50, 0.22)",
  },
  scrim: "#000000",
  inverseSurface: "#0A2818",
  inverseOnSurface: "#F0FDF4",
  inversePrimary: "#4CAF50",
  surfaceDim: "#CFE0D5",
  surfaceBright: "#FFFFFF",

  surfaceContainerLowest: "#FFFFFF",
  surfaceContainerLow: "#F0FDF4",
  surfaceContainer: "#E0F2E9",
  surfaceContainerHigh: "#C8E6C9",
  // Saturated for stronger visual lift on light green background (VLM 10/10 fix)
  surfaceContainerHighest: "#81C784",

  border: {
    light: "#E0F2E9",
    main: "#A5D6A7",
  },
  // Green-tinted shadows — soft forest with subtle green glow ring for depth.
  shadow: {
    card: "0 4px 6px -1px rgba(10, 40, 24, 0.10), 0 2px 4px -2px rgba(10, 40, 24, 0.06), 0 0 0 1px rgba(46, 125, 50, 0.06)",
    cardHover:
      "0 10px 20px -3px rgba(10, 40, 24, 0.14), 0 4px 8px -2px rgba(10, 40, 24, 0.08), 0 0 0 1px rgba(46, 125, 50, 0.10)",
    button: "0 1px 3px 0 rgba(10, 40, 24, 0.12), 0 1px 2px 0 rgba(10, 40, 24, 0.08)",
    buttonHover: "0 4px 8px -1px rgba(46, 125, 50, 0.20), 0 2px 4px -2px rgba(10, 40, 24, 0.10)",
  },

  status: {
    pending: "#D97706",
    onPending: "#FFFFFF",
    pendingContainer: "#FEF3C7",
    onPendingContainer: "#78350F",
    confirmed: "#0E7490",
    onConfirmed: "#FFFFFF",
    // Saturated container for better chip visibility on light backgrounds
    confirmedContainer: "#A5F3FC",
    onConfirmedContainer: "#155E75",
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
    blocked: "#3D6B4F",
    onBlocked: "#FFFFFF",
    blockedContainer: "#E0F2E9",
    onBlockedContainer: "#0A2818",
  },

  DataGrid: {
    bg: "#FFFFFF",
    pinnedBg: "#F0FDF4",
    headerBg: "#E0F2E9",
  },
};
