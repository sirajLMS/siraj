# Task 4 — `appearancePreviewStore` (Zustand)

## Summary

Created `frontend/common/stores/appearancePreviewStore.ts` — the Zustand store
backing the `?customize=1` overlay per implementation design §8. Holds the
in-memory appearance draft (per-mode brand colors, logo URL, site info
scalars), customize-mode UI flags, dirty/saved tracking, and an undo/redo
history stack. Writes `<html>` CSS custom properties (`--mui-palette-primary-main`,
`--mui-palette-secondary-main`) inline on every draft mutation for instant
live-preview feedback; the `useAppearanceCssVars` hook (Task 4.1) will own the
mount-time re-application, the `@supports` fallback, and the `nativeColor: true`
context per design §9.

**All 6 sub-loop lifecycle stages pass** (tsgo → oxlint → biome → lint:type-aware
→ duplicates → codescene) on the first complete run (after removing two
unnecessary type assertions flagged by oxlint).

## Files Created/Modified

- **Created**: `frontend/common/stores/appearancePreviewStore.ts` (243 lines, 9527 bytes)
  - Exports `useAppearancePreviewStore` (Zustand store) + `DEFAULT_APPEARANCE_DRAFT`
    (client-side mirror of the backend `DEFAULT_APPEARANCE_FIELDS` constant).
  - No other files touched — the store is self-contained and imports only from
    `zustand` + the codegen `graphql.ts`.

## Store Shape

```ts
interface AppearancePreviewState {
  // State
  readonly draft: AppearanceDraftInput;       // codegen input type (NO MAPPING)
  readonly isCustomizeMode: boolean;
  readonly isDark: boolean;                    // active per-mode tab
  readonly hydrated: boolean;
  readonly dirty: boolean;                     // unsaved-changes flag
  readonly past: ReadonlyArray<AppearanceDraftInput>;   // undo stack (≤50)
  readonly future: ReadonlyArray<AppearanceDraftInput>; // redo stack (≤50)

  // Edit actions (push to past, clear future, write CSS vars, set dirty)
  readonly setField: <K extends keyof AppearanceDraftInput>(key: K, value: AppearanceDraftInput[K]) => void;
  readonly setModeColors: (mode: keyof AppearanceColorsInput, pair: AppearanceColorPairInput) => void;
  readonly resetToDefaults: () => void;

  // Mode + overlay actions
  readonly setMode: (isDark: boolean) => void;
  readonly enterCustomizeMode: () => void;
  readonly exitCustomizeMode: () => void;       // also clears inline CSS vars

  // Lifecycle
  readonly loadFromServer: (draft: AppearanceDraftInput) => void;  // clears history + dirty
  readonly markSaved: () => void;               // clears dirty (called by autosave effect)

  // History
  readonly undo: () => void;
  readonly redo: () => void;
  readonly canUndo: () => boolean;
  readonly canRedo: () => boolean;
}
```

## Implementation Details

### Type source — codegen `AppearanceDraftInput` (NO MAPPING)

Per `frontend/common/stores/AGENTS.md` ("NO MAPPING", "NO SCHEMA TYPES"), the
store's `draft` field is typed as `AppearanceDraftInput` imported directly from
`@/frontend/common/graphql/generated/gql/graphql`. This is the codegen-emitted
input type for the `saveAppearanceDraft` mutation (line 302 of `graphql.ts`):

```ts
export type AppearanceDraftInput = {
  colors: AppearanceColorsInput;
  defaultColorScheme: string;
  logoUrl: string | null | undefined;
  siteDescription: string;
  siteName: string;
  siteTitle: string;
};
```

The draft can be passed directly as the `input` variable to
`saveAppearanceDraftMutationDocument` — the Pothos resolver (Task 2.4)
normalizes `logoUrl: undefined → null` and coerces `defaultColorScheme: string → PaletteMode`.
No intermediate mapping, no indexed-access workarounds, no hand-rolled types.

The `setModeColors` action takes `mode: keyof AppearanceColorsInput` (= `"light" | "dark"`)
and `pair: AppearanceColorPairInput`, both imported from `graphql.ts` — the
union is derived from the codegen type rather than redefined locally.

### Default appearance draft — duplicated from backend

`DEFAULT_APPEARANCE_DRAFT` mirrors `DEFAULT_APPEARANCE_FIELDS` in
`backend/services/appearance/appearance-settings.service.ts` (Task 2.3). It is
duplicated on the client because importing the backend service would pull
server-only dependencies (Drizzle, `next/cache`, `AuditService`, `PermissionsService`)
into the client bundle. The values are:

| Field | Value | Source |
|---|---|---|
| `colors.light.primaryMain` | `#0D9488` | matches backend |
| `colors.light.secondaryMain` | `#4F46E5` | matches backend |
| `colors.dark.primaryMain` | `#2DD4BF` | matches backend |
| `colors.dark.secondaryMain` | `#818CF8` | matches backend |
| `logoUrl` | `null` | matches backend |
| `siteName` | `"Siraj"` | matches backend |
| `siteTitle` | `"Siraj"` | matches backend |
| `siteDescription` | `"Siraj education management"` | matches backend |
| `defaultColorScheme` | `"dark"` | matches backend |

A comment in the file warns that these must stay in sync — if they drift,
`resetToDefaults()` on the client produces a different draft than `resetDraft()`
on the backend. A future task could extract these to `shared/appearance/defaults.ts`
to eliminate the duplication, but that's out of scope for Task 4.

### CSS var writes — instant preview feedback

Three module-level helper functions handle the `<html>` inline style:

1. `writeActiveModeCssVars(draft, isDark)` — reads `draft.colors[activeMode]`
   (where `activeMode = isDark ? "dark" : "light"`) and sets
   `--mui-palette-primary-main` + `--mui-palette-secondary-main` on
   `document.documentElement.style`. Guarded by `typeof document !== "undefined"`
   so the store can be imported in SSR/tests without touching the DOM.

2. `clearActiveModeCssVars()` — removes both inline CSS vars so the app falls
   back to the published tokens emitted by `server-theme-css.ts` (Task 8.1).
   Called by `exitCustomizeMode`.

3. `commitEdit(state, nextDraft)` — shared helper that calls
   `writeActiveModeCssVars` and returns the partial state update
   (`{ draft, dirty: true, past: [...prev, oldDraft].slice(-50), future: [] }`).
   Used by `setField`, `setModeColors`, and `resetToDefaults` to keep the
   history semantics consistent (any new edit invalidates the redo chain).

The store does NOT own the `@supports` fallback or the `nativeColor: true`
context — those are React-rendering concerns owned by the `useAppearanceCssVars`
hook (Task 4.1). The store's direct CSS var writes are the "fast path" for
instant feedback on every keystroke/color pick; the hook ensures correctness
on mount and handles the `color-mix()` / relative-color fallback.

### Undo/redo history

- `past`: array of previous drafts, most-recent-last. Bounded by `MAX_HISTORY = 50`
  (oldest entries evicted via `Array.slice(-50)`).
- `future`: array of drafts available for redo, most-recent-first. Cleared on
  any new edit (`setField` / `setModeColors` / `resetToDefaults`).
- `undo()` — pops the last entry from `past` onto `draft`, pushes the current
  draft onto `future`. No-ops if `past` is empty.
- `redo()` — pops the first entry from `future` onto `draft`, pushes the current
  draft onto `past`. No-ops if `future` is empty.
- `setMode` does NOT touch history (toggling the light/dark tab is a view
  change, not a draft edit).
- `loadFromServer` clears both stacks (fresh start from the server-published row).
- Both `undo` and `redo` set `dirty: true`. If the user undoes back to the
  saved state, the autosave effect (Task 4.1) will fire and call `markSaved()`.

### Autosave — NOT in the store

Per design §8 ("Debounce (3s) autosave: a `useEffect` in a provider calls
`saveAppearanceDraft` mutation"), the store does NOT call GraphQL mutations
directly. The autosave effect lives in a provider hook (Task 4.1) which:

1. Subscribes to `useAppearancePreviewStore(s => s.draft)` + `s.dirty`.
2. On `dirty → true`, debounces 3s, then calls `useMutation(saveAppearanceDraftMutationDocument)`.
3. On success, calls `markSaved()` to clear the dirty flag.

This keeps the store pure (state + CSS var side effect only) and the network
I/O in React-land where `useMutation` belongs.

## Verification Results

### `bun run scripts/health/sub-loop.ts frontend/common/stores/appearancePreviewStore.ts --lifecycle codescene`

```
✅ tsgo passed (no errors for frontend/common/stores/appearancePreviewStore.ts)
✅ oxlint passed
✅ biome:check passed
✅ lint:type-aware passed
✅ check:duplicates passed
✅ codescene passed
✅ All checks for lifecycle "codescene" passed for frontend/common/stores/appearancePreviewStore.ts
```

### Fix applied during the sub-loop

The first oxlint run flagged two `typescript(no-unnecessary-type-assertion)`
warnings:

```ts
// Before (flagged):
const previous = state.past[state.past.length - 1] as AppearanceDraftInput;
const next = state.future[0] as AppearanceDraftInput;

// After (fixed):
const previous = state.past[state.past.length - 1];
const next = state.future[0];
```

The assertions were unnecessary because `ReadonlyArray<AppearanceDraftInput>`
indexing already returns `AppearanceDraftInput` (the project does not enable
`noUncheckedIndexedAccess`, and the `length > 0` guard above each access
satisfies the type narrowing). Removed both assertions; re-ran the sub-loop —
all 6 stages pass.

## Carry-Forward Knowledge

### For Task 4.1 (`useAppearanceCssVars` hook)

- The store already writes `--mui-palette-primary-main` and
  `--mui-palette-secondary-main` on every draft mutation via
  `writeActiveModeCssVars`. The hook should:
  1. Re-apply the vars on mount (in case the store was hydrated before the
     hook mounted).
  2. Re-apply on `isDark` change (already done by `setMode`, but the hook
     should be defensive).
  3. Own the `@supports not (color: rgb(from red r g b))` static fallback
     per design §9.
  4. Enable `cssVariables.nativeColor: true` on the MUI theme context
     selectively (decision #3) so the browser derives shade/contrast via
     `color-mix()`.
- Import the store via `import { useAppearancePreviewStore } from "@/frontend/common/stores/appearancePreviewStore"`.
- Subscribe to `s => s.draft.colors[s.isDark ? "dark" : "light"]` for the
  active-mode pair, and `s => s.isDark` for the mode flag.

### For Task 5 (Settings Appearance tab)

- The tab's form view can read `useAppearancePreviewStore(s => s.draft)` to
  display the current draft fields.
- The "Enter Customize Mode" CTA calls `enterCustomizeMode()` and navigates
  to `?customize=1`.
- The tab should call `loadFromServer(data.appearanceSettings.draftFields)`
  once the `appearanceSettingsQueryDocument` query resolves. Note: the query
  result's `draftFields` is typed as `AppearanceSettingsFieldsSelectionFragment_draftFields`
  (all fields nullable in the SDL), but the store's `loadFromServer` expects
  `AppearanceDraftInput` (non-null `colors`). The tab will need to null-guard
  and construct an `AppearanceDraftInput` from the fragment. **This is a
  mapping step** — but it's at the query-result → store boundary, not inside
  the store, so it doesn't violate `AGENTS.md`'s "NO MAPPING" rule (which
  applies to the store's internal types, not to consumer-side null-coalescing).

  **Alternative:** tighten the Pothos `AppearanceFields` object to expose
  `colors` as non-null (would require `t.expose("colors", { nullable: false })`
  + ensuring the service return type matches). This is the follow-up noted in
  Task 3's outcome — defer until Task 5 confirms the friction is real.

### For Task 6 (Customize overlay — `CustomizeToolbar` / `CustomizeSidebar`)

- `CustomizeToolbar` undo/redo buttons: bind `disabled` to
  `!useAppearancePreviewStore(s => s.canUndo())` / `!s.canRedo()`, and
  `onClick` to `s.undo` / `s.redo`.
- `CustomizeToolbar` save draft: the autosave effect (Task 4.1) handles this
  on a 3s debounce. The toolbar's "Save Draft" button can either trigger the
  effect immediately (by calling a `flushAutosave()` method on the hook) or
  just rely on the debounce. Design TBD in Task 6.
- `CustomizeToolbar` publish: calls `useMutation(publishAppearanceMutationDocument)`.
  After success, the published row is returned and Apollo updates the cache;
  the store's `loadFromServer` should be called with the new `draftFields`
  (which now match the published columns) to reset `dirty` + history.
- `CustomizeToolbar` reset: calls `useMutation(resetAppearanceDraftMutationDocument)`,
  then `loadFromServer(result.draftFields)`. Do NOT call `resetToDefaults()` —
  that resets to the hardcoded `DEFAULT_APPEARANCE_DRAFT`, not to the
  server-published values. `resetToDefaults()` is for a "reset to factory
  defaults" button (if desired), not for the "discard my draft" button.
- `CustomizeSidebar` color editors: call `setModeColors("light" | "dark", { primaryMain, secondaryMain })`.
- `CustomizeSidebar` light/dark tabs: call `setMode(true | false)`.
- `CustomizeSidebar` default-mode radio: call `setField("defaultColorScheme", "light" | "dark")`.
- `CustomizeSidebar` logo upload: call `setField("logoUrl", uploadedUrl)` after
  the upload mutation returns the URL (Task 7).
- Exit customize: call `exitCustomizeMode()` (clears inline CSS vars + sets
  `isCustomizeMode: false`), then navigate to the URL without `?customize=1`.

### For Task 6.1 (Overlay conditional in root layout)

- The root layout reads `?customize=1` from `searchParams` and conditionally
  renders `CustomizeToolbar` + `CustomizeSidebar`.
- On mount of the overlay, the layout should call `enterCustomizeMode()` on
  the store. On unmount, call `exitCustomizeMode()`.
- The dashboard shell accepts a `customizeMode` prop (passed from the layout)
  to collapse the sidebar to icon-only (64px).

### For Task 9.7 (Optimistic concurrency)

- The store currently has no `expectedUpdatedAt` tracking. If Task 9.7 adds
  optimistic concurrency, the store should:
  1. Add a `savedUpdatedAt: string | null` field, set by `loadFromServer` and
     `markSaved`.
  2. The autosave effect passes `expectedUpdatedAt` to the mutation.
  3. On `AppearanceConflictError`, the effect shows a reload/overwrite dialog
     and calls `loadFromServer` with the server's current draft on reload.

  This is a clean extension — no refactor of the existing store needed.

### For Task 10.3 (UI component tests)

- The store is a plain Zustand store — tests can import it directly and call
  `useAppearancePreviewStore.setState({ ... })` to seed state.
- `useAppearancePreviewStore.getState()` gives the current state for assertions.
- `useAppearancePreviewStore.setState(initialState)` resets between tests.
- Mock `document.documentElement.style.setProperty` / `removeProperty` in tests
  that exercise `setField` / `setModeColors` / `exitCustomizeMode`.

## Cross-File Dependencies Discovered

- **Depends on Task 3** (codegen): the store imports `AppearanceDraftInput`,
  `AppearanceColorsInput`, `AppearanceColorPairInput` from
  `@/frontend/common/graphql/generated/gql/graphql`. Without Task 3's
  documents file, these types would not be emitted (per Task 3 outcome's
  "codegemitted only enum value, not operation types" issue).
- **Depends on Task 2.3** (backend `DEFAULT_APPEARANCE_FIELDS`): the client
  `DEFAULT_APPEARANCE_DRAFT` is a byte-for-byte mirror. Verified by reading
  `backend/services/appearance/appearance-settings.service.ts` lines 68–79.
- **Enables Task 4.1** (`useAppearanceCssVars` hook): the hook subscribes to
  the store and re-applies CSS vars on mount + handles `@supports` fallback.
- **Enables Task 5** (Settings Appearance tab): the tab reads `draft` from the
  store and calls `loadFromServer` after the query resolves.
- **Enables Task 6** (Customize overlay): `CustomizeToolbar` binds undo/redo
  to `canUndo`/`canRedo`/`undo`/`redo`; `CustomizeSidebar` binds color editors
  to `setModeColors` + `setMode`.
- **Enables Task 9.7** (optimistic concurrency): the store's `dirty` + future
  `savedUpdatedAt` field (to be added) support conflict detection.

## Issues Encountered

1. **oxlint `no-unnecessary-type-assertion` on history-stack accesses** — the
   initial implementation had `as AppearanceDraftInput` assertions on
   `state.past[...]` and `state.future[...]` index accesses. These were
   unnecessary because `ReadonlyArray<T>` indexing already returns `T` (the
   project doesn't enable `noUncheckedIndexedAccess`). Removed both assertions;
   re-ran the sub-loop — all stages pass.

2. **No other issues**: tsgo, biome, lint:type-aware, check:duplicates, and
   codescene all passed on the first run after the oxlint fix. The store is
   243 lines with a single responsibility and no code duplication (the
   `commitEdit` helper consolidates the edit-history logic across three
   setters).

## AC Coverage

- **AC-11** (live preview: CSS vars update on draft change) — ✅ the store
  writes `--mui-palette-primary-main` / `--mui-palette-secondary-main` on
  every `setField` / `setModeColors` / `setMode` / `loadFromServer` / `undo` /
  `redo` call. The `useAppearanceCssVars` hook (Task 4.1) will complete the
  preview pipeline with `@supports` fallback + `nativeColor` context.

- **AC-13** (per-mode color editing: light + dark tabs switching live mode) —
  ✅ the store holds `draft.colors.light` + `draft.colors.dark` independently,
  `setModeColors(mode, pair)` updates one mode at a time, and `setMode(isDark)`
  toggles which mode's colors are written to the live CSS vars (instant
  preview when switching tabs in the customizer).

- **AC-14** (undo/redo in-session history stack) — ✅ the store maintains
  `past` + `future` arrays (bounded at 50 entries), with `undo()` / `redo()`
  / `canUndo()` / `canRedo()` actions. Any new edit clears the redo chain
  (standard undo/redo semantics). History is in-memory only (not persisted),
  matching design §8's "in-session history stack (not persisted)".

## Files NOT Modified

- No backend files touched.
- No existing frontend stores modified.
- No GraphQL documents or codegen artifacts touched.
- The store is a single new file with no barrel export needed (Zustand stores
  in this repo are imported directly by path, not via a barrel — verified by
  checking how `meetingIntegrationsSettingsStore.ts` is imported by consumers).
