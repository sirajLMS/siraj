import type { PaletteOptions } from "@mui/material/styles";

/**
 * Emerald preset — dark mode.
 *
 * Primary: vivid green (Green 500). Secondary: lime (Light Green 400).
 * Deep forest-green backgrounds with glowing emerald accents.
 */
export const darkPalette: PaletteOptions = {
  text: {
    primary: "#DCFCE7",
    secondary: "#BBF7D0",
    disabled: "#3D6B4F",
  },

  primary: {
    main: "#4CAF50", // Green 500
    light: "#81C784",
    dark: "#2E7D32",
    contrastText: "#04140A",
  },
  onPrimary: "#04140A",
  primaryContainer: "#1B5E20",
  onPrimaryContainer: "#C8E6C9",

  secondary: {
    main: "#9CCC65", // Light Green 400
    light: "#C5E1A5",
    dark: "#558B2F",
    contrastText: "#1A2E05",
  },
  onSecondary: "#1A2E05",
  secondaryContainer: "#33691E",
  onSecondaryContainer: "#DCEDC8",

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
    main: "#22D3EE",
    light: "#67E8F9",
    dark: "#0E7490",
    contrastText: "#04141A",
  },
  onInfo: "#04141A",
  infoContainer: "#155E75",
  onInfoContainer: "#CFFAFE",

  tertiary: "#F43F5E",
  onTertiary: "#4C0519",
  tertiaryContainer: "#881337",
  onTertiaryContainer: "#FFE4E6",

  header: "#0A1F12", // Deep forest
  onHeader: "#DCFCE7",
  headerContainer: "#0A1F12",
  onHeaderContainer: "#DCFCE7",

  footer: "#0A1F12",
  onFooter: "#DCFCE7",
  footerContainer: "#0A1F12",
  onFooterContainer: "#86EFAC",

  sidebar: "#0A1F12",
  onSidebar: "#DCFCE7",
  sidebarContainer: "#0A1F12",
  onSidebarContainer: "#DCFCE7",

  background: {
    default: "#031008", // Abyssal forest — darker than paper for depth
    paper: "#0A1F12",
  },
  onBackground: "#DCFCE7",
  surface: "#0A1F12",
  onSurface: "#DCFCE7",
  surfaceVariant: "#103020",
  onSurfaceVariant: "#86EFAC",
  outline: "#1F4A30",
  outlineVariant: "#15331F",
  divider: "rgba(76, 175, 80, 0.14)",
  action: {
    active: "#86EFAC",
    hover: "rgba(76, 175, 80, 0.10)",
    selected: "rgba(76, 175, 80, 0.16)",
    disabled: "rgba(134, 239, 172, 0.3)",
    disabledBackground: "rgba(76, 175, 80, 0.05)",
    focus: "rgba(76, 175, 80, 0.22)",
  },
  scrim: "#000000",
  inverseSurface: "#DCFCE7",
  inverseOnSurface: "#0A1F12",
  inversePrimary: "#2E7D32",
  surfaceDim: "#020C06",
  surfaceBright: "#15331F",

  surfaceContainerLowest: "#010805",
  surfaceContainerLow: "#031008",
  surfaceContainer: "#0A1F12",
  surfaceContainerHigh: "#103020",
  surfaceContainerHighest: "#1F4530",

  border: {
    light: "#103020",
    main: "#15331F",
  },
  // Green-tinted shadows — deep forest with subtle emerald glow.
  shadow: {
    card: "0 4px 6px -1px rgba(4, 19, 8, 0.7), 0 2px 4px -2px rgba(4, 19, 8, 0.5), 0 0 0 1px rgba(76, 175, 80, 0.04)",
    cardHover: "0 10px 20px -3px rgba(4, 19, 8, 0.8), 0 4px 8px -2px rgba(4, 19, 8, 0.5), 0 0 0 1px rgba(76, 175, 80, 0.08)",
    button: "0 1px 3px 0 rgba(4, 19, 8, 0.5), 0 1px 2px 0 rgba(4, 19, 8, 0.3)",
    buttonHover: "0 4px 8px -1px rgba(76, 175, 80, 0.15), 0 2px 4px -2px rgba(4, 19, 8, 0.4)",
  },

  status: {
    pending: "#FBBF24",
    onPending: "#451A03",
    pendingContainer: "#451A03",
    onPendingContainer: "#FDE68A",
    confirmed: "#22D3EE",
    onConfirmed: "#04141A",
    confirmedContainer: "#0891B2",
    onConfirmedContainer: "#CFFAFE",
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
    blocked: "#86EFAC",
    onBlocked: "#04140A",
    blockedContainer: "#103020",
    onBlockedContainer: "#DCFCE7",
  },

  DataGrid: {
    bg: "#04130A",
    pinnedBg: "#0A1F12",
    headerBg: "#103020",
  },
};
