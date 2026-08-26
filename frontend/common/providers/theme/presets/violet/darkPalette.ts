import type { PaletteOptions } from "@mui/material/styles";

/**
 * Violet preset — dark mode.
 *
 * Primary: bright purple (Purple 300). Secondary: pink (Pink 300).
 * Deep violet-black backgrounds with glowing magenta accents.
 */
export const darkPalette: PaletteOptions = {
  text: {
    primary: "#F3E8FF",
    secondary: "#E1BEE7",
    disabled: "#6B3A7A",
  },

  primary: {
    main: "#BA68C8", // Purple 300
    light: "#CE93D8",
    dark: "#7B1FA2",
    contrastText: "#1E1033",
  },
  onPrimary: "#1E1033",
  primaryContainer: "#4A148C",
  onPrimaryContainer: "#E1BEE7",

  secondary: {
    main: "#F06292", // Pink 300
    light: "#F48FB1",
    dark: "#C2185B",
    contrastText: "#330A1F",
  },
  onSecondary: "#330A1F",
  secondaryContainer: "#880E4F",
  onSecondaryContainer: "#F8BBD0",

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
    main: "#A78BFA",
    light: "#C4B5FD",
    dark: "#7C3AED",
    contrastText: "#1E1033",
  },
  onInfo: "#1E1033",
  infoContainer: "#5B21B6",
  onInfoContainer: "#EDE9FE",

  tertiary: "#F43F5E",
  onTertiary: "#4C0519",
  tertiaryContainer: "#881337",
  onTertiaryContainer: "#FFE4E6",

  header: "#1A0F2E", // Deep violet-black
  onHeader: "#F3E8FF",
  headerContainer: "#1A0F2E",
  onHeaderContainer: "#F3E8FF",

  footer: "#1A0F2E",
  onFooter: "#F3E8FF",
  footerContainer: "#1A0F2E",
  onFooterContainer: "#CE93D8",

  sidebar: "#1A0F2E",
  onSidebar: "#F3E8FF",
  sidebarContainer: "#1A0F2E",
  onSidebarContainer: "#F3E8FF",

  background: {
    default: "#0B0518", // Abyssal violet — darker than paper for depth
    paper: "#1A0F2E",
  },
  onBackground: "#F3E8FF",
  surface: "#1A0F2E",
  onSurface: "#F3E8FF",
  surfaceVariant: "#2A1A40",
  onSurfaceVariant: "#CE93D8",
  outline: "#3D2855",
  outlineVariant: "#2A1A40",
  divider: "rgba(186, 104, 200, 0.14)",
  action: {
    active: "#CE93D8",
    hover: "rgba(186, 104, 200, 0.10)",
    selected: "rgba(186, 104, 200, 0.16)",
    disabled: "rgba(206, 147, 216, 0.3)",
    disabledBackground: "rgba(186, 104, 200, 0.05)",
    focus: "rgba(186, 104, 200, 0.22)",
  },
  scrim: "#000000",
  inverseSurface: "#F3E8FF",
  inverseOnSurface: "#1A0F2E",
  inversePrimary: "#7B1FA2",
  surfaceDim: "#080414",
  surfaceBright: "#2A1A40",

  surfaceContainerLowest: "#050210",
  surfaceContainerLow: "#0B0518",
  surfaceContainer: "#1A0F2E",
  surfaceContainerHigh: "#2A1A40",
  surfaceContainerHighest: "#4A3463",

  border: {
    light: "#2A1A40",
    main: "#3D2855",
  },
  // Violet-tinted shadows — deep purple with subtle magenta glow.
  shadow: {
    card: "0 4px 6px -1px rgba(15, 8, 32, 0.7), 0 2px 4px -2px rgba(15, 8, 32, 0.5), 0 0 0 1px rgba(186, 104, 200, 0.04)",
    cardHover: "0 10px 20px -3px rgba(15, 8, 32, 0.8), 0 4px 8px -2px rgba(15, 8, 32, 0.5), 0 0 0 1px rgba(186, 104, 200, 0.08)",
    button: "0 1px 3px 0 rgba(15, 8, 32, 0.5), 0 1px 2px 0 rgba(15, 8, 32, 0.3)",
    buttonHover: "0 4px 8px -1px rgba(186, 104, 200, 0.15), 0 2px 4px -2px rgba(15, 8, 32, 0.4)",
  },

  status: {
    pending: "#FBBF24",
    onPending: "#451A03",
    pendingContainer: "#451A03",
    onPendingContainer: "#FDE68A",
    confirmed: "#A78BFA",
    onConfirmed: "#1E1033",
    confirmedContainer: "#7C3AED",
    onConfirmedContainer: "#EDE9FE",
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
    blocked: "#CE93D8",
    onBlocked: "#1E1033",
    blockedContainer: "#2A1A40",
    onBlockedContainer: "#F3E8FF",
  },

  DataGrid: {
    bg: "#0F0820",
    pinnedBg: "#1A0F2E",
    headerBg: "#2A1A40",
  },
};
