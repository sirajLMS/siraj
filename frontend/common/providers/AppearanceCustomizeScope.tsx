"use client";

import { type ReactNode, useMemo } from "react";
import {
  AppearanceCustomizeContext,
  type AppearanceCustomizeContextValue,
} from "@/frontend/common/context/AppearanceCustomizeContext";

/**
 * `@supports` fallback CSS for browsers that do not support CSS relative-color
 * syntax (`rgb(from <color> r g b)`) — Safari <16.4, < 1% market share per
 * decision #3.
 *
 * When `cssVariables.nativeColor: true` is enabled on the surrounding MUI
 * theme, MUI emits CSS that derives `--mui-palette-primary-light`,
 * `--mui-palette-primary-dark`, `--mui-palette-primary-contrastText` (and the
 * matching secondary tokens) via `color-mix()` + relative-color functions. In
 * browsers that cannot parse `rgb(from ...)`, those derived CSS vars would be
 * invalid and resolve to empty — leaving components that read them (Buttons,
 * Chips, FABs, etc.) without a tint/contrast color.
 *
 * This stylesheet ships static fallbacks: the derived `light`/`dark` tokens
 * alias to `*-main` (no visible tint, but coherent), and the `contrastText`
 * tokens alias to the existing `text.primary` palette var (always readable
 * against the surrounding surface). The fallbacks are scoped to
 * `[data-appearance-customize="true"]` so they only apply inside the
 * customizer overlay and never leak into the production theme.
 *
 * No hardcoded hex colors are used — every value references an existing MUI
 * CSS var, satisfying `frontend/AGENTS.md` ("NO hardcoded colors").
 */
const NATIVE_COLOR_FALLBACK_CSS = `
@supports not (color: rgb(from black r g b)) {
  [data-appearance-customize="true"] {
    --mui-palette-primary-light: var(--mui-palette-primary-main);
    --mui-palette-primary-dark: var(--mui-palette-primary-main);
    --mui-palette-primary-contrastText: var(--mui-palette-text-primary);
    --mui-palette-secondary-light: var(--mui-palette-secondary-main);
    --mui-palette-secondary-dark: var(--mui-palette-secondary-main);
    --mui-palette-secondary-contrastText: var(--mui-palette-text-primary);
  }
}
`;

/**
 * Provider that scopes MUI `cssVariables.nativeColor: true` behavior to the
 * customization overlay subtree (decision #3).
 *
 * Mount this around the `?customize=1` overlay (Phase 6) so:
 *  1. Consumers reading `useContext(AppearanceCustomizeContext)` see
 *     `nativeColorEnabled: true` and can branch (e.g. the
 *     `useAppearanceCssVars` hook auto-enables itself when inside this scope).
 *  2. The `@supports` fallback stylesheet is injected exactly once for the
 *     overlay subtree, so legacy browsers without CSS relative-color syntax
 *     still get a coherent palette (see {@link NATIVE_COLOR_FALLBACK_CSS}).
 *
 * The actual `cssVariables.nativeColor: true` flag on the MUI theme is set by
 * the overlay\\'s theme swap (Phase 6 — the overlay re-mounts a
 * `CssVarsProvider` with a customized theme). This Provider only owns the
 * React Context + the fallback stylesheet — the theme swap itself is a Phase 6
 * concern because it depends on `?customize=1` URL parsing + the dashboard
 * shell layout (see implementation.md §10).
 *
 * The wrapping `div` carries the `data-appearance-customize="true"` attribute
 * so the `@supports` fallback CSS (and any future customize-scoped style) can
 * target the subtree without affecting the rest of the app.
 */
export function AppearanceCustomizeScope({ children }: { readonly children: ReactNode }) {
  const value = useMemo<AppearanceCustomizeContextValue>(() => ({ nativeColorEnabled: true }), []);

  return (
    <AppearanceCustomizeContext.Provider value={value}>
      <div data-appearance-customize="true">
        {children}
        {/*
          biome-ignore lint/security/noDangerouslySetInnerHtml: static CSS string,
          no user input — mirrors the pattern in `frontend/common/lib/emotion-cache.tsx`.
        */}
        <style dangerouslySetInnerHTML={{ __html: NATIVE_COLOR_FALLBACK_CSS }} />
      </div>
    </AppearanceCustomizeContext.Provider>
  );
}
