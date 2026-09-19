# Round 2 Audit — i18n Completeness + RTL + a11y Depth

## Summary

**Overall Assessment**: The v6 design is exceptionally detailed and production-ready for the structural/UI/UX layer, but contains **critical i18n completeness gaps** (the `common` namespace does NOT contain `confirm`/`delete`/`close` as claimed), **missing RTL coverage** for the editor and merge-tag picker, and **significant a11y depth gaps** beyond the §J checklist — particularly focus management, keyboard shortcut conflict matrix, aria-labels on icon buttons, landmark roles, and prefers-contrast coverage. The design needs targeted v7 edits before implementation begins.

---

## i18n Completeness Audit (Part 1)

### Missing keys (every user-facing string in §A-O without a catalogue entry)

| Design Location | User-Facing String | i18n Key Needed | Present in Catalogue? |
|---------------|-------------------|-----------------|----------------------|
| §A Line 833 | "Email Templates / {template.displayName}" | `dashboard.emailTemplates.pageTitle` (breadcrumbs) | ✅ `pageTitle` + `pageSubtitle` exist, but **no breadcrumb-specific keys** |
| §A Line 834 | "back" (breadcrumb back link) | `common.back` or `dashboard.emailTemplates.breadcrumbBack` | ❌ **MISSING** |
| §B Line 846 | "Create" button label | `dashboard.emailTemplates.action.create` | ✅ Present |
| §B Line 856 | "Retry" (ErrorState) | Reuse `common.retry` | ✅ `common.retry` exists |
| §B Line 856 | "Retry" button | `common.retry` | ✅ |
| §C Line 870 | "Edit" menu item | `dashboard.emailTemplates.action.edit` | ✅ Present |
| §C Line 871 | "Preview" menu item | `dashboard.emailTemplates.action.preview` | ✅ Present |
| §C Line 872 | "Duplicate" menu item | `dashboard.emailTemplates.action.duplicate` | ✅ Present |
| §C Line 874 | "Archive" menu item | `dashboard.emailTemplates.action.archive` | ✅ Present |
| §C Line 875 | "Restore" menu item | `dashboard.emailTemplates.action.restore` | ✅ Present |
| §C Line 877 | Search placeholder | `dashboard.emailTemplates.filter.searchPlaceholder` | ✅ Present |
| §C Line 880-883 | Filter labels: Scope, Status, Locale, View | `filterByScope`, `filterByStatus`, `filterByLocale`, `viewActive`, `viewArchived`, `viewAll` | ✅ All present |
| §C Line 884 | "Clear filters" | `dashboard.emailTemplates.filter.clearFilters` | ✅ Present |
| §C Line 889 | Toast messages on action | `toast.saved`, `toast.published`, `toast.archived`, `toast.restored`, `toast.deleted` | ✅ Present |
| §D Line 905 | Scope lock tooltip | `dashboard.emailTemplates.scopeTooltip` | ✅ Present |
| §D Line 909 | Subject placeholder: "Order {{orderNumber}} confirmed" | `dashboard.emailTemplates.helpText.defaultSubject` | ✅ Present, **but interpolation placeholder not reflected in key shape** |
| §D Line 914 | Merge-tag picker items (scope Props) | **No keys for variable names** — variable names are code, not user strings | N/A |
| §D Line 916-920 | Save Draft, Publish, Send Test, Discard | `action.saveDraft`, `action.publish`, `action.sendTest`, `action.discard` | ✅ Present |
| §D Line 918 | Publish confirmation body: "Publishing will archive the currently published version for {scope}/{locale}. Continue?" | **MISSING** `dialog.publishConfirmBody(scope, locale)` | ❌ **MISSING** (only `publishConfirmTitle(name)` exists) |
| §D Line 921 | Archive/Restore confirm dialog bodies | `dialog.archiveConfirmBody`, `dialog.restoreConfirmBody` | ❌ **MISSING** (only titles exist) |
| §D Line 922 | History drawer: "Restore" button | `action.restore` (already in action) | ✅ Present |
| §D Line 922 | History empty state | `emptyRevisions`, `emptyRevisionsHelp` | ✅ Present |
| §D Line 924 | beforeunload prompt | `dialog.beforeUnloadPrompt` | ✅ Present |
| §D Line 925 | In-app nav discard dialog | `dialog.unsavedChangesTitle`, `dialog.unsavedChangesBody` | ✅ Present |
| §E Line 938 | Variable preview autocomplete label | **No specific key** — uses sample props JSON | N/A |
| §E Line 939 | Viewport selector labels: Desktop/Tablet/Mobile | **MISSING** `preview.viewportDesktop`, `preview.viewportTablet`, `preview.viewportMobile` | ❌ **MISSING** |
| §E Line 940 | "Copy HTML" button | `action.copyHtml` | ✅ Present |
| §E Line 940 | Toast: copy success | `toast.copyHtmlCopied()` | ✅ Present |
| §E Line 941 | "Open in new tab" (disabled) tooltip | `dashboard.emailTemplates.previewTooltip` | ✅ Present |
| §F Line 946 | "To:" input label | `sendTest.recipientLabel` | ✅ Present |
| §F Line 946 | "To:" placeholder | `sendTest.recipientPlaceholder` | ✅ Present |
| §F Line 947 | Sample props label | `sendTest.sampleProps` | ✅ Present |
| §F Line 948 | Rate-limit notice | `toast.rateLimited(limit)` | ✅ Present |
| §F Line 949 | "Send to my own email" (Phase 2) | **MISSING** `sendTest.sendToOwnEmail` | ❌ **MISSING** (Phase 2) |
| §F Line 950 | Submit button label | `sendTest.submit` | ✅ Present |
| §F Line 950 | Success toast: "Test sent to {to}" | `toast.testSent(to)` | ✅ Present |
| §F Line 951 | Close discard sample props dialog | `dialog.unsavedChangesTitle/Body` (reuse) | ✅ Present |
| §G Line 958 | SuccessCheckMark — no text | N/A | N/A |
| §H Line 994 | Form helper text on error | Uses `FormHelperText` with validation message | Requires per-field error keys — **MISSING** |
| §I Line 1002 | Status colors (no text) | N/A | N/A |
| §J Line 1007 | Generic aria-labels on interactive elements | `common.cancel`, `common.save` (only 2 exist) | ⚠️ **INCOMPLETE** |
| §N Line 1082 | StatusBadge labels | `status.draft`, `status.published`, `status.archived` | ✅ Present |
| §O Line 1089 | Feature disabled tooltip | `featureDisabledTooltip` | ✅ Present |
| §O Line 1090 | Disabled action tooltip | `featureDisabledTooltip` (reuse) | ✅ Present |

### Missing keys summary (must-add before implementation)

| Missing Key | Context | Type |
|-------------|---------|------|
| `dialog.publishConfirmBody(scope: string, locale: string)` | Publish confirmation dialog body | Interpolation function |
| `dialog.archiveConfirmBody(scope: string, locale: string)` | Archive confirmation dialog body | Interpolation function |
| `dialog.restoreConfirmBody(version: number)` | Restore confirmation dialog body | Interpolation function |
| `dialog.breadcrumbBack` or `common.back` | Breadcrumb back link | String |
| `preview.viewportDesktop`, `preview.viewportTablet`, `preview.viewportMobile` | Preview tab viewport selector | String |
| `sendTest.sendToOwnEmail` | Phase 2 quick button | String |
| Per-field error keys: `error.displayNameRequired`, `error.slugInvalid`, `error.slugTaken`, `error.invalidEmail`, `error.subjectRequired`, `error.allowedEditorGroupsRequired`, `error.attachmentRuleInvalid` | Form validation | String (or interpolated) |

### Pluralization gaps

The catalogue correctly uses the `(count: number) => string` pattern for:
- `toast.saved: () => string` — **NOT pluralized** (always singular action)
- `toast.testSent: (to: string) => string` — correct (interpolation, not plural)
- `toast.rateLimited: (limit: number) => string` — **SHOULD be pluralized** ("5 emails per minute" vs "1 email per minute")
- `column.allowedEditorGroups` — no pluralization needed
- `emptyState` — no count

**Gap**: `toast.rateLimited(limit: number)` receives a number but returns a bare string. It **should** be pluralized: `(limit: number) => string` where the function handles singular/plural. Currently the design shows it as a function but no pluralization logic is defined.

### Interpolation placeholders missing

| Key | Current Shape | Required Shape | Missing Placeholders |
|-----|--------------|----------------|---------------------|
| `dialog.publishConfirmTitle(name)` | ✅ `(name: string) => string` | ✅ OK | — |
| `dialog.editTitle(name)` | ✅ `(name: string) => string` | ✅ OK | — |
| `dialog.publishConfirmBody` | **MISSING** | `(scope: string, locale: string) => string` | scope, locale |
| `dialog.archiveConfirmBody` | **MISSING** | `(scope: string, locale: string) => string` | scope, locale |
| `dialog.restoreConfirmBody` | **MISSING** | `(version: number) => string` | version |
| `toast.testSent(to)` | ✅ `(to: string) => string` | ✅ OK | — |
| `toast.rateLimited(limit)` | ✅ `(limit: number) => string` | **Needs pluralization inside** | limit (and implicit count) |
| `error.versionMismatch(expected, got)` | ✅ `(expected: number, got: number) => string` | ✅ OK | — |
| `helpText.defaultSubject` | string | **Should be function with example** | `example: string` (e.g., "Order {{orderNumber}} confirmed") |

### Namespace boundaries (common vs dashboard.emailTemplates)

**CRITICAL FINDING**: The design §B Line 1174 states:
> **Misc reusable** — `loading`, `cancel`, `save`, `confirm`, `delete`, `close` — **reuse `common` namespace** (`shared/locale/en/common/index.ts:29-33`). DO NOT duplicate these in `dashboard.emailTemplates`.

**This is INCORRECT**. The actual `common` namespace only contains:
- `loading` ✅
- `cancel` ✅  
- `save` ✅
- `confirm` ❌ **NOT IN COMMON**
- `delete` ❌ **NOT IN COMMON**
- `close` ❌ **NOT IN COMMON**

Every existing dashboard domain (billing, permissions, classes, etc.) defines its own `confirm`, `delete`, `close` in its domain namespace. The pattern is **domain-scoped confirmation/dialog labels**, not shared `common`.

**Required fix for v7**:
1. Remove `confirm`, `delete`, `close` from the "reuse from common" list in §B
2. Add `confirm`, `delete`, `close` (or `dialog.confirm`, `dialog.delete`, `dialog.close`) to `dashboard.emailTemplates` catalogue explicitly
3. Update the lockstep rule §B to include these 3 keys in the atomic changeset

### Section-specific namespace references

The design correctly uses `dashboard.emailTemplates` prefix for most keys. However:
- §B Line 1134: `dashboard.emailTemplates.navLabel` → should be in `DashboardNavigationLabels` in `core/nav.ts` (correctly noted)
- §C Line 877: search placeholder → `dashboard.emailTemplates.filter.searchPlaceholder` (correct)
- §D Line 909: subject help text → `dashboard.emailTemplates.helpText.defaultSubject` (correct)

All section references appear correct **except** the missing keys identified above.

---

## RTL Handling (Part 2)

### Editor / dnd-kit behavior

| Element | v6 Status | RTL Reality | Gap |
|---------|-----------|-------------|-----|
| `@react-email/editor` (TipTap) | Not mentioned | **No native RTL support** in `@react-email/editor` v1.4.x. TipTap supports RTL via `direction: "rtl"` on the editor element, but the editor chrome (bubble menu, slash commands) uses CSS `direction` — must wrap `<EmailEditor>` in a `<div dir="rtl">` or set `style={{ direction: "rtl" }}`. **Not documented in v6.** | **CRITICAL MISSING** |
| `dnd-kit` drag direction | Not mentioned | `dnd-kit/core` **auto-detects** `document.dir` and flips `Direction.Forward/Backward` for horizontal sorting. Works correctly if page `dir="rtl"` on `<html>` or parent. **Not documented in v6.** | **MISSING — should confirm auto-flip** |
| `dnd-kit` `SortableItem` / `SortableList` | New helpers in `frontend/common/components/ui/dnd/` | Must ensure custom wrappers pass `direction` context or rely on document dir | **UNDOCUMENTED** |

### Drawer/Inspector direction

| Element | v6 Definition | RTL Behavior Required | Gap |
|---------|---------|----------------------|-----|
| Inspector panel (desktop) | Right-docked fixed 360px | Must become **left-docked** in RTL | **NOT MENTIONED** |
| Inspector drawer (mobile) | Bottom-anchored | Bottom-anchored is fine (vertical) | OK |
| History drawer | Right-anchored | Must become **left-anchored** in RTL | **NOT MENTIONED** |
| Send Test Dialog | Center Dialog | Dialog is centered — OK | OK |

The repo has `rtlFlipIconSx` helper (`frontend/common/utils/rtlFlipIconSx.ts`) that flips icons based on `theme.direction === "rtl"`. This pattern must be applied to:
- Inspector toggle button (`TuneOutlined`)
- History drawer trigger (`History`)
- Any chevron/arrow icons in the editor toolbar

### Toast position

| Element | v6 Definition | RTL Behavior Required | Gap |
|---------|---------|----------------------|-----|
| `@toolpad/core/useNotifications` Snackbar | Not mentioned | MUI `Snackbar` respects `anchorOrigin` — default is `vertical: "top", horizontal: "right"`. In RTL, should be `horizontal: "left"`. **No auto-flip in MUI Snackbar.** | **MISSING — must configure per locale** |

### Other direction-sensitive elements

| Element | RTL Concern | v6 Coverage |
|---------|------------|-------------|
| Merge-tag picker (VariableMentionPicker) | Autocomplete dropdown position, icon flip | ❌ Not mentioned |
| Preview iframe viewport selector | ToggleButtonGroup — auto-flips in MUI | ✅ MUI handles |
| DataGrid column order | Column 1 (Status) leftmost in LTR → should be rightmost in RTL | MUI DataGrid handles via `direction` prop |
| Pagination controls | Next/Previous button icons | Must use `rtlFlipIconSx` |
| Breadcrumbs | Separator direction, order | MUI Breadcrumbs handles via `direction` |
| `beforeunload` dialog | Browser native — **not i18n-able, not RTL-controllable** | ✅ Correctly noted in v6 |

---

## a11y Depth (Part 3)

### Focus management gap list

| Scenario | Current v6 Definition | Required Behavior | Gap |
|----------|----------------|-------------------|-----|
| Editor page loads | Not defined | Focus first focusable element in editor viewport (or Save Draft button in Inspector) | **MISSING** |
| Inspector drawer opens (mobile) | Not defined | Focus first focusable element in drawer (Scope autocomplete) | **MISSING** |
| History drawer opens | Not defined | Focus close button or first version row | **MISSING** |
| Send Test Dialog opens | Not defined | Focus "To:" email input | **MISSING** |
| Publish confirmation dialog opens | Not defined | Focus "Cancel" button (safe default) | **MISSING** |
| Archive/Restore confirmation dialog opens | Not defined | Focus "Cancel" button | **MISSING** |
| Unsaved changes dialog (in-app nav) | Not defined | Focus "Discard" or "Cancel" | **MISSING** |
| Tab switch (Design/Preview/Code) | Not defined | Focus tab panel or first focusable in new tab | **MISSING** |
| Toast appears | Not defined | **Do NOT steal focus** — MUI Snackbar default is correct | ✅ OK if using useNotifications |
| After Save Draft success | Not defined | Return focus to editor viewport (or keep in Inspector) | **MISSING** |
| After Publish success | Not defined | Return focus to editor viewport | **MISSING** |
| After Send Test success + dialog close | Not defined | Return focus to Send Test button | **MISSING** |

### Screen-reader announcement gap list

| Event | v6 Definition | Required Announcement | Gap |
|-------|---------|----------------------|-----|
| Save Draft succeeds | Toast via `useNotifications` | `aria-live="polite"` — ✅ MUI Snackbar default | ✅ Covered |
| Publish succeeds | Toast + SuccessCheckMark | `aria-live="polite"` — ✅ | ✅ Covered |
| Archive succeeds | Toast | `aria-live="polite"` — ✅ | ✅ Covered |
| Send Test succeeds | Toast | `aria-live="polite"` — ✅ | ✅ Covered |
| Validation error on submit | `FormHelperText error` + red border | **Must also announce** — MUI TextField does NOT auto-announce helper text | **MISSING — needs `aria-live="assertive"` toast or `aria-describedby`** |
| Mutation error (permission, network) | `FormErrorSnackbar` | `aria-live="assertive"` — MUI Snackbar default for `severity="error"` | ✅ Likely covered |
| Rate limited (Send Test) | Inline error in dialog | **Not announced** — needs `aria-live="assertive"` region | **MISSING** |
| Filter applied (list updates) | Not defined | Should announce "Results filtered, X items shown" | **MISSING** |
| Sort changed | Not defined | Should announce sort direction | **MISSING** |

### aria-label gap list (icon-only buttons)

| Button Location | Icon | Required aria-label (i18n key) | v6 Definition | Gap |
|----------------|------|-------------------------------|---------|-----|
| List page: back breadcrumb link | `ArrowBack` | `common.back` or `dashboard.emailTemplates.breadcrumbBack` | ❌ Not mentioned | **MISSING** |
| List page: search input adornment | `SearchOutlined` | `dashboard.emailTemplates.filter.searchPlaceholder` (placeholder doubles as label) | ✅ Implicit | OK |
| List page: filter chips clear | `CancelOutlined` | `dashboard.emailTemplates.filter.clearFilters` | ❌ Not mentioned | **MISSING** |
| List page: active filter count badge | N/A | N/A | N/A | OK |
| List page: row actions menu trigger | `MoreVert` | `dashboard.emailTemplates.action.rowActions` | ❌ Not mentioned | **MISSING** |
| Editor desktop: Inspector toggle (History) | `History` | `dashboard.emailTemplates.action.revisions` | ❌ Not mentioned | **MISSING** |
| Editor desktop: Inspector toggle (mobile Tune) | `TuneOutlined` | `dashboard.emailTemplates.inspectorToggle` | ❌ Not mentioned | **MISSING** |
| Editor: Save Draft button | None (has text) | N/A | N/A | OK |
| Editor: Publish button | None (has text) | N/A | N/A | OK |
| Editor: Send Test button | `SendOutlined` | `dashboard.emailTemplates.action.sendTest` | ✅ Has text + icon | OK if text present |
| Editor: Discard button | None (text) | N/A | N/A | OK |
| Inspector: Scope autocomplete clear | `ClearOutlined` | `common.clear` (not in common) or domain | ❌ Not mentioned | **MISSING** |
| Inspector: Attachment rule delete | `DeleteOutlined` | `dashboard.emailTemplates.action.delete` | ❌ Not mentioned | **MISSING** |
| Inspector: Merge-tag picker trigger | `EmailOutlined` | `dashboard.emailTemplates.editor.copyHtml` (wrong) or new `mergeTagPicker` | ❌ Not mentioned | **MISSING** |
| Preview tab: Copy HTML | `ContentCopyOutlined` | `dashboard.emailTemplates.action.copyHtml` | ✅ Has text + icon | OK |
| Preview tab: Viewport selector | None (ToggleButtonGroup) | N/A | N/A | OK |
| Send Test dialog: close (X) | `CloseOutlined` | `common.close` (NOT in common) or `dialog.close` | ❌ Not mentioned | **MISSING** |
| Send Test dialog: "Send to my own email" | None (text) | N/A | N/A | OK |
| History drawer: close (X) | `CloseOutlined` | `dialog.close` | ❌ Not mentioned | **MISSING** |
| History drawer: refresh | `RefreshOutlined` | `dashboard.emailTemplates.action.refresh` | ❌ Not mentioned | **MISSING** |
| History drawer: restore button per row | None (text) | N/A | N/A | OK |

**Total icon-only buttons missing aria-label: 11+**

### Keyboard shortcuts conflict matrix

| Shortcut | Action | Browser Default | Conflict? | Resolution in v6 | Gap |
|----------|--------|----------------|-----------|------------------|-----|
| `Ctrl/Cmd+S` | Save Draft | **Save Page** (browser) | **YES** | `preventDefault()` + dispatch submit | ✅ Documented, but **must verify preventDefault works in editor context** |
| `Ctrl/Cmd+Enter` | Publish | **Submit form** (sometimes) | Medium | `preventDefault()` + confirm dialog | ⚠️ May conflict in textarea |
| `ESC` | Close Drawer/Dialog | Close browser dialogs | **YES** | MUI default handles | ✅ OK |
| `Tab` | Navigate editor toolbar | Browser default | No | Editor must be in tab order | ✅ OK if focusable |
| `Arrow keys` | Navigate DataGrid | Browser default | No | DataGrid handles | ✅ OK |
| `/` (search focus) | Focus search | Browser find-in-page | **YES** | Not documented | **MISSING — should NOT use /** |

**Missing from v6**:
- No tooltip hints showing shortcuts (e.g., `title="Save Draft (Ctrl+S)"`)
- No shortcut conflict matrix documented
- No `aria-keyshortcuts` attribute on buttons

### Landmark roles

| Page Area | Semantic Element | Current v6 Definition | Required | Gap |
|-----------|------------------|-----------------|----------|-----|
| List page main content | `<main>` | Not defined | Yes — wrap DataGrid | **MISSING** |
| List page header/navigation | `<header>` / `<nav>` | `PageHeader` component | `<nav>` for breadcrumbs | **MISSING** |
| Editor page main content | `<main>` | Not defined | Yes — wrap editor viewport | **MISSING** |
| Inspector panel (desktop) | `<aside role="complementary">` | `SectionPanel` in CSS Grid | `role="complementary"` or `<aside>` | **MISSING** |
| History drawer | `<aside role="complementary">` | `<Drawer>` | `role="complementary"` on Drawer | **MISSING** |
| Send Test Dialog | `role="dialog"` | MUI `<Dialog>` | MUI provides | ✅ OK |
| Preview tab iframe | `<iframe title="...">` | `title={t("previewTab")}` | ✅ Defined | OK |

The repo's `PageContainer` / `PageHeader` components may already include landmarks — need to verify. v6 does not explicitly require them.

### Color contrast cases

| Element | Colors (per §I) | WCAG AA Requirement | Risk |
|---------|----------------|--------------------|------|
| Inspector panel header | Not defined (may be subtle on dark) | 4.5:1 text / 3:1 large | **HIGH — must verify** |
| StatusBadge Draft | `warning.main` on `background.paper` | 4.5:1 | Need to verify MUI warning contrast |
| StatusBadge Published | `success.main` on `background.paper` | 4.5:1 | Need to verify MUI success contrast |
| StatusBadge Archived | `action.disabled` / `text.disabled` on `background.paper` | 4.5:1 | `action.disabled` is `rgba(0,0,0,0.26)` — **LIKELY FAILS** on light mode |
| Lock icon (feature flag) | `disabled` color on `background.paper` | 3:1 (non-text) | `action.disabled` — verify |
| Chip labels (Active/Published/Archived in list) | Same as StatusBadge | 4.5:1 | Same risk |
| Editor toolbar buttons | `text.secondary` on `background.paper` | 4.5:1 | Usually OK |
| Merge-tag picker items | `text.primary` on `background.paper` | 4.5:1 | OK |
| Toast messages | `onSurface` on `surfaceContainerHigh` | 4.5:1 | MUI default — OK |

**Specific risk**: `action.disabled` / `text.disabled` used for Archived status. In light mode: `rgba(0,0,0,0.26)` on white = ~2.3:1 — **FAILS WCAG AA**. Must use `warning.light` or a dedicated token for Archived that meets contrast.

### prefers-contrast coverage

| Media Query | v6 Coverage | Required Action |
|-------------|-------------|-----------------|
| `prefers-reduced-motion: reduce` | ✅ `usePrefersReducedMotion()` hook + guard all custom animations | Complete |
| `prefers-contrast: more` | ❌ **NOT MENTIONED** | Add `usePrefersContrast()` hook; increase border widths, ensure 7:1 contrast for text, 4.5:1 for large text |
| `prefers-contrast: less` | ❌ Not mentioned | Rarely needed, but consider |
| `forced-colors: active` (Windows High Contrast) | ❌ Not mentioned | Ensure `currentColor` / `CanvasText` / `Highlight` work; avoid hardcoded colors |

The `THEME_PALETTE.md` uses MUI's palette system which should adapt, but v6 does not document any `prefers-contrast` handling.

### Form field label-input pairing

| Field | Component | Pairing Method | v6 Definition | Gap |
|-------|-----------|----------------|---------|-----|
| displayName | `TextField` / `OutlinedInput` | MUI `FormControl` + `InputLabel` + `htmlFor`/`id` | Not explicitly stated | **MISSING — must mandate** |
| slug | `TextField` | Same | Not explicit | **MISSING** |
| defaultFromEmail | `TextField` | Same | Not explicit | **MISSING** |
| defaultSubject | `TextField` | Same | Not explicit | **MISSING** |
| allowedEditorGroups | `TagInput` (custom) | **TagInput uses `InputBase` internally — no `FormControl`/`InputLabel`** | Not explicit | **CRITICAL — TagInput is NOT accessible by default** |
| attachmentRules pattern | `TextField` in ListItem | Same | Not explicit | **MISSING** |
| attachmentRules maxSize | `TextField` type="number" | Same | Not explicit | **MISSING** |
| Send Test: recipient | `OutlinedInput` | Same | Not explicit | **MISSING** |
| Send Test: sampleProps | `TextareaAutosize` | Same | Not explicit | **MISSING** |

**CRITICAL**: The repo's `TagInput` (`frontend/common/components/ui/input/tagInput/TagInput.tsx`) wraps `InputBase` directly — **it does NOT use `FormControl`/`InputLabel`**. This means:
- No programmatic label association
- Screen readers won't announce the label
- Must wrap TagInput in `FormControl` with `InputLabel` in the consuming component, OR refactor TagInput to accept `label` and `id` props and render `FormControl` internally.

### Error announcement

| Scenario | v6 Definition | Mechanism | Gap |
|----------|---------|-----------|-----|
| Validation error on field | `FormHelperText error` + red border | Visual only | **MISSING aria-live** |
| Form submit with errors | Focus first errored field | `focus()` in code | ✅ Documented |
| Mutation error (save/publish/archive/sendTest) | `FormErrorSnackbar` | MUI Snackbar `severity="error"` | ✅ Likely `aria-live="assertive"` |
| Rate limit in Send Test dialog | Inline error text | Visual only | **MISSING aria-live="assertive"** |

### Skip-to-content link

| Page | v6 Definition | Required | Gap |
|------|---------|----------|-----|
| List page (`/email-templates`) | Not mentioned | "Skip to template list" link at top | **MISSING** |
| Editor page (`/email-templates/[id]`) | Not mentioned | "Skip to editor" link at top | **MISSING** |

The repo may have a global skip link in `app/[locale]/layout.tsx` — need to verify. v6 does not mention page-specific skip links.

---

## Critical Gaps

1. **common namespace missing `confirm`, `delete`, `close`** — Design claims these exist in `common`; they do NOT. Every domain defines its own. Must add to `dashboard.emailTemplates` catalogue.

2. **Missing dialog body interpolation keys**: `publishConfirmBody(scope, locale)`, `archiveConfirmBody(scope, locale)`, `restoreConfirmBody(version)`. Only titles exist.

3. **`@react-email/editor` RTL support undocumented** — TipTap requires explicit `dir="rtl"` on editor wrapper. Not mentioned in v6.

4. **TagInput accessibility** — Custom TagInput component does not use `FormControl`/`InputLabel`. Must be fixed in component or wrapped correctly in Inspector.

5. **11+ icon-only buttons missing `aria-label`** with i18n keys — including Inspector toggle, History drawer trigger, row actions menu, attachment delete, merge-tag picker, dialog close buttons.

6. **Archived status color contrast** — `action.disabled` / `text.disabled` fails WCAG AA (2.3:1 on light). Must use different token.

7. **No `prefers-contrast: more` handling** — Design covers reduced-motion but not high-contrast mode.

8. **No skip-to-content links** on list/editor pages.

9. **No focus management definition** for any dialog/drawer/tab transition.

10. **Keyboard shortcut `Ctrl+S` conflict** — Must verify `preventDefault()` works inside TipTap editor (which may capture keystrokes).

---

## High-Priority Gaps

1. **Missing form field error i18n keys** — Per-field validation messages need catalogue entries.

2. **Missing preview viewport selector labels** — `preview.viewportDesktop/Tablet/Mobile`.

3. **Toast position in RTL** — `useNotifications` Snackbar doesn't auto-flip; must configure `anchorOrigin` based on `theme.direction`.

4. **Merge-tag picker RTL behavior** — Autocomplete dropdown position, icon flip.

5. **Inspector/History drawer RTL docking** — Must define left-docked in RTL.

6. **Breadcrumb back link label** — `common.back` or domain key needed.

7. **Send Test "Send to my own email" (Phase 2)** — Missing key.

8. **`toast.rateLimited` pluralization** — Function receives number but no plural logic defined.

9. **Subject template interpolation placeholder** — `helpText.defaultSubject` should document the `{{fieldName}}` syntax.

---

## Medium-Priority Gaps

1. **Landmark roles** — Explicit `<main>`, `<aside role="complementary">`, `<nav>` for breadcrumbs.

2. **Screen-reader announcements for filter/sort changes** — Live region for "X results filtered".

3. **Validation error announcement** — `aria-live="assertive"` toast or `aria-describedby` on fields.

4. **Rate limit inline error announcement** — `aria-live="assertive"` in Send Test dialog.

5. **Shortcut hints in tooltips** — `title="Save Draft (Ctrl+S)"` or Tooltip component.

6. **`aria-keyshortcuts` attribute** on Save Draft / Publish buttons.

7. **Focus restoration** after dialog close / action success.

8. **TagInput accessibility fix** — Either refactor component or document wrapper pattern.

---

## Low-Priority Gaps / Nice-to-haves

1. **`prefers-contrast: less` handling** — Rarely needed.

2. **Windows High Contrast (`forced-colors`)** support — Ensure no hardcoded colors break.

3. **Global skip link** — May already exist in layout; verify.


---

## Verified Items

| Item | Status | Evidence |
|------|--------|----------|
| Compile-time TS i18n system | ✅ Verified | `shared/AGENTS.md` lines 72-251 |
| `dashboard.emailTemplates` namespace catalogue | ✅ Complete (except gaps above) | Design lines 1129-1187 |
| Lockstep rule (en + ar atomic) | ✅ Documented | Design lines 1117, 1176 |
| `emails.errors` sub-namespace | ✅ Defined | Design lines 1105-1116 |
| `common` namespace contents | ✅ Verified | `shared/locale/en/common/index.ts` — only `cancel`, `save` |
| Domain-specific confirm/delete/close pattern | ✅ Verified | `shared/locale/en/dashboard/billing/main.ts` has `deleteInvoiceDialog.confirm`, `close` |
| `rtlFlipIconSx` helper exists | ✅ Verified | `frontend/common/utils/rtlFlipIconSx.ts` |
| MUI `Snackbar` `aria-live` default | ✅ Verified | MUI source — `role="alert"` for error, `role="status"` for success |
| `usePrefersReducedMotion` hook definition | ✅ In design | Design lines 964-981 |
| `ScopedCssBaseline` for editor | ✅ In design | Design lines 820, 927 |
| `EmailTheming` from `/plugins` | ✅ In design | Design lines 823, 928 |
| `dnd-kit` installed but unused | ✅ Verified | Design line 955; `package.json` |
| `StatusBadge` extension pattern | ✅ Verified | `frontend/common/components/ui/badge/StatusBadge.tsx` |
| `EntityFormDialogActions` pattern | ✅ Verified | `frontend/common/views/dashboard/subjects/home/components/__shared__/EntityFormDialogActions.tsx` |
| `TagInput` component exists | ✅ Verified | `frontend/common/components/ui/input/tagInput/TagInput.tsx` |
| `PageContainer`/`PageHeader` exist | ✅ Referenced | Design line 844 |
| `useAppTranslation` usage pattern | ✅ Verified | Multiple dashboard views |
| `useNotifications` from `@toolpad/core` | ✅ Defined | Design line 889 |

---

## Codebase Precedents Referenced

| Precedent | Location | Relevance |
|-----------|----------|-----------|
| i18n system rules | `shared/AGENTS.md:72-251` | Compile-time TS, pluralization, interpolation, namespace registration |
| Common labels | `shared/locale/types/common/index.ts` | Only `cancel`, `save` — NOT `confirm`/`delete`/`close` |
| Billing domain labels | `shared/locale/types/dashboard/billing/main.ts` | Domain-specific `confirm`, `close`, `delete` pattern |
| RTL icon flip | `frontend/common/utils/rtlFlipIconSx.ts` | `theme.direction === "rtl"` pattern |
| StatusBadge categories | `frontend/common/components/ui/badge/StatusBadge.tsx` | Adding `emailTemplate` category |
| EntityFormDialogActions | `frontend/common/views/dashboard/subjects/home/components/__shared__/EntityFormDialogActions.tsx` | Reusable dialog actions with i18n labels |
| TagInput component | `frontend/common/components/ui/input/tagInput/TagInput.tsx` | Uses `InputBase` — NOT `FormControl`/`InputLabel` |
| Theme palette tokens | `frontend/THEME_PALETTE.md` | M3 `on<Color>` tokens, contrast rules |
| DeleteInvoiceDialog | `frontend/common/views/dashboard/admin/billing/components/DeleteInvoiceDialog.tsx` | Uses `BaseDeleteDialog` with domain `confirm`/`close` labels |
| `useAppTranslation` pattern | Various dashboard views | Client-side namespace loading |
| `useNotifications` pattern | Design line 889 | Toast with severity |
| `usePrefersReducedMotion` | Design lines 964-981 (NEW) | Closes production gap |

---

## Recommended v7 Design Edits

### 1. Fix i18n catalogue (§B lines 1129-1187)

**Add to `dashboard.emailTemplates` catalogue**:
```typescript
// Dialog bodies (MISSING - CRITICAL)
dialog: {
  // ... existing ...
  publishConfirmBody: (scope: string, locale: string) => string;
  archiveConfirmBody: (scope: string, locale: string) => string;
  restoreConfirmBody: (version: number) => string;
  close: string;  // NOT in common!
  confirm: string;  // NOT in common!
  delete: string;  // NOT in common!
  breadcrumbBack: string;  // or use common.back if added
}

// Toast pluralization fix
toast: {
  // ... existing ...
  rateLimited: (limit: number) => string;  // MUST implement plural logic inside
}

// Preview viewport selector (MISSING)
preview: {
  // ... existing ...
  viewportDesktop: string;
  viewportTablet: string;
  viewportMobile: string;
}

// Send Test (Phase 2)
sendTest: {
  // ... existing ...
  sendToOwnEmail: string;
}

// Form field errors (MISSING)
error: {
  // ... existing ...
  displayNameRequired: string;
  slugInvalid: string;
  slugTaken: string;
  invalidEmail: string;
  subjectRequired: string;
  allowedEditorGroupsRequired: string;
  attachmentRuleInvalid: string;
}

// Help text interpolation hint
helpText: {
  // ... existing ...
  defaultSubject: (example: string) => string;  // e.g. "Order {{orderNumber}} confirmed"
}
```

**Remove from "reuse common" list (line 1174)**: `confirm`, `delete`, `close` — they are NOT in common.

### 2. Add RTL subsection (after §G or new §P)

```markdown
#### P. RTL (Right-to-Left) Support

- **Editor (`@react-email/editor`)** — Wrap `<EmailEditor>` in `<div dir={isRtl ? "rtl" : "ltr"}>` or `style={{ direction: isRtl ? "rtl" : "ltr" }}`. TipTap respects the `dir` attribute for cursor movement, text alignment, and bubble menu positioning. Use `useRtl()` hook (MUI) or `theme.direction` to detect.
- **dnd-kit** — Auto-detects `document.dir`. The `SortableItem`/`SortableList` helpers in `frontend/common/components/ui/dnd/` must NOT override direction; rely on document-level `dir`.
- **Inspector panel (desktop)** — Right-docked in LTR (`anchor="right"`), **left-docked in RTL** (`anchor="left"`). Compute via `const anchor = isRtl ? "left" : "right"`.
- **History drawer** — Same as Inspector: `anchor={isRtl ? "left" : "right"}`.
- **Toast position** — `@toolpad/core/useNotifications` `Snackbar` anchorOrigin: `{ vertical: "top", horizontal: isRtl ? "left" : "right" }`. Pass dynamic anchorOrigin based on `theme.direction`.
- **Merge-tag picker** — Autocomplete popup position flips automatically in MUI. Trigger icon (`EmailOutlined`) must use `rtlFlipIconSx`.
- **Breadcrumbs** — MUI `Breadcrumbs` respects `direction` prop; pass `direction={theme.direction}`.
- **Pagination / DataGrid** — MUI handles column order and pagination button icons via `direction` prop.
- **Icons requiring flip** — All directional icons (`ArrowBack`, `ArrowForward`, `ChevronLeft`, `ChevronRight`, `NavigateNext`, `NavigateBefore`) must use `rtlFlipIconSx` or MUI's `RtlIcon` (MUI v9+). Affected: breadcrumb back, row actions menu, Inspector toggle, History drawer trigger, attachment delete, pagination next/prev.
- **beforeunload dialog** — Browser native; not RTL-controllable. No action needed.
```

### 3. Add a11y Deep Specification (new §S after §J)

```markdown
#### S. a11y Deep Specification (beyond §J checklist)

**S.1 Focus Management**
| Trigger | Focus Target | Implementation |
|---------|--------------|----------------|
| Editor page load | Save Draft button (Inspector) or first editor toolbar button | `useEffect` + `ref.current?.focus()` in editor ViewModel |
| Inspector drawer open (mobile) | Scope autocomplete input | `Drawer` `onOpen` callback + `autofocus` on first input |
| History drawer open | Close button (safe) or first version row | `Drawer` `onOpen` + `ref` to close button |
| Send Test Dialog open | "To:" email input | MUI `Dialog` `autoFocus` on first `TextField` |
| Publish/Archive/Restore confirm dialog open | "Cancel" button | `Dialog` `autoFocus` on secondary action |
| Unsaved changes dialog (in-app nav) | "Cancel" button | `Dialog` `autoFocus` on secondary action |
| Tab switch (Design/Preview/Code) | Tab panel (`role="tabpanel"`) or first focusable in new tab | `Tabs` `onChange` + `focus()` on panel |
| Toast appear | **Do not steal focus** | MUI Snackbar default — verify no `autoFocus` |
| Save Draft success | Return to editor viewport | `editorRef.current?.focus()` in mutation `onCompleted` |
| Publish success | Return to editor viewport | Same |
| Send Test success + dialog close | Send Test button | `onClose` callback + `sendTestButtonRef.current?.focus()` |

**S.2 Screen-Reader Announcements**
| Event | Method | `aria-live` |
|-------|--------|-------------|
| Save/Publish/Archive/SendTest success | `useNotifications.show(t("toast.xxx"), { severity: "success" })` | `polite` (MUI default for success) |
| Validation error on submit | `FormErrorSnackbar` with `severity="error"` | `assertive` (MUI default for error) |
| Mutation error (permission/network) | `FormErrorSnackbar` | `assertive` |
| Rate limit in Send Test dialog | Inline error + `aria-live="assertive"` region | `assertive` |
| Filter applied / sort changed | Dedicated `aria-live="polite"` region announcing "X templates shown" | `polite` |
| Version restored (History) | Toast + `aria-live="polite"` | `polite` |

**S.3 aria-label on Icon-Only Buttons (complete list)**
| Button | Icon | aria-label Key |
|--------|------|----------------|
| Breadcrumb back | `ArrowBack` | `dashboard.emailTemplates.breadcrumbBack` |
| Row actions menu trigger | `MoreVert` | `dashboard.emailTemplates.action.rowActions` |
| Inspector toggle (desktop History) | `History` | `dashboard.emailTemplates.action.revisions` |
| Inspector toggle (mobile Tune) | `TuneOutlined` | `dashboard.emailTemplates.inspectorToggle` |
| Attachment rule delete | `DeleteOutlined` | `dashboard.emailTemplates.action.delete` |
| Merge-tag picker trigger | `EmailOutlined` | `dashboard.emailTemplates.editor.mergeTagPicker` |
| Send Test dialog close | `CloseOutlined` | `dashboard.emailTemplates.dialog.close` |
| History drawer close | `CloseOutlined` | `dashboard.emailTemplates.dialog.close` |
| History drawer refresh | `RefreshOutlined` | `dashboard.emailTemplates.action.refresh` |
| Pagination previous | `NavigateBefore` | `common.previousPage` (or domain) |
| Pagination next | `NavigateNext` | `common.nextPage` (or domain) |
| Filter chips clear all | `CancelOutlined` | `dashboard.emailTemplates.filter.clearFilters` |

**S.4 Keyboard Shortcuts**
| Shortcut | Action | Conflict | Resolution | Tooltip Hint |
|----------|--------|----------|------------|--------------|
| `Ctrl/Cmd+S` | Save Draft | Browser Save Page | `e.preventDefault(); e.stopPropagation(); dispatch(saveDraft)` | `title={t("editor.saveDraftShortcut")}` → "Save Draft (Ctrl+S)" |
| `Ctrl/Cmd+Enter` | Publish | Form submit | `e.preventDefault(); openPublishConfirm()` | `title={t("editor.publishShortcut")}` → "Publish (Ctrl+Enter)" |
| `ESC` | Close drawer/dialog | Browser default | MUI handles | N/A |

Add `aria-keyshortcuts="Control+S"` to Save Draft button, `aria-keyshortcuts="Control+Enter"` to Publish button.

**S.5 Landmark Roles**
- List page: wrap DataGrid in `<main>`; breadcrumbs in `<nav aria-label="Breadcrumb">`
- Editor page: wrap editor viewport in `<main>`; Inspector in `<aside role="complementary" aria-label="Template Properties">`
- History drawer: `<Drawer role="complementary" aria-label="Version History">`
- Preview iframe: `title={t("editor.previewTab")}`

**S.6 Color Contrast Verification**
- **Archived status**: Replace `action.disabled`/`text.disabled` with dedicated token meeting 4.5:1 (e.g., `neutral[600]` on light, `neutral[400]` on dark)
- **Inspector panel header**: Verify text contrast ≥ 4.5:1 on both themes
- **Lock icon (feature flag)**: Verify 3:1 against background
- **All StatusBadge colors**: Verify Draft (warning), Published (success), Archived (new token) against `background.paper`

**S.7 prefers-contrast: more**
```typescript
// New hook: frontend/common/lib/use-prefers-contrast.ts
export function usePrefersContrast(): boolean {
  const [highContrast, setHighContrast] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-contrast: more)');
    setHighContrast(mq.matches);
    const handler = (e: MediaQueryListEvent) => setHighContrast(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  return highContrast;
}

// Usage: increase border widths, use `theme.palette.onSurface` for all text,
// ensure 7:1 contrast for body text, 4.5:1 for large text.
```

**S.8 Form Field Label-Input Pairing**
- **All native inputs** (`TextField`, `OutlinedInput`, `TextareaAutosize`): Wrap in `<FormControl>` with `<InputLabel htmlFor={id}>` + `Input` with `id={id}`.
- **TagInput**: **CRITICAL** — current implementation uses raw `InputBase`. Must either:
  a) Refactor `TagInput` to accept `label`, `id`, `error`, `helperText` and render `FormControl`/`InputLabel` internally, OR
  b) Wrap every `TagInput` usage in Inspector with `<FormControl><InputLabel>...</InputLabel><TagInput ... /></FormControl>` and pass `InputLabelProps={{ htmlFor: tagInputId }}` + `TagInput` must expose `inputRef` to set `id`.
- **Send Test dialog fields**: Same — `FormControl` + `InputLabel`.

**S.9 Skip-to-Content Links**
```tsx
// In EmailTemplatesListContainer.tsx and EmailTemplateEditorContainer.tsx (top of render)
<a href="#main-content" className="skip-link">
  {t("common.skipToContent")}  // or domain-specific
</a>
// Target: <main id="main-content">...</main>
// Style: visually hidden until :focus (standard pattern)
```
Add `common.skipToContent` to `CommonLabels` (currently missing) or use domain key.

**S.10 TagInput Accessibility Fix (Component Level)**
```tsx
// TagInput.tsx — add these props and render FormControl internally
interface TagInputProps {
  label: string;
  id: string;
  error?: boolean;
  helperText?: string;
  // ... existing
}
export function TagInput({ label, id, error, helperText, ... }: TagInputProps) {
  return (
    <FormControl error={error} component="div">
      <InputLabel htmlFor={id}>{label}</InputLabel>
      {/* existing TagContainer with InputBase id={id} */}
      {helperText && <FormHelperText id={`${id}-helper`}>{helperText}</FormHelperText>}
      {error && helperText && <FormHelperText error id={`${id}-error`}>{helperText}</FormHelperText>}
    </FormControl>
  );
}
```

---

*End of Round 2 Audit Report*
