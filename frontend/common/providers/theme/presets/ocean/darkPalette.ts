import type { PaletteOptions } from "@mui/material/styles";

/**
 * Ocean preset — dark mode.
 *
 * Primary: bright cyan (Cyan 400). Secondary: light sky (Cyan 200).
 * Deep navy-blue backgrounds with glowing cyan accents.
 */
export const darkPalette: PaletteOptions = {
  text: {
    primary: "#E0F7FA", // Crisp cyan-white
    secondary: "#80DEEA", // Cyan 200
    disabled: "#4A6B78",
  },

  primary: {
    main: "#26C6DA", // Cyan 400
    light: "#80DEEA",
    dark: "#00838F",
    contrastText: "#001F24",
  },
  onPrimary: "#001F24",
  primaryContainer: "#005661", // Deep cyan container
  onPrimaryContainer: "#B2EBF2",

  secondary: {
    main: "#4FC3F7", // Light Blue 400
    light: "#81D4FA",
    dark: "#0288D1",
    contrastText: "#001B2E",
  },
  onSecondary: "#001B2E",
  secondaryContainer: "#01579B",
  onSecondaryContainer: "#E1F5FE",

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
    main: "#4FC3F7",
    light: "#81D4FA",
    dark: "#0288D1",
    contrastText: "#001B2E",
  },
  onInfo: "#001B2E",
  infoContainer: "#01579B",
  onInfoContainer: "#E1F5FE",

  tertiary: "#F43F5E",
  onTertiary: "#4C0519",
  tertiaryContainer: "#881337",
  onTertiaryContainer: "#FFE4E6",

  header: "#0A1929", // Deep navy
  onHeader: "#E0F7FA",
  headerContainer: "#0A1929",
  onHeaderContainer: "#E0F7FA",

  footer: "#0A1929",
  onFooter: "#E0F7FA",
  footerContainer: "#0A1929",
  onFooterContainer: "#80DEEA",

  sidebar: "#0A1929",
  onSidebar: "#E0F7FA",
  sidebarContainer: "#0A1929",
  onSidebarContainer: "#E0F7FA",

  background: {
    default: "#06121E", // Very deep ocean navy
    paper: "#0A1929",
  },
  onBackground: "#E0F7FA",
  surface: "#0A1929",
  onSurface: "#E0F7FA",
  surfaceVariant: "#102A43",
  onSurfaceVariant: "#80DEEA",
  outline: "#2A4A5E",
  outlineVariant: "#1A3040",
  // Tinted divider — uses cyan at low opacity so separators feel "ocean"
  // instead of neutral grey. Without this MUI defaults to rgba(255,255,255,0.12).
  divider: "rgba(38, 198, 218, 0.12)",
  // Tinted action states — hover/selected lean cyan, not neutral grey.
  action: {
    active: "#80DEEA",
    hover: "rgba(38, 198, 218, 0.08)",
    selected: "rgba(38, 198, 218, 0.12)",
    disabled: "rgba(128, 222, 234, 0.3)",
    disabledBackground: "rgba(38, 198, 218, 0.05)",
    focus: "rgba(38, 198, 218, 0.12)",
  },
  scrim: "#000000",
  inverseSurface: "#E0F7FA",
  inverseOnSurface: "#0A1929",
  inversePrimary: "#00838F",
  surfaceDim: "#050F1A",
  surfaceBright: "#1A3040",

  surfaceContainerLowest: "#030C15",
  surfaceContainerLow: "#06121E",
  surfaceContainer: "#0A1929",
  surfaceContainerHigh: "#102A43",
  surfaceContainerHighest: "#1A3040",

  border: {
    light: "#102A43",
    main: "#1A3040",
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
    confirmed: "#4FC3F7",
    onConfirmed: "#001B2E",
    confirmedContainer: "#01579B",
    onConfirmedContainer: "#E1F5FE",
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
    blocked: "#80DEEA",
    onBlocked: "#001F24",
    blockedContainer: "#102A43",
    onBlockedContainer: "#E0F7FA",
  },

  DataGrid: {
    bg: "#06121E",
    pinnedBg: "#0A1929",
    headerBg: "#102A43",
  },
};
