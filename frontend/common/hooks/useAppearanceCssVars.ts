"use client";

import type { PaletteMode } from "@mui/material/styles";
import { useContext, useEffect } from "react";
import type { AppearanceFields } from "@/backend/types/appearance.types";
import { AppearanceCustomizeContext } from "@/frontend/common/context/AppearanceCustomizeContext";

/**
 * Inline CSS variables on `<html>` managed by {@link useAppearanceCssVars}.
 *
 * MUI v9's `cssVariables: true` (see `createAppCssVarsTheme` in
 * `frontend/common/providers/theme/theme.ts`) bakes these as stylesheet rules
 * under `:root[data-mui-color-scheme="..."]`. Inline styles on
 * `document.documentElement` win over those rules (same specificity, inline
 * wins), so writing the active-mode `primaryMain` / `secondaryMain` here
 * overrides the baked palette for the lifetime of the customize session.
 *
 * When `cssVariables.nativeColor: true` is enabled on the surrounding theme
 * (via `<AppearanceCustomizeScope>` from
 * `frontend/common/providers/AppearanceCustomizeScope.tsx`), MUI emits CSS
 * that derives `--mui-palette-primary-light` / `-dark` / `-contrastText` (and
 * the matching secondary tokens) from `*-main` via `color-mix()` + relative
 * color functions (decision #3) — so updating just the two primitives here is
 * enough for the whole palette to re-tint in-browser with zero JS color math.
 */

/**
 * The two atomic brand primitives for the active editing mode. Read from
 * `draft.colors[activeMode]` — the draft stores colors per-mode (decision #12)
 * so the admin can edit light/dark independently in the `?customize=1` overlay.
 */
export interface AppearanceActiveModeColors {
  readonly primaryMain: string;
  readonly secondaryMain: string;
}

/**
 * Read the active-mode brand primitives from the draft.
 *
 * Pure helper — exported so the Zustand store (Task 4 — `appearancePreviewStore`)
 * can call it from `setField` to write the CSS var immediately on field change
 * (in addition to the React effect in {@link useAppearanceCssVars}, which
 * handles the field-change case for React consumers).
 */
export function readActiveModeColors(draft: AppearanceFields, activeMode: PaletteMode): AppearanceActiveModeColors {
  const colors = draft.colors[activeMode];
  return {
    primaryMain: colors.primaryMain,
    secondaryMain: colors.secondaryMain,
  };
}

/**
 * Write the active-mode brand primitives as inline CSS vars on
 * `document.documentElement` (`<html>`).
 *
 * SSR-safe: no-ops when `document` is undefined (server render / tests).
 *
 * Design §9: the vars are written on `<html>` (not under a
 * `[data-mui-color-scheme="..."]` selector) because:
 *  - The customizer overlay swaps the live mode via
 *    `useColorScheme().setMode()`, which itself toggles the
 *    `data-mui-color-scheme` attribute on `<html>`. Pinning the inline var to
 *    `<html>` keeps it mode-agnostic — the active-mode colors apply regardless
 *    of which live mode the admin is previewing.
 *  - Inline styles win over MUI's baked `:root[data-mui-color-scheme="..."]`
 *    stylesheet rules (same specificity, inline wins), so the admin's pick
 *    takes precedence over the published palette without needing to re-mount
 *    the `CssVarsProvider`.
 */
import { clearActiveModeCssVars, writeActiveModeCssVars } from "@/frontend/common/stores/appearancePreviewStore";

export function writeAppearanceCssVars(
  colors: AppearanceActiveModeColors,
  isDark = true,
  draft?: AppearanceFields
): void {
  const effectiveDraft = draft ?? {
    colors: {
      light: { primaryMain: colors.primaryMain, secondaryMain: colors.secondaryMain },
      dark: { primaryMain: colors.primaryMain, secondaryMain: colors.secondaryMain },
    },
    logoUrl: null,
    siteName: "Siraj",
    siteTitle: "Siraj",
    siteDescription: "Siraj education management",
    defaultColorScheme: isDark ? "dark" : "light",
  };
  writeActiveModeCssVars(effectiveDraft, isDark);
}

export function clearAppearanceCssVars(): void {
  clearActiveModeCssVars();
}

/**
 * Arguments for {@link useAppearanceCssVars}.
 */
export interface UseAppearanceCssVarsArgs {
  /** The full appearance draft (per-mode colors + scalar staging fields). */
  readonly draft: AppearanceFields;
  /** Active mode being edited in the customizer (light/dark tab). */
  readonly activeMode: PaletteMode;
  /**
   * Override the auto-detected enable state.
   *
   * When omitted, the hook auto-enables when inside `<AppearanceCustomizeScope>`
   * (reads `nativeColorEnabled` from {@link AppearanceCustomizeContext}).
   * Pass `false` to force-disable (e.g. in tests); pass `true` to force-enable
   * even outside the scope (e.g. in Storybook).
   */
  readonly enabled?: boolean;
}

/**
 * Hook that writes/clears `<html>` inline CSS vars whenever the active-mode
 * draft colors change (design §9).
 *
 * Behavior:
 *  1. Reads `draft.colors[activeMode].primaryMain` / `secondaryMain` (the two
 *     atomic primitives per decision #2 — MUI `nativeColor` derives the rest).
 *  2. On mount + whenever either color changes, writes them as inline CSS vars
 *     on `document.documentElement` via {@link writeAppearanceCssVars}.
 *  3. On unmount or when `enabled` flips to false, removes them via
 *     {@link clearAppearanceCssVars} so the production MUI stylesheet resumes
 *     control.
 *
 * The hook is safe to call outside the customize overlay — it auto-no-ops when
 * not inside `<AppearanceCustomizeScope>` (unless `enabled: true` is passed
 * explicitly).
 *
 * @example
 * // Inside the customize overlay (auto-enabled by AppearanceCustomizeScope):
 * useAppearanceCssVars({ draft, activeMode: isDark ? "dark" : "light" });
 *
 * @example
 * // Outside the overlay (force-disabled):
 * useAppearanceCssVars({ draft, activeMode, enabled: false });
 */
export function useAppearanceCssVars({ draft, activeMode, enabled }: UseAppearanceCssVarsArgs): void {
  const ctx = useContext(AppearanceCustomizeContext);
  const isActive = enabled ?? ctx.nativeColorEnabled;

  const colors = isActive ? readActiveModeColors(draft, activeMode) : null;
  const primaryMain = colors?.primaryMain;
  const secondaryMain = colors?.secondaryMain;

  // Write vars whenever the active-mode colors change. No cleanup — the next
  // write overwrites the previous values in place (clearing on every change
  // would cause a 1-frame flash of the production palette between writes).
  useEffect(() => {
    if (!primaryMain || !secondaryMain) return;
    writeAppearanceCssVars({ primaryMain, secondaryMain });
  }, [primaryMain, secondaryMain]);

  // Clear on disable / unmount. Separate effect so the cleanup is tied to the
  // `isActive` flag (not the colors) — we only want to clear when leaving the
  // customize scope, not when the admin picks a new color.
  useEffect(() => {
    if (!isActive) return undefined;
    return () => {
      clearAppearanceCssVars();
    };
  }, [isActive]);
}
