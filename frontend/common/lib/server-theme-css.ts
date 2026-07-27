import type { PaletteMode } from "@mui/material/styles";
import { darkPalette } from "@/frontend/common/providers/theme/palette/darkPalette";
import { lightPalette } from "@/frontend/common/providers/theme/palette/lightPalette";

interface ServerThemeTokens {
  readonly bgDefault: string;
  readonly bgPaper: string;
  readonly headerContainer: string;
  readonly onHeaderContainer: string;
  readonly sidebar: string;
  readonly onSidebar: string;
  readonly onBackground: string;
  readonly onSurface: string;
  readonly onSurfaceVariant: string;
  readonly outlineVariant: string;
  readonly surfaceContainerLow: string;
  readonly primaryContainer: string;
  readonly primaryMain: string;
  readonly borderLight: string;
  readonly textPrimaryChannel: string;
  readonly skeletonBg: string;
}

const DARK_FALLBACKS: ServerThemeTokens = {
  bgDefault: "#1A1A1A",
  bgPaper: "#262626",
  headerContainer: "#1A1A1A",
  onHeaderContainer: "#FFFFFF",
  sidebar: "#1A1A1A",
  onSidebar: "#FFFFFF",
  onBackground: "#FFFFFF",
  onSurface: "#FAFAFA",
  onSurfaceVariant: "#A1A1AA",
  outlineVariant: "#404040",
  surfaceContainerLow: "#141414",
  primaryContainer: "#115E59",
  primaryMain: "#2DD4BF",
  borderLight: "#333333",
  textPrimaryChannel: "255 255 255",
  skeletonBg: "rgba(255 255 255 / 0.13)",
};

const LIGHT_FALLBACKS: ServerThemeTokens = {
  bgDefault: "#FFFFFF",
  bgPaper: "#FFFFFF",
  headerContainer: "#FFFFFF",
  onHeaderContainer: "#171717",
  sidebar: "#FFFFFF",
  onSidebar: "#171717",
  onBackground: "#171717",
  onSurface: "#171717",
  onSurfaceVariant: "#52525B",
  outlineVariant: "#E4E4E7",
  surfaceContainerLow: "#FAFAFA",
  primaryContainer: "#CCFBF1",
  primaryMain: "#0D9488",
  borderLight: "#E4E4E7",
  textPrimaryChannel: "0 0 0",
  skeletonBg: "rgba(0 0 0 / 0.11)",
};

function extractTokens(mode: PaletteMode): ServerThemeTokens {
  const isDark = mode === "dark";
  const palette = isDark ? darkPalette : lightPalette;
  const fallbacks = isDark ? DARK_FALLBACKS : LIGHT_FALLBACKS;

  const bg = palette.background as { readonly default?: string; readonly paper?: string } | undefined;
  const p = palette as Record<string, unknown>;
  const primary = p.primary as { readonly main?: string } | undefined;
  const border = p.border as { readonly light?: string } | undefined;

  return {
    bgDefault: bg?.default ?? fallbacks.bgDefault,
    bgPaper: bg?.paper ?? fallbacks.bgPaper,
    headerContainer: (p.headerContainer as string | undefined) ?? fallbacks.headerContainer,
    onHeaderContainer: (p.onHeaderContainer as string | undefined) ?? fallbacks.onHeaderContainer,
    sidebar: (p.sidebar as string | undefined) ?? fallbacks.sidebar,
    onSidebar: (p.onSidebar as string | undefined) ?? fallbacks.onSidebar,
    onBackground: (p.onBackground as string | undefined) ?? fallbacks.onBackground,
    onSurface: (p.onSurface as string | undefined) ?? fallbacks.onSurface,
    onSurfaceVariant: (p.onSurfaceVariant as string | undefined) ?? fallbacks.onSurfaceVariant,
    outlineVariant: (p.outlineVariant as string | undefined) ?? fallbacks.outlineVariant,
    surfaceContainerLow: (p.surfaceContainerLow as string | undefined) ?? fallbacks.surfaceContainerLow,
    primaryContainer: (p.primaryContainer as string | undefined) ?? fallbacks.primaryContainer,
    primaryMain: primary?.main ?? fallbacks.primaryMain,
    borderLight: border?.light ?? fallbacks.borderLight,
    textPrimaryChannel: fallbacks.textPrimaryChannel,
    skeletonBg: fallbacks.skeletonBg,
  };
}

/**
 * Generate critical CSS variables derived from the requested server theme mode.
 * Injected into `<head>` in `app/layout.tsx` so server-rendered HTML shells
 * (NavbarStaticShell, DesktopMainScrollArea, DashboardRoleSkeleton, SidebarShell) paint
 * instantly in the requested palette before client hydration and Emotion cache mount.
 */
export function buildServerThemeCss(mode: PaletteMode): string {
  const tokens = extractTokens(mode);

  return `
    :root, html, [data-mui-color-scheme] {
      --mui-palette-background-default: ${tokens.bgDefault};
      --mui-palette-background-paper: ${tokens.bgPaper};
      --mui-palette-headerContainer: ${tokens.headerContainer};
      --mui-palette-onHeaderContainer: ${tokens.onHeaderContainer};
      --mui-palette-sidebar: ${tokens.sidebar};
      --mui-palette-onSidebar: ${tokens.onSidebar};
      --mui-palette-onBackground: ${tokens.onBackground};
      --mui-palette-onSurface: ${tokens.onSurface};
      --mui-palette-onSurfaceVariant: ${tokens.onSurfaceVariant};
      --mui-palette-primary-main: ${tokens.primaryMain};
      --mui-palette-primaryContainer: ${tokens.primaryContainer};
      --mui-palette-border-light: ${tokens.borderLight};
      --mui-palette-outlineVariant: ${tokens.outlineVariant};
      --mui-palette-surfaceContainerLow: ${tokens.surfaceContainerLow};
      --mui-palette-text-primaryChannel: ${tokens.textPrimaryChannel};
      --mui-palette-Skeleton-bg: ${tokens.skeletonBg};
      color-scheme: ${mode};
    }
    html, body {
      background-color: ${tokens.bgDefault} !important;
      color: ${tokens.onBackground} !important;
    }
  `.replace(/\s+/g, " ");
}
