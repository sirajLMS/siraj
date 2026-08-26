import type { PaletteOptions } from "@mui/material/styles";

/**
 * Slate preset — dark mode.
 *
 * Primary: light blue-gray (Blue Gray 400). Secondary: light gray (Blue Gray 200).
 * Deep charcoal backgrounds with cool muted accents. True minimal aesthetic.
 */
export const darkPalette: PaletteOptions = {
  text: {
    primary: "#F1F5F9", // Slate 100
    secondary: "#E2E8F0", // Slate 300
    disabled: "#64748B",
  },

  primary: {
    main: "#78909C", // Blue Gray 400
    light: "#90A4AE",
    dark: "#546E7A",
    contrastText: "#0F172A",
  },
  onPrimary: "#0F172A",
  primaryContainer: "#37474F",
  onPrimaryContainer: "#CFD8DC",

  secondary: {
    main: "#B0BEC5", // Blue Gray 200
    light: "#CFD8DC",
    dark: "#78909C",
    contrastText: "#0F172A",
  },
  onSecondary: "#0F172A",
  secondaryContainer: "#455A64",
  onSecondaryContainer: "#ECEFF1",

  error: {
    main: "#F87171",
    light: "#FCA5A5",
    dark: "#DC2626",
    contrastText: "#450A0A",
  },
  onError: "#450A0A",
  errorContainer: "#450A0A",
  onErrorContainer: "#FECACA",

  success: {
    main: "#4ADE80",
    light: "#86EFAC",
    dark: "#16A34A",
    contrastText: "#052E16",
  },
  onSuccess: "#052E16",
  successContainer: "#14532D",
  onSuccessContainer: "#DCFCE7",

  warning: {
    main: "#FBBF24",
    light: "#FDE047",
    dark: "#D97706",
    contrastText: "#451A03",
  },
  onWarning: "#451A03",
  warningContainer: "#78350F",
  onWarningContainer: "#FEF3C7",

  info: {
    main: "#94A3B8", // Slate info
    light: "#CBD5E1",
    dark: "#475569",
    contrastText: "#0F172A",
  },
  onInfo: "#0F172A",
  infoContainer: "#334155",
  onInfoContainer: "#E2E8F0",

  tertiary: "#F43F5E",
  onTertiary: "#4C0519",
  tertiaryContainer: "#881337",
  onTertiaryContainer: "#FFE4E6",

  header: "#1E293B", // Slate 800
  onHeader: "#F1F5F9",
  headerContainer: "#1E293B",
  onHeaderContainer: "#F1F5F9",

  footer: "#1E293B",
  onFooter: "#F1F5F9",
  footerContainer: "#1E293B",
  onFooterContainer: "#CBD5E1",

  sidebar: "#1E293B",
  onSidebar: "#F1F5F9",
  sidebarContainer: "#1E293B",
  onSidebarContainer: "#F1F5F9",

  background: {
    default: "#0B1120", // Deep slate — darker than paper for depth
    paper: "#1E293B",
  },
  onBackground: "#F1F5F9",
  surface: "#1E293B",
  onSurface: "#F1F5F9",
  surfaceVariant: "#334155",
  onSurfaceVariant: "#CBD5E1",
  outline: "#475569",
  outlineVariant: "#334155",
  divider: "rgba(120, 144, 156, 0.14)",
  action: {
    active: "#CBD5E1",
    hover: "rgba(120, 144, 156, 0.10)",
    selected: "rgba(120, 144, 156, 0.16)",
    disabled: "rgba(203, 213, 225, 0.3)",
    disabledBackground: "rgba(120, 144, 156, 0.05)",
    focus: "rgba(120, 144, 156, 0.22)",
  },
  scrim: "#000000",
  inverseSurface: "#F1F5F9",
  inverseOnSurface: "#1E293B",
  inversePrimary: "#546E7A",
  surfaceDim: "#080D18",
  surfaceBright: "#334155",

  surfaceContainerLowest: "#050810",
  surfaceContainerLow: "#0B1120",
  surfaceContainer: "#1E293B",
  surfaceContainerHigh: "#334155",
  surfaceContainerHighest: "#53627A",

  border: {
    light: "#334155",
    main: "#475569",
  },
  // Slate-tinted shadows — deep charcoal with subtle blue-gray glow.
  shadow: {
    card: "0 4px 6px -1px rgba(15, 23, 42, 0.7), 0 2px 4px -2px rgba(15, 23, 42, 0.5), 0 0 0 1px rgba(120, 144, 156, 0.04)",
    cardHover: "0 10px 20px -3px rgba(15, 23, 42, 0.8), 0 4px 8px -2px rgba(15, 23, 42, 0.5), 0 0 0 1px rgba(120, 144, 156, 0.08)",
    button: "0 1px 3px 0 rgba(15, 23, 42, 0.5), 0 1px 2px 0 rgba(15, 23, 42, 0.3)",
    buttonHover: "0 4px 8px -1px rgba(120, 144, 156, 0.15), 0 2px 4px -2px rgba(15, 23, 42, 0.4)",
  },

  status: {
    pending: "#FBBF24",
    onPending: "#451A03",
    pendingContainer: "#451A03",
    onPendingContainer: "#FDE68A",
    confirmed: "#94A3B8",
    onConfirmed: "#0F172A",
    confirmedContainer: "#475569",
    onConfirmedContainer: "#E2E8F0",
    active: "#4ADE80",
    onActive: "#052E16",
    activeContainer: "#14532D",
    onActiveContainer: "#DCFCE7",
    completed: "#C084FC",
    onCompleted: "#3B0764",
    completedContainer: "#581C87",
    onCompletedContainer: "#F3E8FF",
    cancelled: "#F87171",
    onCancelled: "#450A0A",
    cancelledContainer: "#7F1D1D",
    onCancelledContainer: "#FECACA",
    blocked: "#CBD5E1",
    onBlocked: "#0F172A",
    blockedContainer: "#334155",
    onBlockedContainer: "#F1F5F9",
  },

  DataGrid: {
    bg: "#0F172A",
    pinnedBg: "#1E293B",
    headerBg: "#334155",
  },
};
