# Round 5 Audit: §V — Accessibility & RTL Depth

## Summary
- INVALID designs: 3 (V2 contradicts §G1, V5 contradicts §G4, §G2 omits aria-busy)
- PARTIAL designs: 5 (V1, V3, V6, V7, V8)
- NEW gaps: 8
- v9 fixes verified correct: 3/3 (each carries caveats)

## V1 — PARTIAL (line citations wrong)
- §G now exists at lines 1440-1535, G1-G4 ✓
- All forward references resolve ✓
- BUT: V1 text claims dangling refs at "lines 790, 884, 1038" — actual §G-referencing lines are 829, 923, 1077

## V2 — INVALID (contradicts §G1)
- V2 says `frontend/common/hooks/usePrefersReducedMotion.ts` (matchMedia hook)
- §G1 says `frontend/stores/preferencesStore.ts` (Zustand store)
- Two different architectural patterns for same symbol
- `frontend/stores/` doesn't exist — real path is `frontend/common/stores/`
- Animation governance lists also diverge (V2 has Toast/Stagger/Slide; G1 has framer-motion/Tooltip/Dialog)
- Fix: pick ONE pattern, align both sections

## V3 — PARTIAL (incomplete region count)
- CSS clip pattern = standard W3C sr-only ✓
- MUI `sx` accepts all camelCased CSS properties ✓
- No existing `visually-hidden`/`sr-only` utility in repo
- PARTIAL: declares TWO live regions (polite + assertive) but only renders ONE `<div aria-live="polite">` — assertive region missing
- Fix: add separate `<div aria-live="assertive" role="alert">` for FormErrorSnackbar + version-mismatch dialog

## V4 — VALID (Arabic pluralization)
- `pluralize(count, {zero, one, two, few, many, other})` ✓
- CLDR-compliant ✓

## V5 — INVALID (contradicts §G4)
- V5 table: `Ctrl+P` for Publish, `Ctrl+Shift+T` for Send Test, NO merge-tag picker
- §G4 table (declared "authoritative"): `Ctrl+Shift+P` for Publish, `Cmd/Ctrl+K` for merge-tag picker
- V5 IS the "elsewhere" §G4 says not to add to
- `Ctrl+P` clashes with browser print — hostile to discoverability
- `useHotkey` hook path (`frontend/common/hooks/useHotkey.ts`) sane but V5 doesn't ref §G4
- Fix: delete V5 table, replace with pointer to §G4, use `Ctrl+Shift+P` for Publish

## V6 — PARTIAL (focus restoration incomplete)
- `prevFocusRef = document.activeElement` then `restoreFocus` ✓
- Missing: interaction with MUI Dialog's built-in focus restoration (can fight explicit restore)
- No per-dialog wiring diagram
- Fix: explicitly state interaction with MUI's internal focus trap

## V7 — PARTIAL (v9 fix claim is FALSE + missing i18n)
- `defaultAnnouncements` EXISTS as export ✓, `accessibility.announcements` optional ✓
- v9 claim "onDragCancel REQUIRED → compile error" is **FALSE**: `accessibility.announcements` is OPTIONAL (`?`). `onDragCancel` only required IF you supply the full `Announcements` object
- `...defaultAnnouncements` spread + overriding ALL four handlers = redundant (defaults already cover cancel)
- **BUILD-BREAKING**: `dnd.started/over/dropped/cancelled` i18n keys NOT in §B catalogue — V4-3 lockstep = TypeScript compile error

## V8 — PARTIAL (correct a11y + convention deviation + missing i18n)
- `DraggableAttributes` spread ✓ confirmed (role, tabIndex, aria-disabled, aria-pressed, aria-roledescription, aria-describedby)
- MUI Autocomplete auto-wires ARIA ✓ (combobox, listbox, option, aria-expanded, aria-controls)
- `<Button loading>` does NOT auto-set `aria-busy` — V8's explicit `aria-busy="true"` is CORRECT, **contradicts §G2** which says `loading` is enough
- `mode: 'onTouched'` deviates from repo convention (all existing useForm calls use default `onSubmit`)
- `mergeTag.triggerLabel` NOT in §B catalogue — BUILD-BREAKER

## v9 Fix Side-Effects
1. **§G1 ↔ V2 file-path contradiction** (P0): two different paths for same symbol, neither matches repo
2. **§G2 ↔ V8 aria-busy contradiction** (P0): V8 correct (MUI doesn't auto-set aria-busy), §G2 incomplete
3. **V5 ↔ §G4 competing shortcut tables** (P0): different Publish shortcut (`Ctrl+P` vs `Ctrl+Shift+P`)
4. **10 missing i18n keys** (P0 BUILD-BREAKER): `dnd.*`, `editor.shortcuts.*`, `mergeTag.triggerLabel` — V4-3 lockstep makes these TypeScript compile errors
5. **V3 incomplete region count**: polite only, assertive region missing
6. **`...defaultAnnouncements` spread redundant** when all four handlers overridden
7. **`active.data.current?.blockLabel`** convention-only — no design says where to supply it

## NEW Gaps (A11y not covered)
1. Editor CANVAS iframe has no `title` attribute (only preview iframe specified)
2. No `dir="rtl"` design for editor canvas iframe or preview iframe (sandbox doesn't inherit parent's `dir`)
3. No mention of repo's actual RTL mechanism (`createTheme({ direction })` + `stylis-plugin-rtl` cache swap)
4. No roving tabindex design for editor toolbar (sequential Tab through ~5-10 buttons)
5. No landmark roles declared (`<main>`, `<nav>`, `<aside>` with `aria-label`)
6. No focus-visible specification (custom theming may break WCAG-compliant focus rings)
7. No focus-management design for sortable list reorder (where does focus go after keyboard move?)
8. No DragOverlay announcements design (dnd-kit `DragOverlay` renders clone — SR user needs separate ARIA status)

## Recommendations for v10
**P0 (build-breaking):**
1. Add missing i18n keys to §B catalogue + type interface: `dnd.*`, `editor.shortcuts.*`, `mergeTag.triggerLabel`
2. Resolve §G1 vs V2 file-location contradiction (pick ONE pattern, align both)
3. Reconcile V5 and §G4 keyboard shortcuts (delete V5 table, use §G4, recommend `Ctrl+Shift+P` for Publish)
4. Update §G2 to include `aria-busy="true"` on `<Button loading>` (cross-reference V8)

**P1 (correctness):**
5. Soften V7 "onDragCancel REQUIRED" claim — `accessibility.announcements` is OPTIONAL
6. Drop `...defaultAnnouncements` spread OR explain its purpose
7. Specify where `active.data.current?.blockLabel` is set
8. Add V3 assertive region separate from polite region

**P2 (new a11y coverage):**
9. Add `title`/`aria-label` for editor canvas iframe
10. Specify `dir="rtl"` injection for iframes when locale=ar
11. Reference repo's actual RTL mechanism explicitly
12. Add landmark role design for editor page
13. Specify roving tabindex for editor toolbar
14. Specify focus management after sortable reorder
15. Prefer centralized `VisuallyHidden` component over inline sx clip recipe
