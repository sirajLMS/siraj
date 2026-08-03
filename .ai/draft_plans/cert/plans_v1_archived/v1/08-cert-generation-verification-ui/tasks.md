# Tasks: Certificate Generation & Verification UI (Plan 08)

## Document Information

- **Feature Name**: Certificate Generation & Verification Frontend UI
- **Target Directory**: `.ai/draft_plans/cert/plans/08-cert-generation-verification-ui`
- **Version**: 1.0
- **Date**: 2025-08-01
- **Author**: Siraj Development Team
- **Related Documents**:
  - Requirements: `.ai/draft_plans/cert/plans/08-cert-generation-verification-ui/requirements.md`
  - Design: `.ai/draft_plans/cert/plans/08-cert-generation-verification-ui/design.md`
  - Analysis: `.ai/draft_plans/cert/siraj_analysis/05-frontend-patterns.md`
  - Analysis: `.ai/draft_plans/cert/siraj_analysis/08-app-router-navigation.md`
  - Analysis: `.ai/draft_plans/cert/siraj_analysis/06-i18n-system.md`

---

## Task Summary

| Task | Title | Est. Duration | Dependencies |
|------|-------|---------------|--------------|
| 1 | Add certificate GraphQL documents | 2–3 hours | Plan 05 (GraphQL API) |
| 2 | Create certificate list: container + view models + desktop/mobile views + app route | 3–4 hours | Task 1, Plan 09 (i18n namespace) |
| 3 | Create generate certificate dialog | 2–3 hours | Task 1, Task 2 |
| 4 | Create certificate detail: container + view model + desktop/mobile views + app route | 3–4 hours | Task 1, Plan 09 |
| 5 | Create revoke certificate dialog | 1–2 hours | Task 1, Task 4 |
| 6 | Create public verification page (Server Component, no auth) | 2–3 hours | Plan 04 (services), Plan 09 |
| 7 | Create download certificate handler + navigation config | 1–2 hours | Task 2, Task 4 |
| 8 | Quality loop per file (tsgo + biome + lint) + instruction verification | 2–3 hours | Tasks 1–7 |
| 9 | Knowledge propagation (update AGENTS.md, frontend docs) | 1–2 hours | Task 8 |

---

## Pre-Task Instructions

**Before starting any task:**

1. Read the following instruction files:
   - `.github/instructions/frontend.instructions.md` — Frontend-specific rules (MUI v9, Apollo, Path aliases, zustand patterns)
   - `frontend/AGENTS.md` — Frontend layer rules
   - `frontend/views/AGENTS.md` — Views layer rules
   - `frontend/common/graphql/sharedDocuments/AGENTS.md` — GraphQL document conventions
   - `frontend/common/graphql/AGENTS.md` — GraphQL layer rules
   - `frontend/stores/AGENTS.md` — Zustand store rules (for Task 2)

2. Read the following AGENTS.md files:
   - Root `AGENTS.md` — Always applicable
   - `app/AGENTS.md` — App Router rules (for Tasks 2, 4, 6 — page.tsx files)
   - `shared/AGENTS.md` — Shared layer rules (for i18n imports)

3. Read the Requirements file: `.ai/draft_plans/cert/plans/08-cert-generation-verification-ui/requirements.md`

4. Read the Design file: `.ai/draft_plans/cert/plans/08-cert-generation-verification-ui/design.md`

**Quality loop for every task:**

After completing each task's code changes, run the per-file verification loop:

```bash
# 1. Type check (safe to run concurrently)
~/.bun/bin/bun tsgo

# 2. Biome (safe to run concurrently)
~/.bun/bin/bun biome:check

# 3. Lint via queue client (start server first if not running)
~/.bun/bin/bun run scripts/lint-queue-server.ts &  # background
~/.bun/bin/bun run lint  # full-repo lint through queue OR:
curl -s -X POST http://localhost:${LINT_QUEUE_PORT}/lint \
  -H "Content-Type: application/json" \
  -d '{"id":"verify-task-N","files":["<file1>","<file2>"]}'
```

Start the lint queue server as a detached background process if not already running:

```bash
~/.bun/bin/bun run scripts/lint-queue-server.ts &
```

Verify it's listening:

```bash
curl -s http://localhost:${LINT_QUEUE_PORT}/status
# Returns: { running: true, queueLength: 0 }
```

Resolve all issues before proceeding to the next task.

---

## Task 1: Add Certificate GraphQL Documents

**Duration:** 2–3 hours

**_Requirements_:** REQ-01.3 (list query), REQ-04.3 (detail query), REQ-03.2 (templates query), REQ-03.4 (recipient groups query), REQ-03.7 (generate mutation), REQ-06.3 (revoke mutation), REQ-07.3 (verify query for reference)

**_Design Reference_:** Design §6 — GraphQL Documents

### Instructions

1. Create the directory `frontend/common/graphql/sharedDocuments/cert/` if it does not exist.

2. Create `frontend/common/graphql/sharedDocuments/cert/certificates.documents.ts` with the following documents:
   - `certificatesQueryDocument` — list query with `paginationArgs` and `filterArgs`, returns `data { id, studentName, templateName, status, issueDate, verificationCode, fileUrl, thumbnailUrl }` and `pageInfo { count currentPage hasMorePages lastPage perPage total }`
   - `certificateQueryDocument` — single certificate by ID, returns all fields including `expiryDate`, `revokedAt`, `revocationReason`, `version`, `createdAt`
   - `generateCertificateMutationDocument` — mutation with `GenerateCertificateInput` input, returns `id` and `successCount`
   - `revokeCertificateMutationDocument` — mutation with `RevokeCertificateInput` input, returns `id`, `status`, `revokedAt`
   - `verifyCertificateQueryDocument` — public verify by code, returns `templateName`, `recipientName`, `issueDate`, `status`, `academyName`, `verificationCode`, `revocationReason`
   - `certificateRecipientGroupsQueryDocument` — returns `id`, `name`, `recipientCount`, `studentIds`
   - `publishedCertificateTemplatesQueryDocument` — query for published templates with `filterArgs: { status: "PUBLISHED" }`, returns `id`, `name`, `description`, `status`, `orientation`, `width`, `height`, and nested `variables { id, variableKey, variableType, label, isRequired, defaultValue }`

3. Use `gql` from `@apollo/client` and `TypedDocumentNode` from `@graphql-typed-document-node/core` for type safety.

4. Always include the `id` field on every object type in every document (Apollo cache normalization requirement — see `frontend/common/graphql/sharedDocuments/AGENTS.md`).

5. Name documents following the convention: `{entityName}QueryDocument`, `{entityName}MutationDocument` (see `frontend/common/graphql/AGENTS.md`).

6. Import types from `@/backend/types` for the `TypedDocumentNode` type parameters — use `Types.XArgs` for input types and `Operations.XQuery` for operation types.

### Quality Loop

```bash
# Verify the new file
~/.bun/bin/bun tsgo
~/.bun/bin/bun biome:check -- frontend/common/graphql/sharedDocuments/cert/certificates.documents.ts
curl -s -X POST http://localhost:${LINT_QUEUE_PORT}/lint \
  -H "Content-Type: application/json" \
  -d '{"id":"verify-task-1","files":["frontend/common/graphql/sharedDocuments/cert/certificates.documents.ts"]}'
```

### Instruction Verification

- [ ] Read `frontend/common/graphql/sharedDocuments/AGENTS.md` — verify document naming, `id` field requirement, `TypedDocumentNode` pattern
- [ ] Read `frontend/common/graphql/AGENTS.md` — verify import from `@apollo/client`, no `useLazyQuery`
- [ ] Read `frontend/AGENTS.md` — verify path alias `@/` usage
- [ ] Verify no `console.*` — use `logger` if logging is needed
- [ ] Verify no hardcoded strings — all user-facing text via translation system

---

## Task 2: Create Certificate List — Container + ViewModels + Desktop/Mobile + App Route

**Duration:** 3–4 hours

**_Requirements_:** REQ-01.1 through REQ-01.14 (list page), REQ-02.1 through REQ-02.4 (mobile/desktop), REQ-09.1 through REQ-09.3 (navigation), REQ-10.1, REQ-10.3 (i18n)

**_Design Reference_:** Design §2.1 (list page), §3.1 (container), §3.2 (view model), §4.1 (desktop), §4.2 (mobile), §7 (Zustand store), §8 (navigation config)

### Instructions

1. **Create Zustand store:** `frontend/common/stores/certificatesStore.ts`
   - State: `page`, `pageSize`, `search`, `statusFilter`, `templateFilter`, `dateFrom`, `dateTo`
   - Setters reset `page` to 0 when filters change
   - Type `CertificateStatusFilter = "all" | "DRAFT" | "ISSUED" | "EXPIRED" | "REVOKED" | "ARCHIVED"`
   - Follow the pattern from `frontend/stores/AGENTS.md`

2. **Create types file:** `frontend/common/views/dashboard/certificates/types.ts`
   - `CertificateListRow` — `{ id, recipientName, templateName, status, issueDate, verificationCode, fileUrl, thumbnailUrl }`
   - `CertificateStatusBadge` — type for status badge component
   - `CertificateListLabels` — Pick from the canonical `CertificateLabels` interface (see `frontend/views/AGENTS.md` Rule 7 for view-layer label types)
   - All other view-local types

3. **Create ViewModel hook:** `frontend/common/views/dashboard/certificates/useCertificateListViewModel.ts`
   - `"use client"` directive
   - Import `useQuery` from `@apollo/client/react`
   - Import `certificatesQueryDocument` from Task 1
   - Import `useCertificatesStore` from step 1
   - Import `useUserStore` for permissions check
   - Import `useAppTranslation` from `@/shared/locale` with `Translation.Dashboard.Certificates` handle
   - Map raw Apollo rows to `CertificateListRow[]` via a `mapCertificateRow` function
   - Expose `labels`, `rows`, `totalCount`, `loading`, `error`, `page`, `pageSize`, `onPageChange`, `search`, `onSearchChange`, `statusFilter`, `onStatusFilterChange`, `templateFilter`, `onTemplateFilterChange`, `dateFrom`, `dateTo`, `onDateRangeChange`, `canGenerate`, `canDownload`, `onRetry`, `onViewCertificate`, `isGenerateDialogOpen`, `onOpenGenerateDialog`, `onCloseGenerateDialog`
   - Use `fetchPolicy: "cache-and-network"`
   - Use `logger.error` for error logging (never `console.*`)
   - Return flat plain object with `labels` group

4. **Create Container:** `frontend/common/views/dashboard/certificates/CertificateListContainer.tsx`
   - `"use client"` directive
   - Import `RequirePermission` from `@/frontend/common/components/auth/RequirePermission`
   - Import `createLazyView` from `@/frontend/common/components/ui/container/createLazyView`
   - Import `ResponsiveViewSwitch` from `@/frontend/common/components/ui/container/ResponsiveViewSwitch`
   - Import `AppPermission` from `@/frontend/common/graphql/generated/gql/graphql-types`
   - Define `lazyViews` with `createLazyView<CertificateListViewModel>` at module top level with static dynamic imports:
     - Mobile: `() => import("@/frontend/mobile/views/dashboard/certificates/certificateListView.mobile").then(m => ({ default: m.CertificateListMobile }))`
     - Desktop: `() => import("@/frontend/desktop/views/dashboard/certificates/certificateListView.desktop").then(m => ({ default: m.CertificateListDesktop }))`
   - Wrap in `<RequirePermission permissions={[AppPermission.CertificatesList, AppPermission.CertificatesViewOwn, AppPermission.CertificatesViewOther]} fallback={null}>`
   - Then `<ResponsiveViewSwitch mobile={lazyViews.mobile} desktop={lazyViews.desktop} props={viewModel} />`

5. **Create Desktop view:** `frontend/desktop/views/dashboard/certificates/certificateListView.desktop.tsx`
   - `"use client"` directive
   - Import `DesktopAppDataGrid` from `@/frontend/common/components/ui/dataGrid/DesktopAppDataGrid`
   - Import `GridColDef` from `@mui/x-data-grid`
   - Columns: recipientName, templateName, status (renderCell with StatusBadge), issueDate, verificationCode (truncated), actions (view button, download link, no revoke in list context)
   - `paginationOptions: { mode: "server" }` — REQUIRED prop on AppDataGrid
   - StatusBadge component: uses MUI `<Chip>` with color based on status (success/warning/error/default)
   - Filter bar: search input (debounced 300ms), status dropdown, template dropdown, date range pickers
   - "Generate Certificate" button shown only when `viewModel.canGenerate` is true
   - All labels from `viewModel.labels` (never hardcoded)
   - Use `sx` prop for MUI styling (NEVER style props directly)
   - Typography variants: `headlineSm`, `bodyMd`, `labelUppercase` (MUI v9 names)

6. **Create Mobile view:** `frontend/mobile/views/dashboard/certificates/certificateListView.mobile.tsx`
   - `"use client"` directive
   - Card-based layout using MUI `<Card>`, `<CardActionArea>`, `<CardContent>`
   - Each certificate renders as a card with: recipient name (headlineSm), template (bodyMd), status Chip, issue date (labelUppercase), truncated verification code (bodySm)
   - Card click navigates to detail (`onViewCertificate`)
   - "Generate Certificate" floating action button (FAB) if `viewModel.canGenerate`
   - "Load More" button at bottom (infinite scroll alternative)
   - All labels from `viewModel.labels`

7. **Create App Route page:** `app/(dashboard)/dashboard/certificates/page.tsx`
   - Server Component (no `"use client"`)
   - `import { getServerUserContext } from "@/backend/lib/auth/server-auth"`
   - `import { redirectToLogin } from "@/frontend/common/lib/redirectToLogin"`
   - `import { requirePermissionForPage } from "@/backend/lib/auth/require-permission"`
   - `import { AppPermission } from "@/backend/enum"`
   - `import { getLocale } from "@/shared/locale/server-cookies"`
   - `import { getTranslations } from "@/shared/locale"`
   - `import { CertificateListContainer } from "@/frontend/common/views/dashboard/certificates/CertificateListContainer"`
   - `generateMetadata()` — `const locale = await getLocale(); const t = getTranslations(locale).dashboardTranslations.certificates.list; return { title: t.pageTitle }`
   - Default export: async function, `getLocale()`, `getServerUserContext()`, redirect if no `userId`, `requirePermissionForPage(userId, [AppPermission.CertificatesList, AppPermission.CertificatesViewOwn, AppPermission.CertificatesViewOther], locale, context)`
   - Wrap `<CertificateListContainer />` in `<Suspense>` with `<CircularProgress>` fallback

8. **Update PAGE_PERMISSIONS:** Add `certificatesList` and `certificatesDetail` entries to `frontend/common/types/page-permissions.types.ts` (see Design §8.3)

9. **Update navigation config:** Add `grp_certificates` group and `certificates` nav item to `frontend/common/views/dashboard/config/navigationConfig.ts` (see Design §8.1, §8.2)

### Quality Loop

```bash
~/.bun/bin/bun tsgo
~/.bun/bin/bun biome:check
curl -s -X POST http://localhost:${LINT_QUEUE_PORT}/lint \
  -H "Content-Type: application/json" \
  -d '{"id":"verify-task-2","files":["frontend/common/stores/certificatesStore.ts","frontend/common/views/dashboard/certificates/CertificateListContainer.tsx","frontend/common/views/dashboard/certificates/useCertificateListViewModel.ts","frontend/common/views/dashboard/certificates/types.ts","frontend/desktop/views/dashboard/certificates/certificateListView.desktop.tsx","frontend/mobile/views/dashboard/certificates/certificateListView.mobile.tsx","app/(dashboard)/dashboard/certificates/page.tsx","frontend/common/types/page-permissions.types.ts","frontend/common/views/dashboard/config/navigationConfig.ts"]}'
```

### Instruction Verification

- [ ] Read `frontend/AGENTS.md` — verify MUI v9 rules (sx prop, Typography variants, icon naming), path aliases
- [ ] Read `frontend/views/AGENTS.md` — verify Container+ViewModel pattern, createLazyView, ResponsiveViewSwitch
- [ ] Read `frontend/stores/AGENTS.md` — verify Zustand store patterns (filter setters reset page)
- [ ] Read `app/AGENTS.md` — verify Server Component ceremony (getServerUserContext → requirePermissionForPage → render Container)
- [ ] Read `.github/instructions/frontend.instructions.md` — verify Apollo imports from `@apollo/client/react`, no `useLazyQuery`, `fetchPolicy: "cache-and-network"`
- [ ] Verify no `console.*` — use `logger` from `@/frontend/common/utils/logger`
- [ ] Verify no hardcoded strings — all labels from `useAppTranslation(Translation.Dashboard.Certificates)`
- [ ] Verify `id` field included in all GraphQL documents (Apollo cache normalization)
- [ ] Verify `paginationOptions` is set on `DesktopAppDataGrid` (REQUIRED prop)

---

## Task 3: Create Generate Certificate Dialog

**Duration:** 2–3 hours

**_Requirements_:** REQ-03.1 through REQ-03.10 (generate dialog)

**_Design Reference_:** Design §3.4 (GenerateCertificateDialog)

### Instructions

1. **Create dialog component:** `frontend/common/views/dashboard/certificates/GenerateCertificateDialog.tsx`
   - `"use client"` directive
   - Import `useMutation`, `useQuery` from `@apollo/client/react`
   - Import `generateCertificateMutationDocument`, `publishedCertificateTemplatesQueryDocument`, `certificateRecipientGroupsQueryDocument` from Task 1
   - Multi-step form using MUI `<Stepper>` with 4 steps: (1) Select Template, (2) Select Recipient Group, (3) Preview Variables, (4) Confirm
   - Step 1: query published templates (`useQuery(publishedCertificateTemplatesQueryDocument, { variables: { filterArgs: { status: "PUBLISHED" } } })`), display as selectable list
   - Step 2: query recipient groups (`useQuery(certificateRecipientGroupsQueryDocument)`), display with `name` and `recipientCount`
   - Step 3: display resolved variables for the first recipient in the group (variable key → resolved value)
   - Step 4: confirmation with summary (template name, recipient group name, count), "Generate" button
   - Form state: local `useState` for `activeStep`, `selectedTemplateId`, `selectedRecipientGroupId` (ephemeral — NOT in Zustand per store rules)
   - On confirm: call `useMutation(generateCertificateMutationDocument)` with `{ input: { templateId, recipientGroupId } }`, use `refetchQueries` to refetch list
   - Success: close dialog, show success toast with `labels.generate.success(count)` (pluralization function from translation system)
   - Error: display alert within dialog (not toast — errors are actionable)
   - Dialog uses MUI `<Dialog>` with `maxWidth="md"` and `fullWidth`
   - All labels from `useAppTranslation(Translation.Dashboard.Certificates).generate`

2. **Wire dialog into Container:** Update `CertificateListContainer.tsx` to render `<GenerateCertificateDialog>` when `isGenerateDialogOpen` is true. The container's ViewModel already provides `isGenerateDialogOpen`, `onOpenGenerateDialog`, `onCloseGenerateDialog`.

3. **Verify onGenerate button visibility:** The "Generate Certificate" button is only shown when `viewModel.canGenerate` is true (checked in desktop and mobile views from Task 2). No separate `RequirePermission` wrapper needed — the ViewModel already gates it.

### Quality Loop

```bash
~/.bun/bin/bun tsgo
~/.bun/bin/bun biome:check
curl -s -X POST http://localhost:${LINT_QUEUE_PORT}/lint \
  -H "Content-Type: application/json" \
  -d '{"id":"verify-task-3","files":["frontend/common/views/dashboard/certificates/GenerateCertificateDialog.tsx","frontend/common/views/dashboard/certificates/CertificateListContainer.tsx"]}'
```

### Instruction Verification

- [ ] Read `frontend/AGENTS.md` — verify MUI v9 Dialog usage, sx prop, Stepper component
- [ ] Read `.github/instructions/frontend.instructions.md` — verify Apollo `useMutation` import from `@apollo/client/react`, `refetchQueries` usage
- [ ] Verify no `console.*` — use `logger`
- [ ] Verify no hardcoded strings — all labels from translation system
- [ ] Verify dialog state is local `useState` (not Zustand — ephemeral state per store rules)
- [ ] Verify mutation uses `refetchQueries` to invalidate certificate list cache

---

## Task 4: Create Certificate Detail — Container + ViewModel + Desktop/Mobile + App Route

**Duration:** 3–4 hours

**_Requirements_:** REQ-04.1 through REQ-04.12 (detail view), REQ-05.1, REQ-05.2 (mobile/desktop)

**_Design Reference_:** Design §2.2 (detail page), §3.3 (view model), §4.3 (desktop), §4.4 (mobile)

### Instructions

1. **Create ViewModel hook:** `frontend/common/views/dashboard/certificates/useCertificateDetailViewModel.ts`
   - `"use client"` directive
   - Import `useQuery` from `@apollo/client/react`
   - Import `useRouter` from `next/navigation`
   - Import `certificateQueryDocument` from Task 1
   - Import `useUserStore` for permissions
   - Import `useAppTranslation` with `Translation.Dashboard.Certificates` handle
   - Accept `{ certificateId: string }` props
   - `useQuery(certificateQueryDocument, { variables: { id: certificateId }, fetchPolicy: "cache-and-network" })`
   - Compute `canRevoke` = `hasPermission(CertificatesRevoke) && certificate.status !== "REVOKED"`
   - Compute `canDownload` = `hasPermission(CertificatesDownload)`
   - Local state: `isRevokeDialogOpen` (useState)
   - Return: `labels`, `certificate`, `loading`, `error`, `canRevoke`, `canDownload`, `isRevokeDialogOpen`, `onOpenRevokeDialog`, `onCloseRevokeDialog`, `onBackToList`, `onRetry`

2. **Create Container:** `frontend/common/views/dashboard/certificates/CertificateDetailContainer.tsx`
   - `"use client"` directive
   - Same `createLazyView` + `ResponsiveViewSwitch` + `RequirePermission` pattern as list container
   - Permissions: `[AppPermission.CertificatesViewOwn, AppPermission.CertificatesViewOther]`
   - Lazy imports for mobile/desktop detail views

3. **Create Desktop view:** `frontend/desktop/views/dashboard/certificates/certificateDetailView.desktop.tsx`
   - Split layout: left panel (metadata + QR code + action buttons), right panel (PDF iframe)
   - Display all certificate fields: recipientName, templateName, status badge, issueDate, verificationCode (full, copyable), expiryDate, revocation info
   - PDF preview: `<iframe src={cert.fileUrl}>` (right panel, 70vh height)
   - QR code: render verification URL using `qrcode.react` library
   - Download button (if `canDownload` and `fileUrl` exists)
   - Revoke button (if `canRevoke` — not shown for revoked certs)
   - Back to list button
   - React 19: use `<React.Suspense>` if needed, `React.SubmitEvent` for form events

4. **Create Mobile view:** `frontend/mobile/views/dashboard/certificates/certificateDetailView.mobile.tsx`
   - Stacked vertical layout
   - PDF preview shows `thumbnailUrl` as image (not iframe)
   - QR code below info
   - Full-width buttons (download, revoke, back)

5. **Install QR code library:** Add `qrcode.react` as a dependency:
   ```bash
   ~/.bun/bin/bun add qrcode.react
   ```

6. **Create App Route page:** `app/(dashboard)/dashboard/certificates/[id]/page.tsx`
   - Server Component
   - Same ceremony as list page but with `params: Promise<{ id: string }>`
   - Permission: `[AppPermission.CertificatesViewOwn, AppPermission.CertificatesViewOther]`
   - Extract `id` from `await params`
   - Render `<CertificateDetailContainer certificateId={id} />` in `<Suspense>`

7. **Create QR code component:** A reusable `QrCode` component (either in `frontend/common/components/ui/` or inline in the detail views) that takes a `value` string and renders a QR code. Use `qrcode.react`'s `QRCodeSVG` component.

### Quality Loop

```bash
~/.bun/bin/bun tsgo
~/.bun/bin/bun biome:check
curl -s -X POST http://localhost:${LINT_QUEUE_PORT}/lint \
  -H "Content-Type: application/json" \
  -d '{"id":"verify-task-4","files":["frontend/common/views/dashboard/certificates/CertificateDetailContainer.tsx","frontend/common/views/dashboard/certificates/useCertificateDetailViewModel.ts","frontend/desktop/views/dashboard/certificates/certificateDetailView.desktop.tsx","frontend/mobile/views/dashboard/certificates/certificateDetailView.mobile.tsx","app/(dashboard)/dashboard/certificates/[id]/page.tsx"]}'
```

### Instruction Verification

- [ ] Read `frontend/AGENTS.md` — verify MUI v9 rules, Split layout pattern, sx prop
- [ ] Read `frontend/views/AGENTS.md` — verify Container+ViewModel pattern, createLazyView
- [ ] Read `app/AGENTS.md` — verify Server Component params handling (Promise in Next.js 15+)
- [ ] Read `.github/instructions/frontend.instructions.md` — verify Apollo imports, useQuery, fetchPolicy
- [ ] Verify no `console.*` — use `logger`
- [ ] Verify no hardcoded strings — all labels from `useAppTranslation(Translation.Dashboard.Certificates).detail`
- [ ] Verify `id` field in detail query document (Apollo cache normalization)
- [ ] Verify `canRevoke` logic — only shown for non-revoked certificates
- [ ] Verify iframe `src` uses `cert.fileUrl` and is wrapped with Suspense or loading state

---

## Task 5: Create Revoke Certificate Dialog

**Duration:** 1–2 hours

**_Requirements_:** REQ-06.1 through REQ-06.6 (revocation)

**_Design Reference_:** Design §3.5 (RevokeCertificateDialog)

### Instructions

1. **Create dialog component:** `frontend/common/views/dashboard/certificates/RevokeCertificateDialog.tsx`
   - `"use client"` directive
   - Import `useMutation` from `@apollo/client/react`
   - Import `revokeCertificateMutationDocument` from Task 1
   - Props: `{ open, certificateId, recipientName, labels, onClose, onRevoked }`
   - MUI `<Dialog>` with `<DialogTitle>`, `<DialogContent>`, `<DialogActions>`
   - Warning `<Alert severity="warning">` with recipient name
   - `<TextField>` for revocation reason (multiline, minRows=3, required, min 10 chars)
   - Error display: `<Alert severity="error">` if mutation fails
   - Confirm button: disabled if `reason.length < 10` or `loading`
   - On confirm: call `useMutation(revokeCertificateMutationDocument)` with `{ input: { id: certificateId, reason } }`
   - On success: call `onRevoked()` (triggers refetch), `onClose()`, reset reason
   - Labels from `useAppTranslation(Translation.Dashboard.Certificates).revoke`

2. **Wire dialog into detail view:** Update `CertificateDetailContainer.tsx` to render `<RevokeCertificateDialog>` when `isRevokeDialogOpen` is true. Pass `certificateId`, `recipientName`, and labels from the ViewModel.

3. **Verify button visibility:** Revoke button is shown only when `viewModel.canRevoke` is true (already computed in ViewModel from Task 4). No separate permission wrapper needed.

### Quality Loop

```bash
~/.bun/bin/bun tsgo
~/.bun/bin/bun biome:check
curl -s -X POST http://localhost:${LINT_QUEUE_PORT}/lint \
  -H "Content-Type: application/json" \
  -d '{"id":"verify-task-5","files":["frontend/common/views/dashboard/certificates/RevokeCertificateDialog.tsx","frontend/common/views/dashboard/certificates/CertificateDetailContainer.tsx"]}'
```

### Instruction Verification

- [ ] Read `frontend/AGENTS.md` — verify MUI v9 Dialog usage, Alert, TextField, sx prop
- [ ] Read `.github/instructions/frontend.instructions.md` — verify Apollo `useMutation` from `@apollo/client/react`
- [ ] Verify no `console.*` — use `logger`
- [ ] Verify no hardcoded strings — all labels from translation system
- [ ] Verify reason validation (min 10 chars) — use helperText or error state
- [ ] Verify mutation calls `onRevoked()` callback to trigger refetch

---

## Task 6: Create Public Verification Page (Server Component, No Auth)

**Duration:** 2–3 hours

**_Requirements_:** REQ-07.1 through REQ-07.10 (public verification)

**_Design Reference_:** Design §2.3 (public page), §2.4 (public layout), §5 (CertificateVerifyPage)

### Instructions

1. **Create public route layout:** `app/[locale]/verify/[code]/layout.tsx`
   - Server Component
   - Minimal layout: `<AppThemeProvider>` wrapping children in a centered `<Box>`
   - NO sidebar, NO dashboard navigation, NO auth context
   - This is a STANDALONE layout separate from the `(dashboard)` group

2. **Create public route page:** `app/[locale]/verify/[code]/page.tsx`
   - Server Component (no `"use client"`)
   - `import { CertificateManagementService } from "@/backend/services/certificates"`
   - `import { getTranslations } from "@/shared/locale"`
   - `interface VerifyPageProps { params: Promise<{ locale: AppLocale; code: string }> }`
   - `generateMetadata({ params })` — `const { locale } = await params; const t = getTranslations(locale).dashboardTranslations.certificates.verify; return { title: t.pageTitle }`
   - Default export: `async function VerifyCertificatePage({ params })`
   - Extract `locale` and `code` from `await params`
   - Get translations: `const t = getTranslations(locale).dashboardTranslations.certificates.verify` (SYNCHRONOUS — not awaited)
   - Call service directly: `const certificate = await CertificateManagementService.getByVerificationCode(code)` (Server Component calls service, NOT GraphQL)
   - Build labels object from `t.verify` keys (pageTitle, valid, expired, revoked, notFound, recipientName, issueDate, templateName, academyName, verificationCode, statusLabel, revocationReason, verifyAnother, scanQrCode)
   - Render `<CertificateVerifyPage certificate={certificate} labels={labels} />`
   - NO `getServerUserContext()`, NO `requirePermissionForPage()` — PUBLIC route

3. **Create shared client component:** `frontend/common/views/public/verify/CertificateVerifyPage.tsx`
   - `"use client"` directive
   - Props: `{ certificate: CertificateVerifyData | null; labels: CertificateVerifyLabels }`
   - Uses MUI `<Container>`, `<Card>`, `<Stack>`, `<Typography>`, `<Chip>`, `<Alert>`, `<Button>`, `<TextField>`
   - If `certificate` is null: show "Not Found" message with "Verify Another" input
   - If certificate exists: show status badge (VALID=green/success, EXPIRED=amber/warning, REVOKED=red/error), recipient name, template name, issue date, academy name, verification code
   - If revoked: show revocation reason in error Alert
   - QR code: render using `QRCodeSVG` from `qrcode.react` encoding the verification URL
   - "Verify Another" input at bottom: enter new code, navigate to `/verify/[newCode]`
   - Import `useRouter` from `next/navigation` for verify-another navigation
   - All labels from props (server-translated) — NOT `useAppTranslation` (this is a public page, translations come from server)

4. **Verify the route is truly public:** The `app/[locale]/verify/[code]/page.tsx` must NOT be inside the `(dashboard)` route group. It has its own layout without dashboard chrome.

5. **Create the types:** Define `CertificateVerifyData` and `CertificateVerifyLabels` interfaces in the component file or in a shared types file. `CertificateVerifyData` maps to the return type of `CertificateManagementService.getByVerificationCode()`.

### Quality Loop

```bash
~/.bun/bin/bun tsgo
~/.bun/bin/bun biome:check
curl -s -X POST http://localhost:${LINT_QUEUE_PORT}/lint \
  -H "Content-Type: application/json" \
  -d '{"id":"verify-task-6","files":["app/[locale]/verify/[code]/page.tsx","app/[locale]/verify/[code]/layout.tsx","frontend/common/views/public/verify/CertificateVerifyPage.tsx"]}'
```

### Instruction Verification

- [ ] Read `app/AGENTS.md` — verify Server Component rules (no hooks, service calls allowed, translations via `getTranslations(locale)`)
- [ ] Read `shared/AGENTS.md` — verify `getTranslations` usage from `@/shared/locale`
- [ ] Read `frontend/AGENTS.md` — verify MUI v9 rules for the client component
- [ ] Read `.github/instructions/frontend.instructions.md` — verify client component patterns
- [ ] Verify NO `getServerUserContext()` — this is a public route
- [ ] Verify NO `requirePermissionForPage()` — no auth needed
- [ ] Verify `getTranslations(locale)` is called synchronously (NOT awaited — returns property chain)
- [ ] Verify service call is `CertificateManagementService.getByVerificationCode(code)` — NOT GraphQL
- [ ] Verify the route is outside `(dashboard)` route group — no sidebar
- [ ] Verify labels are passed as props from server to client (not via `useAppTranslation`)
- [ ] Verify status badge uses color + text (not color alone — accessibility)

---

## Task 7: Create Download Certificate Handler + Navigation Config

**Duration:** 1–2 hours

**_Requirements_:** REQ-08.1 through REQ-08.4 (download), REQ-09.1 through REQ-09.8 (navigation)

**_Design Reference_:** Design §4.1/§4.2 (download buttons in list), §4.3/§4.4 (download in detail), §8 (navigation config)

### Instructions

1. **Download handler in list views:** In `CertificateListDesktop.tsx` and `CertificateListMobile.tsx`, add a download action that opens `cert.fileUrl` in a new tab:
   - Use an `<a>` element with `href={cert.fileUrl}` and `target="_blank"` (or `download` attribute)
   - Only show if `viewModel.canDownload` is true AND `cert.fileUrl` is not null
   - Disable with tooltip "PDF not available" if `fileUrl` is null

2. **Download handler in detail views:** In `CertificateDetailDesktop.tsx` and `CertificateDetailMobile.tsx`, add a "Download PDF" button:
   - Same mechanism — `<Button href={cert.fileUrl} target="_blank" download>`
   - Only show if `viewModel.canDownload` and `cert.fileUrl` exists

3. **Verify navigation config entries from Task 2:** Confirm the `SIDEBAR_NAV_GROUPS` and `SIDEBAR_NAV_ITEMS` entries added in Task 2 are correct:
   - Group `grp_certificates` with `labelKey: "navGroupCertificates"`, `iconKey: "verified"`
   - Item `key: "certificates"` with `href: "/dashboard/certificates"`, `groupId: "grp_certificates"`
   - Permission filtering verified by `getNavItemsForPermissions()`

4. **Verify PAGE_PERMISSIONS entries:** Confirm Task 2 added `certificatesList`, `certificatesDetail`, and `certificatesVerifyPublic` entries to `frontend/common/types/page-permissions.types.ts`

5. **Verify role-based access:** Test that users with different roles see the correct navigation items:
   - super_admin, academy_admin: see "Certificates" nav item
   - teacher_default: see "Certificates" nav item
   - student_default, parent_default: see "Certificates" nav item (view_own)
   - Users without any `CERTIFICATES_*` permission: do NOT see the nav item

### Quality Loop

```bash
~/.bun/bin/bun tsgo
~/.bun/bin/bun biome:check
curl -s -X POST http://localhost:${LINT_QUEUE_PORT}/lint \
  -H "Content-Type: application/json" \
  -d '{"id":"verify-task-7","files":["frontend/desktop/views/dashboard/certificates/certificateListView.desktop.tsx","frontend/mobile/views/dashboard/certificates/certificateListView.mobile.tsx","frontend/desktop/views/dashboard/certificates/certificateDetailView.desktop.tsx","frontend/mobile/views/dashboard/certificates/certificateDetailView.mobile.tsx"]}'
```

### Instruction Verification

- [ ] Read `frontend/AGENTS.md` — verify MUI v9 button/link patterns, sx prop
- [ ] Read `frontend/common/views/dashboard/config/navigationConfig.ts` — verify GROUPS and ITEMS pattern
- [ ] Read `frontend/common/types/page-permissions.types.ts` — verify PagePermissions type
- [ ] Verify download button uses `cert.fileUrl` (signed storage URL from Plan 06)
- [ ] Verify `canDownload` permission gate is on the ViewModel (defense-in-depth)
- [ ] Verify nav item `permission` uses OR semantics (any one permission shows the item)

---

## Task 8: Quality Loop Per File + Instruction Verification

**Duration:** 2–3 hours

**_Requirements_:** All requirements — final verification pass

**_Design Reference_:** Design §13 (error handling), Architecture AGENTS.md quality workflow

### Instructions

Run a comprehensive quality check on ALL files created in Tasks 1–7:

1. **Type checking (tsgo):**
   ```bash
   ~/.bun/bin/bun tsgo
   ```
   Fix all TypeScript errors. Common issues to look for:
   - Missing `id` field in GraphQL documents
   - Incorrect import paths (must use `@/` alias)
   - MUI v9 style props used instead of `sx` prop
   - Missing `readonly` modifiers on interface properties
   - `FormEvent` instead of `React.SubmitEvent` (React 19)

2. **Biome (formatting + linting):**
   ```bash
   ~/.bun/bin/bun biome:check
   ```
   Fix all formatting and biome lint issues. Run `bun biome:check --write` to auto-fix formatting.

3. **ESLint via lint queue:**
   ```bash
   # Ensure lint queue server is running
   curl -s http://localhost:${LINT_QUEUE_PORT}/status

   # Lint all certificate files at once
   curl -s -X POST http://localhost:${LINT_QUEUE_PORT}/lint \
     -H "Content-Type: application/json" \
     -d '{"id":"verify-task-8","files":["frontend/common/graphql/sharedDocuments/cert/certificates.documents.ts","frontend/common/stores/certificatesStore.ts","frontend/common/views/dashboard/certificates/CertificateListContainer.tsx","frontend/common/views/dashboard/certificates/CertificateDetailContainer.tsx","frontend/common/views/dashboard/certificates/GenerateCertificateDialog.tsx","frontend/common/views/dashboard/certificates/RevokeCertificateDialog.tsx","frontend/common/views/dashboard/certificates/useCertificateListViewModel.ts","frontend/common/views/dashboard/certificates/useCertificateDetailViewModel.ts","frontend/common/views/dashboard/certificates/types.ts","frontend/desktop/views/dashboard/certificates/certificateListView.desktop.tsx","frontend/desktop/views/dashboard/certificates/certificateDetailView.desktop.tsx","frontend/mobile/views/dashboard/certificates/certificateListView.mobile.tsx","frontend/mobile/views/dashboard/certificates/certificateDetailView.mobile.tsx","frontend/common/views/public/verify/CertificateVerifyPage.tsx"]}'
   ```

4. **Instruction file verification:** For each file, check against the applicable instruction files:
   - `frontend/**/*.tsx` → `.github/instructions/frontend.instructions.md`
   - `app/**/*.tsx` → `.github/instructions/frontend.instructions.md` + `app/AGENTS.md`
   - All files → root `AGENTS.md`

5. **AGENTS.md verification per file:**
   - `frontend/common/views/dashboard/certificates/*.tsx` → `frontend/views/AGENTS.md` + `frontend/AGENTS.md`
   - `frontend/common/stores/certificatesStore.ts` → `frontend/stores/AGENTS.md` + `frontend/AGENTS.md`
   - `frontend/common/graphql/sharedDocuments/cert/*.ts` → `frontend/common/graphql/sharedDocuments/AGENTS.md` + `frontend/common/graphql/AGENTS.md` + `frontend/AGENTS.md`
   - `frontend/desktop/**/*.tsx` → `frontend/AGENTS.md`
   - `frontend/mobile/**/*.tsx` → `frontend/AGENTS.md`
   - `app/(dashboard)/dashboard/certificates/**/*.tsx` → `app/AGENTS.md`
   - `app/[locale]/verify/**/*.tsx` → `app/AGENTS.md`
   - `frontend/common/views/public/**/*.tsx` → `frontend/AGENTS.md`

6. **Cross-file violation check:** If fixing a file requires changes to another file not in scope, report it as a cross-file dependency:
   ```
   CROSS-FILE DEPENDENCY:
     Target file: <this file>
     Blocked by: <other file>
     Rule violated: <rule>
     Required fix: <description>
   ```

7. **Verify Apollo cache normalization:** Check all GraphQL documents include the `id` field on every object type.

8. **Verify no `console.*`:** All logging uses `logger` from `@/frontend/common/utils/logger`.

9. **Verify no `useLazyQuery`:** All queries use stateful `useQuery` from `@apollo/client/react`.

10. **Verify no direct style props:** All MUI components use `sx` prop, not direct style props (`fontWeight`, `mb`, `p`, etc.).

### Acceptance Criteria

- [ ] `bun tsgo` passes with no errors
- [ ] `bun biome:check` passes with no issues
- [ ] Lint queue client returns `success: true` for all certificate files
- [ ] All files compliant with their applicable AGENTS.md files
- [ ] All files compliant with `.github/instructions/frontend.instructions.md`
- [ ] No `console.*` in any file
- [ ] No `useLazyQuery` in any file
- [ ] All GraphQL documents include `id` field
- [ ] All imports use `@/` path alias

---

## Task 9: Knowledge Propagation (Update AGENTS.md, Frontend Docs)

**Duration:** 1–2 hours

**_Requirements_:** REQ-11.1 through REQ-11.5 (outcome knowledge base)

**_Design Reference_:** Design §12 (Outcome & Knowledge Transfer Protocol)

### Instructions

1. **Update `frontend/AGENTS.md`:** Add certificate-specific frontend patterns discovered during implementation:
   - Certificate three-location split pattern (list, detail, public verify)
   - Certificate dialog patterns (multi-step generation, revocation confirmation)
   - Certificate Zustand store pattern (filters, pagination, search with page reset)
   - Certificate GraphQL document naming and `id` field requirements
   - Public route pattern (Server Component + service call, no auth, `[locale]` in URL)
   - QR code integration pattern (`qrcode.react` library)
   - PDF iframe preview pattern (desktop) vs thumbnail (mobile)

2. **Update or create `frontend/views/dashboard/certificates/AGENTS.md`:** If non-obvious patterns were discovered specific to the certificate domain:
   - Status badge component mapping (status enum → MUI color)
   - Verification code display pattern (truncated in list, full in detail)
   - If no domain-specific patterns were discovered, skip this step

3. **Update `app/AGENTS.md`:** If the public route pattern is not already documented:
   - Public route = Server Component + service call + no auth + `[locale]` in URL + standalone layout
   - `getTranslations(locale)` is synchronous — returns property chain, NOT awaited
   - Service call: `CertificateManagementService.getByVerificationCode(code)` — direct, no GraphQL

4. **Update `.github/instructions/frontend.instructions.md`:** If certificate-specific instructions are needed:
   - Certificate domain GraphQL document conventions
   - Certificate dialog multi-step pattern
   - Only add if the patterns represent new , undocumented rules

5. **Update `frontend/COMPONENT_PATTERNS.md`:** Add any new component patterns:
   - Multi-step dialog with `<Stepper>` + local state
   - Status badge component (status enum → color + text)
   - QR code component pattern

6. **Verify the knowledge propagation:**
   - Read the updated AGENTS.md files to ensure accuracy
   - Ensure no confidential or security-sensitive information is documented
   - Ensure all documented patterns are accurate to the implementation

### Quality Loop

```bash
# AGENTS.md and docs changes don't need tsgo/biome/lint
# But verify no broken markdown by viewing the files
~/.bun/bin/bun tsgo  # ensure no type errors from doc-related imports
```

### Instruction Verification

- [ ] Verify `frontend/AGENTS.md` accurately reflects the implemented patterns
- [ ] Verify `app/AGENTS.md` accurately documents the public route pattern (if updated)
- [ ] Verify `.github/instructions/frontend.instructions.md` additions are accurate (if any)
- [ ] Verify `frontend/COMPONENT_PATTERNS.md` additions are accurate (if any)
- [ ] Verify no summary/markdown files created (per AGENTS.md rules — no SUMMARY.md, CHANGES.md, REPORT.md)
- [ ] Verify documentation is in the correct files (AGENTS.md, instructions, COMPONENT_PATTERNS.md — NOT new markdown files)

### Acceptance Criteria

- [ ] `frontend/AGENTS.md` updated with certificate frontend patterns
- [ ] `app/AGENTS.md` updated with public route pattern (if not already present)
- [ ] `frontend/COMPONENT_PATTERNS.md` updated with new component patterns (if any)
- [ ] No standalone summary/report markdown files created
- [ ] All documentation accurate to the implementation

---

## Dependency Graph

```
Task 1 (GraphQL Documents)
  ├── Task 2 (List: Container + ViewModel + Views + Route) ← depends on Task 1
  │     ├── Task 3 (Generate Dialog) ← depends on Task 1, 2
  │     └── Task 7 (Download + Nav Config) ← depends on Task 2
  ├── Task 4 (Detail: Container + ViewModel + Views + Route) ← depends on Task 1
  │     ├── Task 5 (Revoke Dialog) ← depends on Task 1, 4
  │     └── Task 7 (Download + Nav Config) ← depends on Task 4
  └── Task 6 (Public Verification) ← depends on Plans 04, 09 (not on Tasks 1–5)
        └── Task 7 (Download + Nav Config) ← independent

Task 8 (Quality Loop) ← depends on Tasks 1–7
Task 9 (Knowledge Propagation) ← depends on Task 8
```

**Parallelizable:** Tasks 2 and 4 can run in parallel after Task 1. Task 6 can run independently (only depends on backend services from Plan 04 and i18n from Plan 09).

---

## Final Verification Checklist

After all tasks are complete, verify the following end-to-end:

### Certificate List
- [ ] `/dashboard/certificates` renders for users with `CERTIFICATES_LIST` or `CERTIFICATES_VIEW_OWN` permission
- [ ] Server-side pagination works (page changes trigger refetch)
- [ ] Search filters results (debounced)
- [ ] Status filter works
- [ ] Template filter works
- [ ] Date range filter works
- [ ] "View" action navigates to detail
- [ ] "Download" opens PDF in new tab
- [ ] "Generate" opens dialog (if user has `CERTIFICATES_GENERATE`)
- [ ] Mobile shows cards, desktop shows table

### Generate Certificate Dialog
- [ ] Step 1: Published templates listed
- [ ] Step 2: Recipient groups listed with counts
- [ ] Step 3: Variables previewed
- [ ] Step 4: Confirm generates certificates
- [ ] Success toast with count
- [ ] List refetches after generation

### Certificate Detail
- [ ] `/dashboard/certificates/[id]` renders
- [ ] All certificate fields displayed
- [ ] PDF preview in iframe (desktop) / thumbnail (mobile)
- [ ] QR code displays
- [ ] Download button works
- [ ] Revoke button shows for users with permission (not for revoked certs)
- [ ] Back button navigates to list

### Revoke Certificate
- [ ] Dialog opens with reason input
- [ ] Reason min 10 chars enforced
- [ ] Confirm calls mutation
- [ ] Certificate status updates to REVOKED
- [ ] Revocation reason displayed

### Public Verification
- [ ] `/verify/[code]` loads without authentication
- [ ] Valid certificate → green VALID badge
- [ ] Expired certificate → amber EXPIRED badge
- [ ] Revoked certificate → red REVOKED badge with reason
- [ ] Invalid code → Not Found page
- [ ] Page is responsive
- [ ] No sidebar/nav (standalone layout)
- [ ] "Verify Another" input works

### Navigation
- [ ] "Certificates" nav item shows for users with certificate permissions
- [ ] "Certificates" nav item hidden for users without permissions
- [ ] Clicking navigates to `/dashboard/certificates`

### i18n
- [ ] All labels switch between English and Arabic
- [ ] No hardcoded strings
- [ ] Public verification page uses server-side translations
- [ ] Pluralization functions work

### Quality
- [ ] `bun tsgo` — no type errors
- [ ] `bun biome:check` — no issues
- [ ] Lint queue — all files pass
- [ ] No `console.*`
- [ ] No `useLazyQuery`
- [ ] All GraphQL documents include `id` field
- [ ] All imports use `@/` path alias
- [ ] All MUI components use `sx` prop (no style props)
