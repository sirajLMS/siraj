import type { PaletteColorOptions, PaletteMode } from "@mui/material/styles";
import { logger } from "@/backend/lib/logger";
import { AppearanceSettingsService } from "@/backend/services";
import type { AppearanceFields } from "@/backend/types";
import { darkPalette } from "@/frontend/common/providers/theme/palette/darkPalette";
import { lightPalette } from "@/frontend/common/providers/theme/palette/lightPalette";

function hasMain(color: PaletteColorOptions | undefined): color is { main: string } {
  return color !== undefined && "main" in color;
}

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
  readonly surface: string;
  readonly primaryContainer: string;
  readonly primaryMain: string;
  readonly borderLight: string;
  readonly textPrimary: string;
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
  surface: "#1E1E1E",
  primaryContainer: "#115E59",
  primaryMain: "#2DD4BF",
  borderLight: "#333333",
  textPrimary: "#FAFAFA",
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
  surface: "#FFFFFF",
  primaryContainer: "#CCFBF1",
  primaryMain: "#0D9488",
  borderLight: "#E4E4E7",
  textPrimary: "#0F172A",
  textPrimaryChannel: "0 0 0",
  skeletonBg: "rgba(0 0 0 / 0.11)",
};

/**
 * Cached SSR read of the published appearance (tag `"appearance"`,
 * invalidated on every publish via `revalidateTag` — AC-22). Wrapped in
 * try/catch so a transient DB/cache failure degrades gracefully to the
 * static fallback tokens instead of 500-ing every page render — the SSR
 * theme CSS is non-critical and the page body renders independently.
 *
 * Returns `null` when no row exists or the read throws; the caller falls
 * back to {@link DARK_FALLBACKS} / {@link LIGHT_FALLBACKS}.
 */
async function fetchPublishedAppearance(): Promise<AppearanceFields | null> {
  try {
    return await AppearanceSettingsService.getFirstAppearancePublished();
  } catch (error) {
    logger.error(
      `[server-theme-css] published appearance read failed; falling back to static tokens. ${
        error instanceof Error ? error.message : String(error)
      }`
    );
    return null;
  }
}

function extractTokens(mode: PaletteMode, appearance?: AppearanceFields | null): ServerThemeTokens {
  const isDark = mode === "dark";
  const palette = isDark ? darkPalette : lightPalette;
  const fallbacks = isDark ? DARK_FALLBACKS : LIGHT_FALLBACKS;
  const publishedPrimary = appearance?.colors[mode].primaryMain;

  const bg = palette.background;
  const primary = palette.primary;
  const border = palette.border;

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
    surface: palette.surface ?? fallbacks.surface,
    primaryContainer: palette.primaryContainer ?? fallbacks.primaryContainer,
    primaryMain: publishedPrimary ?? (hasMain(primary) ? primary.main : fallbacks.primaryMain),
    borderLight: border?.light ?? fallbacks.borderLight,
    textPrimary: palette.text?.primary ?? fallbacks.textPrimary,
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
 *
 * When `appearance` is provided (a published row exists), the
 * `--mui-palette-primary-main` token is overridden with the published
 * per-mode `primaryMain` (AC-21), taking precedence over both the static
 * palette value and the {@link DARK_FALLBACKS} / {@link LIGHT_FALLBACKS}
 * constant. All other tokens retain their palette-or-fallback resolution.
 */
function buildModeRule(mode: PaletteMode, appearance?: AppearanceFields | null): string {
  const tokens = extractTokens(mode, appearance);

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
      --mui-palette-surface: ${tokens.surface};
      --mui-palette-text-primary: ${tokens.textPrimary};
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
 *
 * When a published appearance row exists, the `--mui-palette-primary-main` token is
 * overridden with the published per-mode `primaryMain` for **both** emitted modes
 * (AC-21), so the published brand color paints on first render regardless of which
 * mode the visitor lands in. The read is cached via `unstable_cache` tag
 * `"appearance"` (AC-22) and degrades gracefully to the static palette on failure.
 */
export async function buildServerThemeCss(mode: PaletteMode): Promise<string> {
  const appearance = await fetchPublishedAppearance();
  const otherMode: PaletteMode = mode === "dark" ? "light" : "dark";
  return `${buildModeRule(mode, appearance)} ${buildModeRule(otherMode, appearance)}`;
}

/**
 * Resolve the SSR initial theme mode from the theme cookie, falling back to
 * the published `defaultColorScheme` when no cookie preference is set, and
 * finally to `"dark"` (the pre-task default).
 *
 * The cookie takes precedence so the user's explicit mode choice is respected
 * across navigations. When no cookie is set (first visit, or cookie expired),
 * the published `defaultColorScheme` drives the initial SSR mode (AC-21) —
 * this is the "use published value as default mode" gating for the
 * `server-theme-css` primary-token override.
 *
 * The published read goes through {@link fetchPublishedAppearance} (cached,
 * tag `"appearance"`, try/catch → `null`), so a transient DB/cache failure
 * degrades to `"dark"` instead of 500-ing the layout.
 */
export async function resolveServerThemeMode(cookieThemeValue?: string): Promise<PaletteMode> {
  if (cookieThemeValue === "light" || cookieThemeValue === "dark") {
    return cookieThemeValue;
  }
  const appearance = await fetchPublishedAppearance();
  return appearance?.defaultColorScheme ?? "dark";
}
