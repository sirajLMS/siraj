### Frontend (UI/UX Specification)

> **SWE Review v6 (UI/UX completeness):** expanded from ~60 lines to a complete UI/UX specification per research synthesis at [.ai/plans/email-templates/glm_swe/ui-research/00-synthesis.md](.ai/plans/email-templates/glm_swe/ui-research/00-synthesis.md). All existing v1-v5 technical decisions preserved; UI/UX gaps closed: navigation entry, page layouts, list view, editor view interactions, preview tab, send-test dialog, animations w/ prefers-reduced-motion a11y guard, forms/validation, theming/dark mode, a11y, storybook stories, tests, StatusBadge extension, feature-flag visual cue, complete i18n key catalogue.

Follow the tier-neutral ViewModel + switcher + Container pattern per [frontend/common/views/AGENTS.md](frontend/common/views/AGENTS.md) and [frontend/NEW_PAGE_WORKFLOW.md](frontend/NEW_PAGE_WORKFLOW.md). **`frontend/views/dashboard/` is DEPRECATED** — all new code goes under `frontend/common/views/dashboard/<domain>/` + tier files in `frontend/mobile/views/` and `frontend/desktop/views/`.

**Common layer** (`frontend/common/views/dashboard/email-templates/`):
- `useEmailTemplatesListViewModel.ts` — list/filter/pagination logic (viewport-agnostic)
- `EmailTemplatesListView.tsx` — switcher (`createLazyView` + `ResponsiveViewSwitch`)
- `EmailTemplatesListContainer.tsx` — calls hook, wraps in `<RequirePermission>`
- `useEmailTemplateEditorViewModel.ts` — editor save/preview/send-test logic
- `EmailTemplateEditorView.tsx` — switcher
- `EmailTemplateEditorContainer.tsx` — calls hook, wraps in `<RequirePermission>`
- `EmailEditorWrapper.tsx` — browser-only dynamic import (see "Editor wrapper requirements" below)
- `types/` — label slices (`Pick` from `@/shared/locale/types/...` per Rule 7)

**Mobile tier** (`frontend/mobile/views/dashboard/email-templates/`):
- `emailTemplatesList.mobile.tsx` — pure presentation (no business logic, no `useMediaQuery`/`useViewport`)
- `emailTemplateEditor.mobile.tsx` — mounts `EmailEditor` from `EmailEditorWrapper` (not directly from `@react-email/editor`)

**Desktop tier** (`frontend/desktop/views/dashboard/email-templates/`):
- `emailTemplatesList.desktop.tsx` — DataGrid + filter toolbar + Create action
- `emailTemplateEditor.desktop.tsx` — split-pane: left editor viewport, right Inspector; `<Dialog>` for send-test; `<Drawer>` for history

**Editor wrapper requirements** (verified — see [research file 10](.ai/plans/email-templates/reserch/10-editor-mui-nextjs-interop.md)):
  - SWE review v3: Create a dedicated `EmailEditorWrapper.tsx` in the **common layer** (`frontend/common/views/dashboard/email-templates/EmailEditorWrapper.tsx`) that encapsulates all browser-only concerns:
    ```tsx
    // frontend/common/views/dashboard/email-templates/EmailEditorWrapper.tsx
    'use client';
    import dynamic from 'next/dynamic';
    // Single dynamic import — ssr:false prevents TipTap's window access during SSR
    const EmailEditor = dynamic(() => import('@react-email/editor').then(m => m.EmailEditor), { ssr: false });
    export { EmailEditor };
    ```
    Both mobile and desktop tier views import `EmailEditor` from this wrapper (not directly from `@react-email/editor`). This centralizes the `next/dynamic` + `ssr: false` pattern in one file, preventing accidental SSR imports in tier views.
    - SWE review v5 (V5-5): `next/dynamic({ ssr: false })` has ZERO precedent in the codebase — existing `createLazyView` defaults to `ssr: true` and no file in the repo passes `ssr: false`. This `EmailEditorWrapper.tsx` is an intentional deviation because TipTap touches `window` at module load. The `next/dynamic({ ssr: false })` import lives ONLY in this wrapper file — tier view files must NOT add their own `next/dynamic` imports for the editor; they import `EmailEditor` from `EmailEditorWrapper.tsx`.
  - Add `'use client'` directive on the **tier view file** that mounts the editor (e.g. `emailTemplateEditor.desktop.tsx`) — TipTap is browser-only and touches `window` at module load.
  - SWE review v5 (V5-5): ~~Wrap `EmailEditor` import via `next/dynamic` at module top level in the tier view file~~ REMOVED — the dynamic import lives in `EmailEditorWrapper.tsx` only (see above). Tier views are pure presentation that import `EmailEditor` from the wrapper. Do NOT add a second `next/dynamic` in tier view files.
  - Save flow: hold a `ref<EmailEditorRef>`; on save call `ref.current?.getJSON()` for `designJson` (synchronous — returns JSONContent directly, no Promise) and `await ref.current?.getEmail()` (async — returns Promise<{html, text}>) for compiled output. **SWE review v2:** File objects (attachments, inline images) must be held in `useRef`, NOT in the Zustand store — `File` and `Blob` objects are not serializable and will break Zustand's devtools + persistence middleware. The Zustand store should only hold serializable state (isDirty, selectedScope, locale, etc.).
  - Wrap the editor in MUI v9's `ScopedCssBaseline` (not the global `CssBaseline`) — the global `CssBaseline` reset breaks TipTap's prose styling (`ScopedCssBaseline` is net-new in the repo — only the global `CssBaseline` is used today). Import editor CSS **after** MUI global CSS to avoid the MUI reset overriding ProseMirror styling: e.g. `import '@mui/material/styles'; /* then */ import '@react-email/editor/themes/default.css'`.
  - Two theming layers, verified by name:
    - **Layer A (editor chrome)** — `--re-bg`, `--re-text`, `--re-text-muted`, `--re-border`, `--re-hover`, `--re-active`, `--re-radius`, `--re-radius-sm` (CSS custom properties control bubble menu / slash command / Inspector visuals). Bind these to `useColorScheme()` mode (light vs dark) via inline `style` on the `<EmailEditor>` host element.
    - **Layer B (emailed HTML output)** — JS `EmailTheming.configure({ theme })` API. `--re-*` CSS vars **do NOT** affect the emailed HTML — only the in-editor chrome. The emailed HTML output inherits theme tokens from the `EmailTheming` plugin. **SWE review v2:** `EmailTheming` is NOT built-in to `@react-email/editor` — it must be passed as an `extensions` prop to `<EmailEditor extensions={[EmailTheming.configure({ theme })]} />`. Without explicitly passing it, the emailed HTML output will not include theme tokens. **SWE review v4 (V4-7):** `EmailTheming` is exported from the **`/plugins` subpath** — `import { EmailTheming, extendTheme } from '@react-email/editor/plugins'`. Importing from the package root (`@react-email/editor`) will fail with `Module does not export EmailTheming`. See research file `10-editor-mui-nextjs-interop.md:336`.
  - Known Turbopack dev-compile slowdown with Prism.js grammars bundled by the editor; budget the editor page for slower initial dev compile.

#### A. Routing & Navigation

- **Admin routes** — follow existing `(dashboard)` group pattern (locale from `getLocale()` cookie, NOT a `[locale]` URL segment per [app/AGENTS.md](app/AGENTS.md) and [research file 01](.ai/plans/email-templates/glm_swe/ui-research/01-dashboard-inventory.md)):
  - `app/(dashboard)/email-templates/page.tsx` — list page
  - `app/(dashboard)/email-templates/[id]/page.tsx` — editor page (route param `id`; for new templates, navigate to `/email-templates/new` which the page handler treats as "blank editor with scope picker" when no real row exists)
- **Breadcrumbs** — use existing `usePageBreadcrumbs({ currentTitle, overrides })` (`frontend/common/views/dashboard/lib/usePageBreadcrumbs.ts`).
  - List page: "Email Templates" (single segment).
  - Editor page: "Email Templates / {template.displayName}" with the first segment auto-linking back to `/email-templates`.
- **Sidebar nav entry** — add `emailTemplates: string` to `DashboardNavigationLabels` (`shared/locale/types/dashboard/core/nav.ts`) and a `NavItem` to `SIDEBAR_NAV_ITEMS` under the Admin group. Recommended icon: `<EmailOutlined />` (justify: matches the email domain; `NotificationsActiveOutlined` is reserved for the broader notifications surface which already has its own nav).
- **Permission gate (two-layer defense-in-depth)** — mirror [`app/(dashboard)/payment-catalogs/page.tsx`](app/(dashboard)/payment-catalogs/page.tsx):
  - Server: `requirePermissionForPage(userId, [AppPermission.EMAIL_TEMPLATES_MANAGE], locale, context)` in each `page.tsx`.
  - Client: `<RequirePermission permissions={["EMAIL_TEMPLATES_MANAGE"]} fallback={null}>` in the Container.
  - **New enum value**: add `EMAIL_TEMPLATES_MANAGE = "EMAIL_TEMPLATES_MANAGE"` to `AppPermission`. Add a `PAGE_PERMISSIONS.emailTemplates` entry to the registry.
  - GraphQL mutations additionally gate via `authScopes: { superAdmin: true, notImpersonating: true }` (KEEP from plan L836).
- **Deep-linking & middle-click** — editor URL `/email-templates/{id}` is shareable; MUI DataGrid default supports middle-click → new tab.

#### B. Page Layouts

- **List page wrapper** — `<DesktopPageContainer>` / `<MobilePageContainer>` (`frontend/common/components/ui/container/page/`) — tier-split. Each wraps `<DesktopPageHeader>` / `<MobilePageHeader>` (shared `BasePageHeaderProps` at `frontend/common/components/ui/container/page/types/pageHeader.types.ts:11-17`) with:
  - Title: i18n `dashboard.emailTemplates.pageTitle`
  - Subtitle: i18n `dashboard.emailTemplates.pageSubtitle`
  - Actions slot: primary "Create" button (`<Button variant="contained" color="primary" size="medium" startIcon={<AddOutlined />} />`).
- **Editor page wrapper** — split-tier:
  - Desktop: `<DesktopPageContainer>` + tier header (title = template displayName, with a back `<IconButton>` to the list). Body = two-pane layout via CSS Grid: left = editor viewport (flex-grow), right = Inspector panel (fixed `360px` width, `borderLeft`, scrollable). Use `sx` (NOT style props).
  - Mobile: stacked — editor viewport full-width, Inspector lives in a bottom-anchored `<Drawer>` opened via a `<TuneOutlined />` IconButton in the mobile header.
- **Shared `SectionPanel`** (`frontend/common/components/ui/container/SectionPanel.tsx`) wraps the Inspector sections (Scope, Locale, Version, Editor Groups, Subject, Attachments) — title + actions slot pattern.
- **Loading skeletons** — NEW files, mirroring `DashboardRoleSkeleton.tsx` reference structure:
  - `EmailTemplatesListSkeleton.tsx` (DataGrid shimmer rows + header bar shimmer).
  - `EmailEditorSkeleton.tsx` (editor frame block shimmer + Inspector panel shimmer). Used as `<Suspense fallback={<EmailEditorSkeleton />} />` for the editor route.
- **Empty state** — reuse shared `<EmptyState>` (`frontend/common/components/ui/state/`): illustration + i18n `dashboard.emailTemplates.emptyState` + "Create" CTA button (only if `EMAIL_TEMPLATES_MANAGE`). Empty grid subtitle: `dashboard.emailTemplates.emptyStateHelp`.
- **Error state** — reuse shared `<ErrorState>` (`frontend/common/components/ui/state/`) with a "Retry" `<Button>` wired to Apollo `refetch`.

#### C. List View Components & Interactions

- **DataGrid** — `AppDataGrid` (`frontend/common/components/ui/dataGrid/AppDataGrid.tsx`; wraps MUI X DataGrid v9). Reference usage: `frontend/desktop/views/dashboard/permissions/components/permissionGroupsDataGrid.desktop.tsx:80-189`.
  - Required props: `paginationOptions: ListPaginationOptions` (`frontend/common/components/ui/filter/listPaginationOptions.ts`), `emptyMessage`, `loading`, `getRowId={(row) => row.id}`. **Do NOT override `slots.pagination`** (research file 01 confirms it is non-overridable).
  - Columns:
    1. **Status badge** (renderer calls shared `<StatusBadge>` with the new `emailTemplate` category — see §N). Width ~110px. Renders first (left-most).
    2. **Name** (displayName). Clickable row click → navigate to editor route (research file 01 confirms row-click-to-edit is the established DataGrid convention).
    3. **Scope** (EnumDisplay `<StatusBadge category="emailTemplate" value={row.scope} />` or a typed `<Chip variant="outlined">` — but inline `<Chip>` is forbidden per `COMPONENT_PATTERNS.md:170`; use the enum's localized label as plain `<Typography>` text).
    4. **Locale** (`twoLetterCode` + flag emoji if available; default to plain `<Typography>`).
    5. **Version** (e.g. `v3` from `version` integer; tooltip: i18n `dashboard.emailTemplates.versionTooltip` + lastEdited timestamp).
    6. **Last edited** (relative time, e.g. "2h ago" — format via `date-fns` `formatDistanceToNow` already in repo).
    7. **Allowed editor groups** (comma-joined display of `EmailEditorPermission` labels — short summary only; full list in Inspector).
  - **Row actions menu** — use `useRowMenuAnchor` (reference: `permissionGroupsDataGrid.desktop.tsx`). Menu items (visibility rules in parentheses):
    - "Edit" (always for `EMAIL_TEMPLATES_MANAGE`) → navigate to editor.
    - "Preview" (always) → opens preview dialog.
    - "Duplicate" (`EMAIL_TEMPLATES_MANAGE`) → copies designJson to a new DRAFT.
    - "Archive" (status = PUBLISHED only; `EMAIL_TEMPLATES_MANAGE`) → confirm dialog → archive.
    - "Restore" (status = ARCHIVED only; `EMAIL_TEMPLATES_MANAGE`) → confirm dialog → restores to DRAFT (does NOT auto-publish).
- **Search bar** — in the page header actions slot (right side, before "Create"):
  - `<OutlinedInput size="small" placeholder={t("searchPlaceholder")} startAdornment={<InputAdornment position="start"><SearchOutlined fontSize="small" /></InputAdornment>} />`.
  - Debounced 300ms via `useDebouncedCallback` (`use-debounce` already in repo). Filters by displayName ILIKE.
- **Filter chips row** — below header, inside `<SectionPanel actions={...}>`. There is NO shared `FilterToolbar` in the repo (research file 01) — compose inline. Filters:
  - **Scope** — `<Autocomplete multiple options={EmailScope values} />` rendering localized labels. Active filter shows as a `<Chip>` row.
  - **Status** — `<ToggleButtonGroup exclusive>` of three options: Draft / Published / Archived. Active item highlighted.
  - **Locale** — `<Autocomplete single>`.
  - **Segmented view control** — `<ToggleButtonGroup exclusive>` of three view modes: "Active" (default — Draft + Published), "Archived", "All". Default: Active.
  - **Clear filters** — text button appears when any filter is active; clears all + resets segmented control to "Active".
  - **Active filter count badge** — small `<Chip size="small" color="primary" label="3" />` shown in the page header alongside the search icon when filters > 0.
- **Pagination** — `ListPaginationOptions` (10 / 25 / 50 rows per page; default 25). Stored in the Zustand store so it survives viewport switching.
- **Bulk actions** — Phase 2 (not Phase 1): select rows via DataGrid checkboxes → bulk Archive button appears in the header actions slot. Note: MUI X v9 checkbox column is the supported pattern.
- **Sort** — sortable columns: name (asc/desc), lastEdited (desc — DEFAULT). Scope + status are NOT sortable (display-only). State persisted in store.
- **Toast on action** — reuse `@toolpad/core/useNotifications` (`const notifications = useNotifications(); notifications.show(t("toast.archived"), { severity: "success" })`). There is NO Notistack (research file 01). Use `FormErrorSnackbar` for persistent failure feedback (e.g., server permission error).

#### D. Editor View Components & Interactions

- **Three-tab layout** — in-page tabs (NOT nested routes), mirrors `paymentCatalogAdmin.desktop.tsx:36-68` simple inline `<Tabs value={...} onChange>` + per-tab conditional render:
  1. **Design** — visual `@react-email/editor` mounted via `EmailEditor`.
  2. **Preview** — live compiled HTML in a sandboxed iframe (see §E).
  3. **Code** — raw JSON view of `designJson`, syntax-highlighted via Prism.js lazy-loaded in this tab (the editor bundle already ships Prism grammars — do NOT add a separate highlighter dep).
  - **Tab transitions** — reuse the `<Slide>` tab idiom from `preferencesChannelTabs.mobile.tsx:140`:
    ```tsx
    <Slide direction={slideDirection} in appear mountOnEnter unmountOnExit timeout={220}>
      <Box>{tabContent}</Box>
    </Slide>
    ```
    where `slideDirection` is computed from `newTabIndex > oldTabIndex ? "left" : "right"`. **Wrap with `usePrefersReducedMotion()` (see §G)**: when true, render the tab content directly without `<Slide>` (instant swap).
- **Inspector panel (right, desktop)** — `<SectionPanel>`-based vertical stack:
  - **Scope** — `<Autocomplete>` listing `EmailScope` enum values (localized labels via `dashboard.emailTemplates`). Once a template is PUBLISHED, the scope becomes LOCKED: `disabled` + tooltip (`scopeTooltip` text) — re-publishing with a new scope requires first archiving + creating a new template.
  - **Locale** — `<Autocomplete>` of supported locales (`ar`, `en`).fieldNameRequired.
  - **Version** — read-only `<Chip>` (e.g. `v3`) + lastEdited tooltip. Non-editable.
  - **Allowed editor groups** — `<TagInput>` chip selector (reuse `CatalogEditDialog.tsx:302` pattern; `@/frontend/components/ui/TagInput` if present, or MUI `<Autocomplete multiple freeSolo>`). Options from `EmailEditorPermission` enum (`ADMIN`, `STAFF`, `SUPERVISOR`). Selected chips rendered with the localized label.
  - **Subject template** — `<TextField fullWidth>` + merge-tag insertion button (`<EmailOutlined>` popover opens `VariableMentionPicker`, see §D Merge-tag). Example placeholder: `Order {{orderNumber}} confirmed`.
  - **Attachment rules** — small key-value list: each row = pattern + max size. Use a `<List>` + `<ListItem>` with an "Add rule" `<IconButton>` and per-row `<DeleteOutlined>` delete.
- **Mobile inspector** — bottom-anchored `<Drawer anchor="bottom">`, opened from the mobile header `<TuneOutlined />`. Same fields, compact stack.
- **Merge-tag / variable insertion (NEW `VariableMentionPicker`)**:
  - New component in `frontend/common/components/ui/autocomplete/` reusing the `useAudienceAutocomplete*` hook family pattern.
  - List the scope's `Props` keys (from `EmailPropsByScope`) as lawful insert tokens. Insert at cursor as `{{fieldName}}` (handle/string interpolation, no leading `@`).
  - Future: TipTap `extension-mention` is **transitively available** via `@react-email/editor` for inline `@mention`-style body UX — wire into the visual editor's `extensions` prop as Phase 2. RECOMMENDED approach: phase 1 = standalone Autocomplete in the Inspector (subject + a tooltip "click an item to insert"); phase 2 = TipTap inline mention.
- **Save actions** — sticky bottom of Inspector (`EntityFormDialogActions` slot):
  - **Save Draft** — primary `<Button variant="contained">`, keyboard shortcut Ctrl/Cmd+S (preventDefault + dispatch submit).
  - **Publish** — secondary `<Button variant="outlined" color="success">`, only enabled when status = DRAFT or when there is a published version to replace. Ctrl/Cmd+Enter shortcut. Confirmation dialog: "Publishing will archive the currently published version for {scope}/{locale}. Continue?" Title uses i18n `dialog.publishConfirmTitle(displayName)`.
  - **Send Test** — tertiary `<Button color="secondary" startIcon={<SendOutlined />}>`. Opens the dialog in §F.
  - **Discard** — text button; if `isDirty`, asks for `<Dialog>` confirmation (`unsavedChangesTitle`/`unsavedChangesBody`).
- **Draft → Publish confirm dialog** — reuse `EntityFormDialogActions`; actions: Cancel / Publish ( mbox.confirm before submit).
- **History drawer** — `<Drawer anchor="right">` listing prior versions by `version integer` + status (Draft/Published/Archived). Each row: version chip, status badge, lastEdited, "Restore" button (only if `EMAIL_TEMPLATES_MANAGE`). Restore copies designJson onto a new DRAFT — confirm dialog clarifies "This creates a new draft from v{N}. The published version is unchanged. Continue?". Empty state when no revisions exist: `dashboard.emailTemplates.emptyRevisions` + `emptyRevisionsHelp`. Drawer trigger: small `<History />` IconButton in the page header.
- **Unsaved-changes protection** — `isDirty` tracked in the Zustand store (`emailTemplateEditorStore.ts`). NEW pattern in the repo (research file 03 — no `beforeunload` precedent today). Two layers:
  1. `beforeunload` window event listener → `event.preventDefault(); event.returnValue = ''` so the browser prompts on tab close.
  2. In-app navigation: intercept `next/navigation`'s `useRouter().push` is not directly interruptible; instead, render a small `<Dialog>` "Discard changes?" confirm on any in-app nav when `isDirty`, by wiring the Confirm dialog into the back-link `<IconButton onClick>` + intercepting tab clicks when dirty. Phase 1 covers the back-link; in-app nav interception across the whole app is out of scope.
- **Keyboard shortcuts** — Ctrl/Cmd+S → Save Draft (preventDefault + dispatch). Ctrl/Cmd+Enter → Publish (with confirm). ESC → close Drawer/Dialog (MUI default — no work). Register handlers via a `useEffect` keydown listener in the editor ViewModel, scoped to the editor route only.
- **Editor CSS layering** — KEEP verbatim from v5 (line above): wrap editor in `ScopedCssBaseline`; import `@mui/material/styles` **before** `@react-email/editor/themes/default.css`.
- **Editor `EmailTheming`** — KEEP verbatim from v5 (line above): import from `/plugins` subpath; pass as `extensions` prop.

#### E. Preview Tab

- **Sandboxed iframe** — `<iframe sandbox="" srcDoc={compiledHtml} />` with CSP via `srcDoc` meta or response headers from the preview query:
  - `default-src 'none'` (zero remote scripts/connections)
  - `style-src 'unsafe-inline'` (inline styles for the template)
  - `img-src 'self' data:` (allow inline `data:` URIs; NOT `*` per V5-3 — prevents tracker-pixel IP/UA leaks)
  - **Do NOT use `sandbox="allow-same-origin"`** — pure HTML preview needs no same-origin access; `sandbox=""` creates a unique opaque origin with no script, no forms, no storage.
- Server side: `previewEmailTemplate` GraphQL resolver MUST DOMPurify-sanitize the compiled HTML before serving (defense-in-depth with the iframe sandbox — V5-3 KEEP).
- **Variable preview** — `<Autocomplete>` to load a sample entity for the scope (LookupResultType sample). GraphQL `previewEmailTemplate` query accepts `sampleProps` JSON. Default props pre-filled from the registry (or a small `sampleProps.json` per scope).
- **Desktop viewport selector** — small `<ToggleButtonGroup>` of three options: Desktop (1024) / Tablet (768) / Mobile (375). On mobile tier: iframe is full-width (selector hidden). No existing reusable selector — note as a tiny new in-tab SurfaceSelect component, single-file in `frontend/common/components/ui/toggle/`.
- **"Copy HTML" button** — below iframe, `<Button startIcon={<ContentCopyOutlined />} onClick={copyEmailHtml}>`. Uses `navigator.clipboard.writeText(compiledHtml)`; on success toast `dashboard.emailTemplates.toast.copyHtmlCopied()`.
- **"Open in new tab"** — DISABLED (per security — no raw HTML endpoint exposed). Tooltip: `previewTooltip`.

#### F. Send Test Dialog

- **Dialog** — MUI `<Dialog>` + `EntityFormDialogActions` for actions bar. Title: i18n `dashboard.emailTemplates.dialog.sendTestTitle`.
- **To: input** — `<OutlinedInput type="email">` with zod `z.string().email()` validation. Helper error text on invalid.
- **Sample props** — collapsible `<TextareaAutosize>` (or MUI `<TextField multiline>`) pre-filled with scope-specific default JSON. Editable for advanced test cases.
- **Rate-limit notice** — `<Typography variant="caption" color="text.secondary">` text "Max 5 test emails per minute per user" (from plan todo 12). If the mutation returns `RATE_LIMITED` error, render inline error text: `toast.sendTestRateLimited(limit)`.
- **"Send to my own email" quick button** (Phase 2) — small `<Button>` that pre-fills the To field with the current user's email (from auth store).
- **Submit** — `sendTestEmail` mutation. On success: `notifications.show(t("toast.testSent", { to }), { severity: "success" })` + optionally trigger the `SuccessCheckMark` animation (see §G) BEFORE closing the dialog. On failure: inline error in dialog body.
- **Close behavior** — on close, prompt "Discard sample props changes?" if the sample JSON was modified and the email was not sent.

#### G. Animations & Micro-interactions

- **Libraries** — reuse only what's installed today: `framer-motion@^12.43.0` (used in exactly 3 sibling `MetricCard` files), `@dnd-kit/core@^6.3.1` + `@dnd-kit/sortable@^10.0.0` (installed but UNUSED in any source file — the email plan is the first consumer). DO NOT add Motion / GSAP / auto-animate / lottie / confetti.
- **Tab transitions** — reuse `<Slide>` idiom from `preferencesChannelTabs.mobile.tsx:140` (`direction` computed from index delta, `timeout={220}`). When `usePrefersReducedMotion()` returns true, render directly without slide.
- **List entrance stagger** — mirror `MetricCard.tsx:84-88` framer-motion entrance: `initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: animationIndex * 0.04, ease: [0.25, 0.46, 0.45, 0.94] }}`. Apply to each DataGrid row wrapper (only if DataGrid supports slot rendering; otherwise apply to the named-row container). Cap `delay` so all rows animate in ≤400ms.
- **Success animation** — NEW small component `SuccessCheckMark` in `frontend/common/components/ui/feedback/`. framer-motion SVG `<path>` with `pathLength` 0 → 1, ~600ms one-shot. Used in the Send Test success state + Publish confirmation. No confetti.
- **Drag-and-drop reorder animation** — `@dnd-kit/sortable` `useSortable` ships CSS `transform` + `transition` built-in. Use `<DragOverlay dropAnimation>` for the lift/settle. The plan establishes the repo's first dnd-kit **usage convention**: helper components live in `frontend/common/components/ui/dnd/` (`SortableItem`, `SortableList`). **Install missing deps**: `@dnd-kit/utilities` + `@dnd-kit/modifiers` (`@dnd-kit/core` + `sortable` are already installed; utilities + modifiers are NOT). Do NOT add `react-dnd` or `@hello-pangea/dnd`.
- **Loading spinner** — standard `<CircularProgress size={20} color="inherit">` inside buttons (existing repo convention).
- **Skeletons** — MUI `<Skeleton>` for `EmailEditorSkeleton` and `EmailTemplatesListSkeleton` (see §B).
- **Drawer/Dialog motion** — MUI defaults: `Drawer` uses `Slide`, `Dialog` uses `Fade`. **Do NOT override `TransitionComponent`** on the 56 existing dialogs / 11 existing drawers — keep parity (research file 03).
- **Micro-interactions** — button ripple (MUI built-in). Card hover: subtle elevation change via `sx={{ transition: theme => theme.transitions.create('box-shadow'), '&:hover': { boxShadow: 2 } }}`. No `whileHover` / `whileTap` (avoid framer-motion micro-interactions — keep the repo idiomatic with CSS transitions).
- **Reduced-motion a11y guard (NEW)** — NEW `usePrefersReducedMotion()` hook in `frontend/common/lib/`:
  ```ts
  // frontend/common/lib/use-prefers-reduced-motion.ts
  'use client';
  import { useState, useEffect } from 'react';
  export function usePrefersReducedMotion(): boolean {
    const [reduced, setReduced] = useState(false);
    useEffect(() => {
      const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
      setReduced(mq.matches);
      const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
      mq.addEventListener('change', handler);
      return () => mq.removeEventListener('change', handler);
    }, []);
    return reduced;
  }
  ```
  Wrap EVERY custom animation (stagger, success-check, tab slide, drag-settle): when true, skip the animation (instant state change). **This closes a production-readiness gap** — today the codebase respects `prefers-reduced-motion` NOWHERE (research file 03). MUI Dialog/Drawer/Snackbar/Tooltip already honor the media query internally; only our custom animations need the guard. The hook is Tier-shared (lives in common, runs in both mobile and desktop tier views).
- **No global NProgress or route-level `AnimatePresence`** — loading is Suspense + per-route skeleton (`DashboardRoleSkeleton.tsx` reference). Do NOT add NProgress or AnimatePresence in layout.tsx (no precedent today).

#### H. Forms & Validation

- **Form library** — `react-hook-form` + `Controller` + `useWatch` + separate Zustand UI store. Mirror the `useManualInvoiceViewModel` architectural pattern (research file 02 confirms this is the closest precedented form pattern). **DO NOT use `useFieldArray`** — codebase-wide grep returns zero usages (research file 02); nested arrays are managed via `useWatch` + manual `setValue`.
- **Validation** — `zod` schema for editor-inspector fields (`@hookform/resolvers/zod` already installed):
  - `displayName`: min length 1, max 120.
  - `slug`: regex `^[a-z0-9-]+$`, max 64, unique per scope+locale (async check via `previewEmailTemplate` query — Phase 2).
  - `defaultFromEmail`: email format, optional.
  - `defaultSubject`: nonempty string.
  - `allowedEditorGroups`: non-empty array.
  - `attachmentRules`: each row `pattern` (regex string) + `maxSizeMb` (number, max 25).
- **Field error display** — MUI `<FormHelperText error>` + red border on `<OutlinedInput>` (`error` prop). V5-2-style: do not silently swallow validation errors.
- **Submit gate** — invalid form: focus first errored field (mirror `CatalogEditDialog` pattern). Valid form: dispatch mutate.
- **Confirmation dialogs** — reuse `EntityFormDialogActions` for actions bar (shared `frontend/common/views/dashboard/subjects/home/components/__shared__/EntityFormDialogActions.tsx`).

#### I. Theming & Dark Mode

- **No hardcoded colors** — all colors via theme palette (`sx={(theme) => ({ color: theme.palette.primary.main })}`). No hex literals anywhere (per `frontend/AGENTS.md` + research file 01).
- **Dark mode** — MUI v9 `useColorScheme()` mode drives the editor chrome `--re-*` CSS vars (light vs dark) via inline `style={{ '--re-bg': theme.palette.background.paper, ... }}` on the `<EmailEditor>` host. Wired to `ThemeSwitcher` (existing component — no work).
- **Status colors** — extend palette (small addition to `frontend/THEME_PALETTE.md`): Draft → `theme.palette.warning.main` / `warning.contrastText`, Published → `theme.palette.success.main` / `success.contrastText`, Archived → `theme.palette.action.disabled` / `text.disabled`. These reuse existing palette slots — no new tokens strictly required (research file 03 confirms MUI v9 exposes them).
- **Hover/active transitions** — `theme.transitions.create('box-shadow')` for elevation changes (see §G).

#### J. Accessibility (a11y)

- **Semantic HTML** — every interactive element has an aria-label via i18n (e.g. `aria-label={t("action.create")}`).
- **DataGrid** — `aria-label={t("dashboard.emailTemplates.pageTitle")}` + visible column headers; rows are real `<tr>` (MUI DataGrid default).
- **Filter chips** — `<Chip>` filters carry `aria-label={t("filterByScope")}` etc.
- **Dialog** — `aria-labelledby={titleId}` on `<Dialog>`, title's `<Typography id={titleId} variant="h6">`.
- **Sandboxed preview iframe** — `title={t("previewTab")}` attribute (required for screen readers).
- **Keyboard navigation** — editor toolbar buttons reachable via Tab; Drawer/Dialog trap focus (MUI default — no work). The Storybook addon-a11y toolbar surfaces any a11y warning per story.
- **Color contrast** — WCAG AA minimum (4.5:1 text / 3:1 large text). Status badge colors must meet 4.5:1 against the row background. The Grid row default background is `theme.palette.background.paper` — verify each status palette slot.
- **Reduced-motion** — `usePrefersReducedMotion()` guard (§G) — closes an existing gap.
- **addon-a11y** — `@storybook/addon-a11y` is registered (todo only — warnings do not fail CI; visual a11y review is manual per story). Research file 05 confirms no `@axe-core/playwright` or `jest-axe` is installed — Phase 2 may add `@axe-core/playwright` for E2E assertions.

#### K. Storybook Stories (required file list, mirrors [research file 05](.ai/plans/email-templates/glm_swe/ui-research/05-storybook-tests.md) lines 282-298)

Story pattern = CSF3 explicit `Meta<typeof C>` + `StoryObj<T>` type alias (`tags: ["autodocs"]`). Use `StoryWrapper` (handles locale + theme + user-store seeding globally) — no global Apollo/i18n/theme decorator registration. Apollo `MockedProvider` + `useXStore.setState({...})` per-story **inside a decorator** (reference: `frontend/common/views/dashboard/search-schedule/SearchScheduleContainer.stories.tsx:102-127`).

| # | Component | Story file |
|---|---|---|
| 1 | `useEmailTemplatesListViewModel.ts` | (no story — covered by the.list view story below) |
| 2 | `EmailTemplatesListView.tsx` switcher | `frontend/common/views/dashboard/email-templates/EmailTemplatesListView.stories.tsx` |
| 3 | `EmailTemplatesListContainer.tsx` | `frontend/common/views/dashboard/email-templates/EmailTemplatesListContainer.stories.tsx` |
| 4 | `emailTemplatesList.mobile.tsx` | `frontend/mobile/views/dashboard/email-templates/emailTemplatesList.mobile.stories.tsx` |
| 5 | `emailTemplatesList.desktop.tsx` | `frontend/desktop/views/dashboard/email-templates/emailTemplatesList.desktop.stories.tsx` |
| 6 | `useEmailTemplateEditorViewModel.ts` | (no story — covered by the editor view story below) |
| 7 | `EmailTemplateEditorView.tsx` switcher | `frontend/common/views/dashboard/email-templates/EmailTemplateEditorView.stories.tsx` |
| 8 | `EmailTemplateEditorContainer.tsx` | `frontend/common/views/dashboard/email-templates/EmailTemplateEditorContainer.stories.tsx` |
| 9 | `emailTemplateEditor.mobile.tsx` | `frontend/mobile/views/dashboard/email-templates/emailTemplateEditor.mobile.stories.tsx` |
| 10 | `emailTemplateEditor.desktop.tsx` | `frontend/desktop/views/dashboard/email-templates/emailTemplateEditor.desktop.stories.tsx` (mock `@react-email/editor` via storybook decorator — TipTap doesn't render in Storybook cleanly) |
| 11 | `EmailEditorWrapper.tsx` | covered by editor view stories (don't add a separate story) |
| 12 | `emailTemplateEditorStore.ts` Zustand | (no story — covered indirectly) |
| 13 | GraphQL docs sub-dir | (no story) |
| 14 | Admin routes page.tsx | (no story — server component) |
| 15 | React Email scaffold components (L872+) | **optional** `frontend/**/emails/<Email>.stories.tsx` for visual baselines — Phase 2 |

Each story provides default / empty / loading / error / RTL variants. RTL variant renders with `dir="rtl"` (StoryWrapper handles `stylis-plugin-rtl` cache swap).

#### L. Component / E2E Tests (mirrors [research file 05](.ai/plans/email-templates/glm_swe/ui-research/05-storybook-tests.md))

- **Runner** — `bun:test` + Happy DOM preload (`test/ui/components/happydom-preload.ts`). Vitest is reserved for the Storybook `@storybook/addon-vitest` project only. **No frontend 100%-coverage rule** (the 100% rule is for `backend/db/repo/` only).
- **Tier-split testing convention** (`frontend/common/components/ui/AGENTS.md:227-235`): test both mobile + desktop tier variants separately; unit-test the ViewModel hook in isolation; test the switcher with mocked `useViewport`; assert via rendered output (NOT implementation details); Storybook story = visual baseline.
- **Apollo mock** — `renderWithWrapper(ui, { mocks })` → `TestWrapper` builds ApolloClient with `MockLink` (`test/ui/components/TestWrapper.tsx:61-80`). i18n through `LocaleProvider`; tests set locale via `renderWithWrapper({ locale })`.
- **Required test files**:

| # | Component | Required component test file |
|---|---|---|
| 1 | `useEmailTemplatesListViewModel.ts` | `test/ui/components/email-templates/useEmailTemplatesListViewModel.test.ts` |
| 2 | `EmailTemplatesListView.tsx` switcher | `test/ui/components/email-templates/EmailTemplatesListView.test.tsx` (mocked `useViewport`) |
| 3 | `EmailTemplatesListContainer.tsx` | `test/ui/components/email-templates/EmailTemplatesListContainer.test.tsx` (permission gating) |
| 4 | `emailTemplatesList.mobile.tsx` | `test/ui/components/email-templates/emailTemplatesList.mobile.test.tsx` |
| 5 | `emailTemplatesList.desktop.tsx` | `test/ui/components/email-templates/emailTemplatesList.desktop.test.tsx` (the file plan L952 already names) |
| 6 | `useEmailTemplateEditorViewModel.ts` | `test/ui/components/email-templates/useEmailTemplateEditorViewModel.test.ts` |
| 7 | `EmailTemplateEditorView.tsx` switcher | `test/ui/components/email-templates/EmailTemplateEditorView.test.tsx` |
| 8 | `EmailTemplateEditorContainer.tsx` | `test/ui/components/email-templates/EmailTemplateEditorContainer.test.tsx` |
| 9 | `emailTemplateEditor.mobile.tsx` | `test/ui/components/email-templates/emailTemplateEditor.mobile.test.tsx` |
| 10 | `emailTemplateEditor.desktop.tsx` | `test/ui/components/email-templates/emailTemplateEditor.desktop.test.tsx` (plan L952) |
| 11 | `EmailEditorWrapper.tsx` | `test/ui/components/email-templates/EmailEditorWrapper.test.tsx` (asserts `ssr:false` lazy import behavior + that tier views import from wrapper, not `@react-email/editor` directly) |
| 12 | `emailTemplateEditorStore.ts` Zustand | `test/ui/components/email-templates/emailTemplateEditorStore.test.ts` (dirty state, dialog open, serialization — File/Blob kept out) |

- **Editor view tests must `mock.module`-stub `@react-email/editor`** because TipTap doesn't render cleanly under Happy DOM (research file 05 lines 302-303). Pattern mirrors the existing `mock.module` next/navigation stub. The real save-flow (getJSON → mutation → preview) is reserved for E2E.
- **Single E2E file** — `test/ui/e2e/email-templates.test.ts` covering the admin happy path: login (loginAsDemoUser) → navigate to `/email-templates` → list renders → click "Create" → editor opens → save mutation → publish → preview iframe assertion. Mirrors `test/ui/e2e/admin-dashboard.test.ts` pattern (`setupBrowserLifecycle`, `gotoAppRoute`, `closeE2eSession`) — no page-object layer. Requires `bun run build:test` first.
- **Bundle size verification** — KEEP from plan todo 20b: `NEXT_BUNDLE_ANALYZER=enabled bun run build` confirms the editor route's JS chunk is code-split from the main bundle (TipTap + Prism.js don't bloat the main bundle).

#### M. GraphQL Documents (KEEP verbatim from v5)

**GraphQL documents** — new sub-dir [`frontend/common/graphql/sharedDocuments/email/`](frontend/common/graphql/sharedDocuments/email/):
- `documents.ts` — `EmailTemplateQueryDocument`, `EmailTemplatesQueryDocument`, `EmailTemplateUpsertMutationDocument`, `PublishEmailTemplateMutationDocument`, `SendTestEmailMutationDocument`, `PreviewEmailTemplateQueryDocument`
- `index.ts` — `export * from "./documents";`
- Add `export * from "./email";` to [`frontend/common/graphql/sharedDocuments/index.ts`](frontend/common/graphql/sharedDocuments/index.ts)
- **Every selection set MUST include `id`** on every named object type (Apollo cache normalization per [frontend/common/graphql/sharedDocuments/AGENTS.md](frontend/common/graphql/sharedDocuments/AGENTS.md))
- **Then run** `bun run generate:gqlSchema && bun codegen`

**Apollo hooks** (`useQuery` from `@apollo/client/react`, **no** `useLazyQuery` per [frontend/AGENTS.md](frontend/AGENTS.md))

#### N. StatusBadge Extension (NEW)

- The shared `StatusBadge` (`frontend/common/components/ui/badge/StatusBadge.tsx`) has a fixed `category` prop today (`studentAccount|classSession|classStatus|...`).
- **Add a new `emailTemplate` category** so list+history use the standard status badge (inline `<Chip>` is FORBIDDEN per `COMPONENT_PATTERNS.md:170`).
- Map: `EmailTemplateStatus.DRAFT → theme.palette.warning`, `PUBLISHED → theme.palette.success`, `ARCHIVED → theme.palette.action.disabled / text.disabled`. Localized label per status via `dashboard.emailTemplates.status.*`.
- Mirror the existing category implementation (the component switches on `category` to render the right palette slot) — add the new branch + tests.

#### O. Feature Flag Visual Cue

- When `EMAIL_TEMPLATES_ENABLED === false` (using `getBooleanEnv` per todo 21c V5-2 - NEVER raw `resolveEnvConfig`):
  - **Admin pages still render** (for visual preview, since this is admin-only).
  - **Sidebar entry** displays a small `<LockOutlined fontSize="small" color="disabled" />` adjacent to the label, with a tooltip text explaining "Feature disabled — set EMAIL_TEMPLATES_ENABLED=true to send". Title from i18n `dashboard.emailTemplates.featureDisabledTooltip`.
  - **All "Send Test" + "Publish" actions** in the editor are **disabled** with the same tooltip + lock icon. The send mutation returns `EMAIL_TEMPLATES_DISABLED` GraphQL error code (mapped to a user-visible toast `toast.featureDisabled`).
- This is a small, additive visual cue — does not change the page-routing logic.

#### Zustand Store (KEEP from v5)

[`frontend/common/stores/emailTemplateEditorStore.ts`](frontend/common/stores/emailTemplateEditorStore.ts) — mutable editor state (filters, dialog open, locale/version selector, segmented control, sort, dirty flag, sampleProps). **Serialization rule**: do NOT store `File`/`Blob`/`FormData`/`Promise` in `persist`-enabled stores; keep non-serializable editor refs in `useRef` inside the ViewModel hook. There is NO separate `__mocks__` Storybook convention (research file 05 confirms) — use inline `create()` for the store; Storybook stories render containers with `args: {}` and no store override.

### i18n (complete key catalogue)

Existing call signature is **`getServerTranslations(locale)`** (single-arg) and it returns synchronously (existing usage at [backend/services/communication/templates/email-templates.ts:32](backend/services/communication/templates/email-templates.ts) calls it without `await`). Backend templates import from `@/shared/locale` — this is the canonical reverse direction; `shared/AGENTS.md` bans only `shared → backend` (one-directional). Research confirms (see [research file 09](.ai/plans/email-templates/reserch/09-i18n-react-email-interop.md)).

#### A. Extend existing `emails` namespace (backend per-scope emails + new errors sub-namespace)

Extend [`shared/locale/types/emails/index.ts`](shared/locale/types/emails/index.ts) with full per-scope labels:
- New `SubjectArgs` per scope, e.g. `ComplaintResponseEmailLabels.subject` already takes `{ complaintTitle }` — extend to all scopes (the file currently only defines `EmailLabels` for 2 of the ~13 scopes above).
- **Add a new `errors` sub-namespace** under `EmailsLabels` — does NOT exist today. Shape:
  ```ts
  export interface EmailsErrorLabels {
    readonly templateNotFound: (scope: string) => string;
    readonly templateNotPublished: (scope: string) => string;
    readonly unauthorizedEditor: () => string;
    readonly invalidDesignJson: () => string;
    readonly attachmentTooLarge: (max: number) => string;
    readonly invalidLocale: (locale: string) => string;
    readonly renderFailed: (scope: string) => string; // V4-10: normalized to bare-string (was object form)
  }
  ```
  Add the `errors: EmailsErrorLabels` field to `EmailsLabels`, then implement it in [shared/locale/en/emails/index.ts](shared/locale/en/emails/index.ts) (`emailsEn.errors.*`) and [shared/locale/ar/emails/index.ts](shared/locale/ar/emails/index.ts) (`emailsAr.errors.*`). **MANDATORY LOCKSTEP (V4-3):** `emailsEn` and `emailsAr` are both explicitly `: EmailsLabels` — adding `errors` to `EmailsLabels` will cause TypeScript errors on BOTH files until they BOTH implement `errors`. They MUST be edited atomically in the same commit.
  
  **Two-path i18n wiring (V4-3 correction):** The Siraj i18n system has two DECOUPLED lookup paths:
  1. **Client path:** `useAppTranslation(Translation.Emails)` → `defineNamespace` registry at `shared/locale/namespaces/emails/emails.namespace.ts` (handle listed at `shared/locale/namespaces/translation.ts:86,118`).
  2. **Server path:** `getServerTranslations(locale).emailsTranslations` → `getTranslations(locale)` → returns a pre-built message object (`messagesByLocale[locale]` at `server.ts:6-9,15-17`) that statically imports the SAME leaf modules (`emailsEn`/`emailsAr`) the client `defineNamespace` loaders reference. The `Translations` nominal type at `shared/locale/types/message.ts:260` is **TypeScript-only** — it validates the shape at compile time but is NOT consulted at runtime.
  
  SWE review v5 (V5-7): The server path does NOT perform a type-driven runtime lookup. Both paths consume the same `emailsEn`/`emailsAr` leaf modules at runtime. Extending `EmailsLabels` + updating both en/ar impls is sufficient; no separate `namespacePaths` or `MessageSchema` registration needed.
- All service-layer error messages use the corrected call shape: `getServerTranslations(locale).emailsTranslations.errors.<...>` (NOT `getServerTranslations(locale, "emails.errors")` — that two-arg signature does not exist and **will not compile** — verified at `shared/locale/server-graphql.ts:3`; the function is single-arg and synchronous). Added `renderFailed: (scope: string) => string` to the `EmailsErrorLabels` interface for the `safeRender()` fallback. V4-10: all `EmailsErrorLabels` methods use bare-string args consistently (matching existing `complaintResponse: (param: string) => string` precedent).
- Update English ([shared/locale/en/emails/index.ts](shared/locale/en/emails/index.ts)) and Arabic ([shared/locale/ar/emails/index.ts](shared/locale/ar/emails/index.ts)) implementations — every per-scope interface (`InvoiceGeneratedEmailLabels`, `SuggestionAcknowledgedEmailLabels`, `ClassLifecycleEmailLabels`, `StudentLifecycleEmailLabels`, `LessonReportEmailLabels`, `WelcomeEmailLabels`, `PasswordResetEmailLabels`, `EmailVerificationEmailLabels`, etc.) must be added with full en + ar implementations.

Inline-image / attachment labels use the same localized footer pattern.

#### B. NEW `dashboard.emailTemplates` UI namespace (admin management UI)

All new admin UI surfaces need a brand-new `dashboard.emailTemplates` namespace. The `emails` backend namespace (above) is functionally distinct (it covers email BODY/subject strings rendered into outbound emails). The admin UI surface needs its own namespace per the Siraj two-locale system. Below is the COMPLETE key catalogue grouped by surface (verbatim from [research file 04 lines 278-322](.ai/plans/email-templates/glm_swe/ui-research/04-i18n-locale.md)):

**Navigation labels**
- `dashboard.emailTemplates.navLabel` (sidebar entry under Admin group → ALSO add `emailTemplates: string` to `DashboardNavigationLabels` in `shared/locale/types/dashboard/core/nav.ts`)
- `pageTitle`, `pageSubtitle`

**Table headers (`dashboard.emailTemplates.column.*`)**
- `name`, `scope`, `localeColumn`, `status`, `lastEdited`, `version`, `allowedEditorGroups`

**Status chip labels (`dashboard.emailTemplates.status.*`)**
- `draft`, `published`, `archived` (align with `EmailTemplateStatus` enum)

**Button labels (`dashboard.emailTemplates.action.*`)**
- `create`, `edit`, `preview`, `publish`, `archive`, `restore`, `sendTest`, `duplicate`, `copyHtml`, `revisions`, `saveDraft`, `discard`

**Dialog titles (`dashboard.emailTemplates.dialog.*`)**
- `createTitle`, `editTitle: (name) => string`, `deleteConfirmTitle`, `publishConfirmTitle: (name) => string`, `archiveConfirmTitle`, `restoreConfirmTitle`, `sendTestTitle`, `revisionsTitle`
- `unsavedChangesTitle`, `unsavedChangesBody`, `beforeUnloadPrompt`

**Form field labels / help text (`dashboard.emailTemplates.helpText.*`)**
- `displayName`, `slug`, `scopeLabel`, `localeSelect`, `defaultFromName`, `defaultFromEmail`, `allowedEditorGroups`, `attachmentRules`, `defaultSubject`, `designJson`

**Tooltips (`dashboard.emailTemplates.*`)**
- `scopeTooltip`, `editorGroupsTooltip`, `previewTooltip`, `versionTooltip`, `attachmentRulesTooltip`, `featureDisabledTooltip`

**Toast messages (`dashboard.emailTemplates.toast.*`)**
- `saved: () => string`, `published: () => string`, `archived: () => string`, `restored: () => string`, `deleted: () => string`, `testSent: (to: string) => string`, `saveFailed`, `publishFailed`, `archiveFailed`, `sendTestFailed`, `copyHtmlCopied: () => string`, `rateLimited: (limit: number) => string`, `featureDisabled`

**Error messages (UI layer — distinct from `emails.errors` backend fns) (`dashboard.emailTemplates.error.*`)**
- `loadFailed`, `previewFailed`, `notFound`, `notEditable`, `versionMismatch: (expected: number, got: number) => string`, `invalidDesignJson`, `duplicateScopeLocale`, `missingCompiledHtml`

**Empty states (`dashboard.emailTemplates.empty.*`)**
- `emptyState`, `emptyStateHelp`, `emptyRevisions`, `emptyRevisionsHelp`, `noSearchResults`

**Search / filter (`dashboard.emailTemplates.filter.*`)**
- `searchPlaceholder`, `filterByScope`, `filterByStatus`, `filterByLocale`, `clearFilters`, `viewActive`, `viewArchived`, `viewAll`

**Editor (`dashboard.emailTemplates.editor.*`)**
- `editorLoading`, `editorNotReady`, `discardConfirm`, `previewTab`, `htmlTab`, `codeTab`, `jsonTab`, `copyHtml`, `sendPreviewEmail`, `previewTo`

**Send-test dialog (`dashboard.emailTemplates.sendTest.*`)**
- `recipientLabel`, `recipientPlaceholder`, `sampleProps`, `submit`, `success: (to: string) => string`, `rateLimited: (limit: number) => string`

**Misc reusable** — `loading`, `cancel`, `save`, `confirm`, `delete`, `close` — **reuse `common` namespace** (`shared/locale/en/common/index.ts:29-33`). DO NOT duplicate these in `dashboard.emailTemplates`.

**LOCKSTEP rule (V4-3 applies same as `emails`)**: `dashboardEmailTemplates{En,Ar}` MUST be added atomically — the type interface in `shared/locale/types/dashboard/emailTemplates/main.ts` plus en + ar impls + namespace registration must all land in the same commit. Note: each new namespace (especially with functions taking typed args) demonstrates V4-3-style lockstep discipline.

**7-file atomic changeset for the new UI namespace** (verbatim from [research file 04 lines 326-333](.ai/plans/email-templates/glm_swe/ui-research/04-i18n-locale.md)):
1. `shared/locale/types/dashboard/emailTemplates/main.ts` — define `EmailTemplatesManagementLabels`
2. `shared/locale/en/dashboard/emailTemplates/main.ts` + `shared/locale/ar/dashboard/emailTemplates/main.ts` — both must implement every key atomically (TS errors otherwise — V4-3 lockstep echoes here)
3. `shared/locale/namespaces/dashboard/emailTemplates/main.namespace.ts` — `defineNamespace` handle
4. `shared/locale/types/message.ts` — add `emailTemplates: EmailTemplatesManagementLabels` to `DashboardTranslations` + import the new type
5. `shared/locale/en/messages.ts` + `shared/locale/ar/messages.ts` — add `emailTemplates: dashboardEmailTemplates{En,Ar}` to `dashboardTranslations`
6. `shared/locale/namespaces/index.ts` + `shared/locale/namespaces/translation.ts` — re-export `DashboardEmailTemplates` namespace handle + add to `Translation.Dashboard`
7. `shared/locale/types/dashboard/core/nav.ts` + `shared/locale/en/.../core/nav.ts` + `shared/locale/ar/.../core/nav.ts` — add `emailTemplates` nav label (mirrors the §A navigation addition)

Together with the §A `emails` namespace extension (existing `EmailsLabels` + new `errors` sub-namespace), the i18n work comprises TWO atomic changesets that MUST land together — failing either one breaks the build (TS type error on the missing impl).
