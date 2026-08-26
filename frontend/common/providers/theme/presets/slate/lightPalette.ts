import type { PaletteOptions } from "@mui/material/styles";

/**
 * Slate preset — light mode.
 *
 * Primary: blue-gray (Blue Gray 700). Secondary: gray (Blue Gray 500).
 * Minimal, professional, monochrome feel with cool neutral backgrounds.
 */
export const lightPalette: PaletteOptions = {
  text: {
    primary: "#0F172A", // Slate 900
    secondary: "#475569", // Slate 600
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
    main: "#475569", // Slate info
    light: "#64748B",
    dark: "#334155",
    contrastText: "#FFFFFF",
  },
  onInfo: "#FFFFFF",
  infoContainer: "#E2E8F0",
  onInfoContainer: "#334155",

  tertiary: "#E11D48",
  onTertiary: "#FFFFFF",
  tertiaryContainer: "#FFE4E6",
  onTertiaryContainer: "#881337",

  header: "#FFFFFF",
  onHeader: "#0F172A",
  headerContainer: "#FFFFFF",
  onHeaderContainer: "#0F172A",

  footer: "#FFFFFF",
  onFooter: "#0F172A",
  footerContainer: "#F8FAFC",
  onFooterContainer: "#475569",

  sidebar: "#FFFFFF",
  onSidebar: "#0F172A",
  sidebarContainer: "#F8FAFC",
  onSidebarContainer: "#475569",

  background: {
    default: "#F8FAFC",
    paper: "#FFFFFF",
  },
  onBackground: "#0F172A",
  surface: "#FFFFFF",
  onSurface: "#0F172A",
  surfaceVariant: "#F1F5F9",
  onSurfaceVariant: "#475569",
  outline: "#CBD5E1",
  outlineVariant: "#E2E8F0",
  divider: "rgba(69, 90, 100, 0.12)",
  action: {
    active: "#455A64",
    hover: "rgba(69, 90, 100, 0.04)",
    selected: "rgba(69, 90, 100, 0.08)",
    disabled: "rgba(69, 90, 100, 0.26)",
    disabledBackground: "rgba(69, 90, 100, 0.04)",
    focus: "rgba(69, 90, 100, 0.12)",
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
  surfaceContainerHighest: "#CBD5E1",

  border: {
    light: "#E2E8F0",
    main: "#CBD5E1",
  },
  shadow: {
    card: "0 4px 6px -1px rgba(15, 23, 42, 0.08), 0 2px 4px -2px rgba(15, 23, 42, 0.04)",
    cardHover: "0 10px 15px -3px rgba(15, 23, 42, 0.12), 0 4px 6px -2px rgba(15, 23, 42, 0.06)",
    button: "0 1px 3px 0 rgba(15, 23, 42, 0.1), 0 1px 2px 0 rgba(15, 23, 42, 0.06)",
    buttonHover: "0 4px 6px -1px rgba(15, 23, 42, 0.12), 0 2px 4px -2px rgba(15, 23, 42, 0.08)",
  },

  status: {
    pending: "#D97706",
    onPending: "#FFFFFF",
    pendingContainer: "#FEF3C7",
    onPendingContainer: "#78350F",
    confirmed: "#475569",
    onConfirmed: "#FFFFFF",
    confirmedContainer: "#E2E8F0",
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
    cancelledContainer: "#FEE2E2",
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
