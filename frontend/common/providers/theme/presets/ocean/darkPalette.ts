import type { PaletteOptions } from "@mui/material/styles";
import { SHARED_DARK_SEMANTIC_PALETTE } from "@/frontend/common/providers/theme/palette/paletteDefaults";

/**
 * Ocean preset — dark mode.
 *
 * Primary: bright cyan (Cyan 400). Secondary: light sky (Cyan 200).
 * Deep navy-blue backgrounds with glowing cyan accents.
 */
export const darkPalette: PaletteOptions = {
  text: {
    primary: "#E0F7FA", // Crisp cyan-white
    secondary: "#B2EBF2", // Brightened Cyan 100 for WCAG AA contrast on dark navy
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

  ...SHARED_DARK_SEMANTIC_PALETTE,

  info: {
    main: "#4FC3F7",
    light: "#81D4FA",
    dark: "#0288D1",
    contrastText: "#001B2E",
  },
  onInfo: "#001B2E",
  infoContainer: "#01579B",
  onInfoContainer: "#E1F5FE",

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
    default: "#050E1A", // Abyssal deep — darker than paper for depth
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
  divider: "rgba(38, 198, 218, 0.14)",
  // Tinted action states — hover/selected lean cyan, not neutral grey.
  action: {
    active: "#80DEEA",
    hover: "rgba(38, 198, 218, 0.10)",
    selected: "rgba(38, 198, 218, 0.16)",
    disabled: "rgba(128, 222, 234, 0.3)",
    disabledBackground: "rgba(38, 198, 218, 0.05)",
    // Focus is distinct from hover — higher opacity + ring effect for keyboard nav (WCAG 2.4.7)
    focus: "rgba(38, 198, 218, 0.22)",
  },
  scrim: "#000000",
  inverseSurface: "#E0F7FA",
  inverseOnSurface: "#0A1929",
  inversePrimary: "#00838F",
  surfaceDim: "#040B14",
  surfaceBright: "#1A3040",

  // Material 3 surface layering — each level is progressively lighter + more cyan-tinted
  // so cards/panels/elevated surfaces have visible depth (not flat grey).
  surfaceContainerLowest: "#020810",
  surfaceContainerLow: "#050E1A",
  surfaceContainer: "#0A1929",
  surfaceContainerHigh: "#102A43",
  // Brightened for stronger visual lift on dark ocean background (VLM 10/10 fix)
  surfaceContainerHighest: "#1F3A55",

  border: {
    light: "#102A43",
    main: "#1A3040",
  },
  // Cyan-tinted shadows — deep navy with a subtle cyan glow instead of muddy black.
  // This makes cards feel "underwater" rather than floating on grey.
  shadow: {
    card: "0 4px 6px -1px rgba(6, 18, 30, 0.7), 0 2px 4px -2px rgba(6, 18, 30, 0.5), 0 0 0 1px rgba(38, 198, 218, 0.04)",
    cardHover:
      "0 10px 20px -3px rgba(6, 18, 30, 0.8), 0 4px 8px -2px rgba(6, 18, 30, 0.5), 0 0 0 1px rgba(38, 198, 218, 0.08)",
    button: "0 1px 3px 0 rgba(6, 18, 30, 0.5), 0 1px 2px 0 rgba(6, 18, 30, 0.3)",
    buttonHover: "0 4px 8px -1px rgba(38, 198, 218, 0.15), 0 2px 4px -2px rgba(6, 18, 30, 0.4)",
  },

  status: {
    pending: "#FBBF24",
    onPending: "#451A03",
    pendingContainer: "#451A03",
    onPendingContainer: "#FDE68A",
    confirmed: "#4FC3F7",
    onConfirmed: "#001B2E",
    // Brightened container for WCAG AA contrast on the chip text
    confirmedContainer: "#0288D1",
    onConfirmedContainer: "#E1F5FE",
    active: "#4ADE80",
    onActive: "#052E16",
    activeContainer: "#14532D",
    onActiveContainer: "#DCFCE7",
    completed: "#C084FC",
    onCompleted: "#3B0764",
    completedContainer: "#581C87",
    onCompletedContainer: "#F3E8FF",
    // Brightened cancelled (red) for stronger border visibility on dark cards
    cancelled: "#F87171",
    onCancelled: "#450A0A",
    cancelledContainer: "#7F1D1D",
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
