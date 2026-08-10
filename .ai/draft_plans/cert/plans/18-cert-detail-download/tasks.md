# Plan 18 — Certificate Detail & Download: Tasks

> **Plan #:** 18 · **Title:** Certificate Detail & Download
> **Dependencies:** Plan 2 (Types & Permissions), Plan 4 (Services), Plan 5 (GraphQL API), Plan 6 (PDF Rendering Engine), Plan 7 (Storage & Signed URLs), Plan 16 (Certificate List), Plan 01 (Database Schema)
> **Dependents:** Plan 19 (Public Verification Page)
> **Estimate:** 18 tasks · ~68 hours total

---

## Acceptance Criteria → Task Mapping

| AC ID | Requirement | Primary Task(s) |
|-------|-------------|-----------------|
| AC-18-01 | Certificate detail page at `app/(dashboard)/certificates/[certificateId]` | T01, T03, T04, T05 |
| AC-18-01a | UUID validation of route param | T03 |
| AC-18-02 | PDF download (single-use token, lazy render, polling, blob URL, filename) | T01, T06 |
| AC-18-02a | PNG download | T06 |
| AC-18-02b | JPG download | T06 |
| AC-18-03 | PDF download lazy render (polling `CertPdfStatusQueryDocument`) | T06 |
| AC-18-04 | Download error handling (PDF_OBJECT_MISSING, PDF_CORRUPTED, TEMPLATE_NOT_FOUND) | T06 |
| AC-18-05 | Print via off-screen iframe (NOT display:none, C.6) with Safari fallback | T07 |
| AC-18-06 | Revocation workflow (confirmation, reason, notes, `issued → revoked`) | T08 |
| AC-18-07 | Revoke validation (reason required) | T08 |
| AC-18-08 | Re-issue workflow (new cert, old stays revoked, C.7) | T08 |
| AC-18-09 | Audit trail (paginated, server-sorted, load more, C.9) | T09 |
| AC-18-10 | Status badge (5 canonical values: pending/issued/revoked/expired/failed, C.1) | T05 |
| AC-18-11 | Verification URL (`NEXT_PUBLIC_PUBLIC_BASE_URL`, C.13) + QR (200x200 SVG, 1024x1024 PNG download) | T10 |
| AC-18-11a | Share dialog (copy, email, WhatsApp, QR download) | T11 |
| AC-18-12 | Mobile responsive (accordion, bottom action bar, pinch-to-zoom) | T05 |
| AC-18-13 | Permission-based access (`AppPermission` keys, DashboardAccessDeniedContent, C.3/C.11) | T03, T05 |
| AC-18-14 | Breadcrumb navigation back to list | T05 |
| AC-18-15 | Keyboard accessibility | T05, T08, T09, T10, T11 |

---

## Instruction File Verification

| Task | Layer | Instruction Files | AGENTS.md Files |
|------|-------|-------------------|-----------------|
| T00 | Frontend | `frontend.instructions.md` | `frontend/AGENTS.md`, Root `AGENTS.md` |
| T01 | Frontend | `frontend.instructions.md` | `frontend/AGENTS.md`, `frontend/common/stores/AGENTS.md`, `frontend/common/graphql/AGENTS.md` |
| T02 | Frontend | `frontend.instructions.md` | `frontend/AGENTS.md`, `frontend/common/graphql/sharedDocuments/AGENTS.md` |
| T03 | Frontend | `frontend.instructions.md` | `frontend/AGENTS.md`, `app/AGENTS.md` |
| T04 | Frontend | `frontend.instructions.md` | `frontend/AGENTS.md`, `frontend/views/AGENTS.md` |
| T05 | Frontend | `frontend.instructions.md` | `frontend/AGENTS.md`, `frontend/views/AGENTS.md`, `frontend/mobile/AGENTS.md`, `frontend/desktop/AGENTS.md` |
| T06 | Frontend | `frontend.instructions.md` | `frontend/AGENTS.md` |
| T07 | Frontend | `frontend.instructions.md` | `frontend/AGENTS.md` |
| T08 | Frontend | `frontend.instructions.md` | `frontend/AGENTS.md` |
| T09 | Frontend | `frontend.instructions.md` | `frontend/AGENTS.md`, `frontend/views/AGENTS.md` |
| T10 | Frontend | `frontend.instructions.md` | `frontend/AGENTS.md` |
| T11 | Frontend | `frontend.instructions.md`, `tests.instructions.md` | `frontend/AGENTS.md`, `test/ui/AGENTS.md` |
| T12 | Cross-cutting | — | Root `AGENTS.md` |

---

## Phase 1: Foundation (T00–T02)

### T00: Install qrcode Package

**Goal:** Install the `qrcode` npm package and its TypeScript types for client-side QR code generation.

**Duration:** 15 minutes

**Subtasks:**

- [ ] 0.1 Install qrcode package: `bun add qrcode`
- [ ] 0.2 Install TypeScript types: `bun add -D @types/qrcode`
- [ ] 0.3 Verify version: `qrcode@^1.5.4` (per node_research/qrcode.md)
- [ ] 0.4 Verify browser entry point: `qrcode/lib/browser.js` exists (not the Node.js entry that requires `fs`)

**Files modified:**
- `package.json` (dependencies + devDependencies)
- `bun.lockb` (lockfile)

**Dependencies:** None

**Requirements covered:** REQ-18-11 (QR code generation requires qrcode package)

**Quality loop:**
```bash
bun run scripts/health/sub-loop.ts package.json --lifecycle codescene
```

**Instruction verification:**
- `frontend/AGENTS.md` — dependency conventions
- Root `AGENTS.md` — Import Path Aliases section, package management

**Outcome file:** `.ai/plans/cert-plan-18/outcome/T00-outcome.md`

---

### T01: i18n Namespace & Zustand Store

**Goal:** Define all translation keys for the certificate detail page and create the Zustand store for dialog, download, print, share, and reissue state.

**Duration:** 3-4 hours

**Subtasks:**

- [ ] 1.1 Define translation type schema in `shared/locale/types/dashboard/certificates/detail.ts` for the following namespaces:
  - `certificateDetail` — section headers (overview, status, verification, actions), field labels (certificateNumber, recipientName, recipientId, gradeLevel, issueDate, expiryDate, completionDate, templateName, templateVersion, templateCategory, createdByName, createdAt, updatedAt, statusChangedAt), navigation (backToList, breadcrumbCertificates)
  - `certificateDetail.status` — pending, issued, revoked, expired, failed labels + tooltip with lastChanged interpolation `(date: string) => string` (C.1: 5 canonical values, NO `active`)
  - `certificateDetail.revoke` — dialogTitle, warning (mentions verification link invalidation), reasonLabel, reasons (dataError, wrongRecipient, duplicate, other), otherReasonLabel, otherReasonPlaceholder, notesLabel, notesPlaceholder, cancelButton, revokeButton, successToast, errorToast, reasonRequiredError, otherReasonRequiredError
  - `certificateDetail.reissue` — dialogTitle, infoText (mentions new certificate creation, old stays revoked), optionalReasonLabel, reasonPlaceholder, cancelButton, reissueButton, successToast, errorToast (C.7: renamed from `reactivate`)
  - `certificateAudit` — sectionTitle, eventCount (pluralized: `(count: number) => string`), actionLabels for 7 canonical events (generated, issued, viewed, downloaded, revoked, reissued, expired), actorLabel, roleLabel, timestampLabel, detailsLabel, reasonLabel, notesLabel, resultLabel, expandLabel, collapseLabel, loadMore, loadingMore, emptyTitle, emptyDescription, errorLoading, retry (C.9: no sortToggle keys — sorting is server-side)
  - `certificateDetail.download` — buttonLabel, menuLabel, pdfLabel, pngLabel, jpgLabel, loadingLabel, successToast, errorToast, retry, preparingLabel
  - `certificateDetail.print` — buttonLabel, loadingLabel, errorToast, retry
  - `certificateDetail.verification` — sectionTitle, urlLabel, copyButton, copiedLabel, openLink, qrAltText, qrUnavailable, qrDownloadButton, qrGeneratingLabel
  - `certificateDetail.share` — dialogTitle, copyLinkLabel, copyLinkButton, copiedLabel, emailLabel, emailSubject, emailBody, whatsappLabel, qrDownloadLabel, cancelButton (NEW: REQ-18-08a)
  - `certificateDetail.actions` — downloadLabel, shareLabel, revokeLabel, reissueLabel
  - `certificateDetail.errors` — notFoundTitle, notFoundDescription, accessDeniedTitle, accessDeniedDescription, pdfMissingError, pdfCorruptedError, templateMissingError, networkError (C.5/C.11)

- [ ] 1.2 Implement English translations in `shared/locale/en/dashboard/certificates/detail.ts` for all keys above
  - Pluralization function for `audit.eventCount` (0/1/2/3-10/11-99/100+ categories)
  - Interpolation for `status.tooltip.lastChanged(date)`

- [ ] 1.3 Implement Arabic translations in `shared/locale/ar/dashboard/certificates/detail.ts` for all keys above
  - Arabic pluralization for `audit.eventCount`:
    - 0: "لا توجد أحداث"
    - 1: "حدث واحد"
    - 2: "حدثان"
    - 3-10: "{count} أحداث"
    - 11-99: "{count} حدثًا"
    - 100+: "{count} حدث"
  - RTL-aware text for all labels
  - Interpolation for `status.tooltip.lastChanged(date)` with Arabic date format

- [ ] 1.4 Create Zustand store at `frontend/common/stores/certDetailStore.ts` (C.8: store only holds global dialog/download/print/share state — NOT timeline-local state like sort order or expanded IDs, those are ViewModel-managed)
  - State:
    - Download: `isDownloading: boolean`, `downloadFormat: 'pdf' | 'png' | 'jpg' | null`, `downloadError: string | null`, `activeDownloadCertId: string | null`
    - Print: `isPreparingPrint: boolean`, `printError: string | null`
    - Revoke dialog: `revokeDialogOpen: boolean`, `revokeReason: string`, `revokeOtherReason: string`, `revokeNotes: string`, `isRevoking: boolean`
    - Reissue dialog (C.7: renamed from reactivate): `reissueDialogOpen: boolean`, `reissueReason: string`, `isReissuing: boolean`
    - Share dialog (NEW): `shareDialogOpen: boolean`, `isGeneratingQr: boolean`
  - Actions:
    - Download: `setDownloading(format)`, `setDownloadError(error)`, `setActiveDownloadCertId(id)`
    - Print: `setPreparingPrint(bool)`, `setPrintError(error)`
    - Revoke: `openRevokeDialog()`, `closeRevokeDialog()`, `setRevokeReason(v)`, `setRevokeOtherReason(v)`, `setRevokeNotes(v)`, `setRevoking(bool)`
    - Reissue: `openReissueDialog()`, `closeReissueDialog()`, `setReissueReason(v)`, `setReissuing(bool)` (C.7)
    - Share: `openShareDialog()`, `closeShareDialog()`, `setGeneratingQr(bool)`
    - `reset()` — clears all state
  - Client-side only (not persisted)
  - Follows `frontend/common/stores/AGENTS.md` conventions

- [ ] 1.5 Create mock store at `frontend/common/stores/__mocks__/certDetailStore.ts` for Storybook and component tests

**Files to create:**
- `shared/locale/types/dashboard/certificates/detail.ts` (modify — add detail namespaces)
- `shared/locale/en/dashboard/certificates/detail.ts` (modify — add detail translations)
- `shared/locale/ar/dashboard/certificates/detail.ts` (modify — add detail translations)
- `frontend/common/stores/certDetailStore.ts`
- `frontend/common/stores/__mocks__/certDetailStore.ts`

**Requirements covered:** REQ-18-01 (i18n), REQ-18-04 (revoke i18n), REQ-18-05 (reissue i18n), REQ-18-06 (audit i18n), REQ-18-08a (share i18n)

**Quality loop per file (full progressive chain: tsgo → biome → lint → codescene):**
```bash
bun run scripts/health/sub-loop.ts shared/locale/types/dashboard/certificates/detail.ts --lifecycle codescene
bun run scripts/health/sub-loop.ts shared/locale/en/dashboard/certificates/detail.ts --lifecycle codescene
bun run scripts/health/sub-loop.ts shared/locale/ar/dashboard/certificates/detail.ts --lifecycle codescene
bun run scripts/health/sub-loop.ts frontend/common/stores/certDetailStore.ts --lifecycle codescene
bun run scripts/health/sub-loop.ts frontend/common/stores/__mocks__/certDetailStore.ts --lifecycle codescene
```

**Instruction verification:**
- `frontend/common/stores/AGENTS.md` — Zustand store conventions
- `shared/AGENTS.md` — i18n rules, no cross-layer imports
- `.agents/instructions/frontend.instructions.md`

**Outcome file:** `.ai/plans/cert-plan-18/outcome/T01-outcome.md`

---

### T02: GraphQL Documents

**Goal:** Define all GraphQL query and mutation documents for the certificate detail page, using canonical field names, split download endpoints, and paginated audit trail.

**Duration:** 2-3 hours

**Subtasks:**

- [ ] 2.1 Create `frontend/common/graphql/sharedDocuments/certificates/certDetail.documents.ts` (file naming: domain folder `certificates/`, file prefix `certDetail`)

- [ ] 2.2 Define `CertDetailQueryDocument`:
  - Query: `certificate(id)` → `CertReturnType`
  - Fields: `id`, `certificateNumber`, `status` (enum: PENDING, ISSUED, REVOKED, EXPIRED, FAILED — C.1), `verificationCode`, `issueDate`, `expiryDate`, `completionDate`, `recipientName`, `recipientId`, `gradeLevel`, `templateName`, `templateVersion`, `templateCategory`, `templateOrientation`, `createdByName`, `createdAt`, `updatedAt`, `statusChangedAt`, `pdfExists` (C.2: no `serial`/`studentName`/`studentId`, no per-action `can*` booleans)
  - Include `id` field for Apollo cache normalization

- [ ] 2.3 Define `CertAuditTrailQueryDocument` (C.9: paginated, server-sort, no client `SortOrder` enum):
  - Query: `certificateAuditEvents(certId, limit, offset)` → `{ items: [CertAuditEventReturnType], totalCount: Int, hasMore: Boolean }`
  - Item fields: `id`, `certId`, `action` (enum: GENERATED, ISSUED, VIEWED, DOWNLOADED, REVOKED, REISSUED, EXPIRED — 7 canonical events), `actorName`, `actorRole`, `timestamp`, `details`, `reason`, `notes`
  - Variables: `certId: ID!`, `limit: Int = 20`, `offset: Int = 0`
  - `fetchPolicy: 'cache-and-network'`
  - Server returns newest-first; no client sort order parameter

- [ ] 2.4 Define `CertRevokeMutationDocument`:
  - Mutation: `revokeCertificate(input)` → `CertReturnType`
  - Input: `{ id: ID!, reason: RevocationReason!, otherReason: String, notes: String }`
  - `reason`: enum `RevocationReason` (DATA_ERROR, WRONG_RECIPIENT, DUPLICATE, OTHER — C.7)
  - Returns updated certificate with `status = REVOKED`

- [ ] 2.5 Define `CertReissueMutationDocument` (C.7: renamed from reactivate, creates NEW cert):
  - Mutation: `reissueCertificate(input)` → `CertReturnType`
  - Input: `{ id: ID!, reason: String }` (reason optional — reissue is always intentional)
  - Returns the NEW certificate (new UUID, same template/recipient, status `PENDING` or `ISSUED`)
  - Old certificate remains `REVOKED` — frontend shows old cert decremented and new cert link
  - After reissue: navigate to new certificate detail page

- [ ] 2.6 Define `CertPdfStatusQueryDocument` (C.4: split — status check only, no token minted):
  - Query: `certificatePdfStatus(id)` → `{ pdfExists: Boolean! }`
  - `fetchPolicy: 'no-cache'` (always check fresh)
  - Used for polling during lazy render

- [ ] 2.7 Define `CertCreateDownloadUrlMutationDocument` (C.4: single-use token, not presigned):
  - Mutation: `createCertificateDownloadUrl(input)` → `{ url: String!, expiresAt: String! }`
  - Input: `{ id: ID!, format: DownloadFormat! }` where `DownloadFormat` = `PDF | PNG | JPG`
  - Backend creates `signedUrls` row with single-use token via `claimSignedUrl` (Plan 07)
  - Plan 07 fires `certificate_audits` row with `action = DOWNLOADED` on successful claim
  - `fetchPolicy: 'no-cache'`

- [ ] 2.8 Define `CertCreateImageDownloadUrlMutationDocument` (NEW: PNG/JPG downloads):
  - Mutation: `createCertificateImageDownloadUrl(input)` → `{ url: String!, expiresAt: String! }`
  - Input: `{ id: ID!, format: ImageFormat! }` where `ImageFormat` = `PNG | JPG`
  - Server renders certificate to image (Plan 06 PDF engine → image conversion)
  - Same single-use token model as PDF

- [ ] 2.9 Define `CertTriggerPdfRenderMutationDocument`:
  - Mutation: `triggerCertificatePdfRender(id)` → `{ success: Boolean!, renderId: String }`
  - Triggers async PDF generation via Plan 06 PDF Rendering Engine
  - Frontend polls `CertPdfStatusQueryDocument` after triggering

- [ ] 2.10 Run GraphQL code generation: `bun run generate:gqlSchema && bun codegen`
  - Verify generated types: `CertReturnType`, `CertAuditEventReturnType`, `RevocationReason`, `DownloadFormat`, `ImageFormat`
  - Ensure all types match Plan 02 and Plan 05 definitions

**Files to create:**
- `frontend/common/graphql/sharedDocuments/certificates/certDetail.documents.ts`

**Files modified (code generation):**
- `frontend/common/graphql/generated/` (auto-generated — do not edit manually)

**Requirements covered:** REQ-18-01 through REQ-18-07, REQ-18-09, REQ-18-11

**Quality loop per file (full progressive chain: tsgo → biome → lint → codescene):**
```bash
bun run scripts/health/sub-loop.ts frontend/common/graphql/sharedDocuments/certificates/certDetail.documents.ts --lifecycle codescene
```

**Instruction verification:**
- `frontend/common/graphql/sharedDocuments/AGENTS.md` — document naming, id field, no useLazyQuery
- `frontend/common/graphql/AGENTS.md` — Apollo conventions
- `.agents/instructions/frontend.instructions.md`

**Outcome file:** `.ai/plans/cert-plan-18/outcome/T02-outcome.md`

---

## Phase 2: Detail Page Views (T03–T05)

### T03: App Router Page

**Goal:** Create the server component page for the certificate detail route with auth guard, UUID validation (C.12), permission check (C.3), and metadata.

**Duration:** 1-2 hours

**Subtasks:**

- [ ] 3.1 Create `app/(dashboard)/certificates/[certificateId]/page.tsx` (C.2: route param is `[certificateId]`, NOT `[id]`)
  - Server component
  - Call `getServerUserContext()` for auth
  - C.12: Validate `params.certificateId` is a valid UUID v4 before Apollo query — if invalid, render `<DashboardNotFoundContent />`
  - C.3: Check `AppPermission.CertificateView` (`certificates.view`) — if denied, render `<DashboardAccessDeniedContent />` (C.11: NOT a redirect, inline component)
  - Call `getTranslations(locale).dashboardTranslations.certificateDetail` for i18n
  - Generate metadata: title `"Certificate {certificateNumber} — Siraj"` (C.2: not `serial`)
  - Render `<CertDetailContainer locale={locale} labels={t} certificateId={params.certificateId} />`
  - Error boundary renders `<DashboardNotFoundContent />` on 404 from GraphQL

- [ ] 3.2 C.12: UUID validation helper:
  - Use regex `/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i` for UUID v4
  - If invalid: skip Apollo query entirely (don't waste a network request on invalid input), render `<DashboardNotFoundContent />` with localized message

- [ ] 3.3 Create error boundary components:
  - `DashboardAccessDeniedContent` at `frontend/common/views/dashboard/cert-detail/DashboardAccessDeniedContent.tsx` (C.11: new component, split 403 from 404)
  - `DashboardNotFoundContent` at `frontend/common/views/dashboard/cert-detail/DashboardNotFoundContent.tsx` (C.11: new component)
  - Both: centered Stack with icon (LockOutlined for 403, SearchOffOutlined for 404), title, description, "Back to Certificates" button
  - Reuse from Plan 16 if already exists — check first, only create if not present

- [ ] 3.4 Verify route:
  - Route path: `/[locale]/(dashboard)/certificates/[certificateId]`
  - Dynamic segment `certificateId` = UUID v4
  - Auth required (middleware enforces)
  - Layout: `(dashboard)` layout group with sidebar from Plan 08

**Files to create:**
- `app/(dashboard)/certificates/[certificateId]/page.tsx`
- `frontend/common/views/dashboard/cert-detail/DashboardAccessDeniedContent.tsx` (if not already in Plan 16)
- `frontend/common/views/dashboard/cert-detail/DashboardNotFoundContent.tsx` (if not already in Plan 16)

**Requirements covered:** REQ-18-01 (detail page route), REQ-18-01a (UUID validation), REQ-18-13 (permission access)

**Quality loop per file (full progressive chain: tsgo → biome → lint → codescene):**
```bash
bun run scripts/health/sub-loop.ts app/(dashboard)/certificates/[certificateId]/page.tsx --lifecycle codescene
```

**Instruction verification:**
- `app/AGENTS.md` — App Router conventions
- `.agents/instructions/frontend.instructions.md`

**Outcome file:** `.ai/plans/cert-plan-18/outcome/T03-outcome.md`

---

### T04: Container with Query & State Orchestration

**Goal:** Create the CertDetailContainer that orchestrates Apollo queries, mutations, PDF/PNG/JPG download, print, revocation, reissue, and audit trail using the ViewModel pattern with ViewModel-managed timeline state (C.8).

**Duration:** 4-5 hours

**Subtasks:**

- [ ] 4.1 Create `frontend/common/views/dashboard/cert-detail/certDetailContainer.tsx` (file path: `cert-detail/` domain folder, `certDetailContainer` filename)
  - Import `useQuery` from `@apollo/client/react` for `CertDetailQueryDocument`, `CertAuditTrailQueryDocument`, `CertPdfStatusQueryDocument`
  - Import `useMutation` for `CertRevokeMutationDocument`, `CertReissueMutationDocument`, `CertTriggerPdfRenderMutationDocument`, `CertCreateDownloadUrlMutationDocument`, `CertCreateImageDownloadUrlMutationDocument`
  - Import `certDetailStore` from `@/frontend/common/stores/certDetailStore`
  - C.12: If `certificateId` is not a valid UUID, short-circuit — don't execute Apollo queries
  - C.3: Permission checks use `AppPermission.CertificateView`, `AppPermission.CertificateManage`, `AppPermission.CertificateRevoke`, `AppPermission.CertificateGenerate` from `@/shared/constants`

- [ ] 4.2 Execute main detail query:
  - `useQuery(CertDetailQueryDocument, { variables: { id: certificateId }, fetchPolicy: 'cache-first', skip: !isValidUuid })`
  - Handle loading state → pass to views via `ViewModel.loading`
  - Handle error state → if GraphQL error is `NOT_FOUND`, render `<DashboardNotFoundContent />`; if `FORBIDDEN`, render `<DashboardAccessDeniedContent />` (C.11)
  - Handle data → assemble ViewModel with certificate data

- [ ] 4.3 Execute audit trail query (C.9: paginated, server-sort, load-more):
  - `useQuery(CertAuditTrailQueryDocument, { variables: { certId, limit: 20, offset: 0 }, fetchPolicy: 'cache-and-network', skip: !hasViewPermission || !detailLoaded })`
  - C.3: Skip if `AppPermission.CertificateView` not held (not a `canViewAudit` boolean from query — use AppPermission)
  - Track `offset` in ViewModel state (NOT in store — C.8)
  - `loadMoreAudit()` increments offset, uses `fetchMore` to append items to existing list
  - Server returns newest-first; no client sort toggle

- [ ] 4.4 C.8: ViewModel-managed timeline state (NOT in store):
  - `expandedAuditIds: Set<string>` — managed via `useState` in the ViewModel hook
  - `toggleAuditExpanded(id)` — ViewModel function that adds/removes from the local Set
  - `auditLoadingMore: boolean` — managed via `useState` state pair
  - These are scratch UI state that should NOT be global (C.8)

- [ ] 4.5 Implement PDF download handler (C.4: single-use token, two-step):
  - Set `isDownloading = true`, `downloadFormat = 'pdf'`, `activeDownloadCertId = id` in store
  - Step 1: Check `certificate.pdfExists` from detail query:
    - If `true`: proceed directly to step 2
    - If `false`: call `CertTriggerPdfRenderMutation` → poll `CertPdfStatusQueryDocument` every 3s, max 10 attempts (30s total)
  - Step 2: Call `CertCreateDownloadUrlMutationDocument` with `{ id, format: 'PDF' }` → get `{ url, expiresAt }`
  - Step 3: `fetch(url)` → `response.blob()` → `URL.createObjectURL(blob)` → anchor click → `URL.revokeObjectURL()`
  - Filename sanitization: `{certificateNumber}_{sanitizedRecipientName}.pdf` (C.2: not `serial`/`studentName`) — spaces → underscores, special chars removed
  - Deduplication: if `activeDownloadCertId === id`, ignore new trigger
  - On success: `isDownloading = false`, `downloadFormat = null`, show success toast
  - On error: `isDownloading = false`, `downloadError = errorCode`:
    - C.5 error codes: `PDF_OBJECT_MISSING`, `PDF_CORRUPTED`, `TEMPLATE_NOT_FOUND`
    - Each shows localized message from `certificateDetail.errors.*`
  - On timeout: `downloadError = 'timeout'`, show error toast with Retry

- [ ] 4.6 Implement PNG/JPG download handler (NEW):
  - Same store state pattern as PDF (reuse `isDownloading`, `downloadFormat`, `activeDownloadCertId`)
  - Call `CertCreateImageDownloadUrlMutationDocument` with `{ id, format: 'PNG' | 'JPG' }`
  - Fetch blob → download (same blob URL pattern as PDF)
  - Filename: `{certificateNumber}_{sanitizedRecipientName}.{png|jpg}` (C.2)
  - Error handling: same C.5 error codes + `IMAGE_RENDER_ERROR`

- [ ] 4.7 Implement print handler (C.6: off-screen iframe, NOT display:none):
  - Set `isPreparingPrint = true` in store
  - C.6: Same PDF existence check as download (lazy render if needed)
  - Get single-use token via `CertCreateDownloadUrlMutationDocument` (NOT presigned URL — C.4)
  - Pass URL to `PrintFrame` component (renders off-screen iframe at `position: fixed; left: -9999px; top: 0; width: 1px; height: 1px; opacity: 0` — C.6: NOT `display: none`)
  - On `PrintFrame` `onPrintComplete` callback: `isPreparingPrint = false`
  - C.6 note: `@page` CSS injection only works for HTML — for PDF loaded via `<iframe src>`, the native PDF viewer handles orientation. Honest comment in code acknowledging the limitation.
  - On error: `isPreparingPrint = false`, `printError = errorCode`

- [ ] 4.8 Implement revocation handler:
  - Open revoke dialog via store `openRevokeDialog()`
  - On submit: call `CertRevokeMutationDocument` with `{ id, reason, otherReason?, notes? }`
  - Optimistic UI: status badge transitions `issued → revoked` immediately (C.1)
  - On success: close dialog, reset form, show success toast, refetch detail + audit queries
  - On error: revert optimistic (Apollo auto-reverts), keep dialog open, show error Alert inside dialog

- [ ] 4.9 Implement reissue handler (C.7: new cert creation, old stays revoked):
  - Open reissue dialog via store `openReissueDialog()`
  - On submit: call `CertReissueMutationDocument` with `{ id, reason }` (reason optional)
  - Returns NEW certificate (new UUID) — old cert remains `REVOKED`
  - On success: close dialog, show success toast with link to new cert, navigate to new cert detail page (`/certificates/{newCertId}`)
  - On error: keep dialog open, show error Alert

- [ ] 4.10 Implement share handler (NEW: REQ-18-08a):
  - Open share dialog via store `openShareDialog()`
  - Generate QR code using dynamic import of `qrcode` library:
    - `const QRCode = await import('qrcode')`
    - SVG: `QRCode.toString(url, { type: 'svg', errorCorrectionLevel: 'M', width: 256, margin: 4 })`
    - PNG download: `QRCode.toDataURL(url, { errorCorrectionLevel: 'M', width: 1024, type: 'image/png', margin: 4 })`
  - C.13: URL construction: `${process.env.NEXT_PUBLIC_PUBLIC_BASE_URL}/verify/${verificationCode}`
  - Share actions:
    - Copy verification link: `navigator.clipboard.writeText(url)`
    - Email: opens client email with `mailto:` with subject from i18n
    - WhatsApp: opens `https://wa.me/?text=` with encoded URL
    - Download QR as PNG: uses high-resolution 1024x1024 PNG `toDataURL`

- [ ] 4.11 Assemble ViewModel object (useCertDetailViewModel.ts return type):
  - `vm.loading: boolean` — detail query loading
  - `vm.error: { type: 'not_found' | 'access_denied' | 'network', message: string } | null`
  - `vm.certificate: CertReturnType | null` — detail data (certificateNumber, status, dates, recipient, template, metadata, pdfExists)
  - `vm.locale: Locale` — current locale
  - `vm.labels: CertificateDetailTranslationNamespace` — i18n bound object
  - `vm.pdfUrl: string | null` — resolved for print
  - `vm.download: { isDownloading: boolean, format: 'pdf'|'png'|'jpg'|null, error: string|null, onDownloadPdf(), onDownloadPng(), onDownloadJpg() }`
  - `vm.print: { isPreparingPrint: boolean, error: string|null, onPrint() }`
  - `vm.revoke: { isOpen: boolean, reason: string, otherReason: string, notes: string, isRevoking: boolean, onOpenRevoke(), onCancel(), onSubmit() }`
  - `vm.reissue: { isOpen: boolean, reason: string, isReissuing: boolean, onOpenReissue(), onCancel(), onSubmit() }` (C.7)
  - `vm.share: { isShareDialogOpen: boolean, verificationUrl: string, onOpenShare(), onCancel(), onCopyLink(), onShareEmail(), onShareWhatsApp(), onDownloadQr() }`
  - `vm.audit: { items: CertAuditEventReturnType[],totalCount: number, hasMore: boolean, loading: boolean, loadingMore: boolean, expandedIds: Set<string>, error: ApolloError|null, onLoadMore(), onToggleExpanded(id) }` (C.9/C.8)
  - `vm.permissions: { canView: boolean, canManage: boolean, canRevoke: boolean, canGenerate: boolean }` — derived from `AppPermission` checks
  - `vm.onBack()` — navigation back to list

- [ ] 4.12 Render `<ResponsiveViewSwitch desktop={CertDetailDesktop} mobile={CertDetailMobile} />` — use ViewModel as props
- [ ] 4.13 Render shared dialogs: `<RevokeDialog>`, `<ReissueDialog>`, `<PrintFrame>`, `<ShareDialog>` — all driven by store state

**Files to create:**
- `frontend/common/views/dashboard/cert-detail/certDetailContainer.tsx`
- `frontend/common/views/dashboard/cert-detail/useCertDetailViewModel.ts` (extracted hook — C.8: ViewModel hook with useState for expanded IDs)

**Dependencies:** T00 (qrcode), T01 (store), T02 (documents), T03 (page)

**Requirements covered:** REQ-18-01 through REQ-18-07, REQ-18-09, REQ-18-11, REQ-18-11a

**Quality loop per file (full progressive chain: tsgo → biome → lint → codescene):**
```bash
bun run scripts/health/sub-loop.ts frontend/common/views/dashboard/cert-detail/certDetailContainer.tsx --lifecycle codescene
bun run scripts/health/sub-loop.ts frontend/common/views/dashboard/cert-detail/useCertDetailViewModel.ts --lifecycle codescene
```

**Instruction verification:**
- `frontend/views/AGENTS.md` — view conventions
- `frontend/common/graphql/AGENTS.md` — Apollo hook usage
- `frontend/common/stores/AGENTS.md` — Zustand usage (C.8: store state should NOT include timeline local state)
- `.agents/instructions/frontend.instructions.md`

**Outcome file:** `.ai/plans/cert-plan-18/outcome/T04-outcome.md`

---

### T05: Desktop & Mobile Presentation Views

**Goal:** Create the desktop split layout and mobile accordion layout with all sub-components: switcher, desktop, mobile, status badge, breadcrumbs, info panel, download menu, QR display, actions bar, verification link copy.

**Duration:** 6-7 hours

**Subtasks:**

- [ ] 5.1 Create switcher `frontend/common/views/dashboard/cert-detail/certDetailView.tsx`:
  - Import `ResponsiveViewSwitch` from `@/frontend/components/ui/ResponsiveViewSwitch` (or equivalent pattern)
  - Import desktop/mobile views
  - Pass ViewModel through to selected view

- [ ] 5.2 Create desktop view `frontend/desktop/views/dashboard/cert-detail/certDetail.desktop.tsx`:
  - Use `<PageContainer>` component
  - `<PageHeader>` with breadcrumb: "Certificates > {certificateNumber}" and `CertificateStatusBadge` (compact at header and large in status panel)
  - Split layout: `Grid` with `xs={8}` left / `xs={4}` right (sticky)
  - Left column:
    - `CertificatePreview` — renders the certificate visual (if PDF exists, fetch single-use URL to `<iframe>` or image preview; if not yet rendered, fallback "PDF not yet generated" message)
    - `CertificateInfoPanel` (Overview section):
      - certificateNumber (C.2: NOT serial)
      - recipientName (C.2: NOT studentName)
      - recipientId (C.2: NOT studentId)
      - issueDate, expiryDate, completionDate
      - templateName, templateVersion, templateCategory
    - `StatusTimeline` — full timeline with load-more (C.9)
  - Right column (sticky):
    - Status section: `CertificateStatusBadge` (large) + `statusChangedAt` + last known event timestamp
    - Verification section: `QrCodeDisplay` (200x200 SVG) + `VerificationLinkCopy` (copyable URL with feedback) + "Open Link" button
    - Actions section: `CertificateActionsBar` — Download menu (PDF / PNG / JPG), Share button (opens ShareDialog), Revoke button (if `status === 'issued'` AND `canRevoke`), Re-issue button (if `status === 'revoked'` AND `canGenerate`)
    - `DownloadMenu` dropdown component (NEW: `frontend/common/views/dashboard/cert-detail/DownloadMenu.tsx`):
      - MUI `Menu` with items: PDF (high quality), PNG (image), JPG (compressed image)
      - Each shows progress spinner if downloading that format
      - Disabled per format during download

- [ ] 5.3 Create `CertificateStatusBadge` at `frontend/common/views/dashboard/cert-detail/CertificateStatusBadge.tsx` (C.1: 5 values):
  - `pending`: `theme.palette.warning` background, `theme.palette.onWarning` text, icon `HourglassEmptyOutlined`
  - `issued`: `theme.palette.success` background, `theme.palette.onSuccess` text, icon `CheckCircleOutlined`
  - `revoked`: `theme.palette.error` background, `theme.palette.onError` text, icon `BlockOutlined`
  - `expired`: `theme.palette.warning` background, `theme.palette.onWarning` text, icon `ScheduleOutlined`
  - `failed`: `theme.palette.error` background, `theme.palette.onError` text, icon `ErrorOutlined` (C.1: NEW 5th status)
  - Tooltip shows localized `certificateDetail.status.tooltip.lastChanged(date)` using existing `formatDate` (C.10: not date-fns/custom)
  - Compact variant for mobile appbar

- [ ] 5.4 Create `BreadcrumbNav` at `frontend/common/views/dashboard/cert-detail/BreadcrumbNav.tsx`:
  - MUI `Breadcrumbs` with `aria-label="breadcrumb"`
  - "Certificates" link → navigates to list (preserve search/filter state from Plan 16 store)
  - Current: `Typography` with `certificateNumber` (C.2: not `serial`), truncated > 20 chars on mobile

- [ ] 5.5 Create `CertificateInfoPanel` at `frontend/common/views/dashboard/cert-detail/CertificateInfoPanel.tsx`:
  - Section title: `labels.sections.overview`
  - MUI `Stack` with label `<Typography variant="body2" color="text.secondary">` and value `<Typography variant="body1">`
  - Field keys (C.2): certificateNumber, recipientName, recipientId, issueDate, expiryDate, completionDate, templateName, templateVersion, templateCategory, createdByName
  - Dates formatted via `formatDate` utility (C.10) — use existing `Intl.DateTimeFormat` from `frontend/common/lib/dateFormat` (or wherever formatDate lives in this project). Do NOT use `date-fns` custom format. Do NOT hardcode Hijri format — defer if not already supported.

- [ ] 5.6 Create `QrCodeDisplay` at `frontend/common/views/dashboard/cert-detail/QrCodeDisplay.tsx` (per node_research/qrcode.md):
  - Dynamic `import('qrcode')` (browser entry resolves to `lib/browser.js` — no `fs` dependency)
  - URL from ViewModel `share.verificationUrl` — C.13: `${process.env.NEXT_PUBLIC_PUBLIC_BASE_URL}/verify/${verificationCode}`
  - Generation: `QRCode.toString(url, { type: 'svg', errorCorrectionLevel: 'M', width: 256, margin: 4 })` (per node_research)
  - Insert SVG via `dangerouslySetInnerHTML` (qrcode library produces SVG markup string; sanitize not needed since input is URL we control)
  - Display: 200x200 px container (CSS-scaled from 256px source for retina sharpness)
  - Alt label: `labels.verification.qrAltText`
  - Loading: skeleton placeholder during generation (typically < 1ms but async)
  - Error fallback: "QR unavailable" text from i18n if generation throws
  - Memoize via `useMemo` on `url` prop — only re-generate if URL changes
  - Make this component reusable: prop `url: string | null`, prop `size?: number` (default 200)

- [ ] 5.7 Create `VerificationLinkCopy` at `frontend/common/views/dashboard/cert-detail/VerificationLinkCopy.tsx`:
  - MUI `TextField` with `value` = verification URL, `InputProps={{ readOnly: true }}`
  - MUI `IconButton` with `ContentCopyOutlined` icon (MUI v9 icon naming — `Outlined` suffix required)
  - On copy: call `navigator.clipboard.writeText(url)` with feature-detection fallback
  - Success feedback: icon swaps to `CheckOutlined` for 2 seconds, label shows `copy.copiedLabel` localized
  - Error feedback: if clipboard API unavailable, fall back to manual text selection prompt
  - Keyboard accessible: IconButton has `aria-label`

- [ ] 5.8 Create `CertificateActionsBar` at `frontend/common/views/dashboard/cert-detail/CertificateActionsBar.tsx`:
  - Layout: MUI `Stack` with `direction="row"` on desktop, `direction="column"` on mobile variants
  - Action order: Download (Button+Menu), Share (Button➔Dialog), Revoke (Button, destructive), Re-issue (Button shown only when revoked)
  - Revoke button:
    - Visible only when `certificate.status === 'issued'` AND permissions `canRevoke` is true (C.1: status `issued` not `active`)
    - Destructive styling: `color="error"` MUI button
    - Click handler: `vm.revoke.onOpenRevoke()`
  - Re-issue button (C.7: NOT "Reactivate"):
    - Visible only when `certificate.status === 'revoked'` AND permissions `canGenerate` is true
    - Click handler: `vm.reissue.onOpenReissue()`
  - Conditional rendering: hidden (not disabled) when action conditions not met
  - Each action button has tooltip with localized title and keyboard accessible

- [ ] 5.9 Create mobile view `frontend/mobile/views/dashboard/cert-detail/certDetail.mobile.tsx`:
  - `MobilePageContainer` → `MobilePageHeader`:
    - Back arrow IconButton → `vm.onBack()` (navigates to list)
    - Title: `{certificateNumber}` Typography truncated
    - `CertificateStatusBadge` (compact variant)
    - Overflow menu IconButton → MUI `Menu` with CertificateActionsBar items
  - Single column `Stack`:
    - `CertificatePreview` (full width with zoom buttons and pinch handler)
    - Expandable accordion sections (MUI `Accordion`):
      - Accordion 1: Overview (CertificateInfoPanel)
      - Accordion 2: Status (badge + last changed date + first few audit events)
      - Accordion 3: Verification (QrCodeDisplay + VerificationLinkCopy + OpenLink)
      - Accordion 4: Audit Trail (StatusTimeline with "Load More" button)
  - BottomAppBar (mobile fixed): Download (menu), Share (button)

- [ ] 5.10 Create `StatusTimeline` at `frontend/common/views/dashboard/cert-detail/StatusTimeline.tsx` (C.9: paginated, server-sorted):
  - MUI `Timeline` with `TimelineItem` for each audit event
  - Header: event count with localized pluralization `labels.audit.eventCount(count)` (C.9: no sort toggle — server returns newest first)
  - Each entry: action-specific icon (mapping for 7 canonical events), timestamp (formatted via existing `formatDate` — C.10), actor name + role, action label
  - Action icons (MUI v9 `Outlined` suffix):
    - `generated` → `FileDownloadDoneOutlined`
    - `issued` → `VerifiedOutlined`
    - `viewed` → `VisibilityOutlined`
    - `downloaded` → `DownloadOutlined`
    - `revoked` → `BlockOutlined`
    - `reissued` → `AutorenewOutlined`
    - `expired` → `ScheduleOutlined`
  - Expandable details via MUI `Collapse` (C.8: expanded/collapsed state is ViewModel-managed — `vm.audit.onToggleExpanded(id)`)
  - C.9 Load More button: shows `labels.audit.loadMore` if `audit.hasMore === true`
  - Loading skeleton: TimelineItems with `Skeleton` placeholders
  - Empty state: centered Card with title and description
  - Error state: inline `Alert` with retry that calls `onLoadMore` or refetch
  - Accessibility: each `TimelineItem` has `aria-expanded` reflecting expanded state, role="button", keyboard handler (Enter/Space toggles)

- [ ] 5.11 Create loading skeleton for detail page:
  - Desktop: 2-column skeleton with placeholder blocks for left (preview, info, timeline) and right (status, verification, actions)
  - Mobile: single-column skeleton accordions

- [ ] 5.12 Create inline error component for non-fatal errors (download/print errors):
  - Used within ActionsPanel or InfoPanel when a particular sub-operation failed (e.g., PDF object missing while page loaded fine)

**Files to create:**
- `frontend/common/views/dashboard/cert-detail/certDetailView.tsx` (switcher)
- `frontend/desktop/views/dashboard/cert-detail/certDetail.desktop.tsx`
- `frontend/mobile/views/dashboard/cert-detail/certDetail.mobile.tsx`
- `frontend/common/views/dashboard/cert-detail/CertificateStatusBadge.tsx`
- `frontend/common/views/dashboard/cert-detail/BreadcrumbNav.tsx`
- `frontend/common/views/dashboard/cert-detail/CertificateInfoPanel.tsx`
- `frontend/common/views/dashboard/cert-detail/CertificatePreview.tsx`
- `frontend/common/views/dashboard/cert-detail/QrCodeDisplay.tsx`
- `frontend/common/views/dashboard/cert-detail/VerificationLinkCopy.tsx`
- `frontend/common/views/dashboard/cert-detail/CertificateActionsBar.tsx`
- `frontend/common/views/dashboard/cert-detail/DownloadMenu.tsx`
- `frontend/common/views/dashboard/cert-detail/StatusTimeline.tsx`

**Dependencies:** T04 (container provides ViewModel)

**Requirements covered:** REQ-18-01 (detail display), REQ-18-07 (status badge C.1), REQ-18-09 (breadcrumb), REQ-18-10 (mobile), REQ-18-09 (audit timeline C.9)

**Quality loop per file (full progressive chain: tsgo → biome → lint → codescene):**
```bash
bun run scripts/health/sub-loop.ts frontend/common/views/dashboard/cert-detail/VerificationLinkCopy.tsx --lifecycle codescene
bun run scripts/health/sub-loop.ts frontend/common/views/dashboard/cert-detail/CertificateActionsBar.tsx --lifecycle codescene
bun run scripts/health/sub-loop.ts frontend/common/views/dashboard/cert-detail/DownloadMenu.tsx --lifecycle codescene
bun run scripts/health/sub-loop.ts frontend/common/views/dashboard/cert-detail/StatusTimeline.tsx --lifecycle codescene
```

**Instruction verification:**
- `frontend/views/AGENTS.md` — view conventions
- `frontend/AGENTS.md` — MUI v9 rules (sx prop, icon naming with Outlined suffix, Material 3 on<Color>)
- `frontend/desktop/AGENTS.md` / `frontend/mobile/AGENTS.md` — tier-specific rules
- `.agents/instructions/frontend.instructions.md`

**Outcome file:** `.ai/plans/cert-plan-18/outcome/T05-outcome.md`

---

## Phase 3: Actions (T06–T08)

### T06: PDF, PNG & JPG Download

**Goal:** Implement the PDF, PNG, and JPG download flows with lazy rendering, polling, single-use token (C.4), blob download, filename sanitization, and comprehensive error handling (C.5).

**Duration:** 3-4 hours

**Subtasks:**

- [ ] 6.1 Implement download handler logic in container (if not already done in T04 step 4.5/4.6):
  - Set `isDownloading = true`, `downloadFormat = 'pdf'|'png'|'jpg'`, `activeDownloadCertId = id` in store
  - For PDF: Step 1 — check `certificate.pdfExists` from detail data:
    - If `true`: proceed directly to URL mint (Step 2)
    - If `false`: call `CertTriggerPdfRenderMutation` → start polling
  - For PNG/JPG: server handles generation on demand via `CertCreateImageDownloadUrlMutationDocument`

- [ ] 6.2 Implement PDF polling logic:
  - Poll `CertPdfStatusQueryDocument` every 3 seconds
  - Max 10 attempts (30 seconds total)
  - When `pdfExists === true`: stop polling, proceed to URL mint + blob fetch
  - When timeout reached: stop polling, set `downloadError = 'timeout'`, show error toast with Retry

- [ ] 6.3 C.4: Implement single-use token URL mint and blob fetch:
  - For PDF: call `CertCreateDownloadUrlMutationDocument` with `{ id, format: 'PDF' }` → `{ url, expiresAt }`
  - For PNG/JPG: call `CertCreateImageDownloadUrlMutationDocument` with `{ id, format: 'PNG'|'JPG' }` → `{ url, expiresAt }`
  - `fetch(url)` → `response.blob()` → `URL.createObjectURL(blob)`
  - Create `<a>` element with `href = blobUrl` and `download = sanitizedFilename`
  - Append to DOM, click, remove, `URL.revokeObjectURL(blobUrl)`
  - Note: This URL is single-use (Plan 07 `claimSignedUrl` mints token with `used = true` on claim) — NOT a presigned S3 URL with longer TTL. Backend fires `certificate_audits` row with `action = DOWNLOADED` on successful claim.

- [ ] 6.4 Implement filename sanitization (C.2: field names):
  - Input: `certificate.certificateNumber` + `certificate.recipientName`
  - Pattern: `{certificateNumber}_{sanitizedRecipientName}.{ext}`
  - Sanitization: spaces → underscores, remove special characters, truncate to 100 chars total
  - Example: `CERT-2026-001_Ahmed_Hosny.pdf` (or `.png`/`.jpg`)

- [ ] 6.5 C.5: Implement error handling with localized messages:
  - `PDF_OBJECT_MISSING` → show `labels.errors.pdfMissingError`, error toast with Retry
  - `PDF_CORRUPTED` → show `labels.errors.pdfCorruptedError`, error toast with Retry (regenerate)
  - `TEMPLATE_NOT_FOUND` → show `labels.errors.templateMissingError`, error toast (no retry — contact admin)
  - `IMAGE_RENDER_ERROR` → show `labels.errors.imageRenderError`, error toast with Retry
  - Network error during fetch: show `labels.errors.networkError`, error toast with Retry
  - Render timeout (PDF): error toast with Retry
  - Concurrent download prevention: if `activeDownloadCertId === id`, ignore new trigger

- [ ] 6.6 Create download loading UI:
  - `DownloadMenu` shows `CircularProgress` next to active format when `isDownloading && downloadFormat`
  - Per-format spinner: PDF row disabled + spinner if downloading PDF; PNG row disabled + spinner if downloading PNG; JPG row disabled + spinner if downloading JPG
  - Error Alert appears in actions section when `downloadError !== null`
  - Retry button in error Alert calls the same format's download again

- [ ] 6.7 Extract download utility at `frontend/common/views/dashboard/cert-detail/utils/downloadFile.ts`:
  - Reusable helper: `downloadFromUrl(url, filename) → Promise<void>`
  - Shared by PDF, PNG, JPG download handlers
  - Also used by print handler (T07) for the same blob → anchor pattern

**Files to create/modify:**
- `frontend/common/views/dashboard/cert-detail/certDetailContainer.tsx` (download logic — if not in T04)
- `frontend/common/views/dashboard/cert-detail/utils/downloadFile.ts`
- `frontend/common/views/dashboard/cert-detail/DownloadMenu.tsx` (if not in T05)

**Dependencies:** T01 (store), T02 (documents), T04 (container), Plan 06 (PDF Rendering Engine), Plan 07 (Storage & Signed URLs)

**Requirements covered:** REQ-18-02 (PDF download), REQ-18-02a (PNG), REQ-18-02b (JPG), REQ-18-03 (lazy render polling), REQ-18-04 (error handling C.5)

**Quality loop per file (full progressive chain: tsgo → biome → lint → codescene):**
```bash
bun run scripts/health/sub-loop.ts frontend/common/views/dashboard/cert-detail/certDetailContainer.tsx --lifecycle codescene
bun run scripts/health/sub-loop.ts frontend/common/views/dashboard/cert-detail/utils/downloadFile.ts --lifecycle codescene
bun run scripts/health/sub-loop.ts frontend/common/views/dashboard/cert-detail/DownloadMenu.tsx --lifecycle codescene
```

**Instruction verification:**
- `frontend/AGENTS.md` — no console.log (use logger), MUI v9
- `.agents/instructions/frontend.instructions.md`

**Outcome file:** `.ai/plans/cert-plan-18/outcome/T06-outcome.md`

---

### T07: Print via Off-Screen Iframe

**Goal:** Implement the print functionality using an off-screen iframe (C.6: NOT `display: none`) with the native PDF viewer and Safari fallback.

**Duration:** 2-3 hours

**Subtasks:**

- [ ] 7.1 Create `PrintFrame` component at `frontend/common/views/dashboard/cert-detail/PrintFrame.tsx`:
  - Hidden iframe using C.6 off-screen positioning:
    - `style={{ position: 'fixed', left: '-9999px', top: '0px', width: '1px', height: '1px', opacity: 0, border: 'none' }}`
    - NOT `display: 'none'` — `display:none` prevents rendering and breaks `contentWindow.print()` in Chrome
  - `ref` via `useRef<HTMLIFrameElement | null>(null)`
  - Receives `url` prop (single-use token URL from `CertCreateDownloadUrlMutationDocument` — C.4) and `orientation` prop
  - On `url` set: set iframe `src` to URL
  - On iframe `load` event:
    - C.6 honest note: `@page` CSS injection only works for HTML content. For PDF loaded via `<iframe src=url>`, the PDF is rendered by the browser's native PDF viewer (PDF.js in Firefox, Chrome's built-in viewer). The `@page` CSS hack is not effective for PDF content.
    - For HTML content (fallback): inject `@page { margin: 0; size: A4 <orientation> }` CSS into iframe document head
    - Call `iframe.contentWindow.print()` — this triggers the browser print dialog for the PDF
  - Listen for `afterprint` event: clear iframe `src`, notify parent via `onPrintComplete` callback
  - Error handling: if iframe load fails (network error, 4xx/5xx on token URL) → call `onPrintError(errorCode)` callback
  - Note: The single-use token means `onPrintComplete` MUST clear `src` — subsequent prints need a new token

- [ ] 7.2 C.6: Safari fallback implementation:
  - Safari has different print behavior for iframes — in some versions, `iframe.contentWindow.print()` does not bring up the dialog properly
  - Fallback: detect Safari via user agent (or feature-detect by checking `iframe.contentDocument` availability)
  - If Safari: open URL in a new window via `window.open(url, '_blank')` and show instructions: "Use Cmd+P to print"
  - Document this as a known limitation — no perfectly silent print on Safari with single-use tokens

- [ ] 7.3 Implement print handler in container:
  - Set `isPreparingPrint = true` in store
  - Same PDF existence check as download (lazy render if needed)
  - Mint single-use URL via `CertCreateDownloadUrlMutationDocument` with `{ id, format: 'PDF' }` (C.4)
  - Pass `{ url, orientation }` to `PrintFrame` component
  - On `PrintFrame` `onPrintComplete` callback: `isPreparingPrint = false`
  - On `onPrintError`: `isPreparingPrint = false`, `printError = errorCode` (C.5: same error codes as download)

- [ ] 7.4 Implement print loading UI:
  - Print button (in overflow menu or actions bar) shows `CircularProgress` when `isPreparingPrint === true`
  - Button disabled during print
  - Error Alert in actions section when `printError !== null`

- [ ] 7.5 Handle orientation:
  - Read from `certificate.templateOrientation` ('portrait' or 'landscape')
  - Pass to `PrintFrame` orientation prop
  - Honestly: document that orientation is respected by the PDF's own page settings (set at PDF generation time by Plan 06), not by `@page` injection for external PDF URLs

**Files to create:**
- `frontend/common/views/dashboard/cert-detail/PrintFrame.tsx`

**Dependencies:** T01 (store), T02 (documents), T04 (container), T06 (shares lazy render logic and `downloadFromUrl` utility)

**Requirements covered:** REQ-18-05 (print via off-screen iframe — C.6, not display:none)

**Quality loop per file (full progressive chain: tsgo → biome → lint → codescene):**
```bash
bun run scripts/health/sub-loop.ts frontend/common/views/dashboard/cert-detail/PrintFrame.tsx --lifecycle codescene
```

**Instruction verification:**
- `frontend/AGENTS.md` — MUI v9, no console.log
- `.agents/instructions/frontend.instructions.md`

**Outcome file:** `.ai/plans/cert-plan-18/outcome/T07-outcome.md`

---

### T08: Revoke & Re-issue Dialogs (C.7: renamed from Reactivate)

**Goal:** Implement the revocation and re-issue workflows with confirmation dialogs, validation, and audit trail integration. Re-issue creates a NEW certificate (old stays revoked) — NOT reactivation of the same certificate.

**Duration:** 3-4 hours

**Subtasks:**

- [ ] 8.1 Create `RevokeDialog` at `frontend/common/views/dashboard/cert-detail/RevokeDialog.tsx`
  - MUI `Dialog` with WAI-ARIA dialog pattern (focus trap, Escape to close)
  - `DialogTitle`: localized title from `certificateDetail.revoke.dialogTitle`
  - `DialogContent`:
    - `Alert` (severity=warning) with warning text (mentions verification link invalidation)
    - `Select` for reason (enum: DATA_ERROR, WRONG_RECIPIENT, DUPLICATE, OTHER — C.7 canonical reasons)
    - Conditional `TextField` for "Other" reason — visible only when reason = OTHER
    - `TextField` for notes (multiline, maxRows=4, maxLength=500)
  - `DialogActions`:
    - Cancel button: calls `closeRevokeDialog()`, resets form
    - Revoke button: destructive styling (`color="error"`), calls mutation
  - Validation: reason required; "Other" requires text field filled; confirm button disabled if invalid
  - Loading state: Revoke button shows `CircularProgress` during mutation
  - Error state: `Alert` (severity=error) inside dialog content on mutation failure

- [ ] 8.2 Create `ReissueDialog` at `frontend/common/views/dashboard/cert-detail/ReissueDialog.tsx` (C.7: NEW — NOT ReactivateDialog)
  - MUI `Dialog` with WAI-ARIA dialog pattern
  - `DialogTitle`: localized title from `certificateDetail.reissue.dialogTitle`
  - `DialogContent`:
    - `Alert` (severity=info) with info text: creates new certificate, old stays revoked
    - `TextField` for optional reason (multiline, maxRows=3, maxLength=500) — reason is optional per C.7
  - `DialogActions`:
    - Cancel button: calls `closeReissueDialog()`
    - Re-issue button: primary styling, calls mutation
  - Loading state: button shows `CircularProgress` during mutation
  - Error state: `Alert` (severity=error) on failure

- [ ] 8.3 Wire revocation mutation in container:
  - On RevokeDialog submit: call `CertRevokeMutationDocument` with `{ id, reason, otherReason?, notes? }`
  - Optimistic UI: cache update writes `status = REVOKED` before server confirms
  - On success: close dialog, reset form (`closeRevokeDialog()`), show success toast, refetch detail + audit
  - On error: revert optimistic (Apollo auto-reverts), keep dialog open, show error Alert, re-enable button

- [ ] 8.4 Wire re-issue mutation in container (C.7: NEW — NOT ReactivateCertificateMutation):
  - On ReissueDialog submit: call `CertReissueMutationDocument` with `{ id, reason? }` (reason optional)
  - Returns NEW certificate (new UUID, same template/recipient, status `PENDING` or `ISSUED`)
  - Old certificate remains `REVOKED`
  - On success: close dialog, show success toast with link to new cert, navigate to new cert detail page (`/certificates/${newCertId}`)
  - On error: keep dialog open, show error Alert, re-enable button

- [ ] 8.5 Conditionally render Revoke/Re-issue based on certificate status (C.1: 5 canonical values, NO `active`):
  - Revoke button visible only if `status === 'ISSUED'` AND permissions `canRevoke` is true (C.1: `issued` not `active`)
  - Re-issue button visible only if `status === 'REVOKED'` AND permissions `canGenerate` is true (C.7: re-issue = new generation)
  - Hidden (not disabled) when conditions not met

**Files to create:**
- `frontend/common/views/dashboard/cert-detail/RevokeDialog.tsx`
- `frontend/common/views/dashboard/cert-detail/ReissueDialog.tsx`

**Dependencies:** T01 (store), T02 (documents), T04 (container)

**Requirements covered:** REQ-18-05 (revocation), REQ-18-06 (re-issue — C.7 renamed from reactivation), REQ-18-10 (status badge 5 canonical values)

**Quality loop per file (full progressive chain: tsgo → biome → lint → codescene):**
```bash
bun run scripts/health/sub-loop.ts frontend/common/views/dashboard/cert-detail/RevokeDialog.tsx --lifecycle codescene
bun run scripts/health/sub-loop.ts frontend/common/views/dashboard/cert-detail/ReissueDialog.tsx --lifecycle codescene
```

**Instruction verification:**
- `frontend/AGENTS.md` — MUI v9 Dialog conventions, React 19 event handling
- `.agents/instructions/frontend.instructions.md`

**Outcome file:** `.ai/plans/cert-plan-18/outcome/T08-outcome.md`

---

## Phase 4: Verification & Knowledge (T09–T12)

### T09: Audit Trail Timeline (C.9: paginated, server-sorted; C.8: ViewModel state)

**Goal:** Implement the audit trail timeline component with lazy loading, expandable entries, server-side sorting (newest-first), pagination with "Load More", Arabic pluralization, and ViewModel-managed expanded state. NO client-side sort toggle — server returns entries newest-first.

**Duration:** 3-4 hours

**Subtasks:**

- [ ] 9.1 Create `StatusTimeline` at `frontend/common/views/dashboard/cert-detail/StatusTimeline.tsx` (C.9: paginated, server-sorted — NOT client-sort):
  - MUI `Timeline` with `TimelineItem` for each audit entry
  - Header: event count with Arabic pluralization (`labels.audit.eventCount(count)` from i18n — C.9: NO sort toggle — server returns newest first)
  - Each entry: action-specific icon, timestamp (locale-formatted), actor name + role, action label
  - Expandable details via MUI `Collapse` (reason, notes, result, details) — C.8: expanded state managed by ViewModel, NOT store
  - C.9 Load More button: shows `labels.audit.loadMore` if `vm.audit.hasMore === true`
  - C.9: NO sort toggle (server returns entries newest-first; no client sort)
  - Empty state: centered Card with `labels.audit.emptyTitle` and `labels.audit.emptyDescription`
  - Loading state: skeleton TimelineItems
  - Loading more: `labels.audit.loadingMore` with `CircularProgress` inline
  - Error state: inline `Alert` with `labels.audit.errorLoading` and retry link
  - Accessibility: each `TimelineItem` has `aria-expanded` reflecting expanded state, role="button", keyboard handler (Enter/Space toggles)

- [ ] 9.2 Implement icon mapping for 7 canonical audit actions (C.1: canonical names):
  - `GENERATED` → `FileDownloadDoneOutlined`
  - `ISSUED` → `VerifiedOutlined`
  - `VIEWED` → `VisibilityOutlined` (verified on public page)
  - `DOWNLOADED` → `DownloadOutlined`
  - `REVOKED` → `BlockOutlined`
  - `REISSUED` → `AutorenewOutlined` (C.7: reissued, NOT reactivated)
  - `EXPIRED` → `ScheduleOutlined`

- [ ] 9.3 C.8: ViewModel-managed expanded state (NOT store):
  - `expandedAuditIds: Set<string>` managed via `useState` in the ViewModel hook `useCertDetailViewModel.ts`
  - `toggleAuditExpanded(id)` — ViewModel function that adds/removes from the local Set
  - `Collapse` component shows details (reason, notes, result) when expanded
  - Do NOT put `expandedAuditIds` in the Zustand store — it is timeline-local UI state

- [ ] 9.4 C.9: Implement pagination with Load More:
  - Uses `vm.audit.items`, `vm.audit.totalCount`, `vm.audit.hasMore`, `vm.audit.loadingMore` from ViewModel
  - `vm.audit.onLoadMore()` increments offset and calls `fetchMore` to append items
  - Show "Load More" button only when `vm.audit.hasMore === true`
  - Loading more indicator (inline `CircularProgress` next to Load More button)
  - C.9: `nextFetchPolicy: "cache-first"` to avoid refetch on focus when no filter change
  - Server returns newest-first; no client sort order parameter

- [ ] 9.5 Permission gate:
  - Entire `StatusTimeline` section hidden when `AppPermission.CertificateManage` not held (C.3: use AppPermission, NOT `canViewAudit` boolean)
  - C.3 note: Teacher audit filtering (only own actions) is resolver-side in Plan 05; `canViewAudit` only gates section visibility

- [ ] 9.6 Implement date formatting (C.10: use Intl-based formatDate, NOT date-fns custom):
  - Use `frontend/common/lib/dateFormat.ts` (or `frontend/common/components/intl/dateFormat.ts`) existing utility
  - English: `formatDate(date, 'en')` → "Aug 1, 2026"
  - Arabic: `formatDate(date, 'ar')` → "١ أغسطس ٢٠٢٦" (Intl handles Arabic-Indic digits)
  - C.10: Do NOT use `date-fns` with custom format or Hijri plugin; defer Hijri to future

**Files to create:**
- `frontend/common/views/dashboard/cert-detail/StatusTimeline.tsx`

**Dependencies:** T01 (store), T02 (documents), T04 (container — provides ViewModel with audit state)

**Requirements covered:** REQ-18-07 (audit trail — C.9 paginated, server-sorted, expandable), REQ-18-10 (status badge canonical values)

**Quality loop per file (full progressive chain: tsgo → biome → lint → codescene):**
```bash
bun run scripts/health/sub-loop.ts frontend/common/views/dashboard/cert-detail/StatusTimeline.tsx --lifecycle codescene
```

**Instruction verification:**
- `frontend/views/AGENTS.md` — view conventions
- `frontend/AGENTS.md` — MUI v9 Timeline component, icon naming (Outlined suffix)
- `.agents/instructions/frontend.instructions.md`

**Outcome file:** `.ai/plans/cert-plan-18/outcome/T09-outcome.md`

---

### T10: Verification URL & QR Code (C.13: NEXT_PUBLIC_PUBLIC_BASE_URL)

**Goal:** Implement the verification section with copyable URL, QR code display, and share dialog. Use `NEXT_PUBLIC_PUBLIC_BASE_URL` env var for URL construction (C.13: NOT `window.location.origin`). QR codes are client-generated for preview only — the certificate PDF is baked at generation time by Plan 06.

**Duration:** 2-3 hours

**Subtasks:**

- [ ] 10.1 Verify `qrcode` package installed (T00 — if not, run `bun add qrcode && bun add -D @types/qrcode`)

- [ ] 10.2 Create `QrCodeDisplay` at `frontend/common/views/dashboard/cert-detail/QrCodeDisplay.tsx` (C.13: env var, NOT window.location.origin):
  - Dynamic `import('qrcode')` (browser entry resolves to `lib/browser.js` — no `fs` dependency)
  - C.13: URL construction: `${process.env.NEXT_PUBLIC_PUBLIC_BASE_URL}/verify/${verificationCode}` — NOT `window.location.origin`
  - Generation: `QRCode.toString(url, { type: 'svg', errorCorrectionLevel: 'M', width: 256, margin: 4 })`
  - Insert SVG via `dangerouslySetInnerHTML` (qrcode library produces SVG markup string; sanitize not needed since input is URL we control)
  - Display: 200x200 px container (CSS-scaled from 256px source for retina sharpness)
  - Alt label: `labels.verification.qrAltText`
  - Loading: skeleton placeholder during generation (typically < 1ms but async)
  - Error fallback: "QR unavailable" text from i18n if generation throws
  - Memoize via `useMemo` on `url` prop — only re-generate if URL changes
  - Make this component reusable: prop `url: string | null`, prop `size?: number` (default 200)
  - C.13: Note that printed PDF QR is baked at generation time (Plan 06) using the same env var for URL consistency

- [ ] 10.3 Create `VerificationLinkCopy` at `frontend/common/views/dashboard/cert-detail/VerificationLinkCopy.tsx`:
  - MUI `TextField` with `value` = verification URL, `InputProps={{ readOnly: true }}`
  - MUI `IconButton` with `ContentCopyOutlined` icon (MUI v9: `Outlined` suffix required)
  - On copy: call `navigator.clipboard.writeText(url)` with feature-detection fallback
  - Success feedback: icon swaps to `CheckOutlined` for 2 seconds, label shows `labels.verification.copiedLabel` localized
  - Error feedback: if clipboard API unavailable, fall back to manual text selection prompt
  - MUI `Button` with `href` = URL, `target="_blank"`, `rel="noopener noreferrer"` — "Open Verification Page"
  - Keyboard accessible: IconButton has `aria-label`

- [ ] 10.4 Create `ShareDialog` at `frontend/common/views/dashboard/cert-detail/ShareDialog.tsx` (NEW: REQ-18-08a):
  - MUI `Dialog` controlled by store `shareDialogOpen` state
  - `DialogTitle`: localized `labels.share.dialogTitle` ("Share Certificate")
  - `DialogContent`:
    - Verification link section: shows URL + copy button (reuse `VerificationLinkCopy`)
    - QR code section: `QrCodeDisplay` component (200x200 SVG)
    - QR download button: generates PNG via `QRCode.toDataURL(url, { errorCorrectionLevel: 'M', width: 1024, margin: 4 })` — 1024x1024 for print quality
    - Share via Email: `<Button component="a" href={mailtoLink}>` — `mailto:` link with subject from `labels.share.emailSubject` and body from `labels.share.emailBody` (encoded)
    - Share via WhatsApp: `<Button component="a" href={waMeLink} target="_blank">` — `https://wa.me/?text=${encodedUrl}`
  - `DialogActions`:
    - Close button: localized `labels.share.cancelButton`
  - C.13: All URLs use `${process.env.NEXT_PUBLIC_PUBLIC_BASE_URL}/verify/${verificationCode}`
  - State from store: `shareDialogOpen`, `isGeneratingQr`; actions: `closeShareDialog()`, `setGeneratingQr(bool)`

- [ ] 10.5 Verify URL pattern (C.13):
  - Pattern: `${process.env.NEXT_PUBLIC_PUBLIC_BASE_URL}/verify/${verificationCode}`
  - C.13: `NEXT_PUBLIC_PUBLIC_BASE_URL` is a public env var (no secrets) — accessible client-side
  - `verificationCode` from `certificate.verificationCode` field
  - Verify the env var is set in `.env.local` / Vercel config — add to build-time config validation if not already present

**Files to create:**
- `frontend/common/views/dashboard/cert-detail/QrCodeDisplay.tsx`
- `frontend/common/views/dashboard/cert-detail/VerificationLinkCopy.tsx`
- `frontend/common/views/dashboard/cert-detail/ShareDialog.tsx`

**Dependencies:** T00 (qrcode package), T01 (i18n, store), T04 (container — provides ViewModel)

**Requirements covered:** REQ-18-09 (verification URL display + QR), REQ-18-08a (share dialog), REQ-18-11 (QR at 200x200 SVG, 1024x1024 PNG download)

**Quality loop per file (full progressive chain: tsgo → biome → lint → codescene):**
```bash
bun run scripts/health/sub-loop.ts frontend/common/views/dashboard/cert-detail/QrCodeDisplay.tsx --lifecycle codescene
bun run scripts/health/sub-loop.ts frontend/common/views/dashboard/cert-detail/VerificationLinkCopy.tsx --lifecycle codescene
bun run scripts/health/sub-loop.ts frontend/common/views/dashboard/cert-detail/ShareDialog.tsx --lifecycle codescene
```

**Instruction verification:**
- `frontend/AGENTS.md` — MUI v9, no console.log (use logger), icon naming with `Outlined` suffix
- `.agents/instructions/frontend.instructions.md`

**Outcome file:** `.ai/plans/cert-plan-18/outcome/T10-outcome.md`

---

### T11: Component Tests

**Goal:** Write component tests for the certificate detail page, dialogs, audit timeline, QR/copy components, and ShareDialog — all aligned with C.1 (5 status values), C.7 (reissue not reactivate), C.9 (paginated server-sort), C.13 (env var URLs).

**Duration:** 4-5 hours

**Subtasks:**

- [ ] 11.1 Write component tests at `test/ui/components/cert-detail/`:
  - `CertDetailContainer.test.tsx` — loading state, error state (404/not found → DashboardNotFoundContent), error state (403/access denied → DashboardAccessDeniedContent — C.11), data display with permission flags (C.3: AppPermission-based)
  - `CertificateStatusBadge.test.tsx` — all 5 status values (C.1: pending=warning, issued=success, revoked=error, expired=warning, failed=error — NOT 3 values), tooltip display with `status.tooltip.lastChanged(date)` interpolation
  - `DownloadMenu.test.tsx` — menu opens, format selection (PDF/PNG/JPG), loading state per format, disabled state when downloading, error toast for C.5 error codes (PDF_OBJECT_MISSING, PDF_CORRUPTED, TEMPLATE_NOT_FOUND)
  - `RevokeDialog.test.tsx` — open/close, reason selection (DATA_ERROR, WRONG_RECIPIENT, DUPLICATE, OTHER — C.7), "Other" conditional field, validation (reason + other reason required when OTHER selected), confirm disabled when invalid, loading state, error state (Alert inside dialog)
  - `ReissueDialog.test.tsx` — open/close, optional reason, confirm (creates NEW cert — C.7), loading state, error state (Alert inside dialog)
  - `ShareDialog.test.tsx` — open/close, copy verification link (clipboard API), "Copied!" feedback, email link opens `mailto:`, WhatsApp link opens `https://wa.me/`, QR download button at 1024x1024
  - `StatusTimeline.test.tsx` — empty state, single entry, multiple entries, expand/collapse (C.8: ViewModel-managed expandedIds), C.9: Load More button when hasMore=true, loading more state, NO client sort toggle, event count with pluralization (0/1/2/3-10/11-99/100+ — Arabic)
  - `QrCodeDisplay.test.tsx` — SVG generation (200x200), QR content matches `${NEXT_PUBLIC_PUBLIC_BASE_URL}/verify/${verificationCode}` (C.13), loading state (skeleton), error fallback ("QR unavailable")
  - `VerificationLinkCopy.test.tsx` — copy to clipboard, "Copied!" feedback, clipboard API failure handling, read-only TextField display, "Open Verification Page" link
  - `CertificateActionsBar.test.tsx` — permission-gated button visibility (C.3: use AppPermission.CertificateView/Manage/Revoke/Generate), Revoke visible only when `status === 'ISSUED'` (C.1: not 'active'), Re-issue visible only when `status === 'REVOKED'` (C.7: New name)
  - `CertificateInfoPanel.test.tsx` — field display (C.2: certificateNumber, recipientName, entryDate, expiryDate, templateName, etc. — NOT serial/studentName/studentId), date formatting via `formatDate` (C.10)
  - `DashboardAccessDeniedContent.test.tsx` — renders access denied message, "Back to Certificates" button (C.11: NEW component, split from 404)

- [ ] 11.2 Test setup:
  - Use Happy DOM environment (no server)
  - Mock Apollo Client with `MockedProvider` (in `test/ui/components/cert-detail/__mocks__/`)
  - Mock `certDetailStore` from `frontend/common/stores/__mocks__/certDetailStore.ts`
  - Mock `qrcode` library with `jest.mock('qrcode')` or similar stub
  - Mock `navigator.clipboard` for copy tests (C.13 env var URL)
  - Mock `process.env.NEXT_PUBLIC_PUBLIC_BASE_URL` for URL construction tests (C.13)
  - C.10: Mock `formatDate` utility from `@/frontend/common/lib/dateFormat`

- [ ] 11.3 Run tests:
  ```bash
  bun run test:ui:components -- --testPathPattern="test/ui/components/cert-detail/"
  ```

**Files to create:**
- `test/ui/components/cert-detail/CertDetailContainer.test.tsx`
- `test/ui/components/cert-detail/CertificateStatusBadge.test.tsx`
- `test/ui/components/cert-detail/DownloadMenu.test.tsx`
- `test/ui/components/cert-detail/RevokeDialog.test.tsx`
- `test/ui/components/cert-detail/ReissueDialog.test.tsx`
- `test/ui/components/cert-detail/ShareDialog.test.tsx`
- `test/ui/components/cert-detail/StatusTimeline.test.tsx`
- `test/ui/components/cert-detail/QrCodeDisplay.test.tsx`
- `test/ui/components/cert-detail/VerificationLinkCopy.test.tsx`
- `test/ui/components/cert-detail/CertificateActionsBar.test.tsx`
- `test/ui/components/cert-detail/CertificateInfoPanel.test.tsx`
- `test/ui/components/cert-detail/DashboardAccessDeniedContent.test.tsx`

**Dependencies:** All prior tasks (T01–T10)

**Requirements covered:** Validates REQ-18-01 through REQ-18-13, all C.1 through C.13 reality check fixes

**Quality loop per test file:**
```bash
bun run scripts/run-test/run-test.ts test/ui/components/cert-detail/<file>.test.tsx
```

**Instruction verification:**
- `test/ui/AGENTS.md` — test conventions
- `.agents/instructions/tests.instructions.md`

**Outcome file:** `.ai/plans/cert-plan-18/outcome/T11-outcome.md`

---

### T12: Knowledge Propagation

**Goal:** Document all patterns created by this plan for reuse across other Plans (04, 12, 13, 15, 16) so future implementers can follow the same conventions. Key patterns: Split Download (C.4), Off-Screen Print (C.6), Re-issue (C.7), Paginated Server-Sorted Audit (C.9), URL Construction (C.13), Access Denied Component (C.11), and the full ViewModel-Via-Container pattern with presentation-tier Delegation.

**Duration:** 1-2 hours

**Subtasks:**

- [ ] 12.1 Audit trail pattern (C.9 applied): `StatusTimeline.tsx`
  - Document: Server-sorted (newest-first), no client sort toggle
  - Document: `nextFetchPolicy: "cache-first"` on loadMore to avoid refetch on focus
  - Document: ViewModel-managed `expandedIds` (not store — C.8)
  - Document: Pagination offset-tracking via ViewModel internal `auditOffset` (store exposes only `hasMore`, `totalCount`, `loadMore fn`)
  - Relevant to Plan 04 (Audit Log), Plan 15 (Template audit)

- [ ] 12.2 Re-issue pattern (C.7): `ReissueDialog.tsx`
  - Document: Creates new certificate with `previousCertificateId` foreign key (NOT "reactivate" in-place)
  - Document: Revoke check: `status === 'ISSUED'` (CANCHECK C.1: NOT `'active'` or `'draft'`)
  - Document: Re-issue check: `status === 'REVOKED'` only (C.1: NOT `'active'` + `revokedReason`)
  - Document: Re-issue reason optional (DATA_ERROR, WRONG_RECIPIENT, DUPLICATE, OTHER — C.7)
  - Document: Navigation to newly created certificate after re-issue mutation (C.7)
  - Document: Apollo cache eviction for both `CertificateList` + `CertificateDetail`
  - Relevant to Plan 04 (status management)

- [ ] 12.3 Download security pattern (C.4): `DownloadMenu.tsx`
  - Document: Split `checkRenderStatus` (non-sensitive, poll) from `mintDownloadUrl` (single-use signedUrl, creates audit event)
  - Document: `claimSignedUrl(token, tx)` uses `SELECT FOR UPDATE SKIP LOCKED` on `signedUrls` table
  - Document: DOWNLOAD audit event fires in `mintDownloadUrl` resolver (not client-side)
  - Relevant to Plan 18 and any future download endpoints

- [ ] 12.4 Print pattern (C.6): Off-Screen Iframe with Feature Detection
  - C.6: Iframe with `position: fixed; left: -9999px; width: 794px; height: 1123px` (A4 at 96 DPI)
  - NOT `display: none` (blocks render in Chrome)
  - Iframe `srcdoc` contains a self-contained HTML string with embedded CSS
  - Safari feature detection: `typeof iframe.contentWindow?.document?.queryCommandSupported` → fallback to `window.open(blobUrl)`
  - Stop further processing (ignore further download attempts gracefully)
  - C.6 Note: `@page` CSS at-rule doesn't work inside iframes in all browsers; margin control via `margin: 6mm` on `<body>`

- [ ] 12.5 Verification URL pattern (C.13):
  - C.13: Always use `NEXT_PUBLIC_PUBLIC_BASE_URL` — NEVER `window.location.origin`
  - Document environment variable configuration in `.env.local` and Vercel project settings
  - Pattern: `${process.env.NEXT_PUBLIC_PUBLIC_BASE_URL}/verify/${verificationCode}`
  - Note: QR baked at generation time (Plan 06) uses the same env var
  - Note: `QrCodeDisplay` memoized via `useMemo` on `url` prop

- [ ] 12.6 Error components patterns (C.11):
  - Document: Split 404 (DashboardNotFoundContent) vs 403 (DashboardAccessDeniedContent — NEW)
  - `DashboardAccessDeniedContent`: reusable component (MUI Card with `LockOutlined` icon, description from i18n, CTA "Back to Certificates" link)
  - 404: reuse `DashboardNotFoundContent` from Plan 02
  - UUID validation: add `zod` schema `z.string().uuid()` validation before Apollo query

- [ ] 12.7 ViewModel-VersionStore pattern (C.8):
  - Document: Store only dialog state and cross-tier UI actions (downloadProgress, shareDialogOpen, etc.)
  - Document: ViewModel (Custom Hook at Container level) manages expandedIds, auditPagination, derived/computed state
  - Document: `ViewModelReturnType<TCertDetailViewModel>` is the full return type used by Container; Container delegates to `desktop`/`mobile` Presentation Views

- [ ] 12.8 Icon naming enforcement:
  - Document: MUI v9 Outlined suffix for ALL icons (`BlockOutlined`, NOT `Block`)
  - Document: Canonical icon mapping for 7 audit actions in `StatusTimeline.tsx`
  - Cross-reference: Plan 04 (shared icons for certificate lifecycle), Plan 08 (template actions)

**Outcome file:** `.ai/plans/cert-plan-18/outcome/T12-outcome.md`---

# ADDENDUM: Detail Page, Preview Viewer, Tabbed Panels — Tasks (Phase 2)

**Added:** 2026-08-02
**Status:** Supplemental — appended atop T00–T12; no removals.
**Dependencies:** T00–T10 (store, queries, i18n, download/print plumbing, audit/verify wiring).

### T13: CertificateDetailPage Presentation Shell

**Goal:** Container-style top-level page composing header + breadcrumb + two-column body grid + QR card.

**File:** `frontend/views/dashboard/cert/certificates/detail/CertificateDetailPage.tsx`

**Subtasks:**
- [ ] 13.1 Create route handler `app/[locale]/dashboard/cert/certificates/[id]/page.tsx` delegating to `CertificateDetailPage` container (App Router; server component shell reads params, passes to client component).
- [ ] 13.2 Construct breadcrumb: `Certificates (link)` > `Certificate #{certNumber}` (i18n `cert.detail.breadcrumb.certificates` / `cert.detail.breadcrumb.certificate`); link preserves fallback filter state per C.7 breadcrumb caveat.
- [ ] 13.3 Header bar (MUI AppBar-palette wrapper): left — certificate number (mono font, h1) + status badge; right — Download/Verify/Print/Revoke cluster (Revoke hidden when `status === 'REVOKED'`).
- [ ] 13.4 Two-column body grid (Grid2 `xs=12 xl=7` / `xs=12 xl=5`); below — `QrVerificationCard` full width.
- [ ] 13.5 Reading accessibility: aria-labels on tabs/buttons; focus trap on revoke dialog portal; responsive collapse to single column below `lg`.
- [ ] 13.6 Quality loop: `bun run scripts/health/sub-loop.ts frontend/views/dashboard/cert/certificates/detail/CertificateDetailPage.tsx --lifecycle codescene`.

**Duration:** 6 hours
**Dependencies:** T01 (store), T04 (container), T05 (desktop view tier pattern).
**Outcome file:** `.ai/plans/cert-18/outcome/T13-outcome.md`

---

### T14: CertificatePreviewViewer (Zoom, Pan, Rotate, Fullscreen)

**Goal:** Interactive preview with `react-zoom-pan-pinch` (or fallback custom hook) — pan/zoom/rotate/print/fullscreen.

**File:** `frontend/views/dashboard/cert/certificates/detail/CertificatePreviewViewer.tsx`

**Subtasks:**
- [ ] 14.1 Add `react-zoom-pan-pinch` dependency (peer compat check with React 19; if broken, implement custom `useTransform` hook).
- [ ] 14.2 Toolbar (left top): zoom in, zoom out, fit-to-screen, actual-size, zoom-% label (all using `@mui/icons-material/*Outlined`).
- [ ] 14.3 Pan: click-and-drag (cursor `grab`/`grabbing`); disabled when `prefers-reduced-motion: reduce`.
- [ ] 14.4 Rotate 90° left/right buttons; state piped to `useCertificateDetailStore.rotation`.
- [ ] 14.5 Fullscreen via `requestFullscreen()`; `Esc` exits; toggle button state from `isFullscreen` store field.
- [ ] 14.6 Page navigation: prev/next buttons + `Page X of Y` indicator (disabled if single-page PDF).
- [ ] 14.7 Download overlay (top-right): persistent `Download PDF` button pinned via `position: absolute` over canvas.
- [ ] 14.8 Print button: opens browser print dialog scoped to preview iframe; C.6 fallback to `window.open(blobUrl)`.
- [ ] 14.9 PDF rendering via `<iframe>` or `<object>` with `blob:` URL minted via C.4 split-download.
- [ ] 14.10 Mobile: pinch-to-zoom delegated to native gesture on iframe wrapper; toolbar collapses to icon-only.
- [ ] 14.11 Quality loop per file (codescene lifecycle).
- [ ] 14.12 Confirm `prefers-reduced-motion` disabling animations (useCSS hook from MUI).

**Duration:** 10 hours
**Dependencies:** T06 (mint signed URL plumbing), C.6 print pattern.
**Outcome file:** `.ai/plans/cert-18/outcome/T14-outcome.md`

---

### T15: CertificateDetailsPanel (Tabbed Four-Tab Surface)

**Goal:** MUI Tabs panel hosting `Overview` / `Variable Values` / `Audit Trail` / `Download History`.

**File:** `frontend/views/dashboard/cert/certificates/detail/CertificateDetailsPanel.tsx`

**Subtasks:**
- [ ] 15.1 MUI Tabs with `activeTab` controlled by `useCertificateDetailStore.activeTab`.
- [ ] 15.2 Render correct panel body based on `activeTab` (lazy-render audit/downloads tabs to avoid eager queries).
- [ ] 15.3 ARIA-compliant tab labels and keyboard navigation (left/right arrows between tabs).
- [ ] 15.4 Quality loop (codescene lifecycle).

**Duration:** 4 hours
**Dependencies:** T13 (parent shell).
**Outcome file:** `.ai/plans/cert-18/outcome/T15-outcome.md`

---

### T16: Overview Tab (Info + Recipient Cards)

**Goal:** Two-card surface — `OverviewInfoCard` + `OverviewRecipientCard` — with read-only fields, copy icons, verification URL operations.

**Files:**
- `frontend/views/dashboard/cert/certificates/detail/OverviewInfoCard.tsx`
- `frontend/views/dashboard/cert/certificates/detail/OverviewRecipientCard.tsx`

**Subtasks:**
- [ ] 16.1 Info card: Certificate Number TextField (readonly + Copy icon button via `ContentCopyOutlined`).
- [ ] 16.2 Status badge (`CertificateStatusBadge` — C.1 5-color variant).
- [ ] 16.3 Template Name as `Link` to `/dashboard/cert/templates/[templateId]`.
- [ ] 16.4 Issue Date via `formatDate(issuedAt, locale)` (Gregorian only — C.10 Hijri deferred).
- [ ] 16.5 Expiry Date formatted OR `"None"` literal when `expiresAt IS NULL`.
- [ ] 16.6 Verification URL TextField (readonly) + Copy icon + Open-in-new-tab icon (`OpenInNewOutlined`); URL constructed per C.13 (`NEXT_PUBLIC_PUBLIC_BASE_URL`).
- [ ] 16.7 Verification Code TextField (readonly) + Copy icon.
- [ ] 16.8 Recipient card: Name + Email + Phone (conditional) + Recipient group Link (conditional).
- [ ] 16.9 Clipboard writes via `navigator.clipboard.writeText` with permission fallback to legacy `document.execCommand('copy')` if `clipboard-write` permission denied.
- [ ] 16.10 Toast snackbar on copy (i18n key `common.copied`).
- [ ] 16.11 Quality loop per file (codescene lifecycle).

**Duration:** 8 hours
**Dependencies:** T03 (page), T04 (container).
**Outcome file:** `.ai/plans/cert-18/outcome/T16-outcome.md`

---

### T17: Variable Values Tab

**Goal:** Tabular display joining template variables with resolved values for this certificate; source badges; CSV export.

**Files:**
- `frontend/views/dashboard/cert/certificates/detail/VariableValuesTable.tsx`

**Subtasks:**
- [ ] 17.1 MUI Table rows: `Variable Name | Template Default | Actual Value | Source`.
- [ ] 17.2 Source chip variants: `Auto-mapped` (primary), `Manual` (secondary), `Static` (default), `CSV column` (info with column-name subtitle).
- [ ] 17.3 Resolve values via query — `CertificateVariableValuesQueryDocument` (extend Plan 05 schema; add to T02 document set).
- [ ] 17.4 "Export as CSV" button — client-side CSV conversion via `Blob` + `URL.createObjectURL`; filename `certificate-${certNumber}-variables.csv`.
- [ ] 17.5 Empty state: `No variables defined for this certificate` (i18n `cert.detail.variables.empty`).
- [ ] 17.6 Loading skeleton via MUI `Skeleton` placeholder rows.
- [ ] 17.7 Quality loop per file (codescene lifecycle).

**Duration:** 6 hours
**Dependencies:** T02 (documents), T15 (panel), T03 (page).
**Outcome file:** `.ai/plans/cert-18/outcome/T17-outcome.md`

---

### T18: Audit Trail Tab (Timeline)

**Goal:** MUI Timeline with server-paginated audit events; filter; export; reason/source chips.

**Files:**
- `frontend/views/dashboard/cert/certificates/detail/AuditTimeline.tsx`

**Subtasks:**
- [ ] 18.1 Install `@mui/lab` (Timeline component) — verify not already in deps; add to `package.json` if absent.
- [ ] 18.2 Render each event: timestamp (absolute + relative via `formatDistanceToNow`), event icon, description text, user (System label for system events).
- [ ] 18.3 Icon mapping per T08 Section 12.8 (`AddCircleOutlined`, `VerifiedOutlined`, `DownloadOutlined`, `EmailOutlined`, `CheckCircleOutlined`, `BlockOutlined`, `VisibilityOutlined`).
- [ ] 18.4 Revoked entries: chip with reason i18n key.
- [ ] 18.5 Verified entries: source chip (`public page` / `QR scan` / `direct URL`).
- [ ] 18.6 Filter segmented control: `All Events` / `User Actions` / `System Events` controlled by `auditFilter` store field.
- [ ] 18.7 "Load more" button visible when `auditHasMore === true`; `totalCount` rendered above timeline.
- [ ] 18.8 "Export audit trail" button — CSV with columns `timestamp,event,user,description`.
- [ ] 18.9 ViewModel-managed `expandedAuditIds: Set<string>` (C.8 — NOT in store).
- [ ] 18.10 Pagination uses `PaginationArgs` + Laravel `pageInfo` (C.9).
- [ ] 18.11 Quality loop per file (codescene lifecycle).

**Duration:** 10 hours
**Dependencies:** T09 (audit pagination/wiring), C.9 pagination pattern.
**Outcome file:** `.ai/plans/cert-18/outcome/T18-outcome.md`

---

### T19: Download History Tab

**Goal:** MUI Table of all DOWNLOAD audit events for this certificate; CSV export.

**Files:**
- `frontend/views/dashboard/cert/certificates/detail/DownloadHistoryTable.tsx`

**Subtasks:**
- [ ] 19.1 MUI Table columns: `Date | User | Format | IP Address | User Agent`.
- [ ] 19.2 Filter `action = 'DOWNLOAD'` (server-side filtering in `CertificateAuditTrailQueryDocument`).
- [ ] 19.3 Default sort descending by `createdAt` (server-sorted — C.9; no client toggle).
- [ ] 19.4 "Load more" button when `downloadHasMore === true`; empty state when zero rows.
- [ ] 19.5 "Export download history" button — CSV with same columns.
- [ ] 19.6 Empty state: `No downloads recorded yet` (i18n `cert.detail.downloads.empty`).
- [ ] 19.7 Loading skeleton for initial fetch.
- [ ] 19.8 Quality loop per file (codescene lifecycle).

**Duration:** 6 hours
**Dependencies:** T09 (audit query plumbing).
**Outcome file:** `.ai/plans/cert-18/outcome/T19-outcome.md`

---

### T20: RevokeConfirmDialog

**Goal:** Confirmation modal: warning alert, reason select, custom reason, notify switch, LoadingButton confirm.

**Files:**
- `frontend/views/dashboard/cert/certificates/detail/RevokeConfirmDialog.tsx`

**Subtasks:**
- [ ] 20.1 Props: `{ open, certificateId, onClose, onRevoked }` — `onRevoked` receives the updated `CertificateReturnType`.
- [ ] 20.2 MUI `Dialog` with `maxWidth='sm' fullWidth`.
- [ ] 20.3 Warning `Alert` (severity=`warning`) showing i18n key `cert.detail.revoke.warning`.
- [ ] 20.4 `RevokeReasonSelect` (reuse Plan 16's component; canonical reason enum per C.7).
- [ ] 20.5 Conditional custom-reason `TextField` when reason === `OTHER` (max 200 chars; `inputProps={{ maxLength: 200 }}`).
- [ ] 20.6 `Notify recipient` `Switch` — server sends notification email when ON.
- [ ] 20.7 `LoadingButton` (color=`error`) — i18n label `cert.detail.revoke.confirm`; `loading={isRevoking}` from store.
- [ ] 20.8 On confirm success: global snackbar `Certificate revoked successfully` (i18n `cert.detail.revoke.success`); `onRevoked(updatedCert)` called — caller evicts + refetches `CertificateDetail` Apollo cache.
- [ ] 20.9 On error: error alert inside dialog body (i18n-mapped GraphQL error code per C.11 codes).
- [ ] 20.10 Quality loop per file (codescene lifecycle).

**Duration:** 6 hours
**Dependencies:** T08 (revoke mutation glue), C.7 reason enum.
**Outcome file:** `.ai/plans/cert-18/outcome/T20-outcome.md`

---

### T21: PdfDownloadButton

**Goal:** Encapsulated download trigger — calls split-download flow, shows spinner/progress, handles error snackbars.

**Files:**
- `frontend/views/dashboard/cert/certificates/detail/PdfDownloadButton.tsx`

**Subtasks:**
- [ ] 21.1 Props: `{ certificateId, variant, size }`.
- [ ] 21.2 Click handler: `checkRenderStatus` (pollable, non-sensitive) → `mintDownloadUrl` (single-use `claimSignedUrl`) → `window.location = signedUrl`.
- [ ] 21.3 Loading state swaps icon for `<CircularProgress size={20}>` inside button.
- [ ] 21.4 Large-file linear progress bar below button (visible when `0 < progress < 100`).
- [ ] 21.5 Success: snackbar `Download started` (i18n `cert.detail.download.started`).
- [ ] 21.6 Error handling: `PDF_OBJECT_MISSING` / `PDF_CORRUPTED` / `TEMPLATE_NOT_FOUND` show snackbar with `Retry` action (retriggers PDF regen flow).
- [ ] 21.7 Disabled state when `pdfExists = false` OR `status === 'REVOKED'`; tooltip via `i18n: cert.detail.download.disabled.tooltip`.
- [ ] 21.8 Server-side DOWNLOAD audit fires in `mintDownloadUrl` resolver (C.4 contract — Plan 07).
- [ ] 21.9 Quality loop per file (codescene lifecycle).

**Duration:** 6 hours
**Dependencies:** T06 (download plumbing), C.4 split-download.
**Outcome file:** `.ai/plans/cert-18/outcome/T21-outcome.md`

---

### T22: QrVerificationCard

**Goal:** 200×200 QR PNG card with download-as-PNG action; must mirror PDF-baked QR exactly.

**Files:**
- `frontend/views/dashboard/cert/certificates/detail/QrVerificationCard.tsx`

**Subtasks:**
- [ ] 22.1 Props: `{ verificationCode, certificateId }`.
- [ ] 22.2 Compute URL: `${process.env.NEXT_PUBLIC_PUBLIC_BASE_URL}/verify/${verificationCode}` (C.13 — NEVER `window.location.origin`).
- [ ] 22.3 Render QR canvas via `qrcode` package (300px source → 200px display); 200×200 fixed dimensions.
- [ ] 22.4 Memoize QR via `useMemo` on `verificationCode` prop (C.13 cross-check).
- [ ] 22.5 "Scan to verify" caption below QR (i18n `cert.detail.qr.caption`).
- [ ] 22.6 "Download QR Code" button: canvas `toDataURL('image/png')` → download; filename `certificate-${certNumber}-qr.png`.
- [ ] 22.7 Add comment `// QR mirror invariant: Plan 06 / Plan 18 must use same base URL` to enforce parity with PDF-baked QR.
- [ ] 22.8 Quality loop per file (codescene lifecycle).

**Duration:** 4 hours
**Dependencies:** T00 (qrcode install), T10 (verify URL plumbing), C.13 base URL convention.
**Outcome file:** `.ai/plans/cert-18/outcome/T22-outcome.md`

---

### T23.1–T23.11: useCertificateDetailStore Zend Extension

**Goal:** Extend `useCertificateDetailStore` with viewer/UI state, revoke dialog state, audit/downloads pagination, audit filter; per C.8 viewBox state in store, expandedAuditIds in ViewModel.

**File:** `frontend/stores/useCertificateDetailStore.ts`

**Subtasks:**
- [ ] 23.1 Add viewer fields: `zoom`, `rotation`, `isFullscreen`; actions `setZoom`, `resetZoom`, `rotateLeft/Right`, `toggleFullscreen`.
- [ ] 23.2 Revoke fields: `revokeDialogOpen`, `revokeReason`, `revokeCustomReason`, `revokeNotifyRecipient`, `isRevoking`; open/close setters + `revokeCertificate` action.
- [ ] 23.3 Audit fields: `auditTrail`, `auditTotalCount`, `auditHasMore`, `auditFilter`; `refreshAuditTrail`, `loadMoreAudit`, `setAuditFilter` actions.
- [ ] 23.4 Downloads fields: `downloadHistory`, `downloadHasMore`; `loadMoreDownloads` action.
- [ ] 23.5 `downloadPdf` + `printCertificate` actions (delegated to T06/T07 plumbing).
- [ ] 23.6 `reset()` action: clears state back to initial (used on unmount).
- [ ] 23.7 Confirm non-persisted (no `persist` HOC) — add `// non-persisted: C.8 mitigation` header comment.
- [ ] 23.8 Apollo cache eviction wiring (evict `CertificateDetail:ROOT_ID` after revoke).
- [ ] 23.9 Storybook mock story: MSW handlers for query/mutations (do NOT custom-build store mock; C.8 note).
- [ ] 23.10 Story for All Events / User / System filter transitions.
- [ ] 23.11 Quality loop (codescene lifecycle).

**Duration:** 8 hours
**Dependencies:** T01 (initial store from T01 baseline), T02 (documents), T06 (download glue).
**Outcome file:** `.ai/plans/cert-18/outcome/T23-outcome.md`

---

### T24: Component Tests (6 Test Files)

**Goal:** Per-component Happy DOM tests covering core interactions and i18n.

**Files:**
- `test/ui/components/cert-detail/CertificateDetailPage.test.tsx` (renders shell, breadcrumb, hides Revoke when REVOKED)
- `test/ui/components/cert-detail/CertificatePreviewViewer.test.tsx` (zoom in/out, rotate, fullscreen toggle, print button clicks)
- `test/ui/components/cert-detail/CertificateDetailsPanel.test.tsx` (tab switch a11y, lazy-render)
- `test/ui/components/cert-detail/RevokeConfirmDialog.test.tsx` (open/close, OTHER-reason conditional, confirm success snackbar)
- `test/ui/components/cert-detail/PdfDownloadButton.test.tsx` (loading state, disabled state, error retry)
- `test/ui/components/cert-detail/QrVerificationCard.test.tsx` (QR canvas generated, download-PNG click)

**Subtasks:**
- [ ] 24.1 Add `test/ui/components/cert-detail/` directory per `test/ui/AGENTS.md`.
- [ ] 24.2 Each test mocks Apollo query/mutation handlers via MSW or `MockedProvider`.
- [ ] 24.3 Use `render-with-Intl` pattern from existing UI tests.
- [ ] 24.4 Each test file includes ≥3 test cases for robust coverage.
- [ ] 24.5 Run all six tests via `bun run scripts/run-test/run-test.ts test/ui/components/cert-detail/<file>.test.tsx` per `tests.instructions.md`.
- [ ] 24.6 Verify with `frontend/AGENTS.md` + `test/ui/AGENTS.md` instructions.
- [ ] 24.7 Quality loop per test file: `bun run scripts/health/sub-loop.ts <file-path> --lifecycle codescene` for each file.

**Duration:** 14 hours
**Dependencies:** All T13–T22 implementation tasks.
**Outcome file:** `.ai/plans/cert-18/outcome/T24-outcome.md`

---

### T25: End-to-End Tests (6 Tests)

**Goal:** Playwright E2E covering the six canonical user journeys — view detail, zoom preview, download PDF, view audit trail, revoke certificate, copy verification URL.

**Files:** `test/ui/e2e/cert-detail-18.spec.ts`

**Subtasks:**
- [ ] 25.1 Build production bundle in advance: `bun run build:test` (REQUIRED per `test/ui/AGENTS.md`).
- [ ] 25.2 Test 1 — View certificate detail page: navigate from list, assert breadcrumb + header + status badge + two-column layout visible.
- [ ] 25.3 Test 2 — Zoom preview: click zoom-in twice, assert zoom-% label change, click reset, click rotate, assert rotation state via data attribute.
- [ ] 25.4 Test 3 — Download PDF: click Download PDF, assert network request to mint-signed-url endpoint, assert download triggered (mock the actual file via Playwright route intercept).
- [ ] 25.5 Test 4 — View audit trail: click Audit tab, assert timeline events rendered, click Load more, assert additional events appear.
- [ ] 25.6 Test 5 — Revoke certificate: click Revoke, choose reason (e.g. `DISHONESTY`), toggle notify switch off, confirm — assert success snackbar + badge updates to REVOKED + Revoke button hidden.
- [ ] 25.7 Test 6 — Copy verification URL: in Overview tab, click Copy icon on verification URL, assert clipboard contains `NEXT_PUBLIC_PUBLIC_BASE_URL/verify/<code>` (use Playwright `browserContext.grantPermissions(['clipboard-read', 'clipboard-write'])`).
- [ ] 25.8 Each test seeds a fresh certificate via Playwright fixture (use `globalSetup` script — mirror Plan 16 fixture pattern).
- [ ] 25.9 Quality loop per test file: `bun run scripts/health/sub-loop.ts test/ui/e2e/cert-detail-18.spec.ts --lifecycle codescene`.

**Duration:** 16 hours
**Dependencies:** T13–T22 implementation tasks done + T24 component tests.
**Outcome file:** `.ai/plans/cert-18/outcome/T25-outcome.md`

---

### T26: Quality Loop Per File (Cross-Task)

**Goal:** Run the per-file verification loop (`scripts/health/sub-loop.ts --lifecycle codescene`) on every new file before integration; ensures no tsgo/biome/lint/codescene regressions.

**Files:** all new files from T13–T25.

**Subtasks:**
- [ ] 26.1 Run `bun run scripts/health/sub-loop.ts <file-path> --lifecycle codescene` for EACH new file created in T13–T25.
- [ ] 26.2 Persist sub-loop stdout to per-file log under `.ai/plans/cert-18/outcome/quality-logs/` directory (NOT in repo root).
- [ ] 26.3 For each failed check, apply the relevant fix following `frontend.instructions.md` and/or `tests.instructions.md` (per the AGENTS.md instruction file mapping).
- [ ] 26.4 Cross-file violation follow-up reported to orchestrator per the "Fix-Or-Report" rule in root AGENTS.md.
- [ ] 26.5 Re-run `bun run scripts/health/sub-loop.ts <file-path> --lifecycle codescene` for any file whose fix required cross-file coordination (the sub-loop serializes lint in-process).
- [ ] 26.6 Final full-repo `bun quality-gate` run to confirm no regressions across tsgo → biome → lint → codescene.

**Duration:** 8 hours
**Dependencies:** All T13–T25 atomic files exist.
**Outcome file:** `.ai/plans/cert-18/outcome/T26-outcome.md`

---

### T27: Knowledge Propagation (Phase 2)

**Goal:** Add patterns created in T13–T25 to the existing T12 knowledge base so future plans reuse them.

**Subtasks:**
- [ ] 27.1 Write detailed pattern: Detail Page two-column shell (`CertificateDetailPage`) — breadcrumb back-link caveat (C.7), header action cluster, responsive breakpoint collapse.
- [ ] 27.2 Write pattern: React-Zoom-Pan-Pinch integration OR custom `useTransform` fallback — peer-dep decision matrix for React 19.
- [ ] 27.3 Write pattern: MUI Timeline for audit events (T18) — server-paginated infinite-scroll + filter segmented control + ViewModel-managed expanded IDs.
- [ ] 27.4 Write pattern: Passthrough container tabbed panel (`CertificateDetailsPanel`) — lazy-mount of sub-views via `Tab` value; benefits for query-perf / TTI.
- [ ] 27.5 Write pattern: Revoke Confirm Dialog — reusable props shape `{ open, certificateId, onClose, onRevoked }`; agnostic across entities (`RevokeReasonSelect`)
- [ ] 27.6 Write pattern: PdfDownloadButton progress/disabled/error-retry — uses C.4 split-download flow + audit-server-side.
- [ ] 27.7 Write pattern: Stacked card grids (`OverviewInfoCard` + `OverviewRecipientCard`) + clipboard copy via `navigator.clipboard` with legacy fallback.
- [ ] 27.8 Write pattern: QR Canvas with PNG export — memoization, pure-canvas rendering for PDF parity (Plan 06 / Plan 18 must use same base URL).
- [ ] 27.9 Write pattern: Zustand store viewBox + revoke dialog state — store holds only dialog + cross-tier UI; expandedIds stays in ViewModel (C.8 reinforced).
- [ ] 27.10 Update `.agents/instructions/tests.instructions.md` (or companion guide) with new cert-detail test patterns.
- [ ] 27.11 Document reusable audit-timeline component (`StatusTimeline`) for Plan 04 / 15.

**Duration:** 2-3 hours
**Dependencies:** All T13–T26 tasks complete.
**Outcome file:** `.ai/plans/cert-18/outcome/T27-outcome.md`

---

## Round 4 Enhancement Tasks

### T28: Zoom/Pan Gesture Support (R4.1)

**Goal:** Extend `CertificatePreviewViewer` with pinch-to-zoom, trackpad pan, mouse wheel zoom, drag-to-pan, zoom-to-fit/100%, and pan-bounds clamping.

**Files:**
- `frontend/views/dashboard/cert/certificates/detail/CertificatePreviewViewer.tsx`
- `frontend/stores/useCertificateDetailStore.ts`

**Subtasks:**
- [ ] 28.1 Add `panX`, `panY`, `isPanning` fields to `useCertificateDetailStore` (non-persisted; C.8 header comment).
- [ ] 28.2 Add store actions: `zoomBy(delta)`, `setPan(x, y)`, `zoomTo(zoom)`, `zoomToFit(canvasW, canvasH, vpW, vpH)`.
- [ ] 28.3 Implement touch pinch: `onTouchMove` with two `touches`; compute scale from `Math.hypot` distance ratio; clamp 0.1–4.0.
- [ ] 28.4 Implement touch swipe pan: single `touch` → update `panX`/`panY` via `store.setPan`.
- [ ] 28.5 Implement trackpad pinch: `onWheel` with `evt.ctrlKey` → zoom delta; `preventDefault` to stop browser zoom.
- [ ] 28.6 Implement trackpad two-finger scroll: `onWheel` without `ctrlKey` → pan delta from `deltaX`/`deltaY`.
- [ ] 28.7 Implement mouse wheel zoom: `onWheel` → `deltaY < 0` zoom in, `deltaY > 0` zoom out; zoom toward cursor position (adjust `panX`/`panY` to keep cursor point fixed).
- [ ] 28.8 Implement mouse drag pan: `onMouseDown` → `isPanning=true` + cursor `grabbing`; `onMouseMove` → update pan; `onMouseUp`/`onMouseLeave` → `isPanning=false` + cursor `grab`.
- [ ] 28.9 Add zoom toolbar: `Slider` (min=0.1, max=4.0, step=0.1) bound to `store.zoom` with `%` label; `ZoomInOutlined`/`ZoomOutOutlined` `IconButton`s (±0.25); zoom-to-fit `IconButton` (`FitScreenOutlined`); zoom-to-100% `IconButton` (`SearchOutlined`).
- [ ] 28.10 Implement pan bounds: clamp `panX` to `±(canvasW * zoom - vpW) / 2`; when `canvasW * zoom <= vpW`, disable pan (zoomed out fully). Use `useRef` for viewport dims (updated via `ResizeObserver`); recomputed on zoom change.
- [ ] 28.11 Apply CSS transform: `translate(${panX}px, ${panY}px) scale(${zoom}) rotate(${rotation}deg)` with `will-change: transform`; `transition: transform 200ms ease-out`.
- [ ] 28.12 `prefers-reduced-motion: reduce` → `transition: none` (via `sx` media query).
- [ ] 28.13 Read frontend/AGENTS.md for MUI v9 sx-prop rules before editing.
- [ ] 28.14 Quality loop per file (`scripts/health/sub-loop.ts --lifecycle codescene`).
- [ ] 28.15 Persist sub-loop stdout to `.ai/plans/cert-18/outcome/quality-logs/T28-*.log`.

**Duration:** 10 hours
**Dependencies:** T13 (CertificatePreviewViewer baseline), T23.1 (store viewer fields).
**Outcome file:** `.ai/plans/cert-18/outcome/T28-outcome.md`

---

### T29: Full-Screen Viewer (R4.2)

**Goal:** `CertificateFullscreenViewer` — MUI `Dialog fullScreen` with zoom/rotate/print/download toolbar, keyboard shortcuts, and touch swipe pan.

**Files:**
- `frontend/views/dashboard/cert/certificates/detail/CertificateFullscreenViewer.tsx`
- `frontend/stores/useCertificateDetailStore.ts`

**Subtasks:**
- [ ] 29.1 Create `CertificateFullscreenViewer` component; MUI `Dialog` with `fullScreen` prop.
- [ ] 29.2 `AppBar` sticky toolbar: left (cert number monospace), center (zoom slider + rotate + zoom-to-fit + zoom-to-100%), right (download `IconButton` = `DownloadFormatMenu` trigger, print `IconButton`, close `IconButton`).
- [ ] 29.3 Content area: absolutely positioned wrapper reusing `CertificatePreviewViewer` transform logic (import viewer as child, or share a `useCertificateTransform` hook).
- [ ] 29.4 Keyboard shortcuts via `useEffect` on `window`: `Escape`→close, `+`/`=`→zoom-in, `-`/`_`→zoom-out, `0`→100%, `f`→fit, `Arrow*`→pan(±20px), `r`→rotate-right-90. Clean up on unmount/close.
- [ ] 29.5 Add `aria-keyshortcuts` attribute to dialog root for screen-reader announcement.
- [ ] 29.6 Touch swipe pan: single finger→pan, two-finger→pinch (shared with T28 gesture handlers).
- [ ] 29.7 Swipe beyond pan bounds: CSS overshoot bounce (`transition` overshoot then snap) — applied via `sx` transition with a spring-like easing.
- [ ] 29.8 Minimum zoom clamp: 0.1 (10%); UI prevents further zoom-out.
- [ ] 29.9 Focus trap: verify MUI `Dialog` `disableEnforceFocus={false}`; initial focus on close button (`autoFocus`).
- [ ] 29.10 Add `store.toggleFullscreen()` action (already in T23.1); wire `open` prop to `store.isFullscreen`.
- [ ] 29.11 Read app/AGENTS.md and frontend/AGENTS.md before editing.
- [ ] 29.12 Quality loop per file (`--lifecycle codescene`).
- [ ] 29.13 Persist logs to `.ai/plans/cert-18/outcome/quality-logs/T29-*.log`.

**Duration:** 8 hours
**Dependencies:** T28 (zoom/pan gestures), T23.1 (store fullscreen field).
**Outcome file:** `.ai/plans/cert-18/outcome/T29-outcome.md`

---

### T30: Download Format Menu (R4.3)

**Goal:** `DownloadFormatMenu` — MUI `Menu` offering PDF/PNG/JPEG/JSON/SVG/ZIP with QR toggle, JPEG quality slider, and download progress.

**Files:**
- `frontend/views/dashboard/cert/certificates/detail/DownloadFormatMenu.tsx`
- `frontend/common/graphql/sharedDocuments/certificate-download.documents.ts` (extend existing)
- `frontend/stores/useCertificateDetailStore.ts`

**Subtasks:**
- [ ] 30.1 Create `DownloadFormatMenu` with `Menu` + `MenuItem` entries: PDF (single), PDF bundle, PNG (300dpi), JPEG, JSON, SVG, ZIP.
- [ ] 30.2 Extend `mintDownloadUrl` mutation document with `format` (enum), `dpi` (Int), `quality` (Float), `withQr` (Boolean) params.
- [ ] 30.3 Add `Include QR code` `Switch` in menu footer; default ON; disabled for JSON format.
- [ ] 30.4 JPEG quality `Slider` (min=50, max=100, step=5, default=85); visible only when JPEG selected; label `Quality: {value}%`.
- [ ] 30.5 JSON format: client-side `Blob` from `fetchCertificateExportJson` query response (no split-download); filename `certificate-{number}.json`.
- [ ] 30.6 Linear `Progress` bar appears below menu during in-flight download; reuses `store.downloadProgress`.
- [ ] 30.7 Menu closes after download triggers; progress bar persists on main toolbar until complete.
- [ ] 30.8 Install `qrcode` types if not already present (T00 cross-reference).
- [ ] 30.9 Add `store.downloadFormat`, `store.downloadQuality`, `store.downloadWithQr` fields + setters (non-persisted).
- [ ] 30.10 Read frontend/common/graphql/sharedDocuments/AGENTS.md before editing GraphQL documents.
- [ ] 30.11 Run `bun codegen` after schema/document changes (REQUIRED per AGENTS.md).
- [ ] 30.12 Quality loop per file (`--lifecycle codescene`).
- [ ] 30.13 Persist logs to `.ai/plans/cert-18/outcome/quality-logs/T30-*.log`.

**Duration:** 8 hours
**Dependencies:** T21 (PdfDownloadButton baseline), T06 (download plumbing), T02 (GraphQL documents).
**Outcome file:** `.ai/plans/cert-18/outcome/T30-outcome.md`

---

### T31: Certificate Timeline Visualization (R4.4)

**Goal:** `CertificateTimeline` — horizontal MUI `Timeline` in Overview tab showing key events with color coding, metadata tooltips, zoom, and event-type filter.

**Files:**
- `frontend/views/dashboard/cert/certificates/detail/CertificateTimeline.tsx`
- `frontend/stores/useCertificateDetailStore.ts`

**Subtasks:**
- [ ] 31.1 Create `CertificateTimeline` component; MUI `Timeline` with `position="horizontal"` (v9 supported).
- [ ] 31.2 Map event types to icon+color: Created→`AddCircleOutlined`/info, Issued→`VerifiedOutlined`/success, Viewed→`VisibilityOutlined`/text.secondary, Downloaded→`DownloadOutlined`/primary, Shared→`ShareOutlined`/secondary, Verified→`CheckCircleOutlined`/success, Revoked→`BlockOutlined`/error.
- [ ] 31.3 Each `TimelineItem`: `TimelineSeparator` (icon in colored `Avatar` sx={{ bgcolor: theme.palette.X.main }}), `TimelineContent` (event label i18n + timestamp `formatDate`), `TimelineConnector` colored by severity gradient.
- [ ] 31.4 `Tooltip` per node: event type, timestamp, actor name/email (or `System`), metadata (IP for downloads, source for verified).
- [ ] 31.5 Dense mode: when `events.length > 8`, collapse to icon-only; expandable via chevron `IconButton` (`ExpandMoreOutlined`/`ExpandLessOutlined`).
- [ ] 31.6 Timeline zoom control: `Slider` (1x–5x) above timeline; adjusts CSS `gap` via `sx={{ gap: `${zoom * 24}px` }}`.
- [ ] 31.7 Event filter: `ToggleButtonGroup` (size=`small`) — All, Issued, Viewed, Downloaded, Verified, Revoked. Bound to `store.timelineFilter`.
- [ ] 31.8 Filtered events derived client-side from `store.auditTrail` (no re-fetch — C.9 cross-reference).
- [ ] 31.9 Add `store.timelineFilter` field + `setTimelineFilter` action (non-persisted).
- [ ] 31.10 Performance: use `useDeferredValue` for `timelineFilter` to keep filter responsive.
- [ ] 31.11 Read frontend/views/AGENTS.md before creating component.
- [ ] 31.12 Quality loop per file (`--lifecycle codescene`).
- [ ] 31.13 Persist logs to `.ai/plans/cert-18/outcome/quality-logs/T31-*.log`.

**Duration:** 8 hours
**Dependencies:** T18 (AuditTimeline vertical), T09 (audit query plumbing), T23.3 (audit store fields).
**Outcome file:** `.ai/plans/cert-18/outcome/T31-outcome.md`

---

### T32: Revision History Panel (R4.5)

**Goal:** New `Revisions` tab (Tab 5) in `CertificateDetailsPanel`; revision list with before/after preview, revert action, comparison side-by-side.

**Files:**
- `frontend/views/dashboard/cert/certificates/detail/RevisionHistoryPanel.tsx`
- `frontend/views/dashboard/cert/certificates/detail/CertificateDetailsPanel.tsx` (add Tab 5)
- `frontend/views/dashboard/cert/certificates/detail/RevisionCompareDialog.tsx`
- `frontend/common/graphql/sharedDocuments/certificate-revision.documents.ts`
- `frontend/stores/useCertificateDetailStore.ts`
- `backend/graphql/pothos/certificate-revision.pothos.ts`
- `backend/types/certificate-revision.types.ts`

**Subtasks:**
- [ ] 32.1 Add `CertificateRevisionType` in `backend/types/certificate-revision.types.ts` (define `CertificateRevisionReturnType`, `CertificateRevisionSelectType`).
- [ ] 32.2 Create `backend/graphql/pothos/certificate-revision.pothos.ts`: `CertificateRevisionType` object, `revisions(certificateId)` query (server-paginated per C.9), `revertCertificateRevision(revisionId)` mutation.
- [ ] 32.3 Run `bun run generate:gqlSchema` + `bun codegen` (REQUIRED after schema changes).
- [ ] 32.4 Create `frontend/common/graphql/sharedDocuments/certificate-revision.documents.ts`: `CertificateRevisionsQueryDocument`, `RevertCertificateRevisionMutationDocument` (include `id` field; NO `useLazyQuery`).
- [ ] 32.5 Add Tab 5 `Revisions` to `CertificateDetailsPanel` `Tabs` (`tab="revisions"`); active tab handled by existing `store.activeTab`.
- [ ] 32.6 Create `RevisionHistoryPanel`: MUI `List` of `ListItem`s — revision number (`v3`), author avatar+name, timestamp, revision reason/note (if provided), before/after preview toggle.
- [ ] 32.7 Sort: descending by revision number (latest first).
- [ ] 32.8 `View` action: expands side-by-side diff using `react-diff-viewer-continued` (install in T00 update — React 19 compatible).
- [ ] 32.9 Diff view: template-level changes → table diff (`Variable | Old Value | New Value`); status changes → chip diff (`Draft → Issued`).
- [ ] 32.10 `Revert` action: `LoadingButton` (color=`warning`) → confirmation `Dialog` → calls `revertCertificateRevision` mutation → Apollo cache evict + refetch `CertificateDetail`.
- [ ] 32.11 `Compare` action: multi-select two revisions → opens `RevisionCompareDialog` for side-by-side diff.
- [ ] 32.12 Create `RevisionCompareDialog`: two-column `Grid` layout with diff viewer; i18n labels `cert.detail.revisions.diff.before`/`diff.after`.
- [ ] 32.13 Add `store.revisions`, `store.revisionsLoading`, `store.revisionsCompareOpen` fields + `loadRevisions`, `revertRevision`, `openCompareDialog`, `closeCompareDialog` actions.
- [ ] 32.14 Read backend/graphql/AGENTS.md, backend/types/AGENTS.md before editing backend files.
- [ ] 32.15 Quality loop per file (`--lifecycle codescene`).
- [ ] 32.16 Persist logs to `.ai/plans/cert-18/outcome/quality-logs/T32-*.log`.

**Duration:** 14 hours
**Dependencies:** T15 (CertificateDetailsPanel baseline), T01 (store baseline), backend revision schema.
**Outcome file:** `.ai/plans/cert-18/outcome/T32-outcome.md`

---

### T33: Share Link Generation (R4.6)

**Goal:** `ShareLinkDialog` — generate unique share URL with expiry, password protection, QR code, analytics, and revoke link.

**Files:**
- `frontend/views/dashboard/cert/certificates/detail/ShareLinkDialog.tsx`
- `frontend/common/graphql/sharedDocuments/certificate-share.documents.ts`
- `frontend/stores/useCertificateDetailStore.ts`
- `backend/graphql/pothos/certificate-share.pothos.ts`
- `backend/types/certificate-share.types.ts`
- `app/[locale]/share/[token]/page.tsx` (public share page — read-only certificate detail)

**Subtasks:**
- [ ] 33.1 Add `ShareLinkType` in `backend/types/certificate-share.types.ts`: `ShareLinkReturnType` with `{ id, url, expiresAt, hasPassword, viewsCount, uniqueVisitors, createdAt }`.
- [ ] 33.2 Create `backend/graphql/pothos/certificate-share.pothos.ts`: `ShareLinkType` object, `generateShareLink(certId, expiresInDays?, password?)` mutation, `revokeShareLink(linkId)` mutation, `shareLinkAnalytics(linkId)` query.
- [ ] 33.3 Run `bun run generate:gqlSchema` + `bun codegen`.
- [ ] 33.4 Create `frontend/common/graphql/sharedDocuments/certificate-share.documents.ts`: `GenerateShareLinkMutationDocument`, `RevokeShareLinkMutationDocument`, `ShareLinkAnalyticsQueryDocument`.
- [ ] 33.5 Create `ShareLinkDialog` MUI `Dialog` (`maxWidth='sm'`, `fullWidth`):
  - [ ] 33.6 Link URL `TextField` readonly (monospace) + `Copy` `IconButton` (`ContentCopyOutlined`) + `Open in new tab` `IconButton` (`OpenInNewOutlined`).
  - [ ] 33.7 Expiry `ToggleButtonGroup`: `1 day`, `7 days`, `30 days`, `Never` (i18n keys). Stores `expiresInDays` (null = never).
  - [ ] 33.8 Password `Switch` + conditional `TextField` (type=`password`, min 8 chars; `inputProps={{ minLength: 8 }}`).
  - [ ] 33.9 QR code (200×200 via `qrcode` package) auto-generated from share URL + `Download QR` button (PNG; same `toDataURL` pattern as QrVerificationCard T22).
  - [ ] 33.10 Analytics section: `viewsCount` + `uniqueVisitors` from `ShareLinkAnalyticsQueryDocument`; updates on dialog open.
  - [ ] 33.11 `Revoke share link` `LoadingButton` (color=`error`) with confirmation `Alert` before revoking.
- [ ] 33.12 URL format: `${NEXT_PUBLIC_PUBLIC_BASE_URL}/share/${shareToken}` (C.13 — NEVER `window.location.origin`).
- [ ] 33.13 Create `app/[locale]/share/[token]/page.tsx`: server component resolving token → certificate; if expired/revoked, render `Alert` severity=`error` (i18n `cert.share.expired`); else render read-only certificate detail (reuse `CertificatePreviewViewer` in non-interactive mode).
- [ ] 33.14 Add `store.shareLink`, `store.isGeneratingShareLink`, `store.shareLinkDialogOpen` + `generateShareLink`, `revokeShareLink`, `openShareLinkDialog`, `closeShareLinkDialog` actions.
- [ ] 33.15 Read app/AGENTS.md, backend/graphql/AGENTS.md before editing.
- [ ] 33.16 Quality loop per file (`--lifecycle codescene`).
- [ ] 33.17 Persist logs to `.ai/plans/cert-18/outcome/quality-logs/T33-*.log`.

**Duration:** 14 hours
**Dependencies:** T22 (QrVerificationCard pattern), T01 (store), T10 (verify URL plumbing), C.13 base URL.
**Outcome file:** `.ai/plans/cert-18/outcome/T33-outcome.md`

---

### T34: QR Code Card Enhancement (R4.7)

**Goal:** Extend `QrVerificationCard` with SVG download, academy branding overlay, size selector, placement guide, and PDF metadata integration note.

**Files:**
- `frontend/views/dashboard/cert/certificates/detail/QrVerificationCard.tsx`
- `frontend/stores/useCertificateDetailStore.ts`

**Subtasks:**
- [ ] 34.1 Add SVG download option: `toDataURL` equivalent for SVG via `qrcode.toString(text, { type: 'svg' })` → `Blob` → download; filename `certificate-{number}-qr.svg`.
- [ ] 34.2 Academy branding overlay `Switch` (`Add academy logo overlay`): when ON, render academy logo (from `tenant.academyLogoUrl`) as semi-transparent watermark behind QR via canvas compositing (`ctx.globalAlpha = 0.15`).
- [ ] 34.3 Size selector: MUI `Select` with `Small (150px)`, `Medium (200px)`, `Large (400px)`; updates canvas size + download dimensions; bound to `store.qrSize`.
- [ ] 34.4 Placement guide: collapsible `Accordion` below QR with visual guide (static images from `public/assets/qr-placement/*.png`); i18n labels `cert.detail.qr.placementGuide`.
- [ ] 34.5 Add `store.qrSize` (150 | 200 | 400, default 200), `store.qrIncludeOverlay` (boolean, default false) + `setQrSize`, `toggleQrOverlay` actions.
- [ ] 34.6 Add `// QR mirror invariant: Plan 06 / Plan 18 must use same base URL` comment (already in T22; reinforce with overlay note).
- [ ] 34.7 PDF metadata note: document in code comment that QR URL must be embedded in PDF `/Metadata` via Plan 06 PDF gen (cross-reference — no client change here).
- [ ] 34.8 Read frontend/views/AGENTS.md before editing.
- [ ] 34.9 Quality loop per file (`--lifecycle codescene`).
- [ ] 34.10 Persist logs to `.ai/plans/cert-18/outcome/quality-logs/T34-*.log`.

**Duration:** 6 hours
**Dependencies:** T22 (QrVerificationCard baseline), T23 (store).
**Outcome file:** `.ai/plans/cert-18/outcome/T34-outcome.md`

---

### T35: Accessibility Audit (R4.8)

**Goal:** Add ARIA roles, keyboard navigation, screen-reader labels, focus trap, and reduced-motion support across all R4 components.

**Files:**
- `frontend/views/dashboard/cert/certificates/detail/CertificateFullscreenViewer.tsx`
- `frontend/views/dashboard/cert/certificates/detail/CertificateDetailsPanel.tsx`
- `frontend/views/dashboard/cert/certificates/detail/CertificateTimeline.tsx`
- `frontend/views/dashboard/cert/certificates/detail/OverviewInfoCard.tsx`
- `frontend/views/dashboard/cert/certificates/detail/OverviewRecipientCard.tsx`
- `shared/locale/en/cert-detail-*.json` (and all locale variants — i18n keys for aria labels)

**Subtasks:**
- [ ] 35.1 `CertificateFullscreenViewer`: `role="dialog"`, `aria-modal="true"`, `aria-label` from i18n `cert.detail.viewer.ariaLabel`; toolbar `role="toolbar"` with `aria-label`.
- [ ] 35.2 Zoom/rotate controls: `aria-label` per control (i18n: `Zoom in`, `Zoom out`, `Rotate left`, `Rotate right`).
- [ ] 35.3 Zoom slider: `aria-label`, `aria-valuemin={10}`, `aria-valuemax={400}`, `aria-valuenow={Math.round(zoom*100)}`.
- [ ] 35.4 `CertificateDetailsPanel` `Tabs`: verify MUI v9 native keyboard support (Tab/Arrow/Enter/Space); no `disableKeyboardNavigation`. Each panel `role="tabpanel"` with `aria-labelledby` matching tab `id`.
- [ ] 35.5 `OverviewInfoCard` + `OverviewRecipientCard`: each readonly `TextField` has `aria-label` from i18n (`cert.detail.overview.certificateNumber.ariaLabel`, etc.).
- [ ] 35.6 Copy buttons: `aria-label={i18n('common.copy.ariaLabel')}`.
- [ ] 35.7 Status badge: `aria-label={i18n('cert.status.' + status.toLowerCase())}`.
- [ ] 35.8 Focus trap: verify MUI `Dialog` defaults (`disableEnforceFocus={false}`) on FullscreenViewer, RevokeDialog, ShareLinkDialog.
- [ ] 35.9 Reduced motion: `sx` callback with `@media (prefers-reduced-motion: reduce)` → `transition: none` for zoom/pan transform, timeline slide-in, dialog transitions.
- [ ] 35.10 `CertificateTimeline` event nodes: `aria-label` summarizing event type + timestamp for screen readers.
- [ ] 35.11 Add all aria label i18n keys to `shared/locale/` (en + all active locales) — compile-time typed per shared/AGENTS.md.
- [ ] 35.12 Read frontend/AGENTS.md + shared/AGENTS.md before editing i18n.
- [ ] 35.13 Quality loop per file (`--lifecycle codescene`).
- [ ] 35.14 Persist logs to `.ai/plans/cert-18/outcome/quality-logs/T35-*.log`.

**Duration:** 10 hours
**Dependencies:** T28–T34 (all R4 components exist), shared/locale infrastructure.
**Outcome file:** `.ai/plans/cert-18/outcome/T35-outcome.md`

---

### T36: Loading & Error States (R4.9)

**Goal:** Skeleton preview, progressive image loading, PDF-gen spinner, download progress, corrupted certificate handler.

**Files:**
- `frontend/views/dashboard/cert/certificates/detail/CertificatePreviewViewer.tsx`
- `frontend/views/dashboard/cert/certificates/detail/DownloadFormatMenu.tsx`

**Subtasks:**
- [ ] 36.1 Skeleton certificate preview: MUI `Skeleton` variant=`rectangular` sized to A4 portrait (800×1131 aspect ratio); visible until PDF iframe `onLoad` fires; cross-fade to actual content.
- [ ] 36.2 Progressive image loading (PNG/JPEG previews): `img` with `loading="lazy"` + `decoding="async"` + low-res LQIP placeholder (16×16 blur-up); backend serves `?w=16&format=jpeg&q=20`.
- [ ] 36.3 PDF generation spinner: when `checkRenderStatus` returns `PENDING`, show `CircularProgress` overlay with i18n `cert.detail.download.generating`; poll every 2s (reuse T06 poll).
- [ ] 36.4 Download progress: determinate `LinearProgress` with `value={store.downloadProgress}`; label `${downloadProgress}%` right-aligned; visible only when `0 < progress < 100`.
- [ ] 36.5 Corrupted certificate handler: if `checkRenderStatus` returns `CORRUPTED` or iframe `onError` fires → `Alert` severity=`error` (i18n `cert.detail.preview.corrupted`) + `Regenerate PDF` `LoadingButton` triggering `regeneratePdf` mutation → recheck render status.
- [ ] 36.6 Disable all download buttons when `status === 'CORRUPTED'`.
- [ ] 36.7 Read frontend/AGENTS.md before editing.
- [ ] 36.8 Quality loop per file (`--lifecycle codescene`).
- [ ] 36.9 Persist logs to `.ai/plans/cert-18/outcome/quality-logs/T36-*.log`.

**Duration:** 8 hours
**Dependencies:** T13 (preview viewer), T28 (zoom/pan), T30 (format menu), T06 (render status poll).
**Outcome file:** `.ai/plans/cert-18/outcome/T36-outcome.md`

---

### T37: Print Preview (R4.11)

**Goal:** `window.print()` integration with print-only CSS, page-break control, header/footer removal, and multi-certificate print support.

**Files:**
- `frontend/views/dashboard/cert/certificates/detail/CertificatePreviewViewer.tsx`
- `frontend/views/dashboard/cert/certificates/detail/PdfDownloadButton.tsx` (multi-cert list print)

**Subtasks:**
- [ ] 37.1 Print button (`PrintOutlined` `IconButton`) in `CertificatePreviewViewer` toolbar; calls `window.print()` after iframe `onLoad` confirmed.
- [ ] 37.2 Inject print-only CSS via `<style>` tag added to `document.head` when print triggered:
  - [ ] 37.3 `@media print` hiding `body *` except `#certificate-print-area` (visibility trick); position absolute for print area; `@page { margin: 0; size: A4; }`.
  - [ ] 37.4 Remove `<style>` tag after `window.afterprint` event.
- [ ] 37.5 Page break control: multi-certificate print (list page) inserts `page-break-after: always` between each certificate wrapper `div`; single cert: no page breaks.
- [ ] 37.6 Header/footer removal: `@page { margin: 0 }`; fallback tooltip (i18n `cert.detail.print.pageSetup`) explaining browser page setup.
- [ ] 37.7 Add i18n key `cert.detail.print.pageSetup` to shared/locale/ (all active locales).
- [ ] 37.8 Read frontend/AGENTS.md + shared/AGENTS.md before editing.
- [ ] 37.9 Quality loop per file (`--lifecycle codescene`).
- [ ] 37.10 Persist logs to `.ai/plans/cert-18/outcome/quality-logs/T37-*.log`.

**Duration:** 6 hours
**Dependencies:** T13 (preview viewer), T21 (download button), shared/locale infrastructure.
**Outcome file:** `.ai/plans/cert-18/outcome/T37-outcome.md`

---

### T38: Audit Trail Enhancement — Download Tracking (R4.12)

**Goal:** Extend `DownloadHistoryTable` with GDPR-aware IP tracking, user-agent logging, consent checkbox, and download audit metadata columns.

**Files:**
- `frontend/views/dashboard/cert/certificates/detail/DownloadHistoryTable.tsx`
- `frontend/stores/useCertificateDetailStore.ts`
- `shared/locale/en/cert-detail-download.json` (and all locale variants)

**Subtasks:**
- [ ] 38.1 Extend `DownloadHistoryTable` columns: `Date | User | Format | IP Address | User Agent | With QR` (adding Format, IP, UA, With QR columns).
- [ ] 38.2 Backend: ensure `mintDownloadUrl` resolver logs `metadata: { format, ip, userAgent, withQr }` in DOWNLOAD audit event (server-side change — verify in `backend/graphql/pothos/certificate-download.pothos.ts`).
- [ ] 38.3 IP address truncation: server-side truncates to `/24` (last octet zeroed for IPv4) to reduce PII exposure.
- [ ] 38.4 GDPR notice: `Snackbar`/`Alert` on first download (i18n `cert.detail.download.gdpr.notice`); dismissible; remember in `localStorage` (`cert-gdpr-dismissed=true`).
- [ ] 38.5 Privacy policy link in notice `<Link href="/privacy">` (i18n `cert.detail.download.gdpr.privacyPolicy`).
- [ ] 38.6 User-agent column: display truncated (hover shows full via `Tooltip`).
- [ ] 38.7 Consent checkbox: `FormControlLabel` (i18n `cert.detail.download.consent.label`); stored in `localStorage` (`cert-download-consent=true`). If not checked, download button disabled with tooltip.
- [ ] 38.8 Add `store.downloadConsent`, `store.downloadGdprNoticeDismissed` + `setDownloadConsent`, `dismissGdprNotice` actions (read from `localStorage` on init).
- [ ] 38.9 Add i18n keys `cert.detail.download.consent.label`, `cert.detail.download.gdpr.notice`, `cert.detail.download.gdpr.privacyPolicy` to all locales.
- [ ] 38.10 Read frontend/AGENTS.md, shared/AGENTS.md, backend/graphql/AGENTS.md before editing.
- [ ] 38.11 Quality loop per file (`--lifecycle codescene`).
- [ ] 38.12 Persist logs to `.ai/plans/cert-18/outcome/quality-logs/T38-*.log`.

**Duration:** 10 hours
**Dependencies:** T19 (DownloadHistoryTable baseline), T06 (download plumbing), shared/locale infrastructure.
**Outcome file:** `.ai/plans/cert-18/outcome/T38-outcome.md`

---

### T39: Backend GraphQL Schema for R4 (R4.13)

**Goal:** Add Pothos types and mutations for revision history, share links, and extended download params.

**Files:**
- `backend/graphql/pothos/certificate-revision.pothos.ts` (new)
- `backend/graphql/pothos/certificate-share.pothos.ts` (new)
- `backend/graphql/pothos/certificate-download.pothos.ts` (extend)
- `backend/graphql/pothos/certificate-export.pothos.ts` (new)
- `backend/types/certificate-revision.types.ts` (new)
- `backend/types/certificate-share.types.ts` (new)
- `backend/types/certificate-export.types.ts` (new)

**Subtasks:**
- [ ] 39.1 Create `backend/types/certificate-revision.types.ts`: `CertificateRevisionReturnType`, `CertificateRevisionSelectType`, `RevisionRevertInput`.
- [ ] 39.2 Create `backend/types/certificate-share.types.ts`: `ShareLinkReturnType`, `GenerateShareLinkInput`.
- [ ] 39.3 Create `backend/types/certificate-export.types.ts`: `CertificateExportJsonReturnType`.
- [ ] 39.4 Create `backend/graphql/pothos/certificate-revision.pothos.ts`: `CertificateRevisionType` object, `revisions(certificateId)` query (server-paginated per C.9), `revertCertificateRevision(revisionId)` mutation.
- [ ] 39.5 Create `backend/graphql/pothos/certificate-share.pothos.ts`: `ShareLinkType` object, `generateShareLink(certId, expiresInDays?, password?)` mutation, `revokeShareLink(linkId)` mutation, `shareLinkAnalytics(linkId)` query.
- [ ] 39.6 Extend `certificate-download.pothos.ts`: add `format`, `dpi`, `quality`, `withQr` params to `mintDownloadUrl` mutation.
- [ ] 39.7 Create `backend/graphql/pothos/certificate-export.pothos.ts`: `fetchCertificateExportJson(certId)` query returning metadata + raw variable values.
- [ ] 39.8 NEVER create local type definitions in Pothos files — import from `@/backend/types` (AGENTS.md critical rule).
- [ ] 39.9 Single canonical GraphQL object type per entity (AGENTS.md).
- [ ] 39.10 Include `id` field on every object type (Apollo cache normalization).
- [ ] 39.11 Run `bun run generate:gqlSchema` + `bun codegen` (REQUIRED after schema changes).
- [ ] 39.12 Read backend/graphql/AGENTS.md, backend/types/AGENTS.md before editing.
- [ ] 39.13 Quality loop per file (`--lifecycle codescene`).
- [ ] 39.14 Persist logs to `.ai/plans/cert-18/outcome/quality-logs/T39-*.log`.

**Duration:** 16 hours
**Dependencies:** T02 (schema baseline), backend/types infrastructure, backend/graphql infrastructure.
**Outcome file:** `.ai/plans/cert-18/outcome/T39-outcome.md`

---

### T40: i18n Keys for R4 (R4.14)

**Goal:** Add all Round 4 translation keys to the compile-time TypeScript i18n system.

**Files:**
- `shared/locale/en/cert-detail-viewer.json` (new)
- `shared/locale/en/cert-detail-download.json` (extend)
- `shared/locale/en/cert-detail-timeline.json` (new)
- `shared/locale/en/cert-detail-revisions.json` (new)
- `shared/locale/en/cert-detail-share.json` (new)
- `shared/locale/en/cert-detail-qr.json` (extend)
- `shared/locale/en/cert-detail-print.json` (new)
- `shared/locale/en/cert-detail-preview.json` (new)
- All active locale variants (`shared/locale/ar/`, `shared/locale/fr/`, etc.)

**Subtasks:**
- [ ] 40.1 Add viewer keys: `ariaLabel`, `toolbar.ariaLabel`, `zoom.ariaLabel`, `zoomToFit`, `zoomTo100`, `zoomIn`, `zoomOut`, `rotateLeft`, `rotateRight`, `close`.
- [ ] 40.2 Add download keys: `format.pdf`, `format.png`, `format.jpeg`, `format.json`, `format.svg`, `format.zip`, `format.multiPdf`, `quality.label`, `includeQr`, `generating`, `started`, `consent.label`, `gdpr.notice`, `gdpr.privacyPolicy`.
- [ ] 40.3 Add timeline keys: `created`, `issued`, `viewed`, `downloaded`, `shared`, `verified`, `revoked`, `filterAll`, `filterIssued`, `filterViewed`, `filterDownloaded`, `filterVerified`, `filterRevoked`.
- [ ] 40.4 Add revisions keys: `title`, `author`, `timestamp`, `reason`, `revert`, `revertConfirm`, `compare`, `diff.before`, `diff.after`.
- [ ] 40.5 Add share keys: `title`, `url`, `expiry`, `expiry.1day`, `expiry.7days`, `expiry.30days`, `expiry.never`, `password`, `passwordHint`, `qr`, `downloadQr`, ` revoke`, `revokeConfirm`, `analytics.views`, `analytics.visitors`, `expired`.
- [ ] 40.6 Add QR keys: `sizeSmall`, `sizeMedium`, `sizeLarge`, `overlay`, `placementGuide`.
- [ ] 40.7 Add print keys: `pageSetup`, `multiCert`.
- [ ] 40.8 Add preview keys: `corrupted`, `regenerate`.
- [ ] 40.9 Replicate all keys across every active locale (`ar`, `fr`, etc.) — NEVER hardcode English strings (AGENTS.md i18n rule).
- [ ] 40.10 Use compile-time TypeScript type schema as the source of truth — add function signatures for pluralization/interpolation if needed (shared/AGENTS.md).
- [ ] 40.11 Read shared/AGENTS.md before editing locale files.
- [ ] 40.12 Quality loop per file (`--lifecycle codescene`).
- [ ] 40.13 Persist logs to `.ai/plans/cert-18/outcome/quality-logs/T40-*.log`.

**Duration:** 8 hours
**Dependencies:** All R4 component tasks (T28–T38) for key exhaustion; shared/locale infrastructure.
**Outcome file:** `.ai/plans/cert-18/outcome/T40-outcome.md`

---

### T41: R4 Component Tests (8 Test Files)

**Goal:** Per-component Happy DOM tests covering R4 interactions and i18n.

**Files:**
- `test/ui/components/cert-detail/CertificateFullscreenViewer.test.tsx` (open/close, keyboard shortcuts, zoom slider)
- `test/ui/components/cert-detail/DownloadFormatMenu.test.tsx` (format selection, QR toggle, JPEG quality slider, JSON export)
- `test/ui/components/cert-detail/CertificateTimeline.test.tsx` (event rendering, filter, dense mode, zoom)
- `test/ui/components/cert-detail/RevisionHistoryPanel.test.tsx` (revision list, before/after toggle, revert confirm)
- `test/ui/components/cert-detail/RevisionCompareDialog.test.tsx` (side-by-side diff open/close)
- `test/ui/components/cert-detail/ShareLinkDialog.test.tsx` (generate link, expiry, password, revoke)
- `test/ui/components/cert-detail/QrVerificationCard.test.tsx` (SVG download, size change, overlay toggle — extends T24)
- `test/ui/components/cert-detail/DownloadHistoryTable.test.tsx` (new columns, GDPR notice, consent checkbox)

**Subtasks:**
- [ ] 41.1 Each test mocks Apollo query/mutation via MSW or `MockedProvider`.
- [ ] 41.2 Use `render-with-Intl` pattern from existing UI tests.
- [ ] 41.3 Each test file includes ≥3 test cases for robust coverage.
- [ ] 41.4 Test keyboard shortcuts for FullscreenViewer (simulate `keydown` events).
- [ ] 41.5 Test consent checkbox state persistence via `localStorage` mock.
- [ ] 41.6 Run all tests via `bun run scripts/run-test/run-test.ts test/ui/components/cert-detail/<file>.test.tsx` per `tests.instructions.md`.
- [ ] 41.7 Verify with `frontend/AGENTS.md` + `test/ui/AGENTS.md` + `tests.instructions.md` instructions.
- [ ] 41.8 Quality loop per test file: `bun run scripts/health/sub-loop.ts <file-path> --lifecycle codescene` for each file.
- [ ] 41.9 Persist results to `.ai/plans/cert-18/outcome/quality-logs/T41-*.log`.

**Duration:** 16 hours
**Dependencies:** T28–T40 implementation tasks, T24 (existing cert-detail test pattern).
**Outcome file:** `.ai/plans/cert-18/outcome/T41-outcome.md`

---

### T42: R4 End-to-End Tests (4 Tests)

**Goal:** Playwright E2E covering R4 journeys — full-screen viewer, multi-format download, share link generation, revision revert.

**Files:** `test/ui/e2e/cert-detail-18-r4.spec.ts`

**Subtasks:**
- [ ] 42.1 Build production bundle: `bun run build:test` (REQUIRED per `test/ui/AGENTS.md`).
- [ ] 42.2 Test 1 — Full-screen viewer: click fullscreen button, assert `Dialog` fullScreen open, press `+` and assert zoom-% label change, press `Escape` to close.
- [ ] 42.3 Test 2 — Multi-format download: click download menu, select PNG format, toggle QR OFF, assert network request with `format=PNG&withQr=false` params (mock via Playwright route intercept).
- [ ] 42.4 Test 3 — Share link: click Share, select 7-day expiry, enable password, generate, assert URL textfield contains `/share/`, copy to clipboard (grant permissions), revoke button visible.
- [ ] 42.5 Test 4 — Revision revert: switch to Revisions tab, select a previous revision, click Revert, confirm in dialog, assert success snackbar + certificate detail refetches.
- [ ] 42.6 Each test seeds a fresh certificate via Playwright fixture (mirror Plan 16 fixture pattern).
- [ ] 42.7 Quality loop per test file: `bun run scripts/health/sub-loop.ts test/ui/e2e/cert-detail-18-r4.spec.ts --lifecycle codescene`.
- [ ] 42.8 Persist results to `.ai/plans/cert-18/outcome/quality-logs/T42-*.log`.

**Duration:** 12 hours
**Dependencies:** T28–T40 done + T41 component tests; production build.
**Outcome file:** `.ai/plans/cert-18/outcome/T42-outcome.md`

---

### T43: R4 Quality Loop Per File (Cross-Task)

**Goal:** Run `scripts/health/sub-loop.ts --lifecycle codescene` on every R4 new file before integration.

**Files:** all new files from T28–T42.

**Subtasks:**
- [ ] 43.1 Run `bun run scripts/health/sub-loop.ts <file-path> --lifecycle codescene` for EACH new file in T28–T42.
- [ ] 43.2 Persist sub-loop stdout to per-file log under `.ai/plans/cert-18/outcome/quality-logs/R4-T43-*.log` (NOT in repo root).
- [ ] 43.3 For each failed check, apply fix per `frontend.instructions.md` and/or `tests.instructions.md` and/or `backend.instructions.md` (per AGENTS.md instruction file mapping).
- [ ] 43.4 Cross-file violation follow-up reported to orchestrator per the "Fix-Or-Report" rule in root AGENTS.md.
- [ ] 43.5 Re-run `bun run scripts/health/sub-loop.ts <file-path> --lifecycle codescene` for any file whose fix required cross-file coordination (the sub-loop serializes lint in-process).
- [ ] 43.6 Final full-repo `bun quality-gate` run to confirm no regressions across tsgo → biome → lint → codescene.

**Duration:** 8 hours
**Dependencies:** All T28–T42 atomic files exist.
**Outcome file:** `.ai/plans/cert-18/outcome/T43-outcome.md`

---

### T44: R4 Knowledge Propagation

**Goal:** Document R4 patterns for reuse in future plans.

**Subtasks:**
- [ ] 44.1 Write pattern: Full-screen viewer keyboard shortcuts — `useEffect` window listener pattern with cleanup; `aria-keyshortcuts` convention.
- [ ] 44.2 Write pattern: Zoom/pan gesture matrix — touch/trackpad/mouse unified handler; `ResizeObserver` for pan-bounds clamping; `will-change: transform` performance.
- [ ] 44.3 Write pattern: Multi-format download menu — `Menu` + `Switch` + `Slider` composition; client-side JSON `Blob` export vs split-download for binary formats.
- [ ] 44.4 Write pattern: Horizontal timeline with MUI `Timeline` — dense-mode collapse, event-type filter via `ToggleButtonGroup`, `useDeferredValue` for filter responsiveness.
- [ ] 44.5 Write pattern: Revision history with `react-diff-viewer-continued` — side-by-side diff, revert flow with Apollo cache eviction.
- [ ] 44.6 Write pattern: Share link lifecycle — token generation, expiry/password options, public share page as Server Component, analytics query.
- [ ] 44.7 Write pattern: Print preview via `window.print()` + injected `@media print` CSS — page-break control, header/footer removal.
- [ ] 44.8 Write pattern: GDPR-aware download tracking — IP truncation, consent `localStorage`, dismissible notice, i18n compliance.
- [ ] 44.9 Write pattern: Accessibility ARIA roles for MUI Dialog/Tabs/Toolbar — focus trap verification, reduced-motion `sx` media query.
- [ ] 44.10 Write pattern: Skeleton + progressive image loading — `Skeleton` variant, LQIP blur-up, cross-fade to content.
- [ ] 44.11 Write pattern: Performance budget measurement — `performance.mark/measure` + `logger.debug` (NEVER `console.log`); 60fps `requestAnimationFrame` throttle.
- [ ] 44.12 Update `tests.instructions.md` companion guide with R4 test patterns (keyboard simulation, `localStorage` mock, MSW for share-link mutations).
- [ ] 44.13 Document reusable `CertificateFullscreenViewer` for Plan 04 / 15 (generic viewer pattern — not cert-specific).

**Duration:** 3 hours
**Dependencies:** All T28–T43 tasks complete.
**Outcome file:** `.ai/plans/cert-18/outcome/T44-outcome.md`
