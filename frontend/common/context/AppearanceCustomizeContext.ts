"use client";

import { createContext } from "react";

/**
 * React Context that signals "the customization overlay is mounted" so consumers
 * (the `useAppearanceCssVars` hook, the customize toolbar, the customize
 * sidebar) can branch on whether `cssVariables.nativeColor: true` is in effect
 * on the surrounding MUI theme.
 *
 * Design §9 (`.ai/plans/brand/implementation.md`) + decision #3: when the
 * `?customize=1` overlay is active, MUI's `cssVariables.nativeColor: true` is
 * enabled **selectively** (only inside this scope) so the browser derives
 * `primary.light` / `primary.dark` / `primary.contrastText` (and the matching
 * secondary tokens) from the two atomic primitives (`primaryMain`,
 * `secondaryMain`) via CSS `color-mix()` + relative-color functions. Outside
 * this scope, the production theme (`createAppCssVarsTheme`) keeps its default
 * `cssVariables: { colorSchemeSelector: "data" }` config — no global flag is
 * flipped for all users.
 *
 * File location: `frontend/common/context/AppearanceCustomizeContext.ts`
 * mirrors the existing `ThemeContext.ts` / `ViewportContext.ts` convention
 * (bare `createContext` + types; the matching Provider lives under
 * `frontend/common/providers/AppearanceCustomizeScope.tsx`).
 */
export interface AppearanceCustomizeContextValue {
  /**
   * Whether `cssVariables.nativeColor: true` is enabled for the subtree.
   *
   * `true` only inside `<AppearanceCustomizeScope>`; `false` (default) outside.
   * Consumers branch on this rather than reading the MUI theme directly because
   * the theme object is shared across the whole app (a single `CssVarsProvider`
   * at the root) and the `nativeColor` flag is logically scoped to the
   * customization overlay, not the global theme.
   */
  readonly nativeColorEnabled: boolean;
}

/**
 * Default context value (outside the customize scope). `nativeColorEnabled` is
 * `false` so consumers safely no-op when the overlay is not mounted.
 */
export const APPEARANCE_CUSTOMIZE_DEFAULT: AppearanceCustomizeContextValue = {
  nativeColorEnabled: false,
};

export const AppearanceCustomizeContext = createContext<AppearanceCustomizeContextValue>(APPEARANCE_CUSTOMIZE_DEFAULT);
