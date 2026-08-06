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

  const bg = palette.background;
  const primary = palette.primary;
  const border = palette.border;

  // Type guard to check if primary has the 'main' property (SimplePaletteColorOptions)
  const hasMain = (color: typeof primary): color is { main: string } => color !== undefined && "main" in color;

  return {
    bgDefault: bg?.default ?? fallbacks.bgDefault,
    bgPaper: bg?.paper ?? fallbacks.bgPaper,
    headerContainer: palette.headerContainer ?? fallbacks.headerContainer,
    onHeaderContainer: palette.onHeaderContainer ?? fallbacks.onHeaderContainer,
    sidebar: palette.sidebar ?? fallbacks.sidebar,
    onSidebar: palette.onSidebar ?? fallbacks.onSidebar,
    onBackground: palette.onBackground ?? fallbacks.onBackground,
    onSurface: palette.onSurface ?? fallbacks.onSurface,
    onSurfaceVariant: palette.onSurfaceVariant ?? fallbacks.onSurfaceVariant,
    outlineVariant: palette.outlineVariant ?? fallbacks.outlineVariant,
    surfaceContainerLow: palette.surfaceContainerLow ?? fallbacks.surfaceContainerLow,
    primaryContainer: palette.primaryContainer ?? fallbacks.primaryContainer,
    primaryMain: hasMain(primary) ? primary.main : fallbacks.primaryMain,
    borderLight: border?.light ?? fallbacks.borderLight,
    textPrimaryChannel: fallbacks.textPrimaryChannel,
    skeletonBg: fallbacks.skeletonBg,
  };
}

/**
 * Build the scoped CSS rule block for a single color-scheme mode.
 *
 * The rule is scoped to three equivalent selector groups so it matches
 * regardless of which attribute convention the active layer writes:
 *   - `html[data-mui-color-scheme="${mode}"]` — MUI's `InitColorSchemeScript`
 *     default attribute (also written server-side by `app/layout.tsx` and
 *     synced on toggle by `ColorSchemeStateBridge`).
 *   - `html[data-theme="${mode}"]` — the app's custom attribute, updated on
 *     toggle by `ColorSchemeStateBridge`.
 *   - `html[data-${mode}]` — the boolean attribute form written by MUI's
 *     `useColorScheme().setMode()` when `colorSchemeSelector: "data"` is used
 *     (e.g. `data-dark` / `data-light`).
 */
function buildModeRule(mode: PaletteMode): string {
  const tokens = extractTokens(mode);

  return `
    html[data-mui-color-scheme="${mode}"], html[data-theme="${mode}"], html[data-${mode}] {
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
    html[data-mui-color-scheme="${mode}"] body, html[data-theme="${mode}"] body, html[data-${mode}] body {
      background-color: ${tokens.bgDefault};
      color: ${tokens.onBackground};
    }
  `.replace(/\s+/g, " ");
}

/**
 * Generate critical CSS variables for the requested server theme mode.
 * Injected into `<head>` in `app/layout.tsx` so server-rendered HTML shells
 * (NavbarStaticShell, DesktopMainScrollArea, DashboardRoleSkeleton, SidebarShell) paint
 * instantly in the requested palette before client hydration and Emotion cache mount.
 *
 * Emits rules for **both** `light` and `dark` modes (the initial server `mode` first,
 * then the other mode) so that when the user toggles theme mode on the client, the
 * toggled mode's `html[data-theme="…"]` / `html[data-…]` / `html[data-mui-color-scheme="…"]`
 * selectors always have a matching rule with the correct variable values. Without both
 * modes, the server-rendered shells (which read `var(--mui-palette-*)` directly) would
 * stay stuck in the initial server mode after a client toggle, because no rule would
 * exist for the new mode's selectors.
 *
 * The initial server `mode` is emitted first so it wins the SSR first-paint race before
 * hydration; the selectors are mutually exclusive by attribute value, so order does not
 * affect correctness after toggle — only which rule applies during the very first paint.
 */
export function buildServerThemeCss(mode: PaletteMode): string {
  const otherMode: PaletteMode = mode === "dark" ? "light" : "dark";
  return `${buildModeRule(mode)} ${buildModeRule(otherMode)}`;
}
