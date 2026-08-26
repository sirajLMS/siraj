import type { PaletteOptions } from "@mui/material/styles";

/**
 * Crimson preset — light mode.
 *
 * Primary: deep red (Red 800). Secondary: orange (Orange 800).
 * Energetic, warm palette with warm-tinted backgrounds.
 */
export const lightPalette: PaletteOptions = {
  text: {
    primary: "#2A0808",
    secondary: "#7A2828",
    disabled: "#C98484",
  },

  primary: {
    main: "#C62828", // Red 800
    light: "#EF5350",
    dark: "#B71C1C",
    contrastText: "#FFFFFF",
  },
  onPrimary: "#FFFFFF",
  primaryContainer: "#FFCDD2",
  onPrimaryContainer: "#B71C1C",

  secondary: {
    main: "#EF6C00", // Orange 800
    light: "#FF9800",
    dark: "#E65100",
    contrastText: "#FFFFFF",
  },
  onSecondary: "#FFFFFF",
  secondaryContainer: "#FFE0B2",
  onSecondaryContainer: "#E65100",

  error: {
    main: "#DC2626",
    light: "#F87171",
    dark: "#991B1B",
    contrastText: "#FFFFFF",
  },
  onError: "#FFFFFF",
  errorContainer: "#FEE2E2",
  onErrorContainer: "#991B1B",

  success: {
    main: "#16A34A",
    light: "#4ADE80",
    dark: "#166534",
    contrastText: "#FFFFFF",
  },
  onSuccess: "#FFFFFF",
  successContainer: "#DCFCE7",
  onSuccessContainer: "#14532D",

  warning: {
    main: "#D97706",
    light: "#FBBF24",
    dark: "#92400E",
    contrastText: "#FFFFFF",
  },
  onWarning: "#FFFFFF",
  warningContainer: "#FEF3C7",
  onWarningContainer: "#78350F",

  info: {
    main: "#D97706", // Crimson info leans amber
    light: "#FBBF24",
    dark: "#92400E",
    contrastText: "#FFFFFF",
  },
  onInfo: "#FFFFFF",
  infoContainer: "#FEF3C7",
  onInfoContainer: "#78350F",

  tertiary: "#E11D48",
  onTertiary: "#FFFFFF",
  tertiaryContainer: "#FFE4E6",
  onTertiaryContainer: "#881337",

  header: "#FFFFFF",
  onHeader: "#2A0808",
  headerContainer: "#FFFFFF",
  onHeaderContainer: "#2A0808",

  footer: "#FFFFFF",
  onFooter: "#2A0808",
  footerContainer: "#FFF5F5", // Very light warm tint
  onFooterContainer: "#7A2828",

  sidebar: "#FFFFFF",
  onSidebar: "#2A0808",
  sidebarContainer: "#FFF5F5",
  onSidebarContainer: "#7A2828",

  background: {
    default: "#FFF5F5",
    paper: "#FFFFFF",
  },
  onBackground: "#2A0808",
  surface: "#FFFFFF",
  onSurface: "#2A0808",
  surfaceVariant: "#FFEBEB",
  onSurfaceVariant: "#7A2828",
  outline: "#EF9A9A",
  outlineVariant: "#FFEBEB",
  divider: "rgba(198, 40, 40, 0.12)",
  action: {
    active: "#C62828",
    hover: "rgba(198, 40, 40, 0.04)",
    selected: "rgba(198, 40, 40, 0.08)",
    disabled: "rgba(198, 40, 40, 0.26)",
    disabledBackground: "rgba(198, 40, 40, 0.04)",
    focus: "rgba(198, 40, 40, 0.12)",
  },
  scrim: "#000000",
  inverseSurface: "#2A0808",
  inverseOnSurface: "#FFF5F5",
  inversePrimary: "#EF5350",
  surfaceDim: "#F0D5D5",
  surfaceBright: "#FFFFFF",

  surfaceContainerLowest: "#FFFFFF",
  surfaceContainerLow: "#FFF5F5",
  surfaceContainer: "#FFEBEB",
  surfaceContainerHigh: "#FFCDD2",
  surfaceContainerHighest: "#EF9A9A",

  border: {
    light: "#FFEBEB",
    main: "#EF9A9A",
  },
  shadow: {
    card: "0 4px 6px -1px rgba(42, 8, 8, 0.08), 0 2px 4px -2px rgba(42, 8, 8, 0.04)",
    cardHover: "0 10px 15px -3px rgba(42, 8, 8, 0.12), 0 4px 6px -2px rgba(42, 8, 8, 0.06)",
    button: "0 1px 3px 0 rgba(42, 8, 8, 0.1), 0 1px 2px 0 rgba(42, 8, 8, 0.06)",
    buttonHover: "0 4px 6px -1px rgba(42, 8, 8, 0.12), 0 2px 4px -2px rgba(42, 8, 8, 0.08)",
  },

  status: {
    pending: "#D97706",
    onPending: "#FFFFFF",
    pendingContainer: "#FEF3C7",
    onPendingContainer: "#78350F",
    confirmed: "#C62828",
    onConfirmed: "#FFFFFF",
    confirmedContainer: "#FFCDD2",
    onConfirmedContainer: "#B71C1C",
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
    cancelledContainer: "#FEE2E2",
    onCancelledContainer: "#7F1D1D",
    blocked: "#7A2828",
    onBlocked: "#FFFFFF",
    blockedContainer: "#FFEBEB",
    onBlockedContainer: "#2A0808",
  },

  DataGrid: {
    bg: "#FFFFFF",
    pinnedBg: "#FFF5F5",
    headerBg: "#FFEBEB",
  },
};
