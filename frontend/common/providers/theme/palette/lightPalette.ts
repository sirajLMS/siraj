import type { PaletteOptions } from "@mui/material/styles";

export const lightPalette: PaletteOptions = {
  // Standard MUI Text Palette
  text: {
    primary: "#0F172A", // Slate 900 (High contrast crisp text on white/light gray)
    secondary: "#475569", // Slate 600 (~7.1:1 contrast ratio)
    disabled: "#94A3B8", // Slate 400
  },

  primary: {
    main: "#0D9488", // Deep Teal (Vivid and legible on light background)
    light: "#2DD4BF",
    dark: "#0F766E",
    contrastText: "#FFFFFF",
  },
  onPrimary: "#FFFFFF",
  primaryContainer: "#CCFBF1", // Light Teal tint container
  onPrimaryContainer: "#0F766E", // Dark Emerald text (~7.8:1 contrast on #CCFBF1)

  secondary: {
    main: "#4F46E5", // Vivid Indigo
    light: "#818CF8",
    dark: "#3730A3",
    contrastText: "#FFFFFF",
  },
  onSecondary: "#FFFFFF",
  secondaryContainer: "#E0E7FF",
  onSecondaryContainer: "#312E81",

  error: {
    main: "#DC2626", // Crisp Dark Red
    light: "#F87171",
    dark: "#991B1B",
    contrastText: "#FFFFFF",
  },
  onError: "#FFFFFF",
  errorContainer: "#FEE2E2", // Soft red pill
  onErrorContainer: "#991B1B", // Dark red text

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
    main: "#2563EB",
    light: "#60A5FA",
    dark: "#1E40AF",
    contrastText: "#FFFFFF",
  },
  onInfo: "#FFFFFF",
  infoContainer: "#DBEAFE",
  onInfoContainer: "#1E3A8A",

  tertiary: "#E11D48",
  onTertiary: "#FFFFFF",
  tertiaryContainer: "#FFE4E6",
  onTertiaryContainer: "#881337",

  // Navigation & Shell Components
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
    default: "#F8FAFC", // Slate 50 Canvas
    paper: "#FFFFFF", // Pure white card surfaces
  },
  onBackground: "#0F172A",
  surface: "#FFFFFF",
  onSurface: "#0F172A",
  surfaceVariant: "#F1F5F9",
  onSurfaceVariant: "#475569",
  outline: "#CBD5E1", // Distinct outline
  outlineVariant: "#E2E8F0",
  scrim: "#000000",
  inverseSurface: "#0F172A",
  inverseOnSurface: "#F8FAFC",
  inversePrimary: "#2DD4BF",
  surfaceDim: "#E2E8F0",
  surfaceBright: "#FFFFFF",

  // Material 3 Surface Containers
  surfaceContainerLowest: "#FFFFFF",
  surfaceContainerLow: "#F8FAFC",
  surfaceContainer: "#F1F5F9",
  surfaceContainerHigh: "#E2E8F0",
  surfaceContainerHighest: "#CBD5E1",

  border: {
    light: "#E2E8F0",
    main: "#CBD5E1", // Adds clear visual definition
  },
  shadow: {
    card: "0 4px 6px -1px rgba(15, 23, 42, 0.08), 0 2px 4px -2px rgba(15, 23, 42, 0.04)",
    cardHover: "0 10px 15px -3px rgba(15, 23, 42, 0.12), 0 4px 6px -2px rgba(15, 23, 42, 0.06)",
    button: "0 1px 3px 0 rgba(15, 23, 42, 0.1), 0 1px 2px 0 rgba(15, 23, 42, 0.06)",
    buttonHover: "0 4px 6px -1px rgba(15, 23, 42, 0.12), 0 2px 4px -2px rgba(15, 23, 42, 0.08)",
  },

  // High-Contrast
  status: {
    pending: "#D97706",
    onPending: "#FFFFFF",
    pendingContainer: "#FEF3C7", // Soft warm amber background
    onPendingContainer: "#78350F", // Dark warm amber text (~8.2:1 contrast)

    confirmed: "#2563EB",
    onConfirmed: "#FFFFFF",
    confirmedContainer: "#DBEAFE",
    onConfirmedContainer: "#1E3A8A",

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
