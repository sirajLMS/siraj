import type { PaletteOptions } from "@mui/material/styles";

export const lightPalette: PaletteOptions = {
  // MUI Standard Families (as Objects)
  primary: {
    main: "#0D9488", // Vivid Teal
    light: "#2DD4BF",
    dark: "#0F766E",
    contrastText: "#FFFFFF",
  },
  onPrimary: "#FFFFFF",
  primaryContainer: "#CCFBF1",
  onPrimaryContainer: "#115E59",

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
    main: "#DC2626", // Vivid Red
    light: "#F87171",
    dark: "#991B1B",
    contrastText: "#FFFFFF",
  },
  onError: "#FFFFFF",
  errorContainer: "#FEE2E2",
  onErrorContainer: "#7F1D1D",

  success: {
    main: "#16A34A", // Vivid Green
    light: "#4ADE80",
    dark: "#166534",
    contrastText: "#FFFFFF",
  },
  onSuccess: "#FFFFFF",
  successContainer: "#DCFCE7",
  onSuccessContainer: "#14532D",

  warning: {
    main: "#D97706", // Vivid Amber
    light: "#FBBF24",
    dark: "#92400E",
    contrastText: "#FFFFFF",
  },
  onWarning: "#FFFFFF",
  warningContainer: "#FEF3C7",
  onWarningContainer: "#78350F",

  info: {
    main: "#2563EB", // Vivid Blue
    light: "#60A5FA",
    dark: "#1E40AF",
    contrastText: "#FFFFFF",
  },
  onInfo: "#FFFFFF",
  infoContainer: "#DBEAFE",
  onInfoContainer: "#1E3A8A",

  // Custom Families
  tertiary: "#E11D48", // Vivid Rose
  onTertiary: "#FFFFFF",
  tertiaryContainer: "#FFE4E6",
  onTertiaryContainer: "#881337",

  // Layout Families
  header: "#FFFFFF",
  onHeader: "#171717",
  headerContainer: "#FFFFFF",
  onHeaderContainer: "#171717",

  footer: "#FFFFFF",
  onFooter: "#171717",
  footerContainer: "#FAFAFA",
  onFooterContainer: "#52525B",

  sidebar: "#FFFFFF",
  onSidebar: "#171717",
  sidebarContainer: "#FAFAFA",
  onSidebarContainer: "#52525B",

  // Base Scheme (Strict Zinc/Neutral Gray Scale)
  background: {
    default: "#FFFFFF",
    paper: "#FFFFFF",
  },
  onBackground: "#171717",
  surface: "#FFFFFF",
  onSurface: "#171717",
  surfaceVariant: "#F4F4F5",
  onSurfaceVariant: "#52525B",
  outline: "#A1A1AA",
  outlineVariant: "#E4E4E7",
  scrim: "#000000",
  inverseSurface: "#171717",
  inverseOnSurface: "#F4F4F5",
  inversePrimary: "#2DD4BF",
  surfaceDim: "#E4E4E7",
  surfaceBright: "#FFFFFF",

  // Material 3 Surface Containers (Strict Lightness Progression)
  surfaceContainerLowest: "#FFFFFF",
  surfaceContainerLow: "#FAFAFA",
  surfaceContainer: "#F4F4F5",
  surfaceContainerHigh: "#E4E4E7",
  surfaceContainerHighest: "#D4D4D8",

  // Layout Helpers
  border: {
    light: "#E4E4E7",
    main: "#D4D4D8",
  },
  shadow: {
    card: "0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05)",
    cardHover: "0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -2px rgba(0, 0, 0, 0.04)",
    button: "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
    buttonHover: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)",
  },

  // Status Family
  status: {
    pending: "#D97706",
    onPending: "#FFFFFF",
    pendingContainer: "#FEF3C7",
    onPendingContainer: "#78350F",

    confirmed: "#2563EB",
    onConfirmed: "#FFFFFF",
    confirmedContainer: "#DBEAFE",
    onConfirmedContainer: "#1E3A8A",

    active: "#16A34A",
    onActive: "#FFFFFF",
    activeContainer: "#DCFCE7",
    onActiveContainer: "#14532D",

    completed: "#9333EA", // Purple 600
    onCompleted: "#FFFFFF",
    completedContainer: "#F3E8FF", // Purple 100
    onCompletedContainer: "#581C87", // Purple 900

    cancelled: "#DC2626", // Red 600
    onCancelled: "#FFFFFF",
    cancelledContainer: "#FEE2E2", // Red 100
    onCancelledContainer: "#7F1D1D", // Red 900

    blocked: "#475569", // Slate 600
    onBlocked: "#FFFFFF",
    blockedContainer: "#F1F5F9", // Slate 100
    onBlockedContainer: "#0F172A", // Slate 900
  },

  DataGrid: {
    bg: "#FFFFFF",
    pinnedBg: "#FAFAFA",
    headerBg: "#F4F4F5",
  },
};
