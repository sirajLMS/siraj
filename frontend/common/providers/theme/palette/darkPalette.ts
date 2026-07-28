import type { PaletteOptions } from "@mui/material/styles";

export const darkPalette: PaletteOptions = {
  // Standard MUI Text Palette (WCAG 2.1 AA Compliant high contrast for secondary text)
  text: {
    primary: "#FAFAFA", // High contrast white for primary text
    secondary: "#CBD5E1", // Slate 300 (~7.2:1 contrast ratio against #1E1E1E)
    disabled: "#71717A", // Zinc 500
  },

  primary: {
    main: "#2DD4BF", // Vivid Teal
    light: "#5EEAD4",
    dark: "#0D9488",
    contrastText: "#042F2E",
  },
  onPrimary: "#042F2E",
  primaryContainer: "#064E3B", // Dark Emerald background
  onPrimaryContainer: "#99F6E4", // Bright Mint text (~9.5:1 contrast against container)

  secondary: {
    main: "#818CF8", // Vivid Indigo
    light: "#A5B4FC",
    dark: "#4F46E5",
    contrastText: "#1E1B4B",
  },
  onSecondary: "#1E1B4B",
  secondaryContainer: "#312E81",
  onSecondaryContainer: "#E0E7FF",

  error: {
    main: "#F87171", // Bright Red for visibility
    light: "#FCA5A5",
    dark: "#DC2626",
    contrastText: "#450A0A",
  },
  onError: "#450A0A",
  errorContainer: "#450A0A", // Rich dark crimson container
  onErrorContainer: "#FECACA", // High legibility light red text

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
    main: "#60A5FA",
    light: "#93C5FD",
    dark: "#2563EB",
    contrastText: "#1E3A8A",
  },
  onInfo: "#1E3A8A",
  infoContainer: "#1E3A8A",
  onInfoContainer: "#DBEAFE",

  tertiary: "#F43F5E",
  onTertiary: "#4C0519",
  tertiaryContainer: "#881337",
  onTertiaryContainer: "#FFE4E6",

  // Navigation & Shell Components
  header: "#18181B",
  onHeader: "#FFFFFF",
  headerContainer: "#18181B",
  onHeaderContainer: "#FFFFFF",

  footer: "#18181B",
  onFooter: "#FFFFFF",
  footerContainer: "#18181B",
  onFooterContainer: "#A1A1AA",

  sidebar: "#18181B",
  onSidebar: "#FFFFFF",
  sidebarContainer: "#18181B",
  onSidebarContainer: "#FFFFFF",

  background: {
    default: "#121212", // Pure Dark Canvas
    paper: "#1E1E1E", // Elevated Card Surface
  },
  onBackground: "#FFFFFF",
  surface: "#1E1E1E",
  onSurface: "#FAFAFA",
  surfaceVariant: "#27272A",
  onSurfaceVariant: "#CBD5E1",
  outline: "#52525B",
  outlineVariant: "#3F3F46",
  scrim: "#000000",
  inverseSurface: "#FFFFFF",
  inverseOnSurface: "#171717",
  inversePrimary: "#0D9488",
  surfaceDim: "#171717",
  surfaceBright: "#3F3F46",

  // Material 3 Surface Layering
  surfaceContainerLowest: "#0F0F0F",
  surfaceContainerLow: "#141414",
  surfaceContainer: "#1E1E1E",
  surfaceContainerHigh: "#27272A",
  surfaceContainerHighest: "#3F3F46",

  border: {
    light: "#27272A",
    main: "#3F3F46",
  },
  shadow: {
    card: "0 4px 6px -1px rgba(0, 0, 0, 0.5), 0 2px 4px -2px rgba(0, 0, 0, 0.5)",
    cardHover: "0 10px 15px -3px rgba(0, 0, 0, 0.8), 0 4px 6px -2px rgba(0, 0, 0, 0.4)",
    button: "0 1px 3px 0 rgba(0, 0, 0, 0.4), 0 1px 2px 0 rgba(0, 0, 0, 0.2)",
    buttonHover: "0 4px 6px -1px rgba(0, 0, 0, 0.5), 0 2px 4px -2px rgba(0, 0, 0, 0.5)",
  },

  // High-Contrast Status Badge Pairings
  status: {
    pending: "#FBBF24",
    onPending: "#451A03",
    pendingContainer: "#451A03",
    onPendingContainer: "#FDE68A", // High contrast amber text on dark container

    confirmed: "#60A5FA",
    onConfirmed: "#1E3A8A",
    confirmedContainer: "#1E3A8A",
    onConfirmedContainer: "#DBEAFE",

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

    blocked: "#94A3B8",
    onBlocked: "#0F172A",
    blockedContainer: "#1E293B",
    onBlockedContainer: "#F1F5F9",
  },

  DataGrid: {
    bg: "#121212",
    pinnedBg: "#1E1E1E",
    headerBg: "#27272A",
  },
};
