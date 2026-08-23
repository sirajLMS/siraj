"use client";

import type { PaletteMode } from "@mui/material/styles";
import { useContext, useEffect } from "react";
import type { AppearanceFields } from "@/backend/types/appearance.types";
import { AppearanceCustomizeContext } from "@/frontend/common/context/AppearanceCustomizeContext";
import { pickOnPrimary } from "@/shared/lib/color-contrast.utils";

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
const PRIMARY_MAIN_VAR = "--mui-palette-primary-main";
const SECONDARY_MAIN_VAR = "--mui-palette-secondary-main";

/**
 * Derived foreground token for text placed on top of `primaryMain` (e.g.
 * button labels, chip text, app-bar titles). Computed by {@link pickOnPrimary}
 * from the WCAG contrast ratio of `primaryMain` against pure white vs pure
 * black — whichever produces the higher ratio wins (AC-32). Ties prefer white
 * (MUI default `palette.primary.contrastText` convention).
 *
 * MUI v9 `nativeColor` would otherwise derive `*-contrastText` via CSS
 * `color-mix()` (decision #3), but `onPrimary` is a Material 3 token (per
 * `frontend/AGENTS.md` "Universal Contrast" rule) and the browser-side
 * `color-mix()` derivation does not guarantee WCAG AA — a near-mid-gray
 * primary can produce an `onPrimary` that fails 4.5:1. Computing it in JS via
 * the WCAG 2.1 relative-luminance formula guarantees the threshold.
 */
const ON_PRIMARY_VAR = "--mui-palette-onPrimary";

/**
 * The full set of CSS vars managed by this hook. Used by
 * {@link clearAppearanceCssVars} to remove every property we previously wrote
 * (so the production MUI stylesheet resumes control on customize exit /
 * `resetToDefaults()`).
 */
const MANAGED_CSS_VARS: readonly string[] = [PRIMARY_MAIN_VAR, SECONDARY_MAIN_VAR, ON_PRIMARY_VAR] as const;

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
export function writeAppearanceCssVars(colors: AppearanceActiveModeColors): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.style.setProperty(PRIMARY_MAIN_VAR, colors.primaryMain);
  root.style.setProperty(SECONDARY_MAIN_VAR, colors.secondaryMain);
  // AC-32: derive `--mui-palette-onPrimary` from `primaryMain` so foreground
  // text on brand-colored surfaces (buttons, chips, app bar) meets WCAG AA.
  // `pickOnPrimary` returns `#ffffff` or `#000000` based on whichever has the
  // higher WCAG 2.1 contrast ratio against `primaryMain`. Computed in JS
  // (rather than relying on MUI `nativeColor` `color-mix()` derivation) to
  // guarantee the 4.5:1 threshold for normal text — a near-mid-gray primary
  // can produce an `onPrimary` that fails AA when derived via CSS alone.
  root.style.setProperty(ON_PRIMARY_VAR, pickOnPrimary(colors.primaryMain));
}

/**
 * Remove all appearance-managed inline CSS vars from `<html>`.
 *
 * Called on:
 *  - Customize overlay unmount (the hook's cleanup effect).
 *  - `resetToDefaults()` in the Zustand store (Task 4) — clears the inline
 *    override so the production MUI stylesheet rules resume control.
 *
 * SSR-safe: no-ops when `document` is undefined.
 */
export function clearAppearanceCssVars(): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  for (const varName of MANAGED_CSS_VARS) {
    root.style.removeProperty(varName);
  }
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
