
- The plan's `test: "todo"` addon-a11y config means violations are **non-blocking** (warnings only, no CI gate).
- AppDataGrid relies on MUI default DataGrid keyboard support (no custom arrow-key/Enter-to-edit spec in the plan).
- The plan has **no keyboard shortcuts defined** despite mentioning "keyboard shortcuts" — the v6 changelog promises Ctrl+S/Ctrl+P etc. but the spec body never lists them.
- `§G` is referenced but does not exist as a section (dangling cross-ref).
- Arabic plurals: existing repo pattern is raw count interpolation — no zero/one/two/few/many/other rules anywhere.
- `testSent: (to: string)` is single-recipient; Send Test `To field` uses `z.string().email()` (single string) — no plural form needed since it's one recipient, but the key signature matches repo convention.

# Accessibility & RTL Depth Audit — Email Template System Plan v7

**Plan audited:** `.cursor/plans/email_template_system_(react_email_+_editor)_08419060.plan.md`
**Scope:** Screen reader patterns, keyboard navigation, RTL edge cases, pluralization, ARIA semantics, color contrast, reduced-motion, cognitive a11y, Arabic-specific UX, Storybook addon-a11y.
**Method:** Plan text cross-referenced against `frontend/`, `shared/locale/`, `.storybook/`, and `node_modules` conventions.

---

## Summary Table of All Gaps

| # | Severity | Area | Description |
|---|----------|------|-------------|
| 1 | P0 | Cross-ref integrity | `§G` referenced 3× (lines 790, 884, 1038) as the authoritative source for reduced-motion + button loading + idempotencyKey, **but §G does not exist** as a section. Headers jump §A–§J (§F, §G, §H, §I entirely absent). Dangling cross-reference breaks spec closure. |
| 2 | P0 | Reduced motion | The the `usePrefersReducedMotion()` hook is not implemented anywhere in the codebase (file does not exist) and the plan only says "guard (§G)". No specification of which animations it governs: stagger, `SuccessCheckMark`, `@dnd-kit` `dropAnimation`, `<Slide>` tab transition, autosave toast. |
| 3 | P0 | Screen reader live regions | Plan defines explicit error/loading/toast UI (`§P` lines 882–928) but specifies **no `aria-live` region**. No `aria-live="polite"` for save-success toast, no `aria-live="assertive"` for errors. Search confirms repo has **0 `aria-live` usages** in `frontend/`. |
| 4 | P0 | Pluralization (Arabic) | All 9 pluralizable toast/error keys (`saved`, `published`, `rateLimited`, `versionMismatch`, etc.) use `(count: number) => string`. Repo convention (verified in `shared/locale/ar/dashboard/core/statusTracking.ts:9,63` and `teachers/dashboard.ts:27`) just interpolates the raw count — **no Arabic plural rules** (zero/one/two/few/many/other). `rateLimited: (limit: number)` and `versionMismatch: (expected, got)` produce grammatically wrong Arabic for n=0, n=2, n=11. |
| 5 | P1 | Keyboard shortcuts | v6 changelog (line 1412) advertises "Save Draft + Publish + Send Test actions with keyboard shortcuts". The plan body **never lists the shortcut bindings** (Ctrl+S, Ctrl+P, etc.) — no `useHotkey`, no `keydown` handler, no `<kbd>` affordance spec. Desktop action bar only *displays* shortcut text (`sx={{display:{xs:"none",md:"inline"}}}` line 1107) but no shortcut wiring. |
| 6 | P1 | Focus restoration | Drawer/Dialog focus trap is delegated to "MUI default — no work" (line 788), but **focus restoration after close** is unspecified. For history drawer, "Restore" in flight, and send-test close-after-success this matters. No restoreFocus handler named. |
| 7 | P1 | Escape behavior | No explicit Escape-to-close spec for dialogs (publish-confirm, delete-confirm, restore-confirm, unsaved-changes, version-mismatch). Inspector Drawer mobile swipe-dismiss is specified (`swipeArea="anchor"` line 1100) but Escape for desktop Drawer/Inspector is not. |
| 8 | P1 | Status badge announcements | `§P` says status-badge updates on publish/restore (line 949: "toast → status badge update") but the visual badge change itself is **not announced** to screen readers (no `aria-live` on the cell, no `role="status"`). |
| 9 | P1 | Drag-and-drop announcements | `@dnd-kit/sortable` block reorder (line 1152, R8 line 1124) specifies sensors + `KeyboardSensor` but **no ScreenReader / `LiveAnnouncer` script** (`getAnnouncement` / `onDragStart`/`onDragEnd` text). dnd-kit has built-in `useSortableAnnouncements`/`Announcements` plugin not mentioned. |
| 10 | P1 | Custom-widget ARIA roles | Merge-tag picker (`VariableMentionPicker`) and block reorder (`SortableList`) — neither has `role="listbox"`/`role="option"`/`role="application"` assigned in the plan. Only generic `aria-label` on chips (line 785) and `aria-expanded`/`aria-controls` on the Inspector trigger (line 1101). |
| 11 | P1 | `aria-busy`/`aria-invalid` | `§P` defines busy states (`isSaving`, `isSendingTest`, restoring) but uses `<Button loading>` + overlay only — **no `aria-busy`** attribute. Form validation (`§H`, `§P3`) uses `<FormHelperText error>` but **no `aria-invalid`** and **no `aria-describedby`** linkage to the helper text. |
| 12 | P1 | TipTap RTL awareness | Plan does not specify TipTap editor `dir` management — text direction inside the editable canvas, toolbar button position (leading/trailing swap), and the slash-command / bubble-menu placement in RTL. RTL scope is limited to "story variant renders `dir="rtl"`" (line 828). |
| 13 | P1 | RTL — flip animations & dnd direction | `<Slide direction>` (line 1113) is computed only from `touchstart`/`touchend` delta — no RTL branch. `@dnd-kit` drag axis direction (LTR=right-to-left, RTL=left-to-right) and `restrictToVerticalAxis` behavior in RTL is unspecified. |
| 14 | P2 | Inspector panel RTL swap | Plan says "right-pane Inspector" (line 1412) — does not specify that in RTL it should anchor left (Drawer `anchor` swap or flex-direction flip). No Storybook RTL assertion on this. |
| 15 | P2 | MUI icon position flip | `<LockOutlined>` cue (line 870) is placed "adjacent to the label" — does not specify leading-in-LTR / trailing-in-RTL vs MUI's default `flipIcon`. `TuneOutlined` toolbar IconButton direction not addressed. |
| 16 | P2 | Date/time picker RTL | Plan mentions "Last Edited" column (line 1086) but no RTL-aware date picker rendering rule (Arabic uses Hijri display optionally) — relied entirely on MUI `LocalizationProvider` (not configured in plan). Plan does not specify calendar locale/arabic-number handling. |
| 17 | P2 | Number/date locale-aware formatting | Plan's `versionMismatch: (expected, got) => string` and `rateLimited: (limit)` interpolate raw numbers — no `Intl.NumberFormat`/`Intl.DateTimeFormat` with `locale` arg. Expediency count and timestamp formatting not bound to active locale. |
| 18 | P2 | Email subject RTL render | Plan says locale=ar serves Arabic UI, but does not state whether the user-typed email subject in the editor renders RTL in preview, nor whether the outbound email subject header carries RTL Unicode bidi marks. |
| 19 | P2 | HTML body RTL for ar templates | `previewHtml` (line 774) returns rendered HTML; plan does not specify that ar-locale templates inject `<html dir="rtl" lang="ar">` / `lang` attribute so the rendered email renders RTL in mail clients (RTL email body requires direction inheritance). |
| 20 | P2 | Color contrast — dark mode | Line 789 specifies light-mode verification against `background.paper`. No dark-mode (`theme.palette.mode === "dark"`) verification for the warning/success/disabled badge states, especially the `action.disabled`/`text.disabled` mapping for Archived (line 862) which can fall below 4.5:1 in dark. |
| 21 | P2 | `LockOutlined` disabled-icon contrast | Line 870 uses `color="disabled"` — MUI `action.disabled` is ~2.3:1 against `background.paper`, fails 3:1 non-text-contrast. As an affordance for sighted admins who need to read the tooltip, this fails WCAG 1.4.11. |
| 22 | P2 | Filter chip selected/unselected contrast | Plan puts `aria-label={t("filterByScope")}` on chips (line 785) but does not address contrast of the segmented Active/Archived/All control in selected vs unselected states (segmented buttons often have low contrast in the selected slot). |
| 23 | P2 | DataGrid keyboard pattern | Plan reuses `AppDataGrid` (line 1089) but does not specify editing-model keyboard interactions (Enter to edit row actions, arrow-key nav when row menu anchor is open). `useRowMenuAnchor` (line 1412) — there is no spec for arrow-key open/close of the action menu; relies on MUI defaults. |
| 24 | P2 | `aria-labelledby` vs `aria-describedby` consistency | Dialog uses `aria-labelledby={titleId}` (line 786), but dialogs have bodies and help text. With `sendTestTitle` + `sampleProps` help — `aria-describedby` for the rate-limit notice `<Alert>` (line 898) and sample-props help is not wired. Confirm dialogs (`deleteConfirmTitle`, `publishConfirmTitle`) have bodies (line 1212) not bound via `aria-describedby`. |
| 25 | P3 | Cognitive a11y — undo | Bulk archive has undo toast (line 908, 4s) — good. But save/publish/restore have **no undo**; restore-and-rollback not specified. Conflict "Overwrite/Reload" (line 891) has no "Cancel" recovery path documented. |
| 26 | P3 | Cognitive a11y — help text for design JSON | `helpText.designJson` (line 1216) is named but no spec for *what* the help text says (only a key listed). No inline example format guidance in the editor for designers facing raw JSON. |
| 27 | P3 | Addon-a11y is non-blocking / no CI gate | `.storybook/preview.tsx:81` sets `a11y.test = "todo"` (warnings only, explicitly NOT `'error'`). Plan §J line 791 confirms "warnings do not fail CI; visual a11y review is manual per story". No `@axe-core/playwright` (line 791) installed. The plan mentions "Phase 2 may add" — not committed. |
| 28 | P3 | Addon-a11y rulesets | `.storybook/preview.tsx` defines no `config.rules`/`context` array — runs default axe ruleset only. Plan does not tune for keyboard (e.g. `region` rule off for dashboard, or `heading-order` config). |

---

## Detailed Findings Per Area

### 1. Screen reader patterns
- **Live regions:** ABSENT. The plan enumerates ~15 dynamic surfaces (P1 save label flip, P3 send-test countdown, P5 restore-in-flight, P7 offline banner, P7 stale-tab snackbar, Q2 cache refetch) but assigns `aria-live` to none. The repo has zero `aria-live` usages in `frontend/` (verified by grep). Since `<Snackbar>`/MUI Dialog don't auto-announce their *content change* (only first appearance), status-badge updates and countdown timers are silent to NVDA/VoiceOver.
- **`polite` vs `assertive`:** Not distinguished anywhere. Save-success (`"Saved ✓"`) and stale-tab poll should be `polite`; validation errors and rate-limit countdown should be `assertive`. The plan needs an explicit mapping.
- **Status badge changes:** NOT announced. Line 949 ("toast → status badge update") couples the announcement to the toast only, leaving the DataGrid cell itself silent.
- **Preview iframe title:** SPECIFIED (line 787) — `title={t("previewTab")}`. ✅ However, the iframe also needs `aria-describedby` if it streams loader/error, and `title` is static — the Sandbox CSP `default-src 'none'` (line 66) may also interfere; not addressed.
- **Drag-and-drop announce:** NOT specified (gap #9). dnd-kit ships `LiveAnnouncer`-based announcements via the `Announcements` plugin (onDragStart/onDragOver/onDragEnd spoken text). Plan lists `PointerSensor + TouchSensor + KeyboardSensor` (line 1124) but not the announcement text.

### 2. Keyboard navigation
- **Focus order for editor:** NOT specified beyond Tab-reachability (line 788). The three-tab Design/Preview/Code layout (line 1412) needs a documented roving-tabindex order (tabs → tab-list → Inspector fields → bottom action bar).
- **Keyboard shortcuts:** NOT listed. The plan promises (line 1412) "Save Draft + Publish + Send Test actions with keyboard shortcuts" but the body never enumerates them. No `Ctrl+S` / `Ctrl+P` / `Ctrl+Enter` (publish) / `Ctrl+Shift+S` (duplicate) / `Ctrl+Z` (undo archive) binding appears. The desktop action bar only *shows* the shortcut string (line 1107) but no event handler is wired.
- **Escape for dialogs/drawers:** NOT explicitly specified. Mobile Inspector uses `swipeArea="anchor"` (line 1100); desktop "right-pane Inspector" (line 1412) lacks Escape→close confirmation if `isDirty`.
- **Focus trap:** Delegated to MUI default ("no work" line 788) — reasonable, but the bulk-archive undo toast with action button (line 908) is a TrapBreak case (toast-with-action is NOT a focus trap) and is unaddressed.
- **Focus restoration after close:** ABSENT. Send-test closes 800ms after success (line 900) — where does focus go? Inspector toggle closes the drawer — focus returns to trigger IconButton? History restore-in-flight returns focus to which trigger?
- **DataGrid keyboard pattern:** NOT specified. AppDataGrid (verified at `frontend/common/components/ui/dataGrid/AppDataGrid.tsx`) leans on MUI X DataGrid defaults (arrow-key cell navigation built-in) but the plan adds row-actions menu via `useRowMenuAnchor` — no spec for arrow-down/up inside the open menu, Enter-to-edit on Name cell, or Esc-to-close menu without restoring focus to the row.

### 3. RTL layout edge cases
- **TipTap RTL-aware:** ABSENT. TipTap's `dir` attribute, toolbar button leading-vs-trailing, slash-command position (top-left/right), BubbleMenu caret-flip in RTL — none addressed. Plan covers RTL only as a "story variant" (line 828).
- **Flip animations direction-aware:** ABSENT. `<Slide direction>` (line 1113) tracks only touch delta; in RTL the "next tab" semantics invert. No RTL branch.
- **Inspector panel swap sides:** ABSENT. Plan hard-codes "right-pane Inspector"; no `anchor="right"` → `anchor="left"` swap for RTL.
- **@dnd-kit drag direction reversed:** ABSENT. `restrictToVerticalAxis` (line 36 research) and `KeyboardSensor` (line 1124) arrow direction inverts in RTL; plan is silent.
- **MUI icon positions flipped:** ABSENT. `<LockOutlined>` placement (line 870) and `<TuneOutlined>` (line 1101) — `flipIcon` behavior unspecified.
- **Number/date formats locale-aware:** ABSENT. `versionMismatch` and `rateLimited` interpolate raw numbers; no `Intl.NumberFormat(locale)`/`DateTimeFormat`. Repo `shared/locale/ar/dashboard/core/statusTracking.ts:9` shows the same anti-pattern (reproduced by the plan).

### 4. Pluralization
- **`(count: number) => string` keys:** All 9 plurizable keys use this signature ✅ (lines 1222, 1225, 1237): `rateLimited`, `versionMismatch`, `testSent`. Consistent with repo convention.
- **Arabic plural rules:** NOT handled. Confirmed across `shared/locale/ar/dashboard/**`: every plural fn body interpolates the raw count (e.g. `${count} حساب مقفل`) regardless of n=0/1/2/3-10/11+. This gives wrong Arabic for many cases → e.g. `rateLimited(0)` should say "لا رسائل", `(1)` "رسالة واحدة", `(2)` "رسالتان", `(5)` "٥ رسائل". Plan inherits this repo-wide gap.
- **`testSent: (to: string) => string`:** Sufficient for the plan as written — Send-Test `To field` is `z.string().email()` (line 895, verified), single recipient. **No** plural form needed. But if "Send Test" is later extended to multi-recipient (`z.array(z.string().email())`), the singular key would mislead. Recommend documenting the single-recipient contract in the help text.

### 5. ARIA semantics
- **`role` on custom widgets:** ABSENT for merge-tag picker and sortable block list (gap #10). No `role="listbox"`/`option` on the Autocomplete-powered picker results; no `role="list"`/`listitem` on `<SortableList>`.
- **`aria-expanded`:** SPECIFIED only on the Inspector `TuneOutlined` trigger (line 1101). NOT specified for filter collapsibles, the segmented Active/Archived view, or the "Insert merge tag" disclosure in the subject field.
- **`aria-busy`:** ABSENT (gap #11). Loading states use `<Button loading>` + overlay `<Box>` + `<CircularProgress>` instead of `aria-busy`.
- **`aria-invalid`:** ABSENT (gap #11). Send-test To+sample-props validation uses `<FormHelperText error>` only.
- **`aria-describedby` for help text:** ABSENT. Plan names many `helpText.*` keys (line 1216) but does not bind form field → help text element via id.
- **`aria-label` vs `aria-labelledby` vs `aria-describedby`:** Inconsistent — Dialog uses `aria-labelledby` (line 786) for title, but dialog *bodies* (delete-confirm, publish-confirm, unsaved-changes — all named as bodies in line 1212-1213) are not bound. Filter chips use `aria-label` only. No `aria-labelledby` pairing between an Input and its visible `<FormLabel>`.

### 6. Color contrast
- **Status badge light-mode:** Line 789 says "verify each status palette slot" — but verification is a TODO, not done. The Archive mapping to `theme.palette.action.disabled / text.disabled` (line 862) is borderline (<4.5:1).
- **Dark mode:** NOT verified (gap #20). The plan's dark mode section (line 1412) is theming only (`useColorScheme`/`--re-*`); no contrast verification for any status slot.
- **`LockOutlined` disabled icon contrast:** Insufficient (gap #21). `color="disabled"` = `action.disabled` ≈ 0.38 opacity; against `background.default` in both modes this can drop below 3:1 non-text-contrast (WCAG 1.4.11).
- **Filter chips selected/unselected:** NOT verified (gap #22). Segmented Active/Archived/All likely uses MUI `<ToggleButtonGroup>` — selected slot often low-contrast.

### 7. Reduced motion
- **Implementation pattern:** Specified abstractly in research file 03 (`usePrefersReducedMotion = () => useMediaQuery('(prefers-reduced-motion: reduce)')`) but the hook file does not exist in the codebase (verified). Plan only references it as "closes an existing gap" (line 790) — no concrete file path, no `motion.create()` wrapper pattern, no usage contract.
- **What it disables:** NOT enumerated. Plan mentions only "stagger + success check + block drag settle" (research file 03 line 178) but does not list: (a) `@dnd-kit` `dropAnimation` → `null`, (b) `<Slide>` tab transition timeout → `0`, (c) auto-play of `SuccessCheckMark` SVG, (d) 600ms animation in dialog (line 900), (e) optimistic-state fade-in on rows.
- **@dnd-kit transition:** NOT addressed. dnd-kit's `dropAnimation` accepts `null` to disable; plan silent.
- **Slide tab transition:** NOT replaced with instant swap. `<Slide direction>` (line 1113) has no reduced-motion guard branch.

### 8. Cognitive accessibility
- **Clear error messages with recovery:** Mostly present — `versionMismatch` offers "Overwrite or Reload" (line 891), `restoreConflict` offers "Reload" (line 916). ✅ But the streak of `*.failed` toasts (`saveFailed`, `publishFailed`, `archiveFailed`, `sendTestFailed`, line 1222) are single-label keys with **no recovery instruction** (e.g. "Network error — try again" + Retry button). Insufficient.
- **Confirmation dialogs for destructive:** ✅ Present — `deleteConfirmTitle`, `archiveConfirmTitle`, `restoreConfirmTitle`, `unsavedChangesTitle` (line 1212-1213), `discardConfirm` (line 1234).
- **Undo:** PARTIAL — bulk archive has 4s undo toast (line 908). Save/publish/restore do not.
- **Consistent navigation:** Reasonable — three-tab editor + sidebar entry + breadcrumbs (line 1412). But no spec for whether Tab order is identical across Design/Preview/Code panes.
- **Help text for complex features:** NAMED but not specified — `helpText.designJson`, `helpText.attachmentRules`, `helpText.allowedEditorGroups` (line 1216) are key placeholders; merge-tag help (line 936 references merge-tag mismatcher) has no intro help text.

### 9. Arabic-specific UX
- **Date picker RTL-aware:** NOT specified. Last-Edited column shows a date — MUI `LocalizationProvider` adapter (e.g. `AdapterDateFns` with `ar` locale) is not configured in the plan.
- **Time picker RTL-aware:** N/A — no time picker in the plan; no scheduled-send feature pipeline.
- **Email subject displayed RTL when locale=ar:** NOT specified.
- **HTML email body rendered RTL for ar templates:** NOT specified (gap #19). The `renderAsync` pipeline (line 1305) returns HTML; plan does not set `<html dir="rtl" lang="ar">` on ar-locale templates, so mail clients may render LTR. This is both an a11y AND a correctness bug.

### 10. Storybook addon-a11y
- **Blocking vs warnings:** WARNINGS only. `.storybook/preview.tsx:81` — `test: "todo"`. Plan §J line 791 confirms "warnings do not fail CI".
- **CI gate for a11y:** ABSENT. No `@axe-core/playwright` (line 791) installed. No vitest/jest integration that fails on violations.
- **Specific rulesets configured:** ABSENT. `.storybook/preview.tsx` `a11y` config has only the `test` key; no `config.rules`/`context` array to whitelist/blacklist rule IDs (e.g. `region`, `color-contrast` tuning per surface).

---

## Top-5 Actionable Recommendations

1. **Promote addon-a11y to `test: "error"` and add `@axe-core/playwright` E2E** — give the email-templates feature an actual CI gate. In the same PR, configure a `.storybook/preview.tsx` `a11y.config` with target contexts and rules (disable `region` for dashboard chrome; enable `heading-order`, `color-contrast`, `tabindex`, `aria-valid-attr-value`). Audit the 15 stories and ship **75% of this audit's gaps as axe failures** automatically.

2. **Add an explicit "Keyboard & ARIA" sub-section** that resolves the §G phantom reference and lists: (a) focus-order schema (tabs → Inspector → action bar), (b) the keyboard shortcut table (`Ctrl+S`=Save Draft, `Ctrl+P`=Preview, `Ctrl+Shift+P`=Publish, `Ctrl+Enter`=Send Test, `Ctrl+B/I/U`=TipTap bold/italic/underline, `Esc`=close dialog/drawer + restore focus, `↑↓`=DataGrid row nav + Enter=edit, `Space`=toggle segmented view), (c) `aria-busy`/`aria-invalid`/`aria-describedby` binding rules, (d) merge-tag picker as `role="combobox"`+`aria-expanded`, block list as `role="list"`+`aria-roledescription="sortable item"`.

3. **Mandate live regions for every dynamic surface in §P** — wrap each toast in an `aria-live="polite"` (save/restored/published) vs `aria-live="assertive"` (errors + rate-limit countdown) region; add a hidden `role="status"` span beside every status badge cell so the publish/restore cell announcement is spoken; add the dnd-kit `Announcements` plugin with translation keys (`dnd.picked`=You picked up block N, `dnd.dropped`=You dropped block N at position M, `dnd.cancelled`=Cancelled drag).

4. **Adopt proper Arabic pluralization for the new namespace** — instead of raw `${count}` interpolation, mandate `intl-messageformat` / a small `pluralize(count, { zero, one, two, few, many, other })` helper for every `(count: number) => string` key in `dashboard.emailTemplates`. Document the six CLDR categories explicitly and immediately apply to `rateLimited`, `versionMismatch` (use `expected`/`got` separately, no plural needed on the inner numbers — but `expected.count` style fields do). This closes a repo-wide gap; treat email-templates as the precedent.

5. **Spec RTL depth end-to-end** — add an "RTL" sub-section covering: (a) TipTap `dir="auto"` on the editable + toolbar `flex-direction: row-reverse` in RTL + slash-command anchor; (b) Inspector `anchor` swap (right→left) and flex order flip; (c) `<Slide direction>` flipped relative to `dir` (in RTL swipe-left → "left" direction); (d) `@dnd-kit` arrow axis inversion (`ArrowDown/Up` stays vertical; `ArrowLeft/Right` swaps); (e) HTML body emit `<html dir="rtl" lang="${locale}">` in `renderAsync` for ar templates; (f) Storybook RTL assertion that the Inspector appears on the left, status badge cell text-align right, and the Sidebar `LockOutlined` icon renders on the *trailing* edge. Wire all Storybook stories to render in both `dir` via a StoryWrapper decorator and assert key layout invariants.