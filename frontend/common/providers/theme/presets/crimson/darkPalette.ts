import type { PaletteOptions } from "@mui/material/styles";

/**
 * Crimson preset — dark mode.
 *
 * Primary: bright red (Red 400). Secondary: orange (Orange 400).
 * Deep maroon-black backgrounds with glowing red/amber accents.
 */
export const darkPalette: PaletteOptions = {
  text: {
    primary: "#FEE2E2",
    secondary: "#FCA5A5",
    disabled: "#7A2828",
  },

  primary: {
    main: "#EF5350", // Red 400
    light: "#EF9A9A",
    dark: "#C62828",
    contrastText: "#2A0808",
  },
  onPrimary: "#2A0808",
  primaryContainer: "#B71C1C",
  onPrimaryContainer: "#FFCDD2",

  secondary: {
    main: "#FFA726", // Orange 400
    light: "#FFB74D",
    dark: "#EF6C00",
    contrastText: "#2A1500",
  },
  onSecondary: "#2A1500",
  secondaryContainer: "#E65100",
  onSecondaryContainer: "#FFE0B2",

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
    main: "#FFA726",
    light: "#FFB74D",
    dark: "#EF6C00",
    contrastText: "#2A1500",
  },
  onInfo: "#2A1500",
  infoContainer: "#E65100",
  onInfoContainer: "#FFE0B2",

  tertiary: "#F43F5E",
  onTertiary: "#4C0519",
  tertiaryContainer: "#881337",
  onTertiaryContainer: "#FFE4E6",

  header: "#1F0808", // Deep maroon
  onHeader: "#FEE2E2",
  headerContainer: "#1F0808",
  onHeaderContainer: "#FEE2E2",

  footer: "#1F0808",
  onFooter: "#FEE2E2",
  footerContainer: "#1F0808",
  onFooterContainer: "#FCA5A5",

  sidebar: "#1F0808",
  onSidebar: "#FEE2E2",
  sidebarContainer: "#1F0808",
  onSidebarContainer: "#FEE2E2",

  background: {
    default: "#150404", // Very deep maroon
    paper: "#1F0808",
  },
  onBackground: "#FEE2E2",
  surface: "#1F0808",
  onSurface: "#FEE2E2",
  surfaceVariant: "#2A1010",
  onSurfaceVariant: "#FCA5A5",
  outline: "#3D1818",
  outlineVariant: "#2A1010",
  scrim: "#000000",
  inverseSurface: "#FEE2E2",
  inverseOnSurface: "#1F0808",
  inversePrimary: "#C62828",
  surfaceDim: "#0F0303",
  surfaceBright: "#2A1010",

  surfaceContainerLowest: "#0A0202",
  surfaceContainerLow: "#150404",
  surfaceContainer: "#1F0808",
  surfaceContainerHigh: "#2A1010",
  surfaceContainerHighest: "#3D1818",

  border: {
    light: "#2A1010",
    main: "#3D1818",
  },
  shadow: {
    card: "0 4px 6px -1px rgba(0, 0, 0, 0.6), 0 2px 4px -2px rgba(0, 0, 0, 0.5)",
    cardHover: "0 10px 15px -3px rgba(0, 0, 0, 0.8), 0 4px 6px -2px rgba(0, 0, 0, 0.5)",
    button: "0 1px 3px 0 rgba(0, 0, 0, 0.5), 0 1px 2px 0 rgba(0, 0, 0, 0.3)",
    buttonHover: "0 4px 6px -1px rgba(0, 0, 0, 0.6), 0 2px 4px -2px rgba(0, 0, 0, 0.4)",
  },

  status: {
    pending: "#FBBF24",
    onPending: "#451A03",
    pendingContainer: "#451A03",
    onPendingContainer: "#FDE68A",
    confirmed: "#FFA726",
    onConfirmed: "#2A1500",
    confirmedContainer: "#E65100",
    onConfirmedContainer: "#FFE0B2",
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
    cancelledContainer: "#450A0A",
    onCancelledContainer: "#FECACA",
    blocked: "#FCA5A5",
    onBlocked: "#2A0808",
    blockedContainer: "#2A1010",
    onBlockedContainer: "#FEE2E2",
  },

  DataGrid: {
    bg: "#150404",
    pinnedBg: "#1F0808",
    headerBg: "#2A1010",
  },
};
