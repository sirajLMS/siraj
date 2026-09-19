The codebase investigation is complete. Per my operating instructions, I must not write files — I'll return all findings directly in this response. Here's the full report.

# UI/UX Infrastructure Research — Email Template Editor (React Email + Visual Block Editor)

## Assumptions

- **Library (lines 130–142)**: `react-email@^6` (unified — drops `@react-email/components` + `@react-email/render`) + `@react-email/editor@^1.1`. "TipTap 3.17.x bundled transitively — do NOT install `@tiptap/*`." Optional dev-only `@react-email/ui` deferred.
- **Wrapper (lines 802–815, V5-5)**: `EmailEditorWrapper.tsx` in common layer with `next/dynamic(() => import('@react-email/editor').then(m => m.EmailEditor), { ssr: false })`. "ZERO precedent in the codebase — existing `createLazyView` defaults to `ssr: true`."
- **Ref API (line 149, 816, 16a)**: `EmailEditorRef` — `getJSON(): JSONContent` (sync), `getEmail(): Promise<{html,text}>` (async), `getEmailHtml()`, `getEmailText()`, `editor: Editor | null`. Save = single mutation accepting `designJson` + `compiledHtml` atomically. `File`/`Blob` in `useRef`, NOT Zustand.
- **Theming (lines 818–820, V4-7)**: Two layers — Layer A chrome via `--re-*` CSS vars; Layer B emailed HTML via `EmailTheming.configure({ theme })` imported from `@react-email/editor/plugins` (NOT package root).
- **CSS baseline (line 817)**: `ScopedCssBaseline` (not global `CssBaseline`) "to avoid MUI reset breaking ProseMirror." Import editor CSS after MUI CSS.
- **Frontend tier pattern (lines 781–840)**: `frontend/common/views/dashboard/email-templates/*` (ViewModels + Containers + switcher) + `frontend/mobile/views/...` + `frontend/desktop/views/...`. `createLazyView` + `ResponsiveViewSwitch`. Co-located Zustand; **no** mock-store factory (V5-8).
- **Zustand store (line 838)**: `frontend/common/stores/emailTemplateEditorStore.ts` — filters, dialog open, locale/version selector. Dirty-state (`isDirty` flag + `beforeunload` step 16).
- **Preview (step 12a, V5-3)**: iframe `sandbox=''` (NOT `allow-same-origin`); CSP `default-src 'none'; style-src 'unsafe-inline'; img-src 'self' data:`; server-side DOMPurify sanitize before serving.
- **Render (lines 882–922)**: `render` from unified `react-email` (async, `Promise<string>`) + `toPlainText`; `safeRender()` try/catch fallback; `DOMPurify.sanitize` with explicit `ALLOWED_TAGS`/`ALLOWED_ATTR` denylist.
- **i18n (lines 842–867, V5-7)**: existing single-arg `getServerTranslations(locale).emailsTranslations.*`; extend `EmailsLabels` with new `errors` sub-namespace (MUST edit en + ar atomically per V4-3).
- **Scope enum (lines 169–203)**: new `backend/enum/email/emailTemplates.enum.ts` with `EmailScope`, `EmailEditorPermission` (ADMIN/STAFF/SUPERVISOR), `EmailTemplateStatus` (DRAFT/PUBLISHED/ARCHIVED).
- **DB schema (line 426)**: "currently zero email-template tables." Optimistic locking `version integer DEFAULT 0` with `WHERE version = $1`. Unique partial index `(scope, locale, status='ACTIVE')`.
- **Feature flag (step 21c, V5-2)**: `getBooleanEnv("EMAIL_TEMPLATES_ENABLED")` from `backend/lib/env`.
- **Existing state (V5-4, line 943)**: "file EXISTS (`renderComplaintResponseEmail` + `renderSuggestionAcknowledgedEmail`) with hardcoded hex colors (`#1976d2`, `#2e7d32`) — MUST be migrated not overwritten; delete in Phase 3."

## Codebase reality

### 1. Installed editor libraries — `package.json`
| Library | Version | dep/devDep | Verdict |
|---|---|---|---|
| `react-email` | `^6.9.1` (matches `package.json:153`; installed `6.9.1` dir matches) | dep | **CONFIRMED** |
| `@react-email/editor` | `^1.1` (`package.json:96`); actually-resolved `node_modules/@react-email/editor/package.json` is **`1.6.13`** | dep | **CONFIRMED** (range; resolved is ahead — exports `./plugins`, `./extensions`, `./core`, `./ui`, `./styles/*`, `./themes/default.css`) |
| `@react-email/render` | only in `node_modules` (transitive via `react-email`) | — | **CONFIRMED** unified into react-email (as the design proposes) |
| `@react-email/components` | **NOT FOUND** — not in package.json, not in node_modules | — | **CONFIRMED** dropped |
| `@react-email/ui` | **NOT FOUND** | — | **CONFIRMED** deferred (dev-only preview server) |
| `@tiptap/*` | in `node_modules/@tiptap` (≈20 extensions incl. `extension-mention`), transitive via `@react-email/editor`; **NOT in package.json** | — | **CONFIRMED** bundled, do not separately install |
| `mjml` / `mjml-browser` | **NOT FOUND** | — | confirmed rejected |
| `slate` / `lexical` / `draft-js` | **NOT FOUND** | — | confirmed |
| `react-dnd` | **NOT FOUND** | — | confirmed |
| `@dnd-kit/core` | `^6.3.1` (`package.json:67`) | dep | present but **UNUSED** (see §4) |
| `@dnd-kit/sortable` | `^10.0.0` (`package.json:68`) | dep | present but **UNUSED** (see §4) |
| `framer-motion` | `^12.43.0` (`package.json:126`) | dep | present (only 3 import sites, none in dashboard views) |
| `react-hook-form` | `^7.83.0` (`package.json:154`) | dep | **CONFIRMED** — 156 import sites |
| `@hookform/resolvers` | `^5.5.7` (`package.json:76`) | dep | confirmed — 10 `zodResolver` sites |
| `zod` | `^4.4.3` (`package.json:167`) | dep | confirmed |
| `isomorphic-dompurify` | `^3.21.0` (`package.json:134`) | dep | confirmed; `dompurify` transitive; **NOT yet imported anywhere** |
| `web-streams-polyfill` | transitive only (not in package.json) | — | the proposed Safari polyfill; not yet imported |
| `immutability-helper` / `react-quill*` | **NOT FOUND** | — | confirmed |
| `react-dropzone` | `^19.1.1` (`package.json:152`) | dep | attachment-upload precedent available |

### 2. Existing template/preview code — **REFUTED / NOT FOUND**
- **No `emails/` folder** anywhere under `frontend/` or `backend/` (search returned nothing).
- **No `*.tsx` under any `emails` path** — NOT FOUND.
- **No `email-template.registry.tsx`** — NOT FOUND (`find` empty).
- **No `backend/services/communication/templates/components/` dir** — NOT FOUND.
- **No existing React Email setup**: `grep` for `from 'react-email'`, `from '@react-email'`, `react-email`, `@react-email/editor`, `EmailEditor`, `EmailEditorRef`, `EmailTheming` across `frontend/`, `backend/`, `shared/`, `app/` returned **zero** matching source files.
- **No `renderToStaticMarkup` / `renderToBuffer` / MJML render calls** — NOT FOUND.
- **Only existing renderer**: `backend/services/communication/templates/email-templates.ts` (5836 B). Lines 28–83 (`renderComplaintResponseEmail`) + 85–142 (`renderSuggestionAcknowledgedEmail`) build raw **HTML strings** with `escapeHtml` (lines 3–10) and **hardcoded hex colors** `#1976d2` (lines 51, 56, 57), `#2e7d32` (lines 113, 116). CONFIRMS the design finding V5-4 — file IS orphaned, must migrate. Calls `getServerTranslations(locale).emailsTranslations.complaintResponse` (line 32, 89) — synchronous, single-arg (CONFIRMS the proposed i18n signature, §i18n).
- **No preview iframe component anywhere** — NOT FOUND (grep `<iframe`/`<IFrame` empty in dashboard views; only emotion-cache + layout.tsx touch `dangerouslySetInnerHTML`, both infra).

### 3. Variable / token / merge-tag insertion UX — **NOT FOUND**
- `grep` for `mergeTag`, `merge-tag`, `mergeField`, `templateVariable`, `variablePicker`, `tokenInsert`, `mentionPicker`, `{{firstName}}`, `insertVariable` returned **zero** matches.
- BUT strong reusable Autocomplete precedent: **152 Autocomplete import sites**; family of `useAudienceAutocomplete.ts` / `useTeacherAutocomplete.ts` / `useStudentAutocomplete.ts` / `useParentAutocomplete.ts` / `useStaffAutocomplete.ts` / `useUserAutocomplete.ts` under `frontend/common/hooks/userAutocomplete/` + shared store `frontend/common/stores/userAutocompleteStore.ts`; `CountryAutocomplete.tsx` (`frontend/common/components/ui/input/countrySelect/`).
- Existing chip/tag input: `TagInput` (`frontend/common/components/ui/input/tagInput/TagInput.tsx`) with `useTagInputEditing` hook + stories — usable for the proposed "allowed editor groups" chip selector.
- **TipTap `extension-mention` IS transitively available** in `@react-email/editor` deps — an in-editor `@mention`-style variable-insertion UX could be built on it without a new dependency.

### 4. Block-based / drag-drop editor patterns — dependency present, **pattern NOT FOUND**
- `@dnd-kit/core@^6.3.1` + `@dnd-kit/sortable@^10.0.0` ARE deps, but `grep` for `@dnd-kit/core`, `@dnd-kit/sortable`, `DndContext`, `SortableContext` across `frontend/`, `shared/` returned **zero** source usages.
- `react-dnd` NOT FOUND; no `useDrag`/`useDrop`/`DragLayer` usages; no `onDragEnd`/`onReorder`/`handleDragEnd` handlers.
- `framer-motion` imported in only 3 files (not in dashboard, never for reordering).
- **Verdict**: `@react-email/editor`'s built-in TipTap block model will be the editor's block model — but if the proposed UI wants free drag-and-drop rearrangement of blocks/sections in a sidebar, the dep is there but the established **usage pattern is absent** → a new convention decision is needed.

### 5. Live preview patterns — **NOT FOUND**
- No iframe rendering HTML in any dashboard view (§2).
- Only `dangerouslySetInnerHTML` usages: `frontend/common/lib/emotion-cache.tsx` and `app/layout.tsx` (both SSR/HMPL infra, not preview).
- No `shadow DOM` (`attachShadow`/`shadowRoot`/`createPortal` for preview) usages in views.
- `DOMPurify` not yet imported anywhere in source — sanitization is a NEW integration (the `safeRender` snippet in the proposed design, lines 907–913, is the pattern to adopt).

### 6. Form patterns for complex nested data — established, **no `useFieldArray`**
- `react-hook-form` 156 import sites; `zodResolver` 10 sites (e.g. `frontend/common/views/dashboard/admin/parents/onboarding/useParentOnboardingViewModel.ts`, `useMeetingProviderFormViewModel.ts`, `useManualInvoiceViewModel.ts`); `FormProvider`/`useFormContext` ≈10 files.
- **`useFieldArray` — NOT FOUND** (`grep` empty across `frontend/`, `shared/`, `app/`). Confirms the editor should NOT rely on RHF array fields for nested template JSON.
- The **most complex form is `useManualInvoiceViewModel.ts`** (`frontend/common/views/dashboard/billing/manual/`, 259 lines). Pattern: `useForm<FormData>({ resolver: zodResolver(schema), defaultValues })` + `useWatch({ control, name })` for derived totals (lines 119–126) + `setValue` for field reset (lines 78–82) + a **separate Zustand UI store** `useManualInvoiceUiStore` for cross-component UI state (`isSubmitting`, `showSuccess`, `selectedParentId` — lines 210–216). This is the precedent that maps 1:1 onto the proposed `emailTemplateEditorStore.ts` + `useEmailTemplateEditorViewModel.ts` architecture. Nested arrays (`billingMonths`) are managed as plain form fields with custom watchers, NOT via `useFieldArray`.

### 7. Save / publish / draft flow — partial precedents
- **`EmailTemplateStatus` (DRAFT/PUBLISHED/ARCHIVED)** full flow: **NOT FOUND**. Closest enum is `LessonReportStatus` (`backend/enum/classes/lesson-report.enum.ts:1–6`): `DRAFT / PENDING_REVIEW / APPROVED / REJECTED`. No entity today uses DRAFT→PUBLISHED→ARCHIVED transitions atomically — the proposed transactional activation (step 12) is genuinely new.
- **Optimistic-locking `version` column precedent CONFIRMED**: `backend/db/schema/students/students.ts:65` — `version: integer("version").notNull().default(0)`; same pattern `backend/db/schema/billing/billing.ts:44`. Validates design steps 9/11.
- **Feature-flag precedent CONFIRMED**: `backend/lib/env.ts:70` — `export function getBooleanEnv(name: string): boolean`. Call sites `IS_DEMO`, `NEXT_PUBLIC_IS_DEMO`, `DISABLE_RATE_LIMITING`, `CLEANUP_ENABLED` (lines 353–358). `backend/lib/env-config-keys.ts` has `EMAIL_PROVIDER` (line 298) + `RESEND_FROM_EMAIL` (320) but **NO `EMAIL_TEMPLATES_ENABLED`** yet — confirms step 21c is genuinely pending. (Also confirms V5-2's `getBooleanEnv` correction; `"false"-is-truthy` argument is valid since `resolveEnvConfig` returns strings.)

### 8. Code view vs visual view toggle — **NOT FOUND**
- No existing UI toggles between a visual WYSIWYG and code/raw HTML/JSON view. The `viewMode`/`Tab` matches found (`ExchangeRatesContainer.tsx`, `StudentsView.tsx`, etc.) are unrelated generic view-mode switches, not editor code↔visual toggles.
- `frontend/mobile/views/dashboard/components/genericTabNav.mobile.tsx` is the only generic Tabs primitive.
- The data-grid list views would naturally include a code inspector (e.g. monaco/Prism), but **no Prism.js/monaco highlighter is currently imported** — the proposed design (line 821) mentions Prism.js is bundled by `@react-email/editor` itself, so lazy-load the editor's grammars in the editor route.

### 9. Preview / send-test-email modal — **NOT FOUND**
- `grep` for `sendTest`, `TestEmail`, `previewSend`, `SendTest` across `frontend/`, `shared/`, `backend/` returned nothing relevant (one false positive in a push-channel file).
- Reusable dialog infra: only **`BaseDeleteDialog`** (`frontend/common/components/ui/dialog/BaseDeleteDialog.tsx`) + presets (`dialogPresets.ts`). No preview dialog precedent.
- The `EmailEditorRef.getEmail()` async API (proposed design, lines 16, 816) gives the live HTML for the preview modal.

### 10. Template list / gallery — pattern **NOT FOUND**, alternatives exist
- **No card-grid gallery / thumbnail pattern** in dashboard views. `grep` for `gallery`, `thumbnail`, `Thumbnail`, `CardGrid`, `ImageList` returned zero relevant matches (one `LivePerformanceGrid.tsx`, unrelated).
- **Established list pattern is `DataGrid`** (`@mui/x-data-grid`): **22 usages** including `ServerPaginatedDataGrid.tsx` (`frontend/common/views/dashboard/billing/components/__shared__/`).
- **Closest reusable list-page scaffolding** to mirror: `frontend/common/views/dashboard/admin/payment-catalogs/` (`PaymentCatalogsPageContainer.tsx`, `PaymentCatalogsView.tsx`, `PaymentCatalogsTabPanels.tsx`, `usePaymentCatalogAdminViewModel.ts`) — this is exactly the file the design says to mirror at line 836. Its edit dialog (`CatalogEditDialog.tsx`) already demonstrates the **`CountryAutocomplete` + `TagInput` combo** (lines 274, 302) — i.e. a reusable pattern for the editor's scope-locked-as-chip + allowed-editor-groups selectors.

### Extra verifications of the proposed design
- **`next/dynamic({ ssr: false })` ZERO precedent CONFIRMED** — `grep` for `ssr:false`/`ssr: false` empty in `frontend/`, `shared/`, `app/`. The V5-5 design claim is accurate: this is an intentional deviation isolated to `EmailEditorWrapper.tsx`.
- **`createLazyView` established CONFIRMED** — 129 import sites + `frontend/common/components/ui/container/createLazyView.ts` + `ResponsiveViewSwitch.tsx`. Confirms the proposed tier-switch architecture (lines 781–800).
- **`ScopedCssBaseline` NOT used anywhere CONFIRMED** — only global `CssBaseline` in `frontend/common/providers/theme/ThemeProvider.tsx` + `components.ts`. CONFIRMS the proposed line 817 introduces a new pattern.
- **Zustand `create()` inline CONFIRMED** — pattern used across `frontend/common/stores/*` (no mock-store factory), matching V5-8 (design).
- **`@react-email/editor` exports `/plugins` subpath CONFIRMED** — `node_modules/@react-email/editor/package.json` exports include `./plugins`, `./extensions`, `./core`, `./ui`. Validates the V4-7 design finding that `EmailTheming` import must come from `/plugins`.

## Gap
1. **No React Email renderer/editor is wired anywhere** — every `.tsx` scaffold, registry, wrapper, ref-usage is net-new.
2. **No preview iframe + no DOMPurify importer** — the `safeRender()` + sandboxed-iframe + CSP path is greenfield.
3. **No merge-tag / variable-insertion UI** — must be invented; could leverage TipTap `extension-mention` (already transitive) + the established `useXxxAutocomplete` hook family.
4. **No drag-drop usage** despite `@dnd-kit` installed — a usage convention is needed if the visual editor wants block reordering beyond TipTap's default blocks.
5. **No `useFieldArray`** — nested template-JSON nested state should follow the `useManualInvoiceViewModel` precedent (RHF + `useWatch` + Zustand UI store), NOT RHF field arrays.
6. **No code↔visual toggle, no Prism/monaco import**, no preview/send-test modal.
7. **Card-grid gallery pattern absent** — list view will lean on `DataGrid` / `payment-catalogs` page scaffolding; a thumbnail preview surface is net-new.
8. **`value`/`EmailTemplateStatus` full lifecycle (DRAFT→PUBLISHED→ARCHIVED transactional activation) has no precedent**; optimistic-lock `version` column precedent exists.
9. **`EMAIL_TEMPLATES_ENABLED` env key NOT yet in `env-config-keys.ts`** — must be added (step 21c).
10. The orphan `email-templates.ts` (hardcoded colors, raw HTML strings) MUST be migrated (not overwritten) and deleted only in Phase 3 (V5-4) — confirmed.

## Recommendation
- **New files to create** (design §Frontend, lines 785–839): `frontend/common/views/dashboard/email-templates/{useEmailTemplatesListViewModel,EmailTemplatesListView,EmailTemplatesListContainer,useEmailTemplateEditorViewModel,EmailTemplateEditorView,EmailTemplateEditorContainer,EmailEditorWrapper}.ts(x)`; tier files `frontend/{mobile,desktop}/views/dashboard/email-templates/`; store `frontend/common/stores/emailTemplateEditorStore.ts`; GraphQL docs `frontend/common/graphql/sharedDocuments/email/`; admin routes `app/(dashboard)/email-templates/{page,[id]/page}.tsx`.
- **Reuse, don't rebuild**: `createLazyView` + `ResponsiveViewSwitch` (tier switching); `useManualInvoiceViewModel` form-architecture (RHF + `zodResolver` + `useWatch` + a Zustand UI store — drop any `useFieldArray` idea); `useAudienceAutocomplete*` hook family + `CountryAutocomplete` for a **variable-mention picker**; `TagInput` for the **allowed-editor-groups chip selector** (mirror `CatalogEditDialog.tsx:302`); `payment-catalogs/` page scaffolding for the list view; `getBooleanEnv` for the feature flag.
- **New dependency decisions needed**: NONE for the visual editor itself (TipTap ships inside `@react-email/editor@1.6.13`, incl. `extension-mention`). For a future block-reordering **sidebar**, the installed `@dnd-kit/core` + `@dnd-kit/sortable` can be used but lack any precedent — establish a documented usage pattern; do NOT add `react-dnd`/`@hello-pangea/dnd`.
- **No new installations required** beyond what design step 1 already logged (all installed 2026-08-02). `prismjs`/monaco for the code-view toggle: lazy-load `@react-email/editor`'s bundled Prism grammars in the editor route (line 821); add a separate highlighter only if a standalone code-tab is desired outside the editor.
- **Sanitization**: adopt the proposed `safeRender()` snippet verbatim (lines 893–921) with `isomorphic-dompurify` + `ALLOWED_TAGS`/`ALLOWED_ATTR`; pair with TipTap schema validation at save (step 7a) as belt-and-suspenders.
- **Sanitize the existing orphan**: migrate `renderComplaintResponseEmail` / `renderSuggestionAcknowledgedEmail` colors to theme tokens, defer deletion to Phase 3 after the dispatcher migration (V5-4).

---

## TOP-10 SUMMARY

1. **`react-email@^6.9.1` + `@react-email/editor@^1.1` (resolved v1.6.13)** confirmed in `package.json:96,153`; `@react-email/render` + `@tiptap/*` are correctly transitive-only (not declared). `@react-email/components`/`@react-email/ui` correctly absent.
2. **Zero React Email code exists today** — no `emails/` dir, no `.tsx` scaffolds, no `email-template.registry.tsx`, no `EmailEditorWrapper`, no `@react-email/editor` imports in source.
3. The **only** existing renderer is `backend/services/communication/templates/email-templates.ts` — raw HTML-string templating with hardcoded hex colors `#1976d2`/`#2e7d32` (lines 51–57, 113–116); orphaned, must migrate (V5-4 CONFIRMED).
4. **No preview iframe, no DOMPurify importer, no shadow DOM** in source — `safeRender()` + sandboxed iframe + CSP is net-new infrastructure.
5. **`next/dynamic({ ssr: false })` has ZERO precedent** (CONFIRMED) — the `EmailEditorWrapper.tsx` deviation is intentional and isolated. `createLazyView` (129 sites) + `ResponsiveViewSwitch` are the tier pattern to reuse.
6. **Form pattern** = `useManualInvoiceViewModel.ts` (RHF + `zodResolver` + `useWatch` + Zustand UI store). **`useFieldArray` is NOT used anywhere** — do not introduce it for nested template JSON.
7. **Merge-tag/variable picker is NOT FOUND**, but 152 Autocomplete usages (`useAudienceAutocomplete*` family + `userAutocompleteStore`) + `TagInput` give strong reusable primitives; TipTap `extension-mention` is transitively available for in-editor mention UX.
8. **`@dnd-kit/core`+`sortable` ARE deps but UNUSED** — drag-drop block reordering needs a new usage convention; no `react-dnd`. Free-form block sidebar DnD is greenfield.
9. **Draft/publish flow**: full DRAFT→PUBLISHED→ARCHIVED lifecycle **NOT FOUND** (closest = `LessonReportStatus` PENDING_REVIEW/APPROVED). Optimistic-lock `version integer default 0` precedent CONFIRMED (`students.ts:65`, `billing.ts:44`). `EMAIL_TEMPLATES_ENABLED` env key **absent** (step 21c pending); `getBooleanEnv` precedent at `env.ts:70` CONFIRMED.
10. **Gallery/code-toggle/send-test-modal pattern absent**; list view should reuse `payment-catalogs/` page scaffolding + `DataGrid` (22 sites). `ScopedCssBaseline` is unused (only global `CssBaseline`) — confirms the proposed line 817 is net-new.