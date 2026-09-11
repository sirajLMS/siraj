"use client";

import { create } from "zustand";
import type {
  AppearanceColorPairInput,
  AppearanceColorsInput,
  AppearanceDraftInput,
} from "@/frontend/common/graphql/generated/gql/graphql";
import { detectDocumentColorScheme } from "@/frontend/common/lib/theme-detection";
import {
  type AppearancePreset,
  type AppearancePresetId,
  extractCssVarsFromPalette,
  matchPresetByColors,
  resolvePresetPalette,
} from "@/frontend/common/providers/theme/presets";
import { pickOnPrimary } from "@/shared/lib/color-contrast.utils";

/**
 * CSS custom property names written on `<html>` to override MUI palette
 * tokens for the live brand preview. Mirrors the tokens consumed by
 * `frontend/common/lib/server-theme-css.ts` (Task 8.1) so inline overrides
 * win over the SSR-emitted fallback tokens during customize mode.
 */
const CSS_VAR_PRIMARY_MAIN = "--mui-palette-primary-main";
const CSS_VAR_SECONDARY_MAIN = "--mui-palette-secondary-main";
const CSS_VAR_ON_PRIMARY = "--mui-palette-onPrimary";

/**
 * Maximum number of draft snapshots retained for the undo/redo stack.
 * Keeps memory bounded during long editing sessions; oldest entries fall
 * off first (FIFO eviction via `Array.slice(-MAX_HISTORY)`).
 */
const MAX_HISTORY = 50;

/**
 * Per-mode color key ("light" | "dark"). Matches `keyof AppearanceColorsInput`
 * from the codegen input types so the store never redefines the union.
 */
type AppearanceMode = keyof AppearanceColorsInput;

/**
 * Default appearance draft — a snapshot of the current brand palette.
 *
 * Mirrors `DEFAULT_APPEARANCE_FIELDS` in
 * `backend/services/appearance/appearance-settings.service.ts` (Task 2.3).
 * Duplicated here because importing the backend service would pull
 * server-only deps (Drizzle, `next/cache`, audit service) into the client
 * bundle. If these values drift, `resetToDefaults()` on the client would
 * produce a different draft than `resetDraft()` on the backend — keep them
 * in sync when editing.
 *
 * Typed as `AppearanceDraftInput` (the codegen mutation input type) so the
 * draft can be passed directly to `saveAppearanceDraftMutationDocument`
 * without mapping (per `frontend/common/stores/AGENTS.md` — NO MAPPING).
 */
export const DEFAULT_APPEARANCE_DRAFT: AppearanceDraftInput = {
  colors: {
    light: { primaryMain: "#0D9488", secondaryMain: "#4F46E5" },
    dark: { primaryMain: "#2DD4BF", secondaryMain: "#818CF8" },
  },
  logoUrl: null,
  siteName: "Siraj",
  siteTitle: "Siraj",
  siteDescription: "Siraj education management",
  defaultColorScheme: "dark",
};

/** Track all CSS variable names written on `document.documentElement` during customize mode. */
const activeCustomizedCssVars = new Set<string>();

/**
 * Write the active-mode brand color CSS vars and preset palette tokens on `<html>`.
 *
 * Called by store setters for instant preview feedback (design §8 —
 * "updates draft + writes CSS var"). When a preset is selected, its complete
 * palette (backgrounds, surfaces, headers, sidebars, borders, text, status) is
 * flattened into `--mui-palette-*` inline CSS variables on `<html>` so the entire
 * page theme immediately shifts to that preset.
 *
 * Custom brand color picks (`primaryMain` / `secondaryMain`) layer on top of the
 * preset's baseline palette.
 *
 * Guarded by `typeof document` so the store can be imported in SSR / tests
 * without touching the DOM.
 */
function writeActiveModeCssVars(
  draft: AppearanceDraftInput,
  isDark: boolean,
  presetId?: AppearancePresetId | null
): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  const modeKey: AppearanceMode = isDark ? "dark" : "light";
  const pair: AppearanceColorPairInput | undefined = draft.colors?.[modeKey];

  const activePresetId = presetId ?? matchPresetByColors(draft.colors);
  const palette = resolvePresetPalette(modeKey, activePresetId ?? undefined);
  const presetVars = extractCssVarsFromPalette(palette);

  for (const [varName, varValue] of Object.entries(presetVars)) {
    root.style.setProperty(varName, varValue);
    activeCustomizedCssVars.add(varName);
  }

  if (pair?.primaryMain) {
    root.style.setProperty(CSS_VAR_PRIMARY_MAIN, pair.primaryMain);
    root.style.setProperty(CSS_VAR_ON_PRIMARY, pickOnPrimary(pair.primaryMain));
    activeCustomizedCssVars.add(CSS_VAR_PRIMARY_MAIN);
    activeCustomizedCssVars.add(CSS_VAR_ON_PRIMARY);
  }
  if (pair?.secondaryMain) {
    root.style.setProperty(CSS_VAR_SECONDARY_MAIN, pair.secondaryMain);
    activeCustomizedCssVars.add(CSS_VAR_SECONDARY_MAIN);
  }
}

/**
 * Remove all appearance-managed inline CSS vars from `<html>`.
 *
 * Called on `exitCustomizeMode` when the session did not publish, so the
 * app falls back to the published tokens emitted by the resolved preset
 * once the admin leaves the customizer. When the session published, the
 * inline vars are rewritten with the published values instead of cleared
 * (the SSR stylesheet is not patched by `router.refresh`).
 */
function clearActiveModeCssVars(): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  for (const varName of activeCustomizedCssVars) {
    root.style.removeProperty(varName);
  }
  activeCustomizedCssVars.clear();
}

/**
 * Build the partial state update for an edit that pushes the previous draft
 * onto the undo stack and clears the redo stack. Used by `setField`,
 * `setModeColors`, and `resetToDefaults` to keep the history semantics
 * consistent (any new edit invalidates the redo chain).
 */
function commitEdit(
  state: AppearancePreviewState,
  nextDraft: AppearanceDraftInput,
  presetId?: AppearancePresetId | null
): Partial<AppearancePreviewState> {
  const activePresetId = presetId ?? state.presetId ?? matchPresetByColors(nextDraft.colors);
  writeActiveModeCssVars(nextDraft, state.isDark, activePresetId);
  return {
    draft: nextDraft,
    presetId: activePresetId,
    dirty: true,
    past: [...state.past, state.draft].slice(-MAX_HISTORY),
    future: [],
  };
}

/**
 * Zustand store backing the `?customize=1` overlay (design §8).
 *
 * Holds the in-memory draft of `AppearanceFields` (per-mode colors, logo,
 * site info) plus the customize-mode UI flags (`isCustomizeMode`, `isDark`,
 * `hydrated`, `dirty`) and an undo/redo history stack.
 *
 * The store does NOT call GraphQL mutations directly — autosave is owned by
 * a provider `useEffect` (design §8) which calls `saveAppearanceDraft` via
 * `@apollo/client/react`'s `useMutation`, then `markSaved()` on success.
 *
 * Type source: `AppearanceDraftInput` from `graphql.ts` (codegen) per
 * `frontend/common/stores/AGENTS.md` (NO MAPPING, NO SCHEMA TYPES). The
 * draft can be passed directly as the `input` variable to
 * `saveAppearanceDraftMutationDocument` — the resolver (Task 2.4)
 * normalizes `logoUrl: undefined -> null` and coerces
 * `defaultColorScheme: string -> PaletteMode`.
 */
interface AppearancePreviewState {
  /** Current draft bundle (the source of truth for the customizer form). */
  readonly draft: AppearanceDraftInput;
  /** Whether the `?customize=1` overlay is mounted. */
  readonly isCustomizeMode: boolean;
  /** Active per-mode tab in the customizer (true = dark, false = light). */
  readonly isDark: boolean;
  /** Currently active preset ID (ocean, emerald, violet, crimson, slate, default). */
  readonly presetId: AppearancePresetId | null;
  /** Whether `loadFromServer` has run at least once. */
  readonly hydrated: boolean;
  /** Whether the draft has unsaved changes (cleared by `markSaved` / `loadFromServer`). */
  readonly dirty: boolean;
  /** Whether the reset-to-defaults confirmation dialog is open. */
  readonly resetDialogOpen: boolean;
  /** Undo stack (most-recent-last). Bounded by `MAX_HISTORY`. */
  readonly past: ReadonlyArray<AppearanceDraftInput>;
  /** Redo stack (most-recent-first). Cleared on any new edit. */
  readonly future: ReadonlyArray<AppearanceDraftInput>;
  /**
   * Snapshot of the draft most recently published during this session.
   * The exit-restore in `useAppearanceLivePreview` prefers this over the
   * pre-entry DOM captures so the dashboard reflects a fresh publish
   * immediately, without a page reload. Retained after exit so the
   * exit-restore can read it; reset at the start of the next customize
   * session by `enterCustomizeMode`.
   */
  readonly lastPublished: AppearanceDraftInput | null;
  /** Update a top-level draft field (siteName, siteTitle, logoUrl, defaultColorScheme, ...). */
  readonly setField: <K extends keyof AppearanceDraftInput>(key: K, value: AppearanceDraftInput[K]) => void;
  /** Replace the color pair for one mode (light or dark). */
  readonly setModeColors: (mode: AppearanceMode, pair: AppearanceColorPairInput) => void;
  /** Replace both mode color pairs at once (single undo step — used by preset application). */
  readonly setColors: (colors: AppearanceColorsInput, presetId?: AppearancePresetId | null) => void;
  /** Apply a preset theme: updates draft colors and immediately switches the active theme. */
  readonly applyPreset: (preset: AppearancePreset) => void;
  /** Toggle the active per-mode tab + re-write CSS vars for the new mode. */
  readonly setMode: (isDark: boolean) => void;
  /** Enter customize mode (mounts the overlay). */
  readonly enterCustomizeMode: () => void;
  /**
   * Exit customize mode. Without a publish this session, clears the inline
   * CSS vars so the published stylesheet takes over. After a publish, the
   * inline vars are instead rewritten with the published draft's values: the
   * SSR theme stylesheet in `<head>` is not patched by `router.refresh()` and
   * still carries the pre-publish tokens, so clearing would flash the old
   * published theme until the next full page reload.
   */
  readonly exitCustomizeMode: () => void;
  /** Seed the draft from the server-published row; clears history + dirty. */
  readonly loadFromServer: (draft: AppearanceDraftInput) => void;
  /** Reset the draft to `DEFAULT_APPEARANCE_DRAFT`; pushes the prior draft to history. */
  readonly resetToDefaults: () => void;
  /** Clear the `dirty` flag (called by the autosave effect after a successful mutation). */
  readonly markSaved: () => void;
  /** Record a successful publish: snapshots the published draft for exit-restore. */
  readonly markPublished: (published: AppearanceDraftInput) => void;
  /** Pop the undo stack onto the draft; pushes the current draft to redo. */
  readonly undo: () => void;
  /** Pop the redo stack onto the draft; pushes the current draft to undo. */
  readonly redo: () => void;
  /** Open the reset-to-defaults confirmation dialog. */
  readonly openResetDialog: () => void;
  /** Close the reset-to-defaults confirmation dialog without resetting. */
  readonly closeResetDialog: () => void;
  /** Whether `undo()` would do anything. */
  readonly canUndo: () => boolean;
  /** Whether `redo()` would do anything. */
  readonly canRedo: () => boolean;
}

const initialState = {
  draft: DEFAULT_APPEARANCE_DRAFT,
  isCustomizeMode: false,
  // BUG-C fix: isDark must match defaultColorScheme so the customizer starts
  // in the same mode as the app (dark by default), not always light.
  isDark: DEFAULT_APPEARANCE_DRAFT.defaultColorScheme === "dark",
  presetId: "default" as AppearancePresetId,
  hydrated: false,
  dirty: false,
  resetDialogOpen: false,
  past: [] as ReadonlyArray<AppearanceDraftInput>,
  future: [] as ReadonlyArray<AppearanceDraftInput>,
  lastPublished: null,
};

export const useAppearancePreviewStore = create<AppearancePreviewState>((set, get) => ({
  ...initialState,
  setField: (key, value) => set(state => commitEdit(state, { ...state.draft, [key]: value }, state.presetId)),
  setModeColors: (mode, pair) =>
    set(state =>
      commitEdit(
        state,
        {
          ...state.draft,
          colors: { ...state.draft.colors, [mode]: pair },
        },
        state.presetId
      )
    ),
  setColors: (colors, presetId) =>
    set(state =>
      commitEdit(
        state,
        {
          ...state.draft,
          colors,
        },
        presetId ?? matchPresetByColors(colors)
      )
    ),
  applyPreset: preset =>
    set(state =>
      commitEdit(
        state,
        {
          ...state.draft,
          colors: {
            light: { ...preset.light },
            dark: { ...preset.dark },
          },
        },
        preset.id
      )
    ),
  setMode: isDark => {
    set({ isDark });
    writeActiveModeCssVars(get().draft, isDark, get().presetId);
  },
  enterCustomizeMode: () => {
    // BUG-C fix: detect the current app color scheme from <html> so the
    // customizer starts in the same mode the user is viewing (dark or light),
    // not always the default isDark. This ensures color edits apply to the
    // mode the user actually sees.
    const currentScheme = detectDocumentColorScheme();
    const isDark = currentScheme !== undefined ? currentScheme === "dark" : get().draft.defaultColorScheme === "dark";
    const wasHydrated = get().hydrated;
    const presetId = wasHydrated ? get().presetId : matchPresetByColors(get().draft.colors);
    // Reset hydration + last-visible-publish marks so each session starts by
    // reseeding the draft from the server (the server draft may have changed
    // since the last session, e.g. another admin published).
    set({ isCustomizeMode: true, isDark, presetId, lastPublished: null, hydrated: false });
    // Only write CSS vars when the store already knows the active preset.
    // On the first entry of a session, `hydrated` is false and `presetId`
    // is the factory default ("default") — writing CSS vars here would
    // overwrite the published preset's tokens (e.g. ocean → default) before
    // `loadFromServer` runs. `loadFromServer` writes the correct vars once
    // the server draft arrives.
    if (wasHydrated) {
      writeActiveModeCssVars(get().draft, isDark, presetId);
    }
  },
  exitCustomizeMode: () => {
    const publishedSnapshot = get().lastPublished;
    if (publishedSnapshot) {
      // The SSR stylesheet still holds the pre-publish tokens; keep the newly
      // published values on screen by writing them as inline overrides. The
      // inline vars are mode-scoped by name (a single `--mui-palette-*` var
      // set serves whichever mode is active), so only the active mode's
      // values are written — a theme toggle before the next full reload
      // falls back to the stylesheet for the other mode.
      const presetId = matchPresetByColors(publishedSnapshot.colors) ?? get().presetId;
      writeActiveModeCssVars(publishedSnapshot, get().isDark, presetId);
    } else {
      clearActiveModeCssVars();
    }
    // `lastPublished` stays set until the next `enterCustomizeMode` so the
    // live-preview exit-restore can still read it.
    set({ isCustomizeMode: false });
  },
  loadFromServer: draft => {
    const presetId = matchPresetByColors(draft.colors);
    const isDark = get().isCustomizeMode ? get().isDark : draft.defaultColorScheme === "dark";
    writeActiveModeCssVars(draft, isDark, presetId);
    set({ draft, isDark, presetId, hydrated: true, dirty: false, past: [], future: [] });
  },
  resetToDefaults: () =>
    set(state => {
      writeActiveModeCssVars(DEFAULT_APPEARANCE_DRAFT, state.isDark, "default");
      return {
        draft: DEFAULT_APPEARANCE_DRAFT,
        presetId: "default",
        dirty: true,
        past: [...state.past, state.draft].slice(-MAX_HISTORY),
        future: [],
      };
    }),
  markSaved: () => set({ dirty: false }),
  markPublished: published => set({ lastPublished: published }),
  openResetDialog: () => set({ resetDialogOpen: true }),
  closeResetDialog: () => set({ resetDialogOpen: false }),
  undo: () =>
    set(state => {
      if (state.past.length === 0) return state;
      const previous = state.past[state.past.length - 1];
      const nextPast = state.past.slice(0, -1);
      const matched = matchPresetByColors(previous.colors);
      writeActiveModeCssVars(previous, state.isDark, matched);
      return {
        draft: previous,
        presetId: matched,
        past: nextPast,
        future: [state.draft, ...state.future].slice(0, MAX_HISTORY),
        dirty: true,
      };
    }),
  redo: () =>
    set(state => {
      if (state.future.length === 0) return state;
      const next = state.future[0];
      const nextFuture = state.future.slice(1);
      const matched = matchPresetByColors(next.colors);
      writeActiveModeCssVars(next, state.isDark, matched);
      return {
        draft: next,
        presetId: matched,
        past: [...state.past, state.draft].slice(-MAX_HISTORY),
        future: nextFuture,
        dirty: true,
      };
    }),
  canUndo: () => get().past.length > 0,
  canRedo: () => get().future.length > 0,
}));
