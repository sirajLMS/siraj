import type { PaletteOptions } from "@mui/material/styles";

export const SHARED_DARK_SEMANTIC_PALETTE: Partial<PaletteOptions> = {
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

  tertiary: "#F43F5E",
  onTertiary: "#4C0519",
  tertiaryContainer: "#881337",
  onTertiaryContainer: "#FFE4E6",
};

export const SHARED_LIGHT_SEMANTIC_PALETTE: Partial<PaletteOptions> = {
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

  tertiary: "#E11D48",
  onTertiary: "#FFFFFF",
  tertiaryContainer: "#FFE4E6",
  onTertiaryContainer: "#881337",
};

export const SHARED_DARK_STATUS_PALETTE = {
  pending: "#FBBF24",
  onPending: "#451A03",
  pendingContainer: "#451A03",
  onPendingContainer: "#FDE68A",

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
};

export const SHARED_LIGHT_STATUS_PALETTE = {
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
};

export const SHARED_LIGHT_SHELL_SURFACE_PALETTE: Partial<PaletteOptions> = {
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
    default: "#F8FAFC",
    paper: "#FFFFFF",
  },
  onBackground: "#0F172A",
  surface: "#FFFFFF",
  onSurface: "#0F172A",
  surfaceVariant: "#F1F5F9",
  onSurfaceVariant: "#475569",
  outline: "#CBD5E1",
  outlineVariant: "#E2E8F0",
};
