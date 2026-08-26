/**
 * Palette Factory — resolves the active preset's full palette pair (light + dark).
 *
 * Per brand decision §13 ("Preset Theme Catalog with Light/Dark Palette Pairs"),
 * each preset ships its own complete `lightPalette` + `darkPalette` under
 * `presets/<name>/`. The factory reads `APP_THEME_PRESET` (registered in
 * `backend/lib/env-config-keys.ts`) and returns the matching pair, falling
 * back to the `default` preset when the env var is unset or points to an
 * unknown id.
 *
 * Design pattern: Registry + Factory. The registry is a static `Record<
 * AppearancePresetId, PresetPalettes>` populated at module load — each preset
 * dir exports its own `lightPalette` + `darkPalette`, so the factory stays
 * thin (no dynamic imports, no code-splitting surprises on the SSR fast path
 * per decision §15 "Zero-Latency Serverless").
 *
 * Consumers:
 * - `theme.ts` → `createAppCssVarsTheme()` / `createAppTheme()` use the
 *   factory's `{ light, dark }` to build the MUI theme + colorSchemes.
 * - `server-theme-css.ts` → `extractTokens()` reads the factory's per-mode
 *   palette for SSR CSS-var injection.
 *
 * The existing atomic-color catalog in `presets/index.ts` (the customizer
 * swatches) is a separate concern: it seeds the admin's draft color picker
 * (`primaryMain` + `secondaryMain`). This factory provides the *baseline*
 * full palettes shipped per preset — the two layers compose (the customizer
 * overrides `--mui-palette-primary-main` on top of the preset's full palette).
 */
import type { PaletteOptions } from "@mui/material/styles";
import { darkPalette as defaultDark, lightPalette as defaultLight } from "@/frontend/common/providers/theme/presets/default";
import { darkPalette as oceanDark, lightPalette as oceanLight } from "@/frontend/common/providers/theme/presets/ocean";
import { darkPalette as emeraldDark, lightPalette as emeraldLight } from "@/frontend/common/providers/theme/presets/emerald";
import { darkPalette as violetDark, lightPalette as violetLight } from "@/frontend/common/providers/theme/presets/violet";
import { darkPalette as crimsonDark, lightPalette as crimsonLight } from "@/frontend/common/providers/theme/presets/crimson";
import { darkPalette as slateDark, lightPalette as slateLight } from "@/frontend/common/providers/theme/presets/slate";
import { APPEARANCE_PRESETS, type AppearancePresetId } from "@/frontend/common/providers/theme/presets";

/** A resolved preset palette pair (both modes bundled together). */
export interface PresetPalettes {
  /** Full `PaletteOptions` for light mode. */
  readonly light: PaletteOptions;
  /** Full `PaletteOptions` for dark mode. */
  readonly dark: PaletteOptions;
}

/**
 * Static registry — maps each `AppearancePresetId` to its full palette pair.
 *
 * Kept at module scope so the lookup is a single object property access (no
 * array scan, no closure allocation). New presets are added by (1) creating
 * the `presets/<name>/{light,dark}Palette.ts` files, (2) extending the
 * `AppearancePresetId` union in `presets/index.ts`, and (3) adding one entry
 * here. The union enforces exhaustiveness at compile time.
 */
const REGISTRY: Record<AppearancePresetId, PresetPalettes> = {
  default: { light: defaultLight, dark: defaultDark },
  ocean: { light: oceanLight, dark: oceanDark },
  emerald: { light: emeraldLight, dark: emeraldDark },
  violet: { light: violetLight, dark: violetDark },
  crimson: { light: crimsonLight, dark: crimsonDark },
  slate: { light: slateLight, dark: slateDark },
};

/** The default preset id used when `APP_THEME_PRESET` is unset or unknown. */
export const DEFAULT_PRESET_ID: AppearancePresetId = "default";

/**
 * Read the active preset id from the `APP_THEME_PRESET` environment variable.
 *
 * Returns `"default"` when the env var is unset. When the env var references
 * an unknown preset id (e.g. a typo or a renamed preset from a prior release),
 * falls back to `"default"` rather than throwing — the SSR fast path (decision
 * §15) must never block on theme resolution.
 */
export function getActivePresetId(): AppearancePresetId {
  const raw = process.env.APP_THEME_PRESET;
  if (!raw) return DEFAULT_PRESET_ID;
  return isAppearancePresetId(raw) ? raw : DEFAULT_PRESET_ID;
}

/** Type guard — narrows a string to `AppearancePresetId`. */
function isAppearancePresetId(value: string): value is AppearancePresetId {
  return value in REGISTRY;
}

/**
 * Resolve the full palette pair for a given preset id.
 *
 * @param presetId - The preset id to resolve. When omitted (or unknown),
 *   resolves the active preset from `APP_THEME_PRESET` (falling back to
 *   `default`).
 * @returns The `{ light, dark }` palette pair. Never `undefined` — the
 *   `default` entry is the guaranteed fallback.
 */
export function resolvePresetPalettes(presetId?: string): PresetPalettes {
  const id: AppearancePresetId = presetId && isAppearancePresetId(presetId) ? presetId : getActivePresetId();
  return REGISTRY[id] ?? REGISTRY[DEFAULT_PRESET_ID];
}

/**
 * Resolve a single mode's palette (the common case for SSR + theme builders).
 *
 * Convenience wrapper around `resolvePresetPalettes()` that returns just the
 * requested mode, so callers like `createAppTheme(mode)` stay one-liners.
 */
export function resolvePresetPalette(mode: "light" | "dark", presetId?: string): PaletteOptions {
  const pair = resolvePresetPalettes(presetId);
  return mode === "light" ? pair.light : pair.dark;
}

/** Normalize a hex string for case-insensitive comparison. */
const normalizeHex = (hex: string | undefined): string => hex?.toLowerCase().trim() ?? "";

/**
 * Find the preset whose brand-color pairs match the given `PerModeColors`.
 *
 * Compares `primaryMain` + `secondaryMain` for both light + dark modes
 * against the `APPEARANCE_PRESETS` catalog (case-insensitive hex match).
 * Returns `null` when no preset matches (e.g. custom admin-edited colors).
 *
 * Used by `appearancePreviewStore` to detect which preset swatch is
 * "active" when the admin enters customization mode with an existing
 * published color pair.
 */
export function matchPresetByColors(colors: {
  light?: { primaryMain?: string; secondaryMain?: string } | null;
  dark?: { primaryMain?: string; secondaryMain?: string } | null;
} | null | undefined): AppearancePresetId | null {
  if (!colors?.light?.primaryMain || !colors?.dark?.primaryMain) return null;
  const target = {
    lightPrimary: normalizeHex(colors.light?.primaryMain),
    lightSecondary: normalizeHex(colors.light?.secondaryMain),
    darkPrimary: normalizeHex(colors.dark?.primaryMain),
    darkSecondary: normalizeHex(colors.dark?.secondaryMain),
  };
  for (const preset of APPEARANCE_PRESETS) {
    if (
      normalizeHex(preset.light.primaryMain) === target.lightPrimary &&
      normalizeHex(preset.light.secondaryMain) === target.lightSecondary &&
      normalizeHex(preset.dark.primaryMain) === target.darkPrimary &&
      normalizeHex(preset.dark.secondaryMain) === target.darkSecondary
    ) {
      return preset.id;
    }
  }
  return null;
}

/** Type guard — narrows `unknown` to `Record<string, unknown>` for object walking. */
const isStringRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/**
 * Extract MUI CSS custom property name→value pairs from a `PaletteOptions`.
 *
 * Used by `appearancePreviewStore` to inject live-preview CSS vars on
 * `<html>` when the admin drags the color picker. Each top-level palette
 * key becomes `--mui-palette-<key>` (e.g. `primary.main` →
 * `--mui-palette-primary-main`).
 *
 * Only string values are emitted — nested objects are recursed with a
 * hyphen separator (matching MUI's CSS var naming convention).
 */
export function extractCssVarsFromPalette(palette: PaletteOptions): Record<string, string> {
  const vars: Record<string, string> = {};
  const walk = (obj: object, prefix: string): void => {
    for (const [key, value] of Object.entries(obj)) {
      const varName = prefix ? `${prefix}-${key}` : `--mui-palette-${key}`;
      if (typeof value === "string" && value.length > 0) {
        vars[varName] = value;
      } else if (isStringRecord(value)) {
        walk(value, varName);
      }
    }
  };
  walk(palette, "");
  return vars;
}
