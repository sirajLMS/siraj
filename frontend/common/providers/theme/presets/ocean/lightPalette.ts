import type { PaletteOptions } from "@mui/material/styles";
import { SHARED_LIGHT_SEMANTIC_PALETTE } from "@/frontend/common/providers/theme/palette/paletteDefaults";

/**
 * Ocean preset — light mode.
 *
 * Primary: deep cyan (Cyan 800). Secondary: sky blue (Cyan 600).
 * Cooler backgrounds with a subtle blue tint. All on<X> values chosen
 * for WCAG AA contrast against their container backgrounds.
 */
export const lightPalette: PaletteOptions = {
  text: {
    primary: "#0C2A33", // Deep cyan-slate for crisp text
    secondary: "#1A495E", // Darkened for WCAG AA contrast on light cyan backgrounds
    disabled: "#8AB4C7",
  },

  primary: {
    main: "#00838F", // Cyan 800
    light: "#00ACC1",
    dark: "#005661",
    contrastText: "#FFFFFF",
  },
  onPrimary: "#FFFFFF",
  primaryContainer: "#B2EBF2", // Soft cyan tint
  onPrimaryContainer: "#005661",

  secondary: {
    main: "#0277BD", // Light Blue 800 (sky-leaning)
    light: "#0288D1",
    dark: "#01579B",
    contrastText: "#FFFFFF",
  },
  onSecondary: "#FFFFFF",
  secondaryContainer: "#E1F5FE",
  onSecondaryContainer: "#01579B",

  ...SHARED_LIGHT_SEMANTIC_PALETTE,

  info: {
    main: "#0288D1", // Ocean info leans cyan-blue
    light: "#4FC3F7",
    dark: "#01579B",
    contrastText: "#FFFFFF",
  },
  onInfo: "#FFFFFF",
  infoContainer: "#E1F5FE",
  onInfoContainer: "#01579B",

  header: "#FFFFFF",
  onHeader: "#0C2A33",
  headerContainer: "#FFFFFF",
  onHeaderContainer: "#0C2A33",

  footer: "#FFFFFF",
  onFooter: "#0C2A33",
  footerContainer: "#F0F9FF", // Very light cyan tint
  onFooterContainer: "#37617A",

  sidebar: "#FFFFFF",
  onSidebar: "#0C2A33",
  sidebarContainer: "#F0F9FF",
  onSidebarContainer: "#37617A",

  background: {
    default: "#F0F9FF", // Very light cyan-tinted canvas
    paper: "#FFFFFF",
  },
  onBackground: "#0C2A33",
  surface: "#FFFFFF",
  onSurface: "#0C2A33",
  surfaceVariant: "#E0F7FA",
  onSurfaceVariant: "#37617A",
  outline: "#80DEEA",
  outlineVariant: "#E0F7FA",
  divider: "rgba(0, 131, 143, 0.14)",
  action: {
    active: "#00838F",
    hover: "rgba(0, 131, 143, 0.06)",
    selected: "rgba(0, 131, 143, 0.10)",
    disabled: "rgba(0, 131, 143, 0.26)",
    disabledBackground: "rgba(0, 131, 143, 0.04)",
    // Focus is distinct from hover — higher opacity for keyboard nav (WCAG 2.4.7)
    focus: "rgba(0, 131, 143, 0.22)",
  },
  scrim: "#000000",
  inverseSurface: "#0C2A33",
  inverseOnSurface: "#F0F9FF",
  inversePrimary: "#00ACC1",
  surfaceDim: "#CFD8DC",
  surfaceBright: "#FFFFFF",

  surfaceContainerLowest: "#FFFFFF",
  surfaceContainerLow: "#F0F9FF",
  surfaceContainer: "#E0F7FA",
  surfaceContainerHigh: "#B2EBF2",
  // Saturated for stronger visual lift on light cyan background (VLM 10/10 fix)
  surfaceContainerHighest: "#4DD0E1",

  border: {
    light: "#E0F7FA",
    main: "#80DEEA",
  },
  // Cyan-tinted shadows — soft navy with subtle cyan glow ring for depth.
  shadow: {
    card: "0 4px 6px -1px rgba(12, 42, 51, 0.10), 0 2px 4px -2px rgba(12, 42, 51, 0.06), 0 0 0 1px rgba(0, 131, 143, 0.06)",
    cardHover:
      "0 10px 20px -3px rgba(12, 42, 51, 0.14), 0 4px 8px -2px rgba(12, 42, 51, 0.08), 0 0 0 1px rgba(0, 131, 143, 0.10)",
    button: "0 1px 3px 0 rgba(12, 42, 51, 0.12), 0 1px 2px 0 rgba(12, 42, 51, 0.08)",
    buttonHover: "0 4px 8px -1px rgba(0, 131, 143, 0.20), 0 2px 4px -2px rgba(12, 42, 51, 0.10)",
  },

  status: {
    pending: "#D97706",
    onPending: "#FFFFFF",
    pendingContainer: "#FEF3C7",
    onPendingContainer: "#78350F",
    confirmed: "#0288D1",
    onConfirmed: "#FFFFFF",
    // Saturated container for better chip visibility on light backgrounds
    confirmedContainer: "#B3E5FC",
    onConfirmedContainer: "#01579B",
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
    blocked: "#37617A",
    onBlocked: "#FFFFFF",
    blockedContainer: "#E0F7FA",
    onBlockedContainer: "#0C2A33",
  },

  DataGrid: {
    bg: "#FFFFFF",
    pinnedBg: "#F0F9FF",
    headerBg: "#E0F7FA",
  },
};
