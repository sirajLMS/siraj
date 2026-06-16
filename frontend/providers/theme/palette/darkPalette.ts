import type { PaletteOptions } from "@mui/material/styles";

export const darkPalette: PaletteOptions = {
  // MUI Standard Families (as Objects)
  primary: {
    main: "#98D1D0",
    light: "#B4EDEC",
    dark: "#7DB5B4",
    contrastText: "#003737",
  },
  onPrimary: "#003737",
  primaryContainer: "#0D4D4D",
  onPrimaryContainer: "#85BDBC",

  secondary: {
    main: "#BCC7DE",
    light: "#D8E3FB",
    dark: "#A0ACC2",
    contrastText: "#263143",
  },
  onSecondary: "#263143",
  secondaryContainer: "#545F73",
  onSecondaryContainer: "#CED9F1",

  error: {
    main: "#FFB4AB",
    light: "#FFDAD6",
    dark: "#FF897D",
    contrastText: "#690005",
  },
  onError: "#690005",
  errorContainer: "#93000A",
  onErrorContainer: "#FFDAD6",

  success: {
    main: "#62DF7D",
    light: "#78F691",
    dark: "#1CA64D",
    contrastText: "#003914",
  },
  onSuccess: "#003914",
  successContainer: "#1CA64D",
  onSuccessContainer: "#002E0F",

  warning: {
    main: "#FFBA46",
    light: "#FFD69C",
    dark: "#FCB53B",
    contrastText: "#442C00",
  },
  onWarning: "#442C00",
  warningContainer: "#CA8A04",
  onWarningContainer: "#422A00",

  info: {
    main: "#B4C5FF",
    light: "#D2DBFF",
    dark: "#618BFF",
    contrastText: "#002A78",
  },
  onInfo: "#002A78",
  infoContainer: "#2563EB",
  onInfoContainer: "#EEEFFF",

  // Custom Families
  tertiary: "#D5BDEB",
  onTertiary: "#3A294D",
  tertiaryContainer: "#4F3D63",
  onTertiaryContainer: "#C0A9D6",

  // Layout Families
  header: "#90D2D1",
  onHeader: "#003737",
  headerContainer: "#135E5E",
  onHeaderContainer: "#ccf3f2ff",

  footer: "#ADCDCC",
  onFooter: "#173535",
  footerContainer: "#002020",
  onFooterContainer: "#6B8A89",

  sidebar: "#002626",
  onSidebar: "#FFFFFF",
  sidebarContainer: "#0c3232ff",
  onSidebarContainer: "#93c5c4ff",

  // Base Scheme
  background: {
    default: "#111414",
    paper: "#161D1D",
  },
  onBackground: "#E1E3E2",
  surface: "#111414",
  onSurface: "#E1E3E2",
  surfaceVariant: "#404848",
  onSurfaceVariant: "#BFC8C8",
  outline: "#899292",
  outlineVariant: "#404848",
  scrim: "#000000",
  inverseSurface: "#E1E3E2",
  inverseOnSurface: "#2E3131",
  inversePrimary: "#2E6767",
  surfaceDim: "#111414",
  surfaceBright: "#373A39",
  surfaceContainerLowest: "#0C0F0F",
  surfaceContainerLow: "#191C1C",
  surfaceContainer: "#1D2020",
  surfaceContainerHigh: "#282A2A",
  surfaceContainerHighest: "#323535",

  // Layout Helpers
  border: {
    light: "#3d4949",
    main: "#879393",
  },
  shadow: {
    card: "none",
    cardHover: "0 0 0 1px #3d4949, 0 12px 24px rgba(0, 0, 0, 0.6)",
    button: "none",
    buttonHover: "none",
  },

  // Status Family
  status: {
    pending: "#FFBA46",
    onPending: "#442C00",
    pendingContainer: "#CA8A04",
    onPendingContainer: "#422A00",

    confirmed: "#B4C5FF",
    onConfirmed: "#002A78",
    confirmedContainer: "#2563EB",
    onConfirmedContainer: "#EEEFFF",

    active: "#62DF7D",
    onActive: "#003914",
    activeContainer: "#1CA64D",
    onActiveContainer: "#002E0F",

    completed: "#DDB8FF",
    onCompleted: "#490080",
    completedContainer: "#9333EA",
    onCompletedContainer: "#F6E6FF",

    cancelled: "#FFB4AB",
    onCancelled: "#690005",
    cancelledContainer: "#DC2626",
    onCancelledContainer: "#FFF6F5",

    blocked: "#FFB4AB",
    onBlocked: "#690005",
    blockedContainer: "#B91C1C",
    onBlockedContainer: "#FFCDC7",
  },

  DataGrid: {
    // bg: "#1a2e2eff",
    pinnedBg: "#293548",
    headerBg: "#132424ff",
  },
};
