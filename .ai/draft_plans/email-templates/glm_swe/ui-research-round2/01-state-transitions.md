# Round 2 Audit — State Transitions & Edge Cases

## Summary

**32 gaps identified** across 8 categories. **Critical: 6**, **High: 10**, **Medium: 10**, **Low: 6**. v6 specification covers skeletons and happy-path UI well, but omits mutation-level loading states, optimistic transitions, conflict resolution, network-edge guards, and several form/editor edge cases. Most gaps map to existing repo patterns (Zustand `isLoading`/`error`, `useNotifications` toast, `useManualInvoiceViewModel` `isSubmitting`/`showSuccess`, `useApolloConnectivity` offline detection, `MetricCard` stagger entrance) — fixes are low-effort insertions.

---

## Critical Gaps (must-fix before implementation)

1. **Inspector panel skeleton missing** — [§B L854] Plan specifies `EmailEditorSkeleton` with "editor frame block shimmer + Inspector panel shimmer" but no dedicated Inspector-only skeleton for when the editor loads faster than template data (common on slow connections). The Inspector (scope/locale/version/editor groups/subject/attachments) should shimmer independently. **Fix**: Add `InspectorSkeleton` component to `EmailEditorSkeleton.tsx` reusing `<Skeleton variant="rectangular" height={...} />` per MUI pattern; ViewModel exposes `inspectorLoading` (Apollo `loading` from template query) separate from `editorLoading`.

2. **No button-level `loading` prop on mutation buttons** — [§D L916–920] Save Draft, Publish, Send Test buttons have no inline spinner state. Plan mentions `<CircularProgress size={20} color="inherit">` inside buttons (§G L960) but never wires it. **Fix**: ViewModel returns `isSaving`, `isPublishing`, `isSendingTest` booleans (Apollo `loading` from each mutation); tier views pass `loading={isSaving}` to `<Button>`. Precedent: `useManualInvoiceViewModel` L251 `isSubmitting` drives button spinner in `ManualInvoice.desktop.tsx`.

3. **No optimistic UI on Save Draft** — [§D L916] Save Draft has no local-first update. User sees no feedback until server responds (slow on large templates). **Fix**: On `saveDraft` mutation start: (a) set `isDirty=false` locally, (b) update Zustand `lastSavedContent = currentDesignJson`, (c) show transient "Saving…" on button, (d) on success → "Saved ✓" toast + 2s auto-dismiss; on error → rollback `isDirty=true`, restore `designJson` from `lastSavedContent`, toast error. Precedent: `useManualInvoiceViewModel` L146–149 uses `onCompleted`/`onError` for success/error UI; `usePaymentCatalogAdminViewModel` L115–120 shows `handleSaved` with `notifications.show` + `refetchActive`.

4. **No conflict detection / version-mismatch handling** — [§D L918] Publish confirm dialog exists but no 409-style "version changed by another admin" flow. i18n key `dashboard.emailTemplates.error.versionMismatch` exists (L1160) but no UI. **Fix**: Server returns `VERSION_MISMATCH` (expected: N, got: M); client shows `<Dialog>` with "Template was edited by another admin (v{M}). Overwrite their changes or reload?" Actions: `Overwrite` (force publish with current version) / `Reload` (fetch latest, re-apply local edits via diff). Requires GraphQL error code mapping in ViewModel `onError` branch.

5. **No offline indicator / mutation gating** — [§G L982] `useApolloConnectivity` exists (L39–199) with `isConnected` + auto-reconnect + toast on disconnect, but plan never wires it to email editor. **Fix**: In `useEmailTemplateEditorViewModel`, subscribe to `useApolloConnectivity().isConnected`; when `false`, disable Save/Publish/Send Test buttons with tooltip "Offline — changes cannot be saved"; show top banner `<Alert severity="warning">You're offline. Changes will sync when reconnected.</Alert>`. Persist draft to `sessionStorage` on `beforeunload` if offline (see Gap 25).

6. **Session expiry mid-edit not handled** — No plan for JWT expiry during edit. **Fix**: Apollo link error interceptor detects `UNAUTHENTICATED`/`FORBIDDEN` on any mutation → toast "Session expired. Please log in." + persist full `designJson` + inspector fields to `sessionStorage` keyed by template ID → redirect to login; on post-login redirect back to editor, pre-fill from `sessionStorage` and show toast "Draft restored from previous session." Precedent: `useApolloConnectivity` L102–119 shows notification + retry pattern; `logger.error` used per repo rule (L152).

---

## High-Priority Gaps

7. **History drawer: no loading/error/empty states** — [§D L922] "Empty state when no revisions exist" covered, but no `loading` (versions fetching), no `error` (fetch failed), no `restoreInFlight` (button spinner), no `restoreConflict` (concurrent edit), no `previewBeforeRestore`. **Fix**: Drawer content = conditional: `loading ? <HistorySkeleton /> : error ? <ErrorState onRetry={refetchHistory} /> : empty ? <EmptyState /> : <VersionList />`. Each row "Restore" button has `loading` prop; on click → optimistic `isRestoring[v]=true`; on error → rollback + toast `versionMismatch`.

8. **Send Test: missing validation UI before submit** — [§F L946–948] To input has Zod email validation but no inline error display spec; sample props JSON has no validation (invalid JSON → silent fail or 500). **Fix**: `react-hook-form` + Zod on both fields; `<FormHelperText error>` on invalid email; `try { JSON.parse(sampleProps) } catch` → inline error "Invalid JSON"; disable Submit until both valid. Precedent: `useManualInvoiceViewModel` L188–199 shows RHF + Zod + `FormHelperText error` pattern.

9. **Send Test: no success toast with "Test sent to X" + checkmark** — [§F L950] Mentions `SuccessCheckMark` animation but no confirmation toast text. i18n has `toast.testSent: (to: string) => string` (L1157). **Fix**: On mutation `onCompleted`: `notifications.show(t("toast.testSent", { to }), { severity: "success" })` + trigger `SuccessCheckMark` in dialog before close (L958). Precedent: `usePaymentCatalogAdminViewModel` L118 `notifications.show(labels.saveSuccess, { severity: "success" })`.

10. **Send Test: rate-limit notice state** — [§F L948] "If mutation returns `RATE_LIMITED` error, render inline error text" but no UI spec for countdown or static notice. **Fix**: On `RATE_LIMITED` error (includes `retryAfterSeconds`), show inline `<Alert severity="warning">Rate limited. Try again in {countdown}s</Alert>` with live countdown (decrement every second); disable Submit during countdown. Also static notice "Max 5 test emails/min" always visible per plan.

11. **List view: empty search results distinct from empty state** — [§C L876] "Empty state" component reused but no `noSearchResults` i18n key distinction (L1163 has `noSearchResults` but plan doesn't wire it). **Fix**: DataGrid `emptyMessage` prop receives conditional: `hasActiveFilters ? t("empty.noSearchResults") : t("empty.emptyState")`. EmptyState `action` button (Create) only shown when `!hasActiveFilters`. Precedent: `ErrorState` L5–8 takes `retryLabel`/`onRetry` for contextual retry.

12. **List view: server-side pagination error + retry** — [§C L861] `AppDataGrid` takes `loading` prop but no error boundary for page fetch failure. **Fix**: ViewModel exposes `paginationError` (Apollo `error` from query); DataGrid wrapper renders `<ErrorState embedded onRetry={refetchPage} retryLabel={t("common.retry")} message={t("error.loadFailed")} />` inside grid container when error + !loading. `refetchPage` calls Apollo `refetch` with current page variables.

13. **List view: no optimistic archive (row removal + undo toast)** — [§C L874, L889] Archive action shows toast after server response; no immediate row removal. **Fix**: On Archive click: (a) optimistically remove row from local data array (Zustand), (b) show toast "Archived. Undo?" with `onAction: undoArchive`, (c) mutation in background; on success → keep removed; on error → re-insert row + toast error. Precedent: `usePaymentCatalogAdminViewModel` L122–143 `handleConfirmDelete` has try/catch + `notifications.show` but no optimistic UI — this is the gap to close.

14. **List view: no row-level loading during bulk/single archive** — [§C L887] Phase 2 bulk actions have no per-row spinner. **Fix**: DataGrid row renderer receives `isArchiving[id]` map; row actions menu "Archive" item disabled when `isArchiving[id]`; show `<CircularProgress size={16} />` next to row. Other rows remain interactive.

15. **Preview tab: no loading/error/empty states** — [§E L930–942] Preview tab spec covers iframe + CSP + viewport selector but no states for: (a) compiling HTML (loading), (b) template has invalid merge tags → DOMPurify/render fails (error), (c) body not yet rendered (empty), (d) unsaved draft warning banner. **Fix**: Preview ViewModel returns `previewStatus: "idle" | "compiling" | "ready" | "error"`; tab renders conditional: `compiling ? <Skeleton /> : error ? <ErrorState onRetry={recompile} /> : empty ? <EmptyState /> : <IframePreview />` + `unsaved ? <Alert severity="info">Preview reflects unsaved changes</Alert> : null`. Precedent: `ErrorState` pattern L11–35.

16. **Stale tab detection (multi-tab edit)** — [§D L925] Plan covers `beforeunload` + in-app nav guard but not detection when another tab saves. **Fix**: Apollo `watchQuery` on template (or lightweight poll every 30s) compares `version` field; if server version > local version → show non-blocking `<Snackbar>` "Template updated in another tab. Click to reload." On click → `router.refresh()` + re-fetch. Alternative: `focus` event listener triggers version check. Precedent: `useApolloConnectivity` L168–187 uses `online`/`offline` listeners — same pattern for `focus`.

---

## Medium-Priority Gaps

17. **Merge-tag picker: empty state (no variables for scope)** — [§D L912–915] `VariableMentionPicker` lists `Props` keys from `EmailPropsByScope` but no empty state UI. **Fix**: Autocomplete `emptyText={t("editor.mergeTags.noneAvailable")}`; disable insertion button when empty.

18. **Merge-tag picker: sample props mismatch warning** — [§D L915] Template uses `{{user.name}}` but sample props lack `user.name` → no inline warning. **Fix**: In Preview tab + Send Test dialog, compute `missingVars = templateVars.filter(v => !sampleProps.has(v))`; if non-empty, show `<Alert severity="warning">Sample data missing: {missingVars.join(", ")}. Preview may not render correctly.</Alert>`.

19. **History drawer: preview older version before restore** — [§D L922] Restore button only; no preview. **Fix**: Add "Preview" button per version row → opens Preview dialog with that version's compiled HTML (read-only).

20. **Preview iframe: viewport selector re-render fluidity** — [§E L939] `<ToggleButtonGroup>` changes iframe width but no transition. **Fix**: Animate width via `sx={{ transition: "width 200ms ease" }}`; respect `usePrefersReducedMotion()` → instant swap.

21. **Editor: unsaved changes + logout** — [§D L923–925] `beforeunload` + in-app nav covered; logout not mentioned. **Fix**: Auth store logout action checks `emailTemplateEditorStore.isDirty` → if true, show confirm dialog "Unsaved changes will be lost. Log out anyway?" (separate from `beforeunload`).

22. **Editor: unsaved changes + idle timeout** — No idle timeout in repo today. **Fix**: If app adds idle timeout (future), same pattern as logout: check `isDirty` → confirm before auto-logout.

22. **History drawer: restore conflict (version edited by another admin)** — [Gap 4] applies to restore too. Server returns `VERSION_MISMATCH` on restore mutation; same Overwrite/Reload dialog.

23. **List view: stale data after background refetch** — [§C L861] Apollo cache updates but plan doesn't specify list re-render behavior. **Fix**: `useQuery` with `fetchPolicy: "cache-and-network"` (default) auto-re-renders; document this in ViewModel comment. No extra code needed — just verify.

24. **Bulk action confirmation dialog** — [§C L887] "Confirm dialog" mentioned but no spec. **Fix**: Dialog title `t("dialog.bulkArchiveConfirm", { count })`; body `t("dialog.bulkArchiveBody")`; actions Cancel / Archive; `loading` on Archive button during mutation.

25. **Draft persistence to sessionStorage for offline/refresh** — [Gap 5, 6] No plan for `sessionStorage` backup. **Fix**: `useEffect` on `designJson` + inspector fields → `sessionStorage.setItem("emailTemplateDraft:{id}", JSON.stringify({ designJson, subject, attachmentRules, sampleProps, timestamp }))`; on editor mount, if `isNew` false and `sessionStorage` has newer timestamp than `lastEdited` → prompt "Unsaved draft found. Restore?" (distinct from server version).

---

## Low-Priority Gaps / Nice-to-haves

26. **Save button "Saved ✓" transient state** — [Gap 3] Covered in optimistic fix but explicit 2s checkmark animation on button itself (not just toast) is a nice touch. Precedent: `SuccessCheckMark` L958.

27. **Publish button "Publishing…" → "Published ✓" states** — Mirror Save pattern.

28. **Keyboard shortcut indicator tooltips** — Ctrl+S / Ctrl+Enter shortcuts mentioned (L917–918) but no tooltip on buttons showing `⌘S` / `⌘Enter`. **Fix**: `Button title={isMac ? "⌘S" : "Ctrl+S"}` using `navigator.platform`.

29. **Drag-and-drop block reorder: loading state while persist** — [§G L959] `@dnd-kit/sortable` has built-in CSS transform but no server persist loading. **Fix**: On `onDragEnd`, set `isReordering=true`; mutation → on complete `isReordering=false`; during reorder, disable Save/Publish.

30. **Editor CSS var transition on theme toggle** — [§I L1001] `--re-*` CSS vars change on dark/light but no transition. **Fix**: `style={{ transition: "background-color 200ms, color 200ms" }}` on `<EmailEditor>` host; respect `usePrefersReducedMotion()`.

31. **Send Test dialog: "Send to my own email" pre-fill** — [§F L949] Marked Phase 2 but easy win. **Fix**: Button `onClick={() => setTo(getCurrentUserEmail())}` from auth store.

32. **History drawer: version chip tooltip shows full timestamp** — [§D L922] "lastEdited tooltip" mentioned; ensure `formatDistanceToNow` + full ISO on hover.

---

## Verified Items (v6 already covers these well)

- ✅ Route structure + permission gates (two-layer: server `requirePermissionForPage` + client `<RequirePermission>`)
- ✅ Tier-split architecture (common ViewModel/Container + mobile/desktop pure presentation)
- ✅ `EmailEditorWrapper` with `next/dynamic({ ssr: false })` — correct isolation of TipTap SSR issues
- ✅ `ScopedCssBaseline` + `EmailTheming` from `/plugins` subpath — correct theming layers
- ✅ Three-tab editor (Design/Preview/Code) with `<Slide>` transitions + `usePrefersReducedMotion` guard
- ✅ Preview iframe sandbox CSP (`default-src 'none'`, `img-src 'self' data:`) + DOMPurify server-side
- ✅ Send Test dialog structure (To + sample props + rate-limit notice)
- ✅ History drawer with restore-to-draft flow + confirm dialog
- ✅ `isDirty` + `beforeunload` + in-app nav guard (back button + tab clicks)
- ✅ `StatusBadge` extension with `emailTemplate` category (Draft=warning, Published=success, Archived=disabled)
- ✅ Complete i18n key catalogue (two namespaces: `emails.errors` + `dashboard.emailTemplates`; 7-file atomic changesets with V4-3 lockstep)
- ✅ `usePrefersReducedMotion` hook — closes production gap
- ✅ Storybook stories table (15 components) + test files table (12 unit + 1 E2E)
- ✅ Feature flag visual cue (lock icon + disabled actions when `EMAIL_TEMPLATES_ENABLED=false`)

---

## Codebase Precedents Referenced

| File:Line | Pattern |
|-----------|---------|
| `useManualInvoiceViewModel.ts:146–149` | Apollo mutation `onCompleted`/`onError` → `setIsSubmitting(false)` + `setShowSuccess(true)` / `logger.error` + toast |
| `useManualInvoiceViewModel.ts:251` | `isSubmitting` boolean drives button `loading` prop |
| `useManualInvoiceViewModel.ts:188–199` | `react-hook-form` + `zodResolver` + `FormHelperText error` validation pattern |
| `usePaymentCatalogAdminViewModel.ts:115–120` | `handleSaved` → toast success + `refetchActive` |
| `usePaymentCatalogAdminViewModel.ts:122–143` | `handleConfirmDelete` try/catch + toast success/error + `setIsDeactivating` |
| `useApolloConnectivity.ts:39–199` | Offline detection (`isConnected`), auto-reconnect, `notifications.show` with `actionText`/`onAction` retry |
| `useApolloConnectivity.ts:168–187` | `online`/`offline` event listeners pattern → reusable for `focus` stale-tab check |
| `MetricCard.tsx:82–88` | Framer-motion entrance stagger: `initial={{opacity:0,y:24}} animate={{opacity:1,y:0}} transition={{duration:0.4, delay:index*0.04}}` |
| `ErrorState.tsx:5–35` | Embedded error with retry button (`onRetry`, `retryLabel`) — reusable in DataGrid, Preview, History |
| `frontend/common/stores/permissionManagementStore.ts:19–20` | Zustand `isLoading: boolean`, `error: string \| null` — pattern for list/editor stores |
| `frontend/common/utils/logger.ts` | Centralized `logger.error/info/debug` — NEVER `console.*` (repo rule) |
| `@toolpad/core/useNotifications` | `notifications.show(message, { severity, autoHideDuration, actionText, onAction })` — NOT Notistack |

---

## Recommended v7 Plan Edits

**Insert new sub-section "P. State Transitions & Edge Cases" after §O (Feature Flag Visual Cue) in the Frontend section (~line 1091):**

```markdown
#### P. State Transitions & Edge Cases

**P1. Loading States (beyond skeletons)**
- Inspector panel: dedicated `InspectorSkeleton` (rectangular shimmers for scope/locale/version/editor-groups/subject/attachments) shown while template query `loading=true`.
- Mutation buttons (Save Draft, Publish, Send Test): Apollo `loading` from each mutation → `Button loading={isSaving}` with `<CircularProgress size={20} color="inherit" />` (existing convention per §G).
- History drawer: `HistorySkeleton` while versions query loads; `ErrorState embedded onRetry={refetchHistory}` on failure.
- Merge-tag picker: `Autocomplete` `loading` prop while `EmailPropsByScope` introspection fetches (if async); `emptyText` when scope has no variables.

**P2. Save/Publish Optimistic Transitions**
- **Save Draft**: on mutation start → `isDirty=false` (optimistic), `lastSavedContentRef.current = designJson`, button `loading=true` + label "Saving…". On success → button label "Saved ✓" (2s) → revert to "Save Draft"; toast `dashboard.emailTemplates.toast.saved()`. On error → `isDirty=true`, restore `designJson` from ref, button `loading=false`, toast `saveFailed`.
- **Publish**: same pattern + `isPublishing` button state. Confirm dialog (existing) → mutation → success toast `published()` + navigate to list (or stay with updated status badge).
- **Conflict detection**: server returns `VERSION_MISMATCH { expected, actual }` → `<Dialog>` "Template was edited by another admin (v{actual}). Overwrite or reload?" Actions: `Overwrite` (force publish with current version) / `Reload` (fetch latest, re-apply local edits via manual diff — Phase 2 can auto-merge).
- **Disable editor while save in flight**: `isSaving || isPublishing` → `<EmailEditor>` `readOnly` prop (if supported) or overlay `<Box sx={{ position: "absolute", inset: 0, bgcolor: "background.paper", opacity: 0.5, pointerEvents: "auto" }} />` with spinner.

**P3. Send Test Flow States**
- To field: RHF + Zod `z.string().email()` → `<FormHelperText error>` on blur/submit.
- Sample props: RHF + custom `validate: (v) => { try { JSON.parse(v); return true } catch { return "Invalid JSON" } }`.
- Submit button: `disabled` until both fields valid + `!isSendingTest`.
- Rate-limit: static notice "Max 5 test emails/min" (caption). On `RATE_LIMITED { retryAfter }` error → inline `<Alert severity="warning">Rate limited. Try again in {countdown}s</Alert>` with live countdown; disable Submit.
- In-flight: `isSendingTest` → button `loading=true`.
- Success: `SuccessCheckMark` animation (600ms) in dialog → `notifications.show(t("toast.testSent", { to }), { severity: "success" })` → close dialog after 800ms.
- Error: inline `<Alert severity="error">{providerErrorMessage}</Alert>` (from GraphQL error `extensions.message`).
- Close with unsent sample props changes → confirm "Discard sample props changes?".

**P4. List View Edge Cases**
- Empty search results: `DataGrid emptyMessage={hasFilters ? t("empty.noSearchResults") : t("empty.emptyState")}`. Create CTA only when `!hasFilters`.
- Pagination error: wrapper renders `<ErrorState embedded onRetry={refetchPage} retryLabel={t("common.retry")} message={t("error.loadFailed")} />` inside grid when `paginationError && !loading`.
- Stale data: `useQuery` with default `fetchPolicy: "cache-and-network"` auto-re-renders on background refetch — documented in ViewModel.
- Bulk Archive confirm: `<Dialog>` title `t("dialog.bulkArchiveConfirm", { count })`, actions Cancel / Archive (loading during mutation).
- Optimistic Archive: on click → immediately filter row from local data array (Zustand `setRows(rows.filter(r => r.id !== id))`); toast "Archived. Undo?" with `onAction: () => setRows(prev => [...prev, archivedRow])`; mutation in background; on error → re-insert row + toast `archiveFailed`.
- Row-level loading: `isArchiving[id]` map → row actions "Archive" disabled + `<CircularProgress size={16} />` inline; other rows interactive.

**P5. History Drawer States**
- Loading: `<HistorySkeleton />` (shimmer rows).
- Error: `<ErrorState embedded onRetry={refetchHistory} />`.
- Empty: `<EmptyState illustration={HistoryIcon} title={t("empty.emptyRevisions")} body={t("empty.emptyRevisionsHelp")} />`.
- Restore in-flight: per-row `isRestoring[v]` → button `loading=true`.
- Restore conflict: same `VERSION_MISMATCH` dialog as Publish (Overwrite / Reload).
- Preview older version: "Preview" button per row → opens read-only Preview dialog with that version's compiled HTML.

**P6. Preview Tab States**
- Compiling: `<Skeleton variant="rectangular" height={400} />` in iframe slot.
- Error: `<ErrorState embedded onRetry={recompile} message={t("error.previewFailed")} />`.
- Empty (no designJson): `<EmptyState title={t("editor.previewEmpty")} />`.
- Unsaved draft banner: `isDirty && <Alert severity="info" sx={{ mb: 2 }}>{t("editor.previewUnsavedWarning")}</Alert>`.
- Viewport selector: animate width `transition: "width 200ms ease"`; respect `usePrefersReducedMotion()` → instant.

**P7. Connection/Network Edge Cases**
- Offline banner: `useApolloConnectivity()` → `!isConnected && <Alert severity="warning" sx={{ position: "sticky", top: 0, zIndex: 1200 }}>You're offline. Changes will sync when reconnected.</Alert>`.
- Mutation gating: `disabled={!isConnected}` on Save/Publish/Send Test with `title="Offline — cannot save"`.
- Stale tab detection: `focus` event listener → `refetchTemplate()` → compare `version`; if `serverVersion > localVersion` → `notifications.show("Template updated in another tab. Click to reload.", { actionText: "Reload", onAction: () => router.refresh() })`.
- Session expiry: Apollo error link interceptor → on `UNAUTHENTICATED`/`FORBIDDEN` during editor mutation → persist full editor state to `sessionStorage["emailTemplateDraft:{id}"]` → `notifications.show(t("sessionExpired"), { severity: "error", actionText: "Log in", onAction: () => router.push("/login?redirect=" + encodeURIComponent(window.location.pathname)) })`. Post-login redirect restores from `sessionStorage` + toast "Draft restored."

**P8. Form/Editor Edge Cases**
- `beforeunload`: `window.addEventListener("beforeunload", e => { if (isDirty) { e.preventDefault(); e.returnValue = "" } })` (existing plan §D).
- In-app nav guard: back button `<IconButton onClick={isDirty ? openDiscardDialog : onBack} />`; tab clicks intercepted via `Tabs onChange={isDirty ? openDiscardDialog : setTab}`.
- Logout guard: auth store `logout` action checks `emailTemplateEditorStore.isDirty` → confirm dialog before clearing auth.
- Idle timeout: (future) same as logout guard.
- Merge-tag picker empty: `Autocomplete emptyText={t("editor.mergeTags.noneAvailable")}`; disable insertion button.
- Merge-tag mismatch warning: `missingVars = templateVars.filter(v => !sampleProps[v])` → `missingVars.length > 0 && <Alert severity="warning">Sample data missing: {missingVars.join(", ")}. Preview may not render correctly.</Alert>` in Preview tab + Send Test dialog.

**P9. Micro-state Polish**
- Save button: "Saved ✓" transient (2s) with `SuccessCheckMark` inline (reuse §G component).
- Publish button: "Publishing…" → "Published ✓" same pattern.
- Keyboard shortcut tooltips: `Button title={navigator.platform.includes("Mac") ? "⌘S" : "Ctrl+S"}` on Save; `⌘Enter` on Publish.
- Drag reorder persist loading: `isReordering` flag → disable Save/Publish during persist.
- Theme transition: `<EmailEditor style={{ transition: "background-color 200ms, color 200ms" }} />` + `usePrefersReducedMotion()` guard.
- `sessionStorage` draft backup: `useEffect(() => { sessionStorage.setItem(key, JSON.stringify({ designJson, subject, attachmentRules, sampleProps, timestamp })) }, [designJson, subject, attachmentRules, sampleProps])`; on mount, if draft newer than `lastEdited` → prompt restore.
```
