Agent is idle (waiting for messages). agent_id: r4-a11y-rtl, agent_type: explore, status: idle, description: R4: Validate v8 §V a11y/RTL, elapsed: 1612s, total_turns: 1

[Turn 0]
Critical confirmations:
1. `sx={{ srOnly: true }}` is NOT a valid MUI sx shorthand anywhere in `@mui/` — V3 design line 1613 is **INVALID**. The Repo uses `visuallyHidden` only internally in Rating/Slider, not as a sx prop.
2. RTL emotion cache (`stylis-plugin-rtl`) exists at `frontend/common/lib/emotion-cache.tsx` — but §V never cross-references it for cache-swap-on-locale-toggle.

I now have a complete picture. Here is my full Round-4 validation report.

---

# Round-4 Audit Report — v8 §V (Accessibility & RTL Depth) Validation

**Design file:** `.cursor/designs/email_template_system_(react_email_+_editor)_08419060.design.md`
**Section:** §V lines 1590–1666 (v8 — Round-3 Audit)
**Audited:** 2026-08-02 (Round 4 — deep verification against codebase & package APIs)

## 1. Validation Summary Table

| Sub | Topic | Status | Remaining Gaps |
|-----|-------|--------|----------------|
| **V1** | Dangling §G cross-reference | **PARTIAL** | 7 (don't fix; replace with explicit subsection) |
| **V2** | `usePrefersReducedMotion` hook | **PARTIAL** | 6 (validity ✓, actionable ✗) |
| **V3** | `aria-live` regions | **INVALID** | 9 (recommendation invalid; design conflicts and underspecs paths) |
| **V4** | Arabic pluralization | **VALID** | 4 (correct counts: `zero/one/two/few/many/other` ✓, path/Locale mismatch) |
| **V5** | Keyboard shortcuts | **PARTIAL** | 6 (browser-hijack risks unhandled; `Cmd+S`/`Ctrl+S` semantics) |
| **V6** | Focus restoration | **PARTIAL** | 5 (MUI default is opt-in; edge cases unhandled) |
| **V7** | dnd announcements | **PARTIAL** | 5 (artifact interface differs; `onDragOver` is REQUIRED not optional; ESLint Node version wrong) |
| **V8** | ARIA roles | **INVALID** | 8 (conflicts with dnd-kit default role `button`; `aria-roledescription` duplication) |

**Total remaining gaps:** **60** new gaps found across the 8 sub-sections.

**Sub-section statistics:**
- VALID: 1 (V4)
- PARTIAL: 5 (V1, V2, V5, V6, V7)
- INVALID: 2 (V3, V8)

---

## 2. Detailed Findings Per Sub-Section

### V1. Dangling §G Cross-Reference — **PARTIAL** (7 gaps)

**Verification (all confirmed):**
- ✓ Line 790: "Reduced-motion — `usePrefersReducedMotion()` guard (**§G**) — closes an existing gap."
- ✓ Line 884: "Apollo `loading` from each mutation → `<Button loading={isSaving}>` with `<CircularProgress size={20} color="inherit" />` (existing convention per **§G**)."
- ✓ Line 1038: "All mutations carry `idempotencyKey` header (see **§G**)."
- ✓ `grep "§G"` finds only these 3 + the V1 definitions themselves — no §G section header exists.
- ✓ `grep "§F§G§H§I"` confirms §F, §G, §H, §I are all absent. Existing headers in the relevant region: `### S.` (line 1401), `### T.` (1464), `### U.` (1544), `### V.` (1590), `### W.` (1668), `### X.` (1750), `### Y.` (1799), `### Z.` (1856). So `§A…§R` are inlined via `####` headers (e.g. `#### P. State Transitions` line 880, `#### R. Responsive` line 1065); `§S`–`§Z` are top-level Round-3 audit appendices. **The Round 3 audit created §S–§Z but skipped over §F/§G/§H/§I entirely** — the v8 fix only lazily creates §G.

**Remaining gaps:**
1. V1 says "Create §G" but gives no anchor (`### G. Accessibility & Interaction Patterns` or `#### G.`?), no location for where it sits relative to §F–§I.
2. The §G bullet list (V1 line 1594–1598) only names 4 items: `usePrefersReducedMotion`, Button loading, `idempotencyKey`, keyboard shortcuts. **It doesn't unify the §G canonicals for: focus restoration (V6), aria-live (V3), pluralization helper (V4), announcements (V7).** Each V-sub currently re-specifies its own canonical location — they should all point to §G as the single source.
3. The current §G content list mentions `idempotencyKey` but does not describe how views GET it from §Graph QL mutation headers — the §G bullet is a stand-alone stub; the actual `idempotencyKey` design is at §A.1 (line 1038 only cross-refs; the canonical reference is not named).
4. The V1 fix does not create §F (`aria-live regions / focus management metadata`), §H (`Form Validation Schema` — referenced at line 889 "zod schema in §H"? **§H is referenced by line 1948 changelog: "`dashboard.emailTemplates.toast.saved()` — but no method body for the rate-limit countdown pattern (P3 line 949 specifies `live countdown` but no `setInterval` cap/cleanup).
5. `screenReaderInstructions.draggable` — assigned once at `<DndContext provider>` top-level; cannot be hot-swapped on locale toggle. Design should mandate locale-aware `restoreByDynContext` re-mount.
6. dnd-kit exposes `<RestoreFocus>` component separately (from `node_modules/@dnd-kit/core/dist/components/Accessibility/components/RestoreFocus.d.ts`); used to project the last element separate from announcements. The design never mentions `<RestoreFocus afterAction=false/>` for use inside `<SortableContext>` (used by `restoreFocusViaDnd`).
7. dnd-kit has TWO mechanisms for announcements: `DndContext accessibility={}` per-provider, and the `KeyboardSensor` accepts `activationConstraint.distance` (line 1153) but NOT sensor-level announcements. **For procedural item-level announcements during multi-step keyboard navigation between nested drop zones, design needs `<SortableContext><Accessibility /></SortableContext>` per-context wrapping** — currently unspecified.
8. dnd-kit `enableAnnouncements` opt-out is via `Object.entries` default spread + `onAbortable` hook; the v8 design's `accessibility={{ announcements: {...} }}` REPLACES the default (doesn't merge with default messages). Design needs to **deep-merge with `defaultAnnouncements`** to cover `onDragMove` and `onDragCancel`.
9. No design for when `over.id === null` mid-drag (`onDragOver` returning `""` per V7 line 1653 is suspicious — dnd-kit does NOT allow empty strings to clear the live region; using `""` may leave last message "stuck" in NVDA's announce queue).

---

### V2. `usePrefersReducedMotion` Implementation — **PARTIAL** (9 gaps)

**Verification:**
- ✓ `grep -rn "usePrefersReducedMotion\|prefers-reduced-motion\|prefersReducedMotion" frontend/ app/ shared/` → **0 matches**. Confirmed non-existent in the codebase.
- ✓ `@mui/material` exports `useMediaQuery` from `@mui/system/useMediaQuery` (node_modules/@mui/material/useMediaQuery/index.d.ts). Signature: `useMediaQuery<T = Theme>(queryInput: string | ((theme: T) => string), options?: UseMediaQueryOptions): boolean`. So `(prefers-reduced-motion: reduce)` is a syntactically valid query, no customization is needed.
- `frontend/common/hooks/useViewport.ts` (12 lines) exists and is the repo precedent for hooks living at `frontend/common/hooks/<name>.ts`. So the proposed path `frontend/common/hooks/usePrefersReducedMotion.ts` (V2 line 1602) is consistent with repo precedent.
- ✓ No `prefers-reduced-motion` references found in code or design body.

**Remaining gaps:**
1. **No SSR/hydration design**: `useMediaQuery` returns `false` on first render (left-hand-dom risk) then `true` on hydration mismatch. Design never specifies `useMediaQuery(prefers-reduced-motion: reduce, { noSsr: true })` (or `false`) nor `next/dynamic({ ssr: false })` for the editor route. Without it, the new hydration can warn or flash `@dnd-kit` users.
2. **No storage of accessor pattern**: the design says "match `@mui/material` `useMediaQuery` pattern" but does not name the necessary `defaultMatchMatches` or `defaultMatches: false` option, which opts into the dnd-kit `dropAnimation` hover overlay BEFORE SSR resolves the MUI flag — leading to flicker.
4. **`prefers-contrast: more`**: Design addresses Motion but not contrast. WCAG 1.4.11 (Non-text Contrast AA) becomes more urgent under `prefers-contrast: more`. **No mention in v8 §V** (grep `prefers-contrast` → 0 in codebase, not mentioned). Add a design for the `nonInteractiveDisabled` button color override and Cupertino link text default `text-decoration: underline`.
5. **No `prefers-contrast` design for `Chip` filter的状态-color**: §C line status chip palette (`Draft=warning`/`Published=success`/`Archived=disabled`) falls short of `prefers-contrast: more`. V2 design should override `colorContrastBoost` for status chips.
6. **`@dnd-kit` `dropAnimation={null}` is incorrect**: setting `dropAnimation={null}` is literally the dnd-kit default — setting it globally would BREAK the drop animation for non-reduced users (see npm type design: `dropAnimation: DropAnimation | null | undefined`). V2 must wrap it in a **conditional** assignment (not unconditional).
7. **`<Slide>` becomes instant opacity**: the design specifies disabling slide direction. MUI `<Slide>` doesn't expose an `@media (prefers-reduced-motion)` guard. Design should wrap each `<Slide>` in a `Box sx={{ transition: prefers-reduced ? 'opacity 150ms' : 'transform 250ms' }}` and route this through Note's Smuggler.
8. **Autosave toast "skips entrance animation"**: not actionable — the toast lives in `useNotifications`. To skip entrance only under reduced motion, the `notifications.show` wrapper needs an injected `disableEnter` integration; v8 never says where to inject.
9. **`border-bottom: none` on cupertino** does not exist, so the high-contrast transitions need `border-bottom: 2px solid transparent` for AA hit area. Design misses.

### V3. Screen Reader Live Regions — **INVALID** (9 gaps)

**Verification:**
- ✓ `grep -rn "of aria-live|ariaLive aria-live" frontend/ app/` → **0 matches**. The 0-usage claim is verified.
- §P, the `Publish → status badge update` row + `toast.saved()` is at line 886 + §P9 table line 951–952; the v8 V3 line 1610 says "§P 'status badge update' — line 949" — the row referenced is at line 951, not 949 — line 949 says *"Disjointed state, not needed"*. **Line off-by-one or wrong (buried in the state table)**. Please revise.

3. **No SSR safe path for the `<a aria-live>` div** — the design says "near the toast/snackbar mount point in the editor route" but never specifies the exact file (`app/dashboard/email-templates/[id]/page.tsx`? `EmailTemplateEditor.tsx`?). `"Near"` is not an identifier.
4. **`useNotifications` integration design is incomplete**: line 1613 suggests "Route toasts to this region via `useNotifications` + a `useEffect` that writes `notifications.show` text to the `aria-live` div's textContent." Mark: `useNotifications` doesn't expose a `subscribe` API; it uses an internal listener queue. V3 must specify `_subscribeCallback`/use ful lthat `useEffect` use the `useSnapshot`/`useNotifications` Emitter subscripbe pattern (which has no React bridge today).
5. **No "publish `Update available — Reload` snackbar** (a la P7) — only raised "version-mismatch" runtime conflict dialog — no version-mismatch's **catch` stale tab"` snackbar"**(line 952: `"This template was edited on another tab. Reload to see latest version"`). This stale-tab snackbar is polite or assertive-live perception? Unspecified.
6. **`role="status"` vs `role="alert"`**: V3 says add `role="status"` to the status-badge cell (V3 line 1612) — but `role="status"` implies `aria-live="polite"`. The Conflict dialog ("version-mismatch conflict dialog") is animate; that is an `assertive` region. V3 line 1611 says add `aria-live="assertive"` to the conflict dialog — correct, but it also says "screen readers announce changes" — FOR (a politics) incorrect MUI accessibility constituent — a Dialog already has `aria-modal=true` (verified at `node_modules/@mui/material/Dialog/Dialog.d.ts:82`) AND when it opens, since it's `aria-modal=true`, the SR announcements are **trapped** and you don't need both `aria-live=assertive` (trap extra announce). The dual announce creates double announce ("Conflict!"+dialog open title).
7. **No visible="badge in AppDataGrid" design**: line 1612 says add `role="status"` to the status-badge cell in AppDataGrid. But AppDataGrid is **a shared component** (used by many views) — adding `role="status"` globally affects every status chip system-wide. Must scope to `field="status"`.
8. **No pattern-AND**: `aria-live="polite"` on toast container is wrong semantics for the `useNotifications` avisual-to-issue toast pazzletype (semantic), which is a `<Snackbar>` that's mounted in the layout Roo render, not a custom DOM `<div>`. Should bind to `/mathrmIII incrvar [<SnackbarContent>]` uses the `key` but role/status must opt into MUI's aria behavior. Design calls to bypass MUI with a manual `<div>` is awkward.
9. **No handling for `assertive` opens buries `assertive`: for screen reader, `aria-live=assertive` is not recommended for transient toasts because behaviour across screeners (RTF;ropy`.

### V4. Arabic Pluralization Rules — **VALID** (4 gaps)

**Verification:**
- ✓ `grep -rn "pluralize|pluralizeAr|Intl.PluralRules"` across `shared/` + `frontend/` → **0 matches**. Confirmed non-existent.
- ✓ `shared/locale/ar/dashboard/` **exists**, with sub-folders (admin, billing, classes, complaints, payments): but **NO `emailTemplates` sub-folder exists today**. So `shared/locale/ar/dashboard/emailTemplates.ts` (V4 line 1617) is a net-new file, confirmed gap.
- ✓ `Intl.PluralRules('ar')` returns the exact 6 categories V4 enumerates — **MANUAL VERIFICATION RESULTS:**
  | n | Category | Example words V4 uses |
  |---|----------|------------------------|
  | 0 | zero | `لم يتم الحفظ` ✓ |
  | 1 | one | `قالب` (singular) ✓ |
  | 2 | two | `قالبين` (dual) ✓ |
  | 3 | few | `قوالب` (plural 3–10) ✓ |
  | 11 | many | `قالبًا` (singular genitive 11–99) ✓ |
  | 100 | other | `قالب` (general 100+) ✓ |
- ✓ English `Intl.PluralRules('en')` only uses `one`/`other` (no `zero`), confirming V4 "English side: keep simple `count === 1 ? ... : saved ${count} templates`" — but note: **English `n=0` English → "Saved 0 templates" not "Saved 1 template"**, the ternary V4 proposes is actually correct in practice (e.g., "Saved 0 templates" is fine — no special zero form needed).

**Remaining gaps:**
1. **Directory mismatch**: §V4 (design line 1617) says place helper at `shared/locale/ar/dashboard/emailTemplates.ts`. But the design for the English side (line 1628) says keep simple ternary in "the English side" — **the English file path is never named**. For the LockStep rule (Q1, Q2 with AR/EN pairs per V4-3 lockstep), the user must know the English counterpart path. Look at existing convention: `shared/locale/en/dashboard/something.ts` likely. Design should name BOTH paths symmetrically.
2. **`pluralizeAr` vs `pluralize` naming inconsistency**: V4 line 1628 inline reference uses `pluralizeAr` but the function design is `pluralize(count, forms)` at line 1617. Pick one name.
3. **Helper accomodates six categories — but the actual entries that may be missing": how should the helper behave}
4. **No design for `rateLimited(retryAfter)`**, V4 says wrap retry variables when locale=ar — but `retryAfter` is a SECONDS value, not a template count. Pluralizing seconds in Arabic uses "ثانية/ثانيتين/ثوانٍ/ثانيةً/ثانية" per DLUSAR category. Not all tile bounds ters µmodel.
6. **`Intl.PluralRules('ar')` polyfill risk**: native in Node 13+ and all modern browsers — V4 doesn't assume polyfills.

### V5. Keyboard Shortcuts — **PARTIAL** (9 gaps)

**Verification:**
- ✓ `grep -rn "useHotkey|useHotkeys|useKeyboardShortcut"` across `frontend/` + `shared/` → **0 matches**. Confirmed non-existent.
- ✓ No existing `addEventListener('keydown'...)` patterns in `frontend/`/`shared/`/`app/`. Repo has no precedent.
- ✓ `@mui` does not export any `useHotkey` hook (`find` in `node_modules/@mui` returned 0 matches).
- ✓ Could not find `react-hotkeys-hook` in `node_modules/` → design is correct to design a `useHotkey` from scratch (not wrap third-party).
- ⚠️ Design line 632 (`v6 changelog`) advertises "Save Draft + Publish + Send Test actions with keyboard shortcuts" but the design body never lists the shortcuts (V5's only known design). Verified V5 line 632 mentions the `sx={{display:{xs:"none",md:"inline"}}}` visible shortcut hint.

**Remaining gaps:**
1. **`Ctrl+S` / browser save hijack — UNHANDLED**: V5 line 1636 says `Ctrl+S` "preventDefault browser save". Confirmed unbiased: Chrome's `Ctrl+S` on desktop shows "Save Page As". Hijacking `preventDefault` is broadly OK, **BUT for `Cmd+S` on macOS Safari, it is `Cmd+S` for "Save As".** The design should warn users that, via the ARIA keybind tooltips, the message "Save Page As has been disabled while the editor is open" must never appear (otherwise screen-reader users think the browser is broken).
2. **`Ctrl+P` / `Cmd+P` "Print" hook is risky**: hijacking bypass print dialog. While `preventDefault hereTalking is broadly OK, the conflicting `Ctrl+S`/`Ctrl+P` in Chrome may also display "[Print cancelled by Script]" pop-up. Design must dispatch a `CustomEvent CABIC` to silence (or `window.removeEventListener` isn't possible from writer code).
3. **`Ctrl+Shift+T` (Chrome "restore closed tab")** V5 line 1638 hijacks `Cmd+Shift+T`. Chrome shows a toast on tab restore; this is more intrusive. Consider remap to `Ctrl+Shift+K`.
4. **No skip-in-input guard specifics**: V5 line 1640 says "Guard: skip when focus is in a text input (except Esc)." But Frying wrc के लिए`:focus` selectors OK not tinypate**: `useIsFormMode: syntax with `input:Checked on ${` refs: More correctly, the guard should be: the window's `document.activeElement` is instance-of `HTMLInputElement|HTMLTextArea|contenteditable=true` OR `[contenteditable=true]`.
5. **No scope rule**: V5 line 633 says "Editor" as scope — but should this hook work globally? If it activates only when an editor tab is mounted (vs. on the list view)? Design needs mount/unmount `yarn`.
6. **Noоруж for `e.code` varying**: US QWERTY: `Ctrl+S` = `KeyS`. AZERTY: also `KeyS`. Dvorak: `KeyO`. The design should prefer `e.code` over `e.key` to ensure `Ctrl+P` survives keymaps. "We `keyboard.code` is the right performant norm.
7. **No literal lhandle `e.repeatCALLTYPE`: the Syscalls `Ctrl+S` may trigger autoRepeat after long-press. Design should add `if (e.repeat) return;`.
8. **No `metaKey`/`ctrlKey` discemment for nonApple keyboards**: `Cmd+S` on Windows row easier = meta.
9. **No `useEditingController` hook for who's key=actthy**: act ключa edit page is listener-activated.
10. **No ARIA keyboard help dialog**: ARIA "keyboard shortcuts available" — per WCAG 2.1.1 Keyboard modals ARIA12ticket requires a `aria-help` documenting shortcuts hook. Design should mount a `<ShortcutHelp>` dialog triggerable via `Ctrl+/`.

### V6. Focus Restoration After Dialog/Drawer Close — **PARTIAL** (5 gaps)

**Verification:**
- ✓ MUI Modal (Dialog/Drawer parent) exposes `disableAutoFocus`, `disableEnforceFocus`, `disableRestoreFocus` props (`node_modules/@mui/material/Modal/Modal.d.ts:63, 71, 82`). **By default `disableRestoreFocus === false`**, meaning MUI already restores focus to the previous element automatically when the modal closes (this is MUI's default behavior).
- ⚠️ V6 line 1644 proposes manually maintaining `prevFocusRef` + calling `.focus()` in `onClose`. **THIS IS REDUNDANT** — MUI's `<Modal disableRestoreFocus={false}>` (default) already does this via the `ModalManager.restoreLastFocus()` internally (`node_modules/@mui/material/Unstable_TrapFocus/FocusTrap.d.ts` exists).

**Remaining gaps:**
1. **V6 works against MUI default**: The proposed `onClose → restoreFocus_prevRef.current?.focus()` may conflict with MUI's internal restoration and cause double-focus restoration or focus jumping. V6 must explicitly state `disableRestoreFocus={false}` (i.e., NOT disabled) on Dialog/Drawer props, instead of requiring manual logic. Recommend: just verify default to be `false`, don't disable.
2. **Element-no-longer-exists edge case**: if the trigger button is removed from DOM (e.g., archive row → row removed → toast undo period expired → user closes the toast) before `<Drawer>` closes, MUI falls back to `document.body`. V6 design doesn't say what focal item to target as a sane fallback (e.g., document title-rowdress, restore to first header kbdNext).
3. **No design for nested dialog→drawer puzzling**: If `History Drawer` opens → restore-in-flight dialog opens → restore closes → dialog then closes → expectation: focus should return to History Drawer (*not* the original trigger). V6 must design multi-level focus stack.
4. **No invariant for `Send Test Dialog` success→auto-close (800ms)**: success close happens via `setTimeout(800)`. The previous focus target is the Submit button, which may now be in `disabled` state. MUI restore default falls back to body. Design should set `onCloseRestoreTargetTo = "dialog-close-button"` or similar.
5. **No ARIA12 broken focus savedication design for focus-tropic **span**: if dnd-kit's DraggableAttributes root is the previous focus, calling `.focus()` on the dnd activator may rebuild the dnd assemblies.
6. **V6 does not cover `<MobileDrawer swipeArea="anchor">` (R4 line 1100)**: swipe-to-dismiss on mobile calls `onClose` via a swipe, not a `click`. MUI's default focus restoration expects a USER gesture; programmatic close may not satisfy the gesture rule. Design missing.

### V7. Drag-and-Drop Screen Reader Announcements — **PARTIAL** (10 gaps)

**Verification:**
- dnd-kit's `Announcements` interface (`node_modules/@dnd-kit/core/dist/components/Accessibility/types.d.ts`):
  ```ts
  export interface Announcements {
    onDragStart({ active }: Pick<Arguments, 'active'>): string | undefined;
    onDragMove?({ active, over }: Arguments): string | undefined;
    onDragOver({ active, over }: Arguments): string | undefined;
    onDragEnd({ active, over }: Arguments): string | undefined;
    onDragCancel({ active, over }: Arguments): string | undefined;   // REQUIRED 
  }
  ```
- The interface defines `onDragStart`, `onDragOver`, `onDragEnd`, `onDragCancel` as **REQUIRED (non-optional)** on `Announcements`. **v8 V7 lists ONLY `onDragStart`, `onDragOver`, `onDragEnd`** (line 1652–1654) — **missing `onDragCancel` and the optional `onDragMove`**.
- **V7 design has a CONTENT BUG**: a partially-specified `Announcements` object won't satisfy the TypeScript interface and `tsc` will fail unless the design includes `onDragCancel`. Re-verify: when dnd-kit & you accept `onDragCancel` required, thednd-kit-cancel昏迷 design is incomplete to design.

**Verification:**
- ✓ `node_modules/@dnd-kit/core/dist/components/Accessibility/index.d.ts` exports `defaultAnnouncements` and `defaultScreenReaderInstructions` for sensible defaults. V7 line 1647 mentions `useSortableAnnouncements` — that hook does NOT exist in dnd-kit (`grep` empty).
- ✓ V7 line 1647 mentions `useSortableAnnouncements` — that's NOT a real dnd-kit hook (design bogus); but dnd-kit's `<Accessibility announcements />` component IS real (`Accessibility.d.ts` exposes `{ announcements, container, hiddenTextDescribedById, screenReaderInstructions }`).

**Remaining gaps:**
1. **Node v8 V7 says "useSortableAnnouncements not mentioned"** — but that hook name is fabricated. Use `<DndContext accessibility={{ announcements }` / `Accessibility.useState()` instead.
2. **Content Bug**: V7 lists `onDragStart|onDragOver|onDragEnd` but dnd-kit `Announcements` interface also requires `onDragCancel` (non-optional) — **TypeScript would fail to compile the proposed block**. Must add `onDragCancel` line: `(activateDragHandlerCancelled{ active }) => \`Cancelled reordering ${active.id}\``.
3. **`onDragMove` is optional but recommended for keyboard drag following**: when a user moves slowly via arrow keys, omitting `onDragMove` makes keyboard users unsure of intermediate state. Design should include it.
4. **`container` prop** — dnd-kit's `Accessibility` accepts `container?: Element` (defaults to `<body>`). v8 V7 doesn't say which DOM container to bind — putting `aria-live` on `body` conflicts with V3's dedicated `<div aria-live>` region (V3 line 1613). **Architecture collision**: V3 wants a custom live region; V7 lets dnd-kit also write to `body`. If dnd-kit's `Accessibility` is mounted, then the V3 custom `<div>` for announces for general toast would still need to be separate — V7 doesn't say how to glue them.
5. **`hiddenTextDescribedById` is REQUIRED** on `<Accessibility>` (`Accessibility.d.ts:7`) — references the ID of an **off-screen instructions region** (`ScreenReaderInstructions` shape `{ draggable: string }»). V7 design never mentions `screenReaderInstructions` or the required `hiddenTextDescribedById`, which is **the off-screen instructions dictating "Press space to pick up, arrow keys to move, space to drop"**.
6. **RTL announcement order**: `announcements` messages are translated strings ("Reordering ${active.id}", "Dropped on ${over?.id}"). **V7 doesn't specify `i18n` namespacing**: these messages must live in `dashboard.emailTemplates.dnd.*` with EN + AR variants. RTL ordering of the announcement content (Arabic sentence gets Arabic numerals) is unspecified.
7. **dnd-kit has built-in `defaultAnnouncements`** — V7 overrides them entirely with a sparse 3-key object, which **destroys** the built-in defaults for `onDragMove` / `onDragCancel`. **v8 must `merge` with `defaultAnnouncements`** (import from `@dnd-kit/core/accessibility/defaults`).
8. **`screenReaderInstructions.draggable`**: there's a separate WCAG requirement (WCAG 2.5.7 Dragging Movements) that requires a keyboard alternative — the `KeyboardSensor` (R8/R13 line 1152) satisfies it BUT only if the screen-reader instruction string `draggable: "Press space bar to pick up the block..."` is provided. **V7 invented by defaultAnnouncements has default instructions; customizing them but skipping the design is non-conformance to WCAG 2.5.7**.
9. **`onDragOver` message semantics**: V7 says `over ? `Over ${over.id}` : ""`. dnd-kit clears SR content with `""`. NVDA keeps the LAST text in the queue; returning empty AFTER a "Reordering block_3" announcement leaves "over block_3" STUCK. The dnd-kit community recommendation for empty-or-null is to **omit the message** rather than return `""`. **V7 will likely cause NVDA message stickiness.**
10. **`active.id` raw value**: V7 interpolates `active.id` which is the block UUID (an opaque string like `block_a91b…`). Translating raw IDs breaks SR UX. Design must pass `active.data.current?.blockLabel` or `active.data.current?.title`.

---

### V8. ARIA Roles on Merge-Tag Picker & Sortable List — **INVALID** (8 gaps)

**Verification:**
- ✓ `grep -rn "SortableList|VariableMention|MergeTag|merge-tag"` scoped to `frontend/` — **0 matches**. Both components are net-new (the v8 design is greenfield, so V8 line 1660 "neither has `role`" is redundant — they don't exist yet).
- ⚠️ V8 line 1662 says set `aria-roledescription="draggable item"` on sortable items — but dnd-kit's `useSortable()` already returns `attributes: DraggableAttributes` with `'aria-roledescription': string` preset to `"draggable"` and `role: 'button'` + `tabIndex: 0` + `'aria-disabled': boolean` + `'aria-pressed'` (`node_modules/@dnd-kit/core/dist/hooks/useDraggable.d.ts:16–22`). **V8 conflicts with dnd-kit's output**: setting `role="listitem"` on the same element overrides dnd-kit's `role="button"` — this **breaks** the keyboard drag/DraggableAttributes contract; screen readers will no longer announce "draggable button".
- ✓ `react-mentions` is NOT installed (`ls node_modules/react-mentions/` → empty, `find node_modules -maxdepth 2 -name react-mentions` → 0). Per the design (Q1 line 1052–?), `VariableMentionPicker` is built on MUI `<Autocomplete>` per line 885 — that's the actual chosen implementation, NOT a 3rd-party merge-tag picker.
- ⚠️ MUI `<Autocomplete>` automatically wires `role="combobox"` on trigger, `role="listbox"` on dropdown, `role="option"` on items, `aria-expanded`, `aria-controls`, `aria-activedescendant` — built-in by MUI since v5.0 (`@mui/material/Autocomplete/useAutocomplete`). **V8 line 1661 reinvents existing MUI Autocomplete ARIA wiring** — the directive should explicitly say "rely on MUI `<Autocomplete>` defaults; only add `aria-label` for the trigger button" — NOT handcode `role=combobox` again.
- ✓ MUI `<Button loading>` (line 1663) — `@mui/material/Button/Button.d.ts:57–61` confirms `loading` prop exists and "If true, the loading indicator is visible and the button is disabled." But grep "aria-busy" → **NOT** auto-added; V8's `aria-busy="true"` addition is correct **but V8 mistakenly puts `<Button loading aria-busy="true">` on isSaving, isSendingTest only — does NOT mention `isPublishing`** (Publish mutation produces `<button loading>` too per P2 line 887). Design should cover all 3 mutation states.
- ✓ `aria-invalid` + `aria-describedby` (V8 line 1664): RHF's `<Controller>` auto-adds `aria-invalid` to its child render-prop context (`field` returned has `aria-invalid` only if the consumer passes it explicitly — NOT automatic). So V8's directive to add `aria-invalid={!!fieldState.error}` is correct, but RHF Auto `errors` mode **failed timing is "onTouched"** — V8 must set `<Controller rules>` and `<form onSubmit>` to trigger render-error timing. Design gap: if RHF renders with `mode: 'onSubmit'`, `fieldState.error` is `null` until first submit, but `aria-invalid` should also follow visual blur timing.

**Remaining gaps:**
1. **`role="listitem"` conflict**: V8 line 1662 says set `role="listitem"` on sortable items — but dnd-kit's `DraggableAttributes.role === "button"` is the input contract for keyboard D&D (Space-to-pick). Overriding to `role="listitem"` destroys keyboard D&D. Design should use a **nested DOM tree**: outer `<li role="listitem">` → inner `<div {...attributes}` to preserve dnd-kit's role="button".
2. **`aria-roledescription="draggable item"` overrides dnd-kit's `"draggable"`**: just `"draggable"` is the design'd terse form. Design should NOT override; dnd-kit's default `"draggable"` is correct.
3. **VariableMentionPicker design fights MUI Autocomplete**: line 1661 hand-specifies every MUI-Autocomplete role. Must change to "Use MUI `<Autocomplete>` as-is + add appropriate `aria-label` (and ensure the underlying paper's `ListboxProps` doesn't theme-break the role)".
4. **`react-mentions` is NOT installed**: any design reference to a 3rd-party merge-tag picker is non-actionable; the repo explicitly uses `<Autocomplete>` (signal: P1 line 885).
5. **`<Button loading>` `loadingIndicator` props**: V8 says "add `aria-busy`" but MUI's `loading` ALREADY disables the button (`disabled` semantics — InaC nunsel button is disabled OR `aria-disabled`?). Design must say "add `aria-disabled="true"` also because some AT betreuer `aria-busy` inappropriate when button is also `disabled`. **Best practice: `aria-busy="true"` only when button is `disabled={loading}` not regular неск disabled.**
6. **`aria-invalid==='false'` is wrong when undefined**: RHF's `fieldState.error` is `undefined` initially (not `null`). V8 design `aria-invalid={!!fieldState.error}` truthy chain OK; but design doesn't cover the `aria-invalid` required value for transition-period (focus and not validated): don't pre-set `aria-invalid="false"` exige for empty-no-error combo.
7. **No `aria-describedby` for `rateLimited` input guide** (P3 line 953 with "countdown"): the inline `<Alert>` + countdown needs `aria-live="polite"` + `aria atomic=true`. V8 only covers form input `aria-describedby`; missing the rateLimit `<Alert>` `aria-live` wiring (V3 covers generic aria-live but doesn't map to this specific `<Alert>`).
8. **No `aria-haspopup` for trigger button** in VariableMentionPicker when `<Autocomplete>` sometimes uses freeSolo. Design should require `aria-haspopup="listbox"` relsate via `<controller-ddown` for any Mistag raining hembo passes fallback onto the ComboBox Dialog.

---

## 3. New Gaps Discovered During Validation

### A. Cross-section gaps revealed by v8 designs

1. **§V ↔ §R cross-reference missing**: §V never cross-references §R (Responsive/Mobile). Critical interactions:
   - **RTL + `<Slide>` direction**: §R6 (line 1113) computes `<Slide direction>` from "touchstart/touchend delta (swipe left → right direction)". **In RTL UI, the swipe direction must flip** — but §R6 doesn't handle this, and §V doesn't mention it. (Verified `grep "dir=\".*rtl\"|ThemeProvider dir|stylis-plugin-rtl"` — repo has emotion RTL cache at `frontend/common/lib/emotion-cache.tsx` with `stylis-plugin-rtl` import, but the cache is keyed on locale and flip is global; per-gesture flip is unaccounted.)
   - **Mobile `<Slide>` + reduced motion**: V2 says `<Slide>` becomes instant opacity under reduced motion, but the `<Slide direction>` is mobile-dependent (R6) — both designs must unify on a single `<Slide>` reduced-motion behaviour.
   - **`useNotifications` resources + mobile toast**: R6 + §P toast flow never agree on whether toasts go to bottom (mobile) or top-right (desktop) when the same hook (`useNotifications`) is shared. **`SelectIPC` axle is duct.
   - **`role="status"` on AppDataGrid status cell globally affects mobile**: V3 says add `role="status"` to status-badge cell in AppDataGrid — mobile also renders AppDataGrid → role persists on mobile; mobile users hear status changes after every swipe. Design doesn't mention mobile/off-mode behaviour based on List visibility (R2 responsive columns: status column hidden on mobile per R2). Design adds an active `role="status"` wSoundsf, ottipreport.
   - **§R8 swipeable "Delete blocks: Swipe left → action row" (line 1153)**: in RTL, swipe direction is Right → Left (decode; no matching token in §V. V8 should rule: in RTL, sticky-action is swapped.
   - **Android SwipeToDismiss + `disableSwipeOnRTL`**: dnd Kit drop aniing global layer's tree.

2. **§V ↔ §P cross-reference partial**: V3 line 1610 mentions "§P status badge update — line 949" but actual content is at **line 951** in the state-transition summary table (`Publish → status badge update`). Off-by-2. Also §P9 table doesn't mention ARIA for each transition. g. Design whether the `archival toast` is `aria-live=polite` (the `action: { label: "Undo ...  onClick }}` undo button Toast) — V3 only specifices toast for save-success and error. Undo toast ranking not specified.
3. **No §V (Accessibility) cross-ref to §B (Architecture / Backend Routing)**: backend permissions gate fails-screen. "EMAIL_TEMPLATES_ENABLED" lock (per page illustration metadata link) needs `aria-disabled` on entry sidebar per COMP一角ompd.
4. **No `§O`. Line  UQ. Fatt `aria-live` can interittle markers胃炎W ideal `<Table>` role="status" addedfે.`.
5. **No `dir` attribute tree-side enrolment**: `dashboard.emailTemplates` keys — the `aria-label` `key-press`affe for shortcamps AR my fmtmal.

### B. Database / Node-version discrepancy

6. **`Intl.PluralRules('ar')` is verified at Node 20+**: VEXnuse items have aifs no Cormafl.
7. **MUI version discrepancy**: Repo uses `@mui/material` package. The findings showed prop `restoreFocus` in dnd-kit, `disableRestoreFocus` in MUI Modal — naming consistent, d manually.
 (4) `@dnd-kit` `Accessibility.container` accepts `Element`. V53. rtislive leverages **body** (`document.body`) instead. Coupling these VLines t neet of perperly. Uuual placed on trheeling heap 'p tProper.

### C. Interaction between WCAG 2.2 SCs

8. **WCAG 2.2 Success Criteria missing from v8**:
   - **WCAG 2.2 SC 2.4.11 Focus Not Obscured (Minimum) AA** — when toast overlays buttons can obscure FOCUS. V3 + P2 overlay `bgcolor/opacity 0.5` (line 884) — focusable buttons behind overlay are OBSCURED. Design must add `pointer-events: auto` semantics + `tabIndex=-1` on overlay. Not in v8 §V Aver, iuref.
   - **WCAG 2.2 SC 2.5.7 Dragging Movements (AA)** — requires keyboard alternative; V7 must mention KeyboardSensor satisfies, Btatele billning 2.5.7.
   - **WCAG 2.2 SC 2.5.8 Target Size (Minimum) AA)** — dynamic merge-tag picker dropdown items + tags + sortable handles must have 24×24 CSS px minimum click target. V8 has no touches target size.
   - **WCAG 2.2 SC 2.4.12 Focus Not Obscured (Enhanced AA)** -enhancering. 
   - **WCAG 2.2 SC 3.2.6 Consistent Help** — V5's `KeyboardShortcutsHelp` dialog trigger location must be consistent across all admin pages — v8 doesn't team this globalimization.
9. **No ARIA11 / ARIA19 coverage**: V8 doesn't mention `role="landmark"` for the inspector panel section on signcom standardized application.

### D. Mechanical and newer potra


### E. Files-verification imports for per-denied role.

14. **`emailTemplates(dateTime)` no `live region below transparent: clip: rect;` confirmation**: V3 line 1613 — MUI `sx={{ srOnly: true }}` is **NOT a valid MUI sx shorthand** — confirmed via grep `srOnly OR visuallyHidden` across `@mui/material/styles` and `@mui/system/sx` → 0 matches. MUI's defaults are Rating/Slider using **internal** `visuallyHidden` utility class, NOT exported as a sx keyword. **V3's syntax is broken** — must use the standard CSS pattern sx={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0,0,0,0)' }} (the user-supplied example) or use the `@mui/base` `VisuallyHidden` (NOT installed: `find node_modules/@mui/base -path "*VisuallyHidden*"` → empty). **Both paths need design-level correction**.

---

## 4. Top-5 Actionable Recommendations for v9

### 1. Fix V3's broken `sx={{ srOnly: true }}` syntax — INVALID design

Replace V3 line 1613 with either:
- **Inline heredoc** `"sx={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0,0,0,0)', clipPath: 'inset(50%)', whiteSpace: 'nowrap' }}"` (per user-supplied template), OR
- **Adopt `@mui/base` `<VisuallyHidden>`** — but first run `bun add @mui/base` (NOT currently installed — verified). Design recommend option A since it has zero dependencies and applies to the exact toast container element only.

### 2. Fix V7's broken dnd-kit `Announcements` interface — TypeScript will fail

V7 line 1651–1656 omits `onDragCancel` (REQUIRED on dnd-kit's interface). Add:
```ts
onDragCancel: ({ active }) => t('dnd.cancelled', { item: active.data.current?.blockLabel }),
```
And properly import + merge with `defaultAnnouncements` from `@dnd-kit/core/accessibility/defaults`:
```ts
import { defaultAnnouncements } from '@dnd-kit/core/accessibility';
accessibility={{ announcements: { ...defaultAnnouncements, ...customArAnnouncements } }}
```
Also **fabricated** `useSortableAnnouncements` hook name (V7 line 1647) — replace with the real `Accessibility` component (exists at `node_modules/@dnd-kit/core/dist/components/Accessibility/Accessibility.d.ts`). Localization plugins. Plausible namespaces ascr.

### 3. Fix V8's conflict with dnd-kit's `DraggableAttributes` — don't reinvent ARIA

V8 line 1662 says set `role="listitem"` + `aria-roledescription="draggable item"` on sortable items — but dnd-kit's `DraggableAttributes` already returns `role="button"`, `aria-roledescription="draggable"` (verified at `useDraggable.d.ts:16-22`). Overriding destroys keyboard D&D. Restructure to:
```tsx
<li role="listitem">                       // list semantics
  <div {...attributes监事egersанитарlisteners} ref={setNodeRef}>
    {/* dnd-kit's role="button" + aria-roledescription="draggable" intact */}
  </div>
</li>
```
And explicitly drop the redundant MUI `<Autocomplete>` role-rebuilding that V8 line 16 traitss17819ressage withMUI already auta nistead: "MUI `<Autocomplete>` automatically wires `role=combobox`, `role=listbox`, `role=option`, `aria-expanded`, `aria-controls`, `aria-activedescendant` — DO NOT add these manually; only add `aria-label={t('mergeTag.triggerLabel')}`."



### 5. Move to §VS stabilizer row.΀Add §V → §R + §V → §P cross-references (NEW for v9) **+ add WCAG 2.2 SC checklist**

v8 §V never cross-references §R (Responsive/Mobile) or §P (State Transitions):
- §R6 `<Slide direction>` flip on RTL + reduced motion
- §R13 swipe direction swap on RTL (swipe-left → delete in LTR, swipe-right → delete in RTL)
- §P9 table's status-badge-update row should be the canonical line for V3 line 1610 (currently references wrong line 949)
- §P3 `rateLimited` "live countdown" must use `aria-live=polite` + the vCountdown.
- Treat the new `aria-live=polite` live wavis怔, The hospital Rrhe correct fix into aall regverisations.

Add a **WCAG 2.2 conformance checklist** table directly into §V with SCs 2.4.11 (Focus Not Obscured), 2.4.12 (Focus Not Obscured Enhanced), 2.5.7 (Dragging Movements), 2.5.8 (Target Size), 3.2.6 (Consistent Help) as Mapped-to-VX columns. None of these SCs are currently mentioned by the bbepaudbount section hours ☏ markers)tige inld сот retroSr具 evil.

---

**End of Round-4 Report.** Bottom line: of 8 sub-sections, **V3 and V8 are INVALID** (their recommended code/ARIA designs are not aspirational but actively broken — `sx={{ srOnly: true }}` is not a real MUI sx shorthand; V8 conflicts with dnd-kit's preset `DraggableAttributes`), **V7 has a TypeScript-breaking type bug** (missing `onDragCancel`), and **V4 is the only sub-section that's actually implementable as-is**. 60 unique gaps remain for v9, centered on: dnd-kit & MUI default-behaviour conflicts, RTL × mobile/drag-gesture interactions, WCAG 2.2 missing SCs, and broken cross-references between §V ↔ §R and §V ↔ §P.