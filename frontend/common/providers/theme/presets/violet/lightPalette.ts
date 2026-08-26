import type { PaletteOptions } from "@mui/material/styles";

/**
 * Violet preset — light mode.
 *
 * Primary: deep purple (Purple 700). Secondary: pink (Pink 700).
 * Creative, regal feel with purple-tinted backgrounds.
 */
export const lightPalette: PaletteOptions = {
  text: {
    primary: "#1E1033", // Deep violet-slate
    secondary: "#5B3A7A",
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
    main: "#7C3AED", // Violet info
    light: "#A78BFA",
    dark: "#5B21B6",
    contrastText: "#FFFFFF",
  },
  onInfo: "#FFFFFF",
  infoContainer: "#EDE9FE",
  onInfoContainer: "#5B21B6",

  tertiary: "#E11D48",
  onTertiary: "#FFFFFF",
  tertiaryContainer: "#FFE4E6",
  onTertiaryContainer: "#881337",

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
  surfaceContainerHighest: "#CE93D8",

  border: {
    light: "#F3E8FF",
    main: "#CE93D8",
  },
  shadow: {
    card: "0 4px 6px -1px rgba(30, 16, 51, 0.08), 0 2px 4px -2px rgba(30, 16, 51, 0.04)",
    cardHover: "0 10px 15px -3px rgba(30, 16, 51, 0.12), 0 4px 6px -2px rgba(30, 16, 51, 0.06)",
    button: "0 1px 3px 0 rgba(30, 16, 51, 0.1), 0 1px 2px 0 rgba(30, 16, 51, 0.06)",
    buttonHover: "0 4px 6px -1px rgba(30, 16, 51, 0.12), 0 2px 4px -2px rgba(30, 16, 51, 0.08)",
  },

  status: {
    pending: "#D97706",
    onPending: "#FFFFFF",
    pendingContainer: "#FEF3C7",
    onPendingContainer: "#78350F",
    confirmed: "#7C3AED",
    onConfirmed: "#FFFFFF",
    confirmedContainer: "#EDE9FE",
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
    cancelledContainer: "#FEE2E2",
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
