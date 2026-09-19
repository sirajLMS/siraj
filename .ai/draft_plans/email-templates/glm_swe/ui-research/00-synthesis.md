# 00 — UI/UX Research Synthesis (email template system)

> **Purpose:** single executive summary that reviewers consult first before diving into the
> deeper research files (`01`–`04`) in this same directory. It distills the top
> recommendations per surface, surfaces the cross-cutting gaps to close, and
> reaffirms the locked technical decisions the UI/UX design MUST
> preserve.

---

## 1. Top recommendations by research file

### 01 — Dashboard inventory
- **Routes are `app/(dashboard)/…`, NOT `app/[locale]/…`** — locale comes from a cookie
  (`getLocale()` reads `NEXT_LOCALE` → `Accept-Language`). The `/email-templates` +
  `/email-templates/[id]` shape is consistent with the codebase convention.
- Reuse verbatim: `SidebarShell` + `navigationConfig.ts` `SIDEBAR_NAV_ITEMS` registry;
  `usePageBreadcrumbs({ currentTitle, overrides })`; `DesktopPageContainer` / `MobilePageContainer`
  + `DesktopPageHeader` / `MobilePageHeader` + `SectionPanel`; `AppDataGrid` (wraps MUI X DataGrid v9,
  requires `paginationOptions: ListPaginationOptions`); `useRowMenuAnchor` row-actions pattern
  (`permissionGroupsDataGrid.desktop.tsx:46–178`); `MetricCard` grid wrappers; `PageHeaderBreadcrumb`.
- Reuse `payment-catalogs/` page scaffolding (`PaymentCatalogsPageContainer`,
  `CatalogEditDialog`, `PaymentCatalogsTabPanels` + `paymentCatalogsTabsStore`) verbatim — it is
  the closest admin CRUD analogue and demonstrates the `CountryAutocomplete` + `TagInput` combo
  that maps 1:1 to the editor's scope-lock + allowed-editor-groups chip selectors.
- **Permission gate is two-layered**: server `requirePermissionForPage(userId, perms[], locale, ctx)`
  in `page.tsx` + client `<RequirePermission permissions={PAGE_PERMISSIONS.<page>} fallback={null}>`
  in the Container (mirror `payment-catalogs`). A **new `AppPermission.EMAIL_TEMPLATES_MANAGE`**
  enum value must be added.
- Toasts use **`@toolpad/core/useNotifications`** (`notifications.show(msg, { severity })`) —
  there is no Notistack. `FormSuccessSnackbar` / `FormErrorSnackbar` exist for persistent feedback.
- Page-level state (filters, tabs, dialog open) belongs in a **Zustand store** (mobile/desktop
  isolation rule — filters must survive viewport switching). Mirror `paymentCatalogsTabsStore`.

### 02 — Template editor
- **ZERO React Email code today** — no `emails/` dir, no scaffolds, no `EmailEditor`/`EmailTheming`
  imports. The editor wrapper + scaffolds are net-new.
- Form pattern: **`useManualInvoiceViewModel`** is the 1:1 architectural precedent — RHF
  (`useForm` + `zodResolver` or native `rules`) + `Controller` + `useWatch` + a **separate
  Zustand UI store** for cross-component state (`isSubmitting`, `showSuccess`, …). **DO NOT use
  `useFieldArray`** — codebase-wide grep confirms zero usages; nested arrays are managed via
  `useWatch` + manual `setValue`.
- Variable/merge-tag picker: build a new `VariableMentionPicker` Autocomplete reusing the
  `useAudienceAutocomplete*` hook family. TipTap `extension-mention` is **transitively**
  available (via `@react-email/editor`) — an inline `@mention` UX is achievable without a new dep.
- `@dnd-kit/core` + `@dnd-kit/sortable` are installed but **unused** — the email editor is the first
  consumer. `@dnd-kit/utilities` + `@dnd-kit/modifiers` are NOT installed and must be added.
- `ScopedCssBaseline` is net-new (the codebase uses only the global `CssBaseline` in
  `AppThemeProvider`). Wrap the editor in `ScopedCssBaseline` so the
  MUI reset doesn't break ProseMirror, and import editor CSS **after** MUI's CSS.
- Sanitization: adopt the `safeRender()` snippet verbatim with `isomorphic-dompurify`
  + `ALLOWED_TAGS` / `ALLOWED_ATTR` (`isomorphic-dompurify` already installed and verified working
  under Bun).

### 03 — Animations
- **framer-motion@^12.43.0** is installed but used in exactly 3 sibling `MetricCard` files
  (`frontend/{common,desktop,mobile}/components/ui/card/MetricCard/styled.tsx`) — stagger-by-index
  entrance: `initial={{opacity:0,y:24}} animate={{opacity:1,y:0}} transition={{duration:0.4,
  delay:animationIndex*0.04, ease:[0.25,0.46,0.45,0.94]}}`. Reuse this pattern for the editor
  block-list entrance — do NOT add Motion/GSAP/auto-animate/lottie/confetti.
- **MUI transitions authored**: only `<Collapse>` ×3 and **one `<Slide direction={...}>` tab idiom**
  at `preferencesChannelTabs.mobile.tsx:140` (`direction={slideDirection} in appear mountOnEnter
  unmountOnExit timeout={220}` — direction computed from tab index delta). `<Fade>/<Grow>/<Zoom>`
  are NOT authored; do NOT add custom `TransitionComponent` overrides on the 56 Dialogs / 11
  Drawers (use MUI defaults — Dialog=Fade, Drawer=Slide).
- **`prefers-reduced-motion` is respected NOWHERE** — production-readiness gap, closed via a new
  `usePrefersReducedMotion` helper in `frontend/common/lib/` wrapping every
  custom animation (stagger, success-check, drag-settle). MUI Dialog/Drawer/Snackbar/Tooltip
  already honor the media query internally — only custom animations need the guard.
- dnd-kit ships its own animation: `useSortable()` yields `transform` + `transition` applied as
  CSS, plus `<DragOverlay dropAnimation>` for the lift/settle. **Use dnd-kit built-ins**; do NOT
  pull in framer-motion `Reorder`.
- Success animation: a new `SuccessCheckMark` component (framer-motion `pathLength` on SVG check,
  ~600ms one-shot) is net-new — lives in `frontend/common/components/ui/feedback/`. No lottie/confetti.
- No NProgress, no route-level `AnimatePresence`; loading is Suspense + per-route skeleton
  (`DashboardRoleSkeleton.tsx` is the reference structure — mirror it as
  `EmailEditorSkeleton` + `EmailTemplatesListSkeleton`).

### 04 — i18n / locale
- Two-path i18n: **client** `useAppTranslation<TLabels>(handle)` (single-arg, synchronous,
  reads `useAppLocale()` then `readTranslation(handle, locale)`); **server** `getTranslations(locale)`
  / `getServerTranslations(locale)` (single-arg, synchronous, returns the pre-built
  `messagesByLocale[locale]` object — drill by dot access). **No 2-arg form** —
  `getTranslations(locale, "namespace")` does not compile.
- **`ctx.t()` in GraphQL is the no-arg form** returning the full `Translations` object — drill as
  `ctx.t().emailsTranslations.errors.*`. (Older doc snippets describing `ctx.t("errors")` are stale.)
- The existing `emails` namespace covers only **2 of ~13 EmailScopes** (`complaintResponse`,
  `suggestionAcknowledged`) and has **no `errors` sub-namespace** and **zero UI labels**.
- The admin management UI needs a **NEW `dashboard.emailTemplates` namespace** (proposed schema
  at research file 04, lines 278–322). Two locales only (`["ar","en"]`,
  default `ar`); RTL via `dir` attr + `stylis-plugin-rtl` cache swap.
- **Lockstep rule:** `EmailsLabels` extension to `emailsEn` + `emailsAr` MUST be atomic
  (a missing impl breaks the TS type → compile error). The same lockstep applies to
  the new `dashboardEmailTemplates{En,Ar}` modules. The 7 files that change atomically for the
  UI namespace are enumerated at research file 04, lines 326–333.

---

## 2. Cross-cutting gaps to close

1. **Sidebar registration** — no `emailTemplates` nav label exists anywhere; add a `NavItem` to
   `SIDEBAR_NAV_ITEMS` under the Admin group + a `DashboardNavigationLabels.emailTemplates` key.
2. **Permission enum** — `AppPermission.EMAIL_TEMPLATES_MANAGE` does not exist; add it and a
   `PAGE_PERMISSIONS.emailTemplates` entry.
3. **StatusBadge category** — the shared `StatusBadge` has no `emailTemplate` category; extend it
   (Draft→`warning`, Published→`success`, Archived→`default`) — inline `<Chip>` is forbidden per
   `COMPONENT_PATTERNS.md:170`.
4. **Two-pane editor layout** — no master-detail / inspector primitive exists; build a tier-split
   `EditorShell` (desktop: left editor + right inspector; mobile: stacked with bottom-sheet `<Drawer>`).
5. **Sandboxed iframe + CSP** — no preview iframe anywhere; net-new. `sandbox=""`, `srcDoc`,
   CSP `default-src 'none'; style-src 'unsafe-inline'; img-src 'self' data:`, server-side
   `DOMPurify.sanitize` before serving.
6. **List filter toolbar** — no shared `FilterToolbar`/`SearchToolbar`; compose inline
   (`OutlinedInput` + `SearchOutlined` startAdornment) inside `SectionPanel.actions`; filter state
   in the editor store (survives viewport switching).
7. **Merge-tag insertion UX** — net-new; `VariableMentionPicker` Autocomplete built on
   `useAudienceAutocomplete*` pattern; TipTap `extension-mention` available for inline body UX.
8. **Test-send modal** — net-new; `BaseDeleteDialog` is the only shared confirm primitive — reuse
   `EntityFormDialogActions` for the actions bar of a fresh `SendTestEmailDialog`.
9. **dnd-kit usage convention** — established pattern is absent (deps installed, zero source
   usages); set the convention now (`useSortable` + `DragOverlay.dropAnimation`, add
   `@dnd-kit/utilities` + `@dnd-kit/modifiers`).
10. **`prefers-reduced-motion` discipline** — respected nowhere today; the new
    `usePrefersReducedMotion` helper + guarded custom animations (stagger, success-check,
    drag-settle) raise the a11y bar for the whole codebase's first custom-motion surface.
11. **Unsaved-changes protection** — no codebase precedent for `beforeunload` + in-app navigate-away
    guard; `isDirty` tracked in the Zustand store, the helper is new but the convention is standard.
12. **Feature-flag visual cue** — when `EMAIL_TEMPLATES_ENABLED=false`, render the admin pages for
    preview but surface a `<LockOutlined>` + tooltip on the sidebar entry; the send route returns
    an error so no email leaks prematurely.

---

## 3. Locked technical decisions the UI/UX design MUST preserve

- **`EmailEditorWrapper.tsx`** in the common layer centralizes `next/dynamic(() =>
  import('@react-email/editor').then(m => m.EmailEditor), { ssr: false })`. The `ssr: false` is a
  deliberate first-in-repo deviation (TipTap touches `window` at module load). Tier views import
  `EmailEditor` from the wrapper ONLY — never directly from `@react-email/editor`, never via a
  second `next/dynamic` import.
- **RT/integer design** — `EmailEditorRef`: `getJSON(): JSONContent` sync + `getEmail():
  Promise<{html, text}>` async. Save flow is **atomic**: `getJSON` sync → `getEmail` async →
  single mutation accepting both `designJson` + `compiledHtml`. Files/Blobs live in `useRef`,
  NOT in the Zustand store (non-serializable).
- **CSS layering** — wrap the editor in MUI v9's `ScopedCssBaseline`; import `@mui/material/styles`
  **before** `@react-email/editor/themes/default.css` so the MUI reset does not override
  ProseMirror styling.
- **Two theming layers** — Layer A: `--re-*` CSS custom properties for editor chrome (bubble
  menu / slash command / Inspector). Layer B: `EmailTheming.configure({ theme })` for the
  emailed HTML output, imported from the **`/plugins` subpath**
  (`import { EmailTheming, extendTheme } from '@react-email/editor/plugins'`) and passed as
  `extensions={[EmailTheming.configure({ theme })]}`. `--re-*` vars do NOT affect the emailed HTML.
- **GraphQL documents** live in `frontend/common/graphql/sharedDocuments/email/`:
  `EmailTemplateQueryDocument`, `EmailTemplatesQueryDocument`, `EmailTemplateUpsertMutationDocument`,
  `PublishEmailTemplateMutationDocument`, `SendTestEmailMutationDocument`,
  `PreviewEmailTemplateQueryDocument`. Every selection set includes `id` (Apollo cache
  normalization). Hooks use `useQuery` from `@apollo/client/react` — **no `useLazyQuery`**. Run
  `bun run generate:gqlSchema && bun codegen` after changes.
- **Admin routes** under `app/(dashboard)/email-templates/{page,[id]/page}.tsx`, locale from
  cookie (NOT a `[locale]` URL segment). (`app/AGENTS.md:59`.)
- **Zustand store** `frontend/common/stores/emailTemplateEditorStore.ts` holds serializable state
  only (`isDirty`, `selectedScope`, locale/version selector, dialog open).
- **`emails` namespace extension** — add the `errors: EmailsErrorLabels` sub-namespace
  (`templateNotFound`, `templateNotPublished`, `unauthorizedEditor`, `invalidDesignJson`,
  `attachmentTooLarge`, `invalidLocale`, `renderFailed`) to `EmailsLabels` plus per-scope
  `*EmailLabels` interfaces for the ~11 missing scopes; `emailsEn` + `emailsAr` MUST land
  atomically (lockstep). Service error strings use `getServerTranslations(locale).
  emailsTranslations.errors.<…>` (single-arg, sync — never the non-existent 2-arg form).
- **Sanitization** — `safeRender()` with `isomorphic-dompurify` + explicit `ALLOWED_TAGS` /
  `ALLOWED_ATTR` is the belt-and-suspenders path; pair with TipTap schema validation at save.
  Verified: `isomorphic-dompurify.sanitize()` strips `<script>` + `onerror` under Bun.
- **Orphan migration** — the existing `backend/services/communication/templates/email-templates.ts`
  (hardcoded `#1976d2`/`#2e7d32`) is migrated (not overwritten) and deleted only after the
  dispatcher migration completes.
- **Feature flag** — `getBooleanEnv("EMAIL_TEMPLATES_ENABLED")` from `@/backend/lib/env`
  (string-truthy bug; the bare `=== "true"` check is handled by the helper), registered in
  `env-config-keys.ts`.

---

## 4. What this synthesis unlocks

With the locked decisions fixed and the cross-cutting gaps enumerated, the Frontend +
i18n work for the email template system becomes an exhaustive UI/UX design: navigation, page
layouts, list + editor views, preview tab, send-test dialog, animations (with reduced-motion a11y
guard), forms/validation, theming/dark mode, a11y, status-badge extension, feature-flag visual
cue, and the complete `dashboard.emailTemplates` i18n key catalogue. Implementation can proceed
without further design ambiguity.
