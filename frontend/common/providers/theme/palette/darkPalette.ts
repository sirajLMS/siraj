import type { PaletteOptions } from "@mui/material/styles";

export const darkPalette: PaletteOptions = {
  // MUI Standard Families (as Objects)
  primary: {
    main: "#2DD4BF", // Vivid Teal (Light)
    light: "#5EEAD4",
    dark: "#0D9488",
    contrastText: "#042F2E",
  },
  onPrimary: "#042F2E",
  primaryContainer: "#115E59",
  onPrimaryContainer: "#CCFBF1",

  secondary: {
    main: "#818CF8", // Vivid Indigo (Light)
    light: "#A5B4FC",
    dark: "#4F46E5",
    contrastText: "#1E1B4B",
  },
  onSecondary: "#1E1B4B",
  secondaryContainer: "#312E81",
  onSecondaryContainer: "#E0E7FF",

  error: {
    main: "#F87171", // Vivid Red (Light)
    light: "#FCA5A5",
    dark: "#DC2626",
    contrastText: "#450A0A",
  },
  onError: "#450A0A",
  errorContainer: "#7F1D1D",
  onErrorContainer: "#FEE2E2",

  success: {
    main: "#4ADE80", // Vivid Green (Light)
    light: "#86EFAC",
    dark: "#16A34A",
    contrastText: "#052E16",
  },
  onSuccess: "#052E16",
  successContainer: "#14532D",
  onSuccessContainer: "#DCFCE7",

  warning: {
    main: "#FBBF24", // Vivid Amber (Light)
    light: "#FDE047",
    dark: "#D97706",
    contrastText: "#451A03",
  },
  onWarning: "#451A03",
  warningContainer: "#78350F",
  onWarningContainer: "#FEF3C7",

  info: {
    main: "#60A5FA", // Vivid Blue (Light)
    light: "#93C5FD",
    dark: "#2563EB",
    contrastText: "#1E3A8A",
  },
  onInfo: "#1E3A8A",
  infoContainer: "#1E3A8A",
  onInfoContainer: "#DBEAFE",

  // Custom Families
  tertiary: "#F43F5E", // Vivid Rose (Light)
  onTertiary: "#4C0519",
  tertiaryContainer: "#881337",
  onTertiaryContainer: "#FFE4E6",

  // Layout Families
  header: "#1A1A1A",
  onHeader: "#FFFFFF",
  headerContainer: "#1A1A1A",
  onHeaderContainer: "#FFFFFF",

  footer: "#1A1A1A",
  onFooter: "#FFFFFF",
  footerContainer: "#1A1A1A",
  onFooterContainer: "#A1A1AA",

  sidebar: "#1A1A1A",
  onSidebar: "#FFFFFF",
  sidebarContainer: "#1A1A1A",
  onSidebarContainer: "#FFFFFF",

  // Base Scheme (Strict Zinc/Neutral Gray Scale)
  background: {
    default: "#1A1A1A", // Base background
    paper: "#262626", // Cards and elevated surfaces
  },
  onBackground: "#FFFFFF",
  surface: "#262626",
  onSurface: "#FAFAFA",
  surfaceVariant: "#404040",
  onSurfaceVariant: "#A1A1AA",
  outline: "#52525B",
  outlineVariant: "#404040",
  scrim: "#000000",
  inverseSurface: "#FFFFFF",
  inverseOnSurface: "#171717",
  inversePrimary: "#0D9488",
  surfaceDim: "#171717",
  surfaceBright: "#404040",

  // Material 3 Surface Containers (Strict Lightness Progression)
  surfaceContainerLowest: "#0F0F0F",
  surfaceContainerLow: "#141414",
  surfaceContainer: "#1A1A1A",
  surfaceContainerHigh: "#262626",
  surfaceContainerHighest: "#333333",

  // Layout Helpers
  border: {
    light: "#333333",
    main: "#404040",
  },
  shadow: {
    card: "0 4px 6px -1px rgba(0, 0, 0, 0.5), 0 2px 4px -2px rgba(0, 0, 0, 0.5)",
    cardHover: "0 10px 15px -3px rgba(0, 0, 0, 0.8), 0 4px 6px -2px rgba(0, 0, 0, 0.4)",
    button: "0 1px 3px 0 rgba(0, 0, 0, 0.4), 0 1px 2px 0 rgba(0, 0, 0, 0.2)",
    buttonHover: "0 4px 6px -1px rgba(0, 0, 0, 0.5), 0 2px 4px -2px rgba(0, 0, 0, 0.5)",
  },

  // Status Family
  status: {
    pending: "#FBBF24",
    onPending: "#451A03",
    pendingContainer: "#78350F",
    onPendingContainer: "#FEF3C7",

    confirmed: "#60A5FA",
    onConfirmed: "#1E3A8A",
    confirmedContainer: "#1E3A8A",
    onConfirmedContainer: "#DBEAFE",

    active: "#4ADE80",
    onActive: "#052E16",
    activeContainer: "#14532D",
    onActiveContainer: "#DCFCE7",

    completed: "#C084FC", // Purple 400
    onCompleted: "#3B0764", // Purple 950
    completedContainer: "#581C87", // Purple 900
    onCompletedContainer: "#F3E8FF", // Purple 100

    cancelled: "#F87171", // Red 400
    onCancelled: "#450A0A", // Red 950
    cancelledContainer: "#7F1D1D", // Red 900
    onCancelledContainer: "#FEE2E2", // Red 100

    blocked: "#94A3B8", // Slate 400
    onBlocked: "#0F172A", // Slate 900
    blockedContainer: "#1E293B", // Slate 800
    onBlockedContainer: "#F1F5F9", // Slate 100
  },

  DataGrid: {
    bg: "#1A1A1A",
    pinnedBg: "#262626",
    headerBg: "#262626",
  },
};
