import type { PaletteOptions } from "@mui/material/styles";

/**
 * Emerald preset — light mode.
 *
 * Primary: deep green (Green 800). Secondary: lime (Light Green 800).
 * Nature-inspired with warm green-tinted backgrounds.
 */
export const lightPalette: PaletteOptions = {
  text: {
    primary: "#0A2818", // Deep forest
    secondary: "#3D6B4F",
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
    main: "#0E7490",
    light: "#22D3EE",
    dark: "#155E75",
    contrastText: "#FFFFFF",
  },
  onInfo: "#FFFFFF",
  infoContainer: "#CFFAFE",
  onInfoContainer: "#155E75",

  tertiary: "#E11D48",
  onTertiary: "#FFFFFF",
  tertiaryContainer: "#FFE4E6",
  onTertiaryContainer: "#881337",

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
  surfaceContainerHighest: "#A5D6A7",

  border: {
    light: "#E0F2E9",
    main: "#A5D6A7",
  },
  shadow: {
    card: "0 4px 6px -1px rgba(10, 40, 24, 0.08), 0 2px 4px -2px rgba(10, 40, 24, 0.04)",
    cardHover: "0 10px 15px -3px rgba(10, 40, 24, 0.12), 0 4px 6px -2px rgba(10, 40, 24, 0.06)",
    button: "0 1px 3px 0 rgba(10, 40, 24, 0.1), 0 1px 2px 0 rgba(10, 40, 24, 0.06)",
    buttonHover: "0 4px 6px -1px rgba(10, 40, 24, 0.12), 0 2px 4px -2px rgba(10, 40, 24, 0.08)",
  },

  status: {
    pending: "#D97706",
    onPending: "#FFFFFF",
    pendingContainer: "#FEF3C7",
    onPendingContainer: "#78350F",
    confirmed: "#0E7490",
    onConfirmed: "#FFFFFF",
    confirmedContainer: "#CFFAFE",
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
    cancelledContainer: "#FEE2E2",
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
