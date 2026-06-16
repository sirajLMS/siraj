import type { PaletteOptions } from "@mui/material/styles";

export const lightPalette: PaletteOptions = {
  // MUI Standard Families (as Objects)
  primary: {
    main: "#003535",
    light: "#104F4F",
    dark: "#002020",
    contrastText: "#FFFFFF",
  },
  onPrimary: "#FFFFFF",
  primaryContainer: "#0D4D4D",
  onPrimaryContainer: "#85BDBC",

  secondary: {
    main: "#3C475A",
    light: "#545F73",
    dark: "#263143",
    contrastText: "#FFFFFF",
  },
  onSecondary: "#FFFFFF",
  secondaryContainer: "#545F73",
  onSecondaryContainer: "#CED9F1",

  error: {
    main: "#BA1A1A",
    light: "#DE3730",
    dark: "#93000A",
    contrastText: "#FFFFFF",
  },
  onError: "#FFFFFF",
  errorContainer: "#FFDAD6",
  onErrorContainer: "#93000A",

  success: {
    main: "#006B2C",
    light: "#00873A",
    dark: "#003914",
    contrastText: "#FFFFFF",
  },
  onSuccess: "#FFFFFF",
  successContainer: "#00873A",
  onSuccessContainer: "#F7FFF2",

  warning: {
    main: "#805600",
    light: "#CA8A04",
    dark: "#4B3100",
    contrastText: "#FFFFFF",
  },
  onWarning: "#FFFFFF",
  warningContainer: "#CA8A04",
  onWarningContainer: "#422A00",

  info: {
    main: "#004AC6",
    light: "#2563EB",
    dark: "#002F84",
    contrastText: "#FFFFFF",
  },
  onInfo: "#FFFFFF",
  infoContainer: "#2563EB",
  onInfoContainer: "#EEEFFF",

  // Custom Families
  tertiary: "#38274B",
  onTertiary: "#FFFFFF",
  tertiaryContainer: "#4F3D63",
  onTertiaryContainer: "#C0A9D6",

  // Layout Families
  header: "#004545",
  onHeader: "#FFFFFF",
  headerContainer: "#135E5E",
  onHeaderContainer: "#e5fafaff",

  footer: "#000000",
  onFooter: "#FFFFFF",
  footerContainer: "#002020",
  onFooterContainer: "#6B8A89",

  sidebar: "#002626",
  onSidebar: "#FFFFFF",
  sidebarContainer: "#0c3232ff",
  onSidebarContainer: "#afc5c5ff",

  // Base Scheme
  background: {
    default: "#F8FAF9",
    paper: "#FFFFFF",
  },
  onBackground: "#191C1C",
  surface: "#F8FAF9",
  onSurface: "#191C1C",
  surfaceVariant: "#DBE4E3",
  onSurfaceVariant: "#404848",
  outline: "#707978",
  outlineVariant: "#BFC8C8",
  scrim: "#000000",
  inverseSurface: "#2E3131",
  inverseOnSurface: "#F0F1F0",
  inversePrimary: "#98D1D0",
  surfaceDim: "#D9DAD9",
  surfaceBright: "#F8FAF9",
  surfaceContainerLowest: "#FFFFFF",
  surfaceContainerLow: "#F2F4F3",
  surfaceContainer: "#EDEEED",
  surfaceContainerHigh: "#E7E8E8",
  surfaceContainerHighest: "#E1E3E2",

  // Layout Helpers
  border: {
    light: "#E2E8F0",
    main: "#CBD5E1",
  },
  shadow: {
    card: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)",
    cardHover: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
    button: "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
    buttonHover: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)",
  },

  // Status Family
  status: {
    pending: "#805600",
    onPending: "#FFFFFF",
    pendingContainer: "#CA8A04",
    onPendingContainer: "#422A00",

    confirmed: "#004AC6",
    onConfirmed: "#FFFFFF",
    confirmedContainer: "#2563EB",
    onConfirmedContainer: "#EEEFFF",

    active: "#006B2C",
    onActive: "#FFFFFF",
    activeContainer: "#00873A",
    onActiveContainer: "#F7FFF2",

    completed: "#7800CE",
    onCompleted: "#FFFFFF",
    completedContainer: "#9333EA",
    onCompletedContainer: "#F6E6FF",

    cancelled: "#B70011",
    onCancelled: "#FFFFFF",
    cancelledContainer: "#DC2626",
    onCancelledContainer: "#FFF6F5",

    blocked: "#93000B",
    onBlocked: "#FFFFFF",
    blockedContainer: "#B91C1C",
    onBlockedContainer: "#FFCDC7",
  },

  DataGrid: {
    bg: "#eff7f7ff",
    pinnedBg: "#293548",
    headerBg: "#59adadff",
  },
};
