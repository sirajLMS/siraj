# Task 9 — Customizer i18n labels (`customize.*` namespace)

## Summary

Added the `customize` sub-namespace to the appearance settings locale,
covering all 16 keys required by `tasks.md` Phase 9 / `implementation.md`
§14 / **AC-24**:

| Group            | Keys                                                                |
|------------------|---------------------------------------------------------------------|
| Mode toggle      | `enterMode`, `exitMode`                                             |
| Toolbar actions  | `undo`, `redo`, `saveDraft`, `publish`, `resetDefaults`             |
| Sidebar sections | `brandIdentity`, `colors`, `light`, `dark`, `logoUpload`, `defaultMode` |
| Status badges    | `published`, `draft`                                                |
| Misc             | `exportJson`                                                        |

The keys live as a nested `customize: AppearanceCustomizeLabels` field
on the existing `SettingsAppearanceTabLabels` interface — so consumers
already reading `t.appearance.toolbarUndo` from Task 6.2 can now also
read `t.appearance.customize.brandIdentity` etc. without any namespace
registration changes (the appearance namespace was already wired into
`SettingsLabels` by Task 5.1; this is purely an additive interface +
implementation change).

## Requirements Coverage

- **AC-24** — All customizer-overlay user-facing strings now have
  compile-time-typed i18n keys. The inline English literals temporarily
  introduced by Tasks 6.2 (`CustomizeToolbar`) and 6.3
  (`CustomizeSidebar` + 4 section files) can now be replaced with
  `t.appearance.customize.<key>` calls. (The literal-replacement work
  itself is a separate mechanical follow-up — see "Carry-Forward".)

## Files Modified

### Edited (3 files)

1. **`shared/locale/types/dashboard/settings/appearance.ts`** (+55 lines,
   was 66 → 121)
   - Added `readonly customize: AppearanceCustomizeLabels;` field to
     `SettingsAppearanceTabLabels` (after `noPermission`, before the
     closing brace).
   - Added the new `AppearanceCustomizeLabels` interface below
     `SettingsAppearanceTabLabels` with 16 `readonly string` fields
     grouped by purpose (mode toggle / toolbar actions / sidebar
     sections / status badges / misc). Each field has a JSDoc comment
     explaining its UI location and distinguishing it from any sibling
     field on the parent interface (e.g. `publish` vs `publishNow`,
     `published` vs `publishedBadge`).
   - Updated the file-level doc comment: removed the "customize.* are
     scoped to Task 9 — this interface covers only the in-tab form
     view" disclaimer, replaced with a positive statement that the
     `customize` sub-namespace carries the overlay strings.

2. **`shared/locale/en/dashboard/settings/appearance.ts`** (+18 lines,
   was 43 → 61)
   - Added `customize: { ... }` block with English values for all 16
     keys. Toolbar/sidebar labels mirror the prototype's
     `customize-overlay.html` text exactly ("Brand Identity", "Theme
     Colors", "Light", "Dark", "Logo", "Default Mode", "Enter
     Customize Mode", "Exit Customize Mode", "Undo", "Redo", "Save
     Draft", "Publish", "Reset to Defaults", "Published", "Draft",
     "Export JSON").

3. **`shared/locale/ar/dashboard/settings/appearance.ts`** (+18 lines,
   was 43 → 61)
   - Added `customize: { ... }` block with Arabic translations for all
     16 keys. Mode labels use the same "فاتح" / "داكن" pair already
     used elsewhere in the codebase (matching the MUI theme Arabic
     translations); other strings use natural Arabic phrasing.

## Design Adherence

### Nested sub-namespace vs. separate top-level namespace

Per `shared/AGENTS.md` §Translation System, the canonical pattern is
one `*Labels` interface per locale namespace, registered via
`shared/locale/types/message.ts` + `shared/locale/serverLegacy.ts`
(`namespacePaths`). Two options were considered:

1. **New top-level namespace** `DashboardCustomizeLabels` in
   `shared/locale/types/dashboard/customize.ts` — requires editing
   `message.ts`, `serverLegacy.ts`, `LocaleProvider` layout
   translations, and the consumer hook call site.
2. **Nested sub-namespace** `customize: AppearanceCustomizeLabels` as a
   field on the existing `SettingsAppearanceTabLabels` — no namespace
   registration changes; the appearance namespace was already wired by
   Task 5.1.

Option 2 was chosen because:
- All consumers (Tasks 6.2, 6.3, 7) already call
  `useAppTranslation(Translation.Dashboard.Settings).appearance` — a
  nested field reads as `t.appearance.customize.<key>` with zero
  call-site changes.
- The customizer overlay is conceptually part of the appearance
  settings domain — it's the live-preview UI for the same draft that
  the appearance tab edits. Splitting it into a separate top-level
  namespace would suggest it's a separate feature, which it isn't.
- The 5.1-outcome header comment already reserved `customize.*` for
  "Task 9" inside the appearance type file — this implementation
  fulfills that reservation at the same location.

### Distinct short vs. long labels

Several `customize.*` keys intentionally duplicate existing
`SettingsAppearanceTabLabels` keys with shorter text:

| `customize.*` (short) | `SettingsAppearanceTabLabels` (long) |
|-----------------------|--------------------------------------|
| `publish: "Publish"` | `publishNow: "Publish Now"` |
| `resetDefaults: "Reset to Defaults"` | `resetToDefaults: "Reset to Defaults"` |
| `published: "Published"` | `publishedBadge: "Published"` |
| `draft: "Draft"` | `draftBadge: "Draft has changes"` |
| `exportJson: "Export JSON"` | `exportJson: "Export JSON"` (same) |
| `saveDraft: "Save Draft"` | `saveDraft: "Save Draft"` (same) |
| `enterMode: "Enter Customize Mode"` | `enterCustomizeMode: "Enter Customize Mode"` (same) |
| `exitMode: "Exit Customize Mode"` | `toolbarExit: "Exit"` (different verb) |

The duplicates exist because:
- The `customize.*` keys are the canonical names listed in
  `tasks.md` / `implementation.md` §14 — they're the spec contract.
- The toolbar (`toolbarExit`, `toolbarUndo`, etc. from Task 6.2) uses
  short labels because space is constrained; the tab's action bar uses
  the longer `*Now` / `*To*` variants.
- Merging them would require renaming existing keys across Tasks 5.2 /
  6.2 consumers — outside Task 9's scope.
- The JSDoc on each `customize.*` field explicitly notes the
  distinction (e.g. `publish` → "short — distinct from `publishNow`").

### Compile-time safety

Because `AppearanceCustomizeLabels` is a TypeScript interface and the
`en` / `ar` exports are typed as `SettingsAppearanceTabLabels`, any
missing or extra key in either locale surfaces as a `tsgo` error at
build time. Verified: `bun tsgo` exits 0 with the new files in place.

### Layer isolation (per `shared/AGENTS.md`)

All three edited files live in `shared/locale/` and import only from
`@/shared/locale/types/...` (the EN/AR implementation files import the
type via the `@/` path alias). No imports from `@/frontend/**`,
`@/backend/**`, or `@/app/**`. No view-layer types referenced.

## Cross-file Dependencies

### Producers (this task)

- `shared/locale/types/dashboard/settings/appearance.ts` — added
  `AppearanceCustomizeLabels` interface + `customize` field.
- `shared/locale/en/dashboard/settings/appearance.ts` — added EN
  values.
- `shared/locale/ar/dashboard/settings/appearance.ts` — added AR
  values.

### Consumers (downstream — not modified by this task)

- `frontend/common/views/dashboard/components/customize/CustomizeToolbar.tsx`
  (Task 6.2) — currently uses inline English strings + the existing
  `t.toolbarUndo` / `t.toolbarRedo` / `t.toolbarExit` / `t.toolbarPublish`
  fields. A mechanical follow-up can switch the inline strings to
  `t.appearance.customize.<key>` and deprecate the `toolbar*` fields.
- `frontend/common/views/dashboard/components/customize/CustomizeSidebar.tsx`
  + 4 section files (Task 6.3) — currently use inline English strings
  for section titles ("Brand Identity", "Theme Colors", "Light",
  "Dark", "Logo", "Default Mode") and field labels. A mechanical
  follow-up can replace each literal with
  `t.appearance.customize.<key>`.
- Any future Task 7 / Task 9.x consumer (logo upload confirmation
  dialog, preset theme catalog, etc.) can use the same namespace.

### Downstream impact on existing consumers

- No existing consumer of `SettingsAppearanceTabLabels` needs changes:
  the new `customize` field is additive. The EN/AR exports already
  include the new block, so `dashboardSettingsAppearanceEn.customize`
  and `dashboardSettingsAppearanceAr.customize` are populated. Any
  code that reads `t.appearance.toolbarUndo` continues to work —
  backward-compatible.

## Quality Verification

### Per-file `sub-loop.ts --lifecycle codescene`

All 3 edited files pass all 6 stages:

```
✅ tsgo passed
✅ oxlint passed
✅ biome:check passed
✅ lint:type-aware passed
✅ check:duplicates passed
✅ codescene passed
```

Files verified:
1. `shared/locale/types/dashboard/settings/appearance.ts` — ✅ all 6 passed
2. `shared/locale/en/dashboard/settings/appearance.ts` — ✅ all 6 passed
3. `shared/locale/ar/dashboard/settings/appearance.ts` — ✅ all 6 passed

### Project-wide `bun tsgo`

Exit 0, 0 `error TS` lines (matches Phase 0.1 baseline of 0 errors;
no regression introduced by the 3 edited files).

## Decisions

- **Nested sub-namespace vs. top-level namespace.** Chose nested
  `customize: AppearanceCustomizeLabels` on `SettingsAppearanceTabLabels`
  because all consumers already use the appearance namespace, the
  customizer overlay is conceptually part of the appearance settings
  domain, and the 5.1-outcome already reserved `customize.*` inside
  this file. See "Design Adherence" above.

- **16 keys exactly as listed in `tasks.md`.** Did not add or remove
  any keys. The spec lists: `enterMode`, `exitMode`, `undo`, `redo`,
  `saveDraft`, `publish`, `resetDefaults`, `brandIdentity`, `colors`,
  `light`, `dark`, `logoUpload`, `defaultMode`, `published`, `draft`,
  `exportJson` — all 16 are present. Did NOT add: field-label keys
  (e.g. `siteNameLabel`, `siteTitleLabel`, `siteDescriptionLabel`,
  `primaryLabel`, `secondaryLabel`, `removeLogo`, `uploadLogo`,
  `logoAcceptHint`, `livePreviewHint`). Those remain as inline
  English in the Task 6.3 section components; if a future task needs
  them, they can be added to `AppearanceCustomizeLabels` or a sibling
  interface without breaking the existing 16.

- **AR translations are natural phrasing, not transliteration.** E.g.
  `colors: "ألوان النمط"` (literally "pattern colors" — natural Arabic
  for "theme colors"), `light: "فاتح"` / `dark: "داكن"` (the standard
  Arabic light/dark pair used throughout the codebase, matching the
  MUI theme Arabic translations).

- **Did NOT replace inline English in Tasks 6.2 / 6.3 components.**
  Task 9's scope per `tasks.md` is "Add customizer labels to settings
  locale namespace" — i.e. add the keys. The mechanical replacement
  of inline literals with `t.appearance.customize.<key>` calls in
  `CustomizeToolbar.tsx` + `CustomizeSidebar.tsx` + 4 section files
  is a separate follow-up (could be done in a Task 9.x or a refactor
  sweep). Leaving them inline doesn't break anything — the keys exist
  and are typed, ready to consume.

## Carry-Forward / Deferred

- **Replace inline English in Tasks 6.2 / 6.3 components with
  `t.appearance.customize.<key>` calls.** Mechanical change across 6
  files (`CustomizeToolbar.tsx`, `CustomizeSidebar.tsx`,
  `BrandIdentitySection.tsx`, `LogoUploadSection.tsx`,
  `ColorEditorSection.tsx`, `DefaultModeSection.tsx`). Each component
  already calls `useAppTranslation(Translation.Dashboard.Settings).appearance`
  (or can be wired to) — the only change per literal is `"Brand
  Identity"` → `t.customize.brandIdentity`.

- **Add field-label keys (siteNameLabel, primaryLabel, etc.) if the
  follow-up sweep reveals they're needed.** The current 16 keys cover
  section titles + toolbar actions + status badges; they do NOT cover
  individual field labels like "Site Name", "Site Title", "Site
  Description", "Primary", "Secondary", "Upload logo", "PNG/SVG · max
  2MB", "Remove", "Changes preview live as you edit". If the sweep
  needs these, add them to `AppearanceCustomizeLabels` or a sibling
  `AppearanceCustomizeFieldLabels` interface.

- **Deprecate redundant `toolbar*` fields on
  `SettingsAppearanceTabLabels` after Tasks 6.2 components migrate.**
  Once `CustomizeToolbar.tsx` switches from `t.toolbarUndo` /
  `t.toolbarRedo` / `t.toolbarExit` / `t.toolbarPublish` /
  `t.toolbarBadge` / `t.toolbarLivePreviewHint` to
  `t.customize.<key>` equivalents, the `toolbar*` fields become dead
  code. A follow-up sweep can remove them and reduce the interface
  surface. (Note: `toolbarLivePreviewHint` and `toolbarBadge` don't
  have direct `customize.*` equivalents — they'd need new keys or
  stay as-is.)

## Files Touched

| Path | Action | Lines |
|---|---|---|
| `shared/locale/types/dashboard/settings/appearance.ts` | Edited | 66 → 121 (+55) |
| `shared/locale/en/dashboard/settings/appearance.ts` | Edited | 43 → 61 (+18) |
| `shared/locale/ar/dashboard/settings/appearance.ts` | Edited | 43 → 61 (+18) |

## Issues / Open Questions

- **No issues.** All 3 files pass all 6 codescene-lifecycle checks.
  Project-wide `bun tsgo` reports 0 errors. The 16 keys are typed,
  implemented in EN + AR, and ready for consumption by Tasks 6.2 / 6.3
  / 7 components.

- **Open question (carry-forward)**: should the `toolbar*` fields
  added in Task 6.2 be merged into `customize.*` now, or left as-is
  until the component migration sweep? Left as-is to keep Task 9's
  diff minimal and avoid touching `CustomizeToolbar.tsx` (which would
  re-trigger the codescene lifecycle on a file outside this task's
  stated scope).

## Next Actions

- **Phase 9 follow-up (mechanical sweep)**: replace inline English
  literals in `CustomizeToolbar.tsx`, `CustomizeSidebar.tsx`, and the
  4 section files with `t.appearance.customize.<key>` calls. Each
  literal becomes a one-line edit; no schema changes needed.
- **Task 9.1+**: JSON Schema & IDE Integration, ENV Hydration & Tiered
  Caching, "Export JSON" feature (consumes `customize.exportJson`),
  Built-in Preset Themes Catalog.
