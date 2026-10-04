import type {
  AppearanceColorPairInput,
  AppearanceColorsInput,
  AppearanceDraftInput,
} from "@/frontend/common/graphql/generated/gql/graphql";
import type { AppearancePreset, AppearancePresetId } from "@/frontend/common/providers/theme/presets";

/**
 * Per-mode color key ("light" | "dark"). Matches `keyof AppearanceColorsInput`
 * from the codegen input types so the store never redefines the union.
 */
export type AppearanceMode = keyof AppearanceColorsInput;

/** Action surface exposed by the appearance preview store. */
export interface AppearancePreviewActions {
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
 * `saveAppearanceDraftMutationDocument` — the resolver normalizes
 * `logoUrl: undefined -> null` and coerces
 * `defaultColorScheme: string -> PaletteMode`.
 */
export interface AppearancePreviewState extends AppearancePreviewActions {
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
}
