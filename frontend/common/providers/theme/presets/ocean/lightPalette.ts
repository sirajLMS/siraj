import type { PaletteOptions } from "@mui/material/styles";

/**
 * Ocean preset — light mode.
 *
 * Primary: deep cyan (Cyan 800). Secondary: sky blue (Cyan 600).
 * Cooler backgrounds with a subtle blue tint. All on<X> values chosen
 * for WCAG AA contrast against their container backgrounds.
 */
export const lightPalette: PaletteOptions = {
  text: {
    primary: "#0C2A33", // Deep cyan-slate for crisp text
    secondary: "#37617A", // Muted cyan-slate
    disabled: "#8AB4C7",
  },

  primary: {
    main: "#00838F", // Cyan 800
    light: "#00ACC1",
    dark: "#005661",
    contrastText: "#FFFFFF",
  },
  onPrimary: "#FFFFFF",
  primaryContainer: "#B2EBF2", // Soft cyan tint
  onPrimaryContainer: "#005661",

  secondary: {
    main: "#0277BD", // Light Blue 800 (sky-leaning)
    light: "#0288D1",
    dark: "#01579B",
    contrastText: "#FFFFFF",
  },
  onSecondary: "#FFFFFF",
  secondaryContainer: "#E1F5FE",
  onSecondaryContainer: "#01579B",

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
    main: "#0288D1", // Ocean info leans cyan-blue
    light: "#4FC3F7",
    dark: "#01579B",
    contrastText: "#FFFFFF",
  },
  onInfo: "#FFFFFF",
  infoContainer: "#E1F5FE",
  onInfoContainer: "#01579B",

  tertiary: "#E11D48",
  onTertiary: "#FFFFFF",
  tertiaryContainer: "#FFE4E6",
  onTertiaryContainer: "#881337",

  header: "#FFFFFF",
  onHeader: "#0C2A33",
  headerContainer: "#FFFFFF",
  onHeaderContainer: "#0C2A33",

  footer: "#FFFFFF",
  onFooter: "#0C2A33",
  footerContainer: "#F0F9FF", // Very light cyan tint
  onFooterContainer: "#37617A",

  sidebar: "#FFFFFF",
  onSidebar: "#0C2A33",
  sidebarContainer: "#F0F9FF",
  onSidebarContainer: "#37617A",

  background: {
    default: "#F0F9FF", // Very light cyan-tinted canvas
    paper: "#FFFFFF",
  },
  onBackground: "#0C2A33",
  surface: "#FFFFFF",
  onSurface: "#0C2A33",
  surfaceVariant: "#E0F7FA",
  onSurfaceVariant: "#37617A",
  outline: "#80DEEA",
  outlineVariant: "#E0F7FA",
  divider: "rgba(0, 131, 143, 0.12)",
  action: {
    active: "#00838F",
    hover: "rgba(0, 131, 143, 0.04)",
    selected: "rgba(0, 131, 143, 0.08)",
    disabled: "rgba(0, 131, 143, 0.26)",
    disabledBackground: "rgba(0, 131, 143, 0.04)",
    focus: "rgba(0, 131, 143, 0.12)",
  },
  scrim: "#000000",
  inverseSurface: "#0C2A33",
  inverseOnSurface: "#F0F9FF",
  inversePrimary: "#00ACC1",
  surfaceDim: "#CFD8DC",
  surfaceBright: "#FFFFFF",

  surfaceContainerLowest: "#FFFFFF",
  surfaceContainerLow: "#F0F9FF",
  surfaceContainer: "#E0F7FA",
  surfaceContainerHigh: "#B2EBF2",
  surfaceContainerHighest: "#80DEEA",

  border: {
    light: "#E0F7FA",
    main: "#80DEEA",
  },
  shadow: {
    card: "0 4px 6px -1px rgba(12, 42, 51, 0.08), 0 2px 4px -2px rgba(12, 42, 51, 0.04)",
    cardHover: "0 10px 15px -3px rgba(12, 42, 51, 0.12), 0 4px 6px -2px rgba(12, 42, 51, 0.06)",
    button: "0 1px 3px 0 rgba(12, 42, 51, 0.1), 0 1px 2px 0 rgba(12, 42, 51, 0.06)",
    buttonHover: "0 4px 6px -1px rgba(12, 42, 51, 0.12), 0 2px 4px -2px rgba(12, 42, 51, 0.08)",
  },

  status: {
    pending: "#D97706",
    onPending: "#FFFFFF",
    pendingContainer: "#FEF3C7",
    onPendingContainer: "#78350F",
    confirmed: "#0288D1",
    onConfirmed: "#FFFFFF",
    confirmedContainer: "#E1F5FE",
    onConfirmedContainer: "#01579B",
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
    blocked: "#37617A",
    onBlocked: "#FFFFFF",
    blockedContainer: "#E0F7FA",
    onBlockedContainer: "#0C2A33",
  },

  DataGrid: {
    bg: "#FFFFFF",
    pinnedBg: "#F0F9FF",
    headerBg: "#E0F7FA",
  },
};
