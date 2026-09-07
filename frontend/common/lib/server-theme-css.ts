import type { PaletteColorOptions, PaletteMode } from "@mui/material/styles";
import { logger } from "@/backend/lib/logger";
import { AppearanceSettingsService } from "@/backend/services";
import type { AppearanceFields } from "@/backend/types";
import type { AppearancePresetId } from "@/frontend/common/providers/theme/presets";
import { matchPresetByColors, resolvePresetPalettes } from "@/frontend/common/providers/theme/presets/paletteFactory";

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
  readonly secondaryMain: string;
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
  secondaryMain: "#818CF8",
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
  secondaryMain: "#4F46E5",
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

/**
 * Resolve the preset id the app's palette should be built from.
 *
 * Priority: the published appearance's color pair is matched against the
 * preset catalog (`matchPresetByColors`) — when it matches a preset, the
 * full preset palette (backgrounds, surfaces, header/sidebar, dividers,
 * shadows) is what the published theme should look like. When the published
 * colors are custom (no catalog match) or there is no published row, the
 * `APP_THEME_PRESET` env var (via the factory fallback) applies.
 */
export function resolveAppearancePresetId(appearance?: AppearanceFields | null): AppearancePresetId | undefined {
  return matchPresetByColors(appearance?.colors ?? null) ?? undefined;
}

function extractTokens(mode: PaletteMode, appearance?: AppearanceFields | null): ServerThemeTokens {
  const isDark = mode === "dark";
  const palettes = resolvePresetPalettes(resolveAppearancePresetId(appearance));
  const palette = isDark ? palettes.dark : palettes.light;
  const fallbacks = isDark ? DARK_FALLBACKS : LIGHT_FALLBACKS;
  const publishedColors = appearance?.colors[mode];
  const publishedPrimary = publishedColors?.primaryMain;
  const publishedSecondary = publishedColors?.secondaryMain;

  const bg = palette.background;
  const primary = palette.primary;
  const secondary = palette.secondary;
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
    secondaryMain: publishedSecondary ?? (hasMain(secondary) ? secondary.main : fallbacks.secondaryMain),
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
 * When `appearance` is provided (a published row exists), the palette is
 * resolved from the catalog preset whose brand colors match the published
 * row (falling back to the env preset when the colors are custom), and the
 * `--mui-palette-primary-main` / `--mui-palette-secondary-main` tokens are
 * overridden with the published per-mode pair (AC-21), taking precedence
 * over both the palette values and the {@link DARK_FALLBACKS} /
 * {@link LIGHT_FALLBACKS} constants. All other tokens retain their
 * palette-or-fallback resolution — now from the *published* preset.
 *
 * The `body` background/color rules read the emitted vars via `var(--…)`,
 * so the customize overlay's inline overrides on `<html>` (live preview)
 * also repaint `body` — a literal color here would freeze the page
 * background during live preset switching.
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
      --mui-palette-secondary-main: ${tokens.secondaryMain};
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
      background-color: var(--mui-palette-background-default, ${tokens.bgDefault});
      color: var(--mui-palette-onBackground, ${tokens.onBackground});
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
 * When a published appearance row exists, the palette is resolved from the
 * catalog preset matching the published colors, and the
 * `--mui-palette-primary-main` / `--mui-palette-secondary-main` tokens are
 * overridden with the published per-mode pair for **both** emitted modes
 * (AC-21), so the published brand paints on first render regardless of which
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

/**
 * Resolve the catalog preset id to build the MUI theme from (client bundle
 * needs this up-front because `process.env.APP_THEME_PRESET` is build-time
 * inlined and cannot see DB-published presets at request time).
 *
 * Reads the published appearance through {@link fetchPublishedAppearance}
 * (cached, tag `"appearance"`, try/catch → `null`) and matches its colors
 * against the preset catalog. Returns `undefined` when no preset matches —
 * the theme builders then fall back to the `APP_THEME_PRESET` env preset.
 */
export async function resolvePublishedAppearancePresetId(): Promise<AppearancePresetId | undefined> {
  const appearance = await fetchPublishedAppearance();
  return resolveAppearancePresetId(appearance);
}
