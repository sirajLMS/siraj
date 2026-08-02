# Requirements: Certificate Generation & Verification UI (Plan 08)

## Document Information

- **Feature Name**: Certificate Generation & Verification Frontend UI
- **Target Directory**: `.ai/draft_plans/cert/plans/08-cert-generation-verification-ui`
- **Version**: 1.0
- **Date**: 2025-08-01
- **Author**: Siraj Development Team
- **Stakeholders**: Frontend team, Backend team, Certificate feature team
- **Related Documents**:
  - Dependencies: Plan 02 (Types & Permissions) — `AppPermission.CERTIFICATES_*` entries and `PAGE_PERMISSIONS` additions
  - Dependencies: Plan 04 (Services & Business Logic) — `CertificateManagementService`, `CertificateGenerationService`
  - Dependencies: Plan 05 (GraphQL API) — Pothos query/mutation resolvers for certificates
  - Dependencies: Plan 06 (PDF Rendering Engine) — `CertificateRendererService` produces PDF + thumbnail
  - Dependencies: Plan 07 (Template Management UI) — template list/editor, shared component patterns
  - Dependencies: Plan 09 (i18n & Navigation) — `shared/locale/` namespace `dashboard.certificates` + nav config entries
  - Analysis: `.ai/draft_plans/cert/siraj_analysis/05-frontend-patterns.md`
  - Analysis: `.ai/draft_plans/cert/siraj_analysis/08-app-router-navigation.md`
  - Analysis: `.ai/draft_plans/cert/siraj_analysis/06-i18n-system.md`
  - Analysis: `.ai/draft_plans/cert/cgvs_analysis/04-template-ui.md`
  - Analysis: `.ai/draft_plans/cert/cgvs_analysis/06-student-recipient.md`

---

## 1. Introduction

### 1.1 Purpose

This requirements document defines the frontend UI for certificate generation, management, and public verification in the Siraj platform. It covers the certificate list page, generation dialog, detail view, revocation flow, PDF download, and a public verification page accessible without authentication.

### 1.2 Scope

**In scope:**
- Certificate list page (`/dashboard/certificates`) with paginated table, search, and filters
- Generate certificate dialog (template selection, recipient group selection, variable preview, confirm)
- Certificate detail view (`/dashboard/certificates/[id]`) with PDF preview, download, QR code
- Certificate revocation dialog with reason input and confirmation
- Public verification page (`/verify/[code]`) — no auth, shows certificate validity
- Mobile (card-based) and desktop (table-based) responsive presentation
- i18n via `shared/locale/` namespace `dashboard.certificates` (client) and `getTranslations(locale)` (server)
- Sidebar navigation entry and `PAGE_PERMISSIONS` registration
- Outcome Knowledge Base & Progress Tracking (Feature 6)

**Out of scope:**
- Template management UI (Plan 07)
- GraphQL API layer (Plan 05)
- PDF rendering engine internals (Plan 06)
- i18n namespace file creation (Plan 09 creates the namespace; this plan consumes it)
- QR code generation library selection (design-level concern — see Design §4.6)

### 1.3 Definitions

| Term | Definition |
|------|-----------|
| **Three-location split** | Siraj frontend pattern: App Router Server Component → `frontend/common/views/` tier-neutral container → `frontend/{mobile,desktop}/views/` tier-specific presentation |
| **Container** | Tier-neutral React component that calls a ViewModel hook and wraps the result in `<RequirePermission><ResponsiveViewSwitch>` |
| **ViewModel** | Custom hook encapsulating all business logic: Apollo `useQuery`, Zustand store, `useRouter`, `hasPermission`; returns a flat plain object with `labels`/`labelsBySection` groupings |
| **Tier view** | Pure presentation component (mobile or desktop) receiving the view model via props; no hooks except ephemeral UI state |
| **Public verification** | Unauthenticated route at `/verify/[code]` that displays certificate validity without requiring login |
| **Certificate status** | `DRAFT`, `ISSUED`, `EXPIRED`, `REVOKED`, `ARCHIVED` — enum from Plan 01/02 |
| **Verification code** | Unique public code (UUID or short hash) stored on the certificate record, used for public lookup |

### 1.4 User Personas

1. **Academy admin / Super admin** — full certificate management: list, generate, view all, download, revoke
2. **Teacher** — generate certificates for their students, list, view own teaching certificates
3. **Student** — view their own earned certificates
4. **Parent** — view certificates of their children
5. **Public visitor** — verify a certificate's authenticity via `/verify/[code]` without logging in

---

## 2. Overall Description

### 2.1 System Context

This plan is the frontend consumer of Plans 05 (GraphQL API) and 06 (PDF Rendering Engine). It adds three frontend locations and one public route:

```
app/(dashboard)/
├── dashboard/certificates/page.tsx          ← list (auth + permission guard)
├── dashboard/certificates/[id]/page.tsx     ← detail (auth + permission guard)

app/
└── [locale]/verify/[code]/page.tsx          ← public verification (NO auth)

frontend/
├── common/views/dashboard/certificates/    ← tier-neutral containers + view models
│   ├── CertificateListContainer.tsx
│   ├── CertificateDetailContainer.tsx
│   ├── GenerateCertificateDialog.tsx
│   ├── RevokeCertificateDialog.tsx
│   ├── useCertificateListViewModel.ts
│   ├── useCertificateDetailViewModel.ts
│   ├── types.ts
│   └── schemas.ts
├── common/views/public/verify/              ← shared public verification view
│   └── CertificateVerifyPage.tsx
├── desktop/views/dashboard/certificates/    ← desktop presentation
│   ├── CertificateListDesktop.tsx
│   └── CertificateDetailDesktop.tsx
├── mobile/views/dashboard/certificates/     ← mobile presentation
│   ├── CertificateListMobile.tsx
│   └── CertificateDetailMobile.tsx
├── common/graphql/sharedDocuments/cert/
│   └── certificates.documents.ts            ← GraphQL documents
└── common/stores/
    └── certificatesStore.ts                  ← Zustand store for UI state
```

### 2.2 Dependencies

| Dependency | Plan | What It Provides |
|------------|------|------------------|
| `AppPermission.CERTIFICATES_*` | 02 | 11 permission enum entries (`CERTIFICATES_LIST`, `CERTIFICATES_GENERATE`, `CERTIFICATES_REVOKE`, `CERTIFICATES_VIEW_OWN`, `CERTIFICATES_VIEW_OTHER`, `CERTIFICATES_DOWNLOAD`, etc.) |
| `CertificateReturnType`, `CertificateSubmitInput`, `CertificateFilterArgs` | 02 | Types from `@/backend/types/certificates/` |
| `CertificateManagementService`, `CertificateGenerationService` | 04 | Service-layer methods for list, detail, generate, revoke, public verify |
| Pothos query/mutation resolvers | 05 | `certificates`, `certificate`, `generateCertificate`, `revokeCertificate`, `verifyCertificate`, `certificateRecipientGroups` |
| PDF rendering + storage `fileUrl` | 06 | `CertificateRendererService.renderPdf()` produces PDF; `fileUrl` field on certificate returns storage-backed signed URL |
| Template management UI | 07 | Shared dialog patterns, template selection components (published templates only) |
| `shared/locale/` namespace `dashboard.certificates` | 09 | Translation type interface + en/ar implementations + namespace registration |

### 2.3 Assumptions

1. Plan 05 exposes the following GraphQL operations: `CertificatesQueryDocument` (list with filters + pagination), `CertificateQueryDocument` (single by ID), `GenerateCertificateMutationDocument`, `RevokeCertificateMutationDocument`, `VerifyCertificateQueryDocument` (public, no auth), `CertificateRecipientGroupsQueryDocument`.
2. Plan 06 stores generated PDFs in the storage system and exposes `fileUrl` (signed URL) and `thumbnailUrl` fields on the `Certificate` GraphQL object type.
3. Plan 09 creates the `dashboard.certificates` namespace with all keys referenced in this plan (list, generate, detail, revoke, verify, errors, status labels).
4. The `CertificateRecipientGroup` GraphQL type provides `id`, `name`, `recipientCount`, and `studentIds` fields for the generation dialog.
5. The `Certificate` GraphQL object type includes `id`, `verificationCode`, `status`, `studentName` (resolved), `templateName` (resolved), `issueDate`, `fileUrl`, `thumbnailUrl`, `revokedAt`, `revocationReason`, `createdAt`.

---

## 3. Functional Requirements (EARS Format)

### REQ-01: Certificate List Page

**User Story:** As an academy admin or teacher, I want to view a paginated list of certificates with search and filters, so that I can find and manage certificates efficiently.

1. **WHEN** a user navigates to `/dashboard/certificates` **THE SYSTEM SHALL** render a Server Component page at `app/(dashboard)/dashboard/certificates/page.tsx` that calls `getServerUserContext()`, redirects to login if no `userId`, and calls `requirePermissionForPage(userId, [AppPermission.CertificatesList, AppPermission.CertificatesViewOwn, AppPermission.CertificatesViewOther], locale, context)`.
2. **WHEN** the list page renders **THE SYSTEM SHALL** render `<CertificateListContainer />` wrapped in `<Suspense>` with a `<CircularProgress>` fallback.
3. **WHEN** the `CertificateListContainer` mounts **THE SYSTEM SHALL** call `useCertificateListViewModel()` which uses `useQuery(CertificatesQueryDocument, { fetchPolicy: "cache-and-network" })` with variables derived from the Zustand `certificatesStore` (page, pageSize, search, statusFilter, templateFilter, dateFrom, dateTo).
4. **WHEN** the certificate list query returns data **THE SYSTEM SHALL** display columns: recipient name, template name, status badge, issued date, verification code (truncated), and actions (view, download, revoke).
5. **WHEN** the user types in the search input **THE SYSTEM SHALL** debounce the input by 300ms, update `certificatesStore.search`, and reset `page` to 0.
6. **WHEN** the user selects a status filter **THE SYSTEM SHALL** update `certificatesStore.statusFilter`, reset `page` to 0, and trigger a refetch.
7. **WHEN** the user selects a template filter **THE SYSTEM SHALL** update `certificatesStore.templateFilter`, reset `page` to 0, and trigger a refetch.
8. **WHEN** the user selects a date range (from/to) **THE SYSTEM SHALL** update `certificatesStore.dateFrom` / `dateTo`, reset `page` to 0, and trigger a refetch.
9. **WHEN** the user clicks a pagination control **THE SYSTEM SHALL** update `certificatesStore.page` and trigger a refetch with the new offset.
10. **WHEN** the user clicks the "View" action on a certificate row **THE SYSTEM SHALL** navigate to `/dashboard/certificates/[id]` via `useRouter().push()`.
11. **WHEN** the user clicks the "Download" action **THE SYSTEM SHALL** open the certificate's `fileUrl` in a new tab or trigger a download via an anchor link.
12. **WHEN** the user clicks "Generate Certificate" button **THE SYSTEM SHALL** open the `<GenerateCertificateDialog>` component.
13. **WHEN** the query is loading **THE SYSTEM SHALL** show a `<CircularProgress>` indicator or skeleton rows.
14. **WHEN** the query returns an error **THE SYSTEM SHALL** log via `logger.error("Error loading certificates:", { error })` and display an error alert with a retry button.

**Quality attributes:**
- Server-side pagination (not client-side) — the `CertificatesQueryDocument` sends `paginationArgs` to the server
- The `AppDataGrid` component uses `paginationOptions: { mode: "server" }` for desktop
- All labels via `useAppTranslation(Translation.Dashboard.Certificates)` using the `list` sub-key

**_Requirements_:** REQ-01.3, REQ-01.4, REQ-01.5, REQ-01.6, REQ-01.7, REQ-01.8

---

### REQ-02: Certificate List — Mobile vs Desktop

**User Story:** As a mobile user, I want to see certificates as cards rather than a table, so that the information is readable on a small screen.

1. **WHEN** the viewport is mobile width **THE SYSTEM SHALL** render `CertificateListMobile.tsx` which displays certificates as cards (one per certificate) with recipient name, template, status badge, issue date, and action buttons.
2. **WHEN** the viewport is desktop width **THE SYSTEM SHALL** render `CertificateListDesktop.tsx` which uses `DesktopAppDataGrid` with server-side pagination, sortable columns, and a filter bar above the grid.
3. **WHEN** the `ResponsiveViewSwitch` component detects viewport size **THE SYSTEM SHALL** lazily load the appropriate tier view via `createLazyView` with static dynamic import paths (`@/frontend/mobile/views/dashboard/certificates/certificateListView.mobile` and `@/frontend/desktop/views/dashboard/certificates/certificateListView.desktop`).
4. **WHEN** the mobile card list reaches the bottom **THE SYSTEM SHALL** support infinite scroll or a "Load More" button that increments `page` and appends results to the existing list.

**_Requirements_:** REQ-01.3, REQ-02.1, REQ-02.2

---

### REQ-03: Generate Certificate Dialog

**User Story:** As an academy admin or teacher, I want to select a certificate template and a recipient group, preview the variables, and confirm generation, so that I can generate certificates for a batch of students.

1. **WHEN** the user clicks "Generate Certificate" **THE SYSTEM SHALL** open a dialog (`<GenerateCertificateDialog>`) containing a multi-step form: (1) select template, (2) select recipient group, (3) preview variables, (4) confirm.
2. **WHEN** the dialog renders step 1 **THE SYSTEM SHALL** query published templates via `useQuery(CertificateTemplatesQueryDocument)` filtered to `status: PUBLISHED` only and display them as a selectable list or dropdown.
3. **WHEN** the user selects a template **THE SYSTEM SHALL** display template preview info (name, orientation, dimensions) and fetch the template's variables via the template's `variables` field.
4. **WHEN** the dialog renders step 2 **THE SYSTEM SHALL** query `CertificateRecipientGroupsQueryDocument` and display recipient groups with their `name`, `recipientCount`, and associated student names.
5. **WHEN** the user selects a recipient group **THE SYSTEM SHALL** display the number of recipients that will receive certificates.
6. **WHEN** the dialog renders step 3 **THE SYSTEM SHALL** display a preview of resolved variables for the first recipient in the group (or a sample) showing variable name → resolved value.
7. **WHEN** the user clicks "Generate" on step 4 **THE SYSTEM SHALL** call `useMutation(GenerateCertificateMutationDocument)` with `{ templateId, recipientGroupId }`, show a loading state on the button, and display a success toast on completion.
8. **WHEN** the mutation succeeds **THE SYSTEM SHALL** close the dialog, show a success message via toast (`labels.generate.success(count)`), and trigger a refetch of the certificate list query.
9. **WHEN** the mutation fails **THE SYSTEM SHALL** display the error message from the GraphQL response in an alert within the dialog (not a toast) using `labels.errors` translations.
10. **WHEN** the user does not have `AppPermission.CertificatesGenerate` **THE SYSTEM SHALL** not show the "Generate Certificate" button — the ViewModel exposes `canGenerate` boolean based on `useUserStore(state => state.permissions).includes(AppPermission.CertificatesGenerate)`.

**Quality attributes:**
- Dialog uses MUI `<Dialog>` with `maxWidth="md"` and `fullWidth`
- Form state managed via local `useState` (not Zustand) — ephemeral dialog state
- Multi-step progress shown via MUI `<Stepper>` component
- All form labels from `useAppTranslation(Translation.Dashboard.Certificates).generate`

**_Requirements_:** REQ-03.1, REQ-03.2, REQ-03.3, REQ-03.4, REQ-03.7

---

### REQ-04: Certificate Detail View

**User Story:** As an admin or certificate owner, I want to view a certificate's full details including a rendered PDF preview and verification QR code, so that I can verify or download the certificate.

1. **WHEN** a user navigates to `/dashboard/certificates/[id]` **THE SYSTEM SHALL** render a Server Component at `app/(dashboard)/dashboard/certificates/[id]/page.tsx` that calls `getServerUserContext()`, redirects to login if no `userId`, and calls `requirePermissionForPage(userId, [AppPermission.CertificatesViewOwn, AppPermission.CertificatesViewOther], locale, context)`.
2. **WHEN** the detail page renders **THE SYSTEM SHALL** render `<CertificateDetailContainer certificateId={params.id} />` wrapped in `<Suspense>`.
3. **WHEN** the `CertificateDetailContainer` mounts **THE SYSTEM SHALL** call `useCertificateDetailViewModel({ certificateId })` which uses `useQuery(CertificateQueryDocument, { variables: { id: certificateId }, fetchPolicy: "cache-and-network" })`.
4. **WHEN** the certificate detail query returns data **THE SYSTEM SHALL** display: recipient name, template name, status badge, issue date, verification code (full, copyable), expiry date (if applicable), revocation info (if revoked), created at, version.
5. **WHEN** the certificate has a `fileUrl` **THE SYSTEM SHALL** display a PDF preview using an `<iframe>` or `<embed>` element with the signed URL (desktop) or a "Download PDF" link (mobile).
6. **WHEN** the certificate has a `thumbnailUrl` **THE SYSTEM SHALL** display the thumbnail image as a preview on mobile devices (instead of loading the full PDF iframe).
7. **WHEN** the detail view renders **THE SYSTEM SHALL** display a QR code that encodes the public verification URL (`/verify/[code]`) using a QR code library (design decision — see Design §4.6).
8. **WHEN** the user clicks "Download PDF" **THE SYSTEM SHALL** open the certificate's `fileUrl` in a new tab or trigger a file download via an `<a>` element with `download` attribute.
9. **WHEN** the certificate is revoked **THE SYSTEM SHALL** display the revocation reason and revoked-at date prominently with a red warning alert.
10. **WHEN** the user has `AppPermission.CertificatesRevoke` and the certificate is not already revoked **THE SYSTEM SHALL** show a "Revoke Certificate" button that opens the `<RevokeCertificateDialog>`.
11. **WHEN** the user clicks "Back to List" **THE SYSTEM SHALL** navigate to `/dashboard/certificates` via `useRouter().push()`.
12. **WHEN** the query returns an error or certificate not found **THE SYSTEM SHALL** display a not-found error message and a link back to the list.

**_Requirements_:** REQ-04.1, REQ-04.3, REQ-04.4, REQ-04.5, REQ-04.7, REQ-04.8

---

### REQ-05: Certificate Detail — Mobile vs Desktop

**User Story:** As a mobile user, I want a readable certificate detail page on my phone, so that I can view the certificate information and download the PDF.

1. **WHEN** the viewport is mobile width **THE SYSTEM SHALL** render `CertificateDetailMobile.tsx` which stacks information vertically: status badge, recipient info, template info, QR code, and download button. PDF preview is shown as a thumbnail image (not iframe).
2. **WHEN** the viewport is desktop width **THE SYSTEM SHALL** render `CertificateDetailDesktop.tsx` which shows a split layout: left panel with certificate metadata and QR code, right panel with PDF iframe preview.
3. **WHEN** the `ResponsiveViewSwitch` component detects viewport size **THE SYSTEM SHALL** lazily load the appropriate tier view via `createLazyView`.

**_Requirements_:** REQ-04.1, REQ-05.1, REQ-05.2

---

### REQ-06: Certificate Revocation

**User Story:** As an admin, I want to revoke a certificate with a reason, so that the certificate is invalidated and public verification shows it as revoked.

1. **WHEN** the user clicks "Revoke Certificate" on the detail view **THE SYSTEM SHALL** open `<RevokeCertificateDialog>` with a confirmation form.
2. **WHEN** the revocation dialog renders **THE SYSTEM SHALL** display a warning message, the certificate recipient name, and a text input for the revocation reason (required, minimum 10 characters).
3. **WHEN** the user clicks "Confirm Revoke" **THE SYSTEM SHALL** call `useMutation(RevokeCertificateMutationDocument)` with `{ id: certificateId, reason }`, show a loading state on the button, and display a success toast on completion.
4. **WHEN** the revocation mutation succeeds **THE SYSTEM SHALL** close the dialog, show success toast (`labels.revoke.success(recipientName)`), and refetch the certificate detail query to reflect the revoked status.
5. **WHEN** the revocation mutation fails **THE SYSTEM SHALL** display the error message in an alert within the dialog.
6. **WHEN** the certificate is already revoked **THE SYSTEM SHALL** not show the "Revoke Certificate" button — the ViewModel computes `canRevoke` as `hasPermission(CertificatesRevoke) && certificate.status !== "REVOKED"`.

**_Requirements_:** REQ-06.1, REQ-06.2, REQ-06.3, REQ-06.4

---

### REQ-07: Public Verification Page

**User Story:** As a public visitor, I want to verify a certificate by visiting a URL with its verification code, so that I can confirm the certificate's authenticity without logging in.

1. **WHEN** a visitor navigates to `/verify/[code]` **THE SYSTEM SHALL** render a Server Component at `app/[locale]/verify/[code]/page.tsx` (note: this route is OUTSIDE the `(dashboard)` group — it has its own layout without the dashboard sidebar/nav).
2. **WHEN** the public verification page renders **THE SYSTEM SHALL** NOT require authentication — no `getServerUserContext()` call, no `requirePermissionForPage()` call.
3. **WHEN** the Server Component executes **THE SYSTEM SHALL** call `CertificateManagementService.getByVerificationCode(code)` directly (Server Component calls services directly — no GraphQL) and pass the result as props to `<CertificateVerifyPage certificate={result} labels={translatedLabels} />`.
4. **WHEN** the certificate is found and valid (status: `ISSUED`) **THE SYSTEM SHALL** display: certificate title (template name), recipient name, issue date, status badge (VALID — green), issuing academy name, and a QR code encoding the verification URL.
5. **WHEN** the certificate is found but expired (status: `EXPIRED`) **THE SYSTEM SHALL** display the same information with an EXPIRED status badge (amber) and a message explaining the certificate has expired.
6. **WHEN** the certificate is found but revoked (status: `REVOKED`) **THE SYSTEM SHALL** display the same information with a REVOKED status badge (red) and the revocation reason (if available).
7. **WHEN** the certificate is not found (no record with that verification code) **THE SYSTEM SHALL** display a "Certificate Not Found" page with a message and no certificate details.
8. **WHEN** the verification page renders **THE SYSTEM SHALL** use `getTranslations(locale)` from `@/shared/locale` (synchronous) for all labels and pass translated strings as props to the shared client component.
9. **WHEN** the verification page renders **THE SYSTEM SHALL** show a "Verify Another Certificate" input field that allows the visitor to enter a different verification code and navigate to `/verify/[newCode]`.
10. **WHEN** the `generateMetadata` function runs for the verification page **THE SYSTEM SHALL** return `{ title: labels.verify.pageTitle }` using `getTranslations(locale).dashboardTranslations.certificates.verify.pageTitle`.

**Quality attributes:**
- PUBLIC route — no sidebar, no dashboard layout, no authentication context
- Server Component calls service directly (not GraphQL) — Server Component pattern from Siraj architecture
- Translations via `getTranslations(locale)` from `@/shared/locale` (synchronous — NOT `await`)
- The `app/[locale]/verify/[code]/page.tsx` path requires a `[locale]` segment because it is NOT inside the `(dashboard)` route group which uses cookie-based locale via `getLocale()` from `@/shared/locale/server-cookies` — this public route serves a broad audience (shared links) and needs the locale in the URL for correct SSR

**_Requirements_:** REQ-07.1, REQ-07.2, REQ-07.3, REQ-07.4, REQ-07.7, REQ-07.8

---

### REQ-08: Download Certificate

**User Story:** As a certificate owner or admin, I want to download the PDF of a certificate, so that I can save or print it.

1. **WHEN** the user clicks "Download PDF" on the certificate detail view **THE SYSTEM SHALL** open the `fileUrl` (storage-backed signed URL) in a new tab or trigger a download.
2. **WHEN** the user clicks the download action on the list page **THE SYSTEM SHALL** use the same mechanism — open the `fileUrl` in a new tab.
3. **WHEN** the certificate has no `fileUrl` (PDF not yet rendered) **THE SYSTEM SHALL** disable the download button and show a tooltip "PDF not available yet".
4. **WHEN** the user does not have `AppPermission.CertificatesDownload` **THE SYSTEM SHALL** not show download buttons — the ViewModel exposes `canDownload` boolean.

**_Requirements_:** REQ-08.1, REQ-08.2, REQ-08.3

---

### REQ-09: Navigation & Permissions

**User Story:** As a user, I want to see "Certificates" in the sidebar navigation (if I have permission), so that I can access the certificate management pages.

1. **WHEN** the `navigationConfig.ts` file is updated **THE SYSTEM SHALL** add a new `SIDEBAR_NAV_GROUPS` entry `{ id: "grp_certificates", labelKey: "navGroupCertificates", iconKey: "verified", section: "main", permission: [AppPermission.CertificatesList, AppPermission.CertificatesViewOwn, AppPermission.CertificatesViewOther] }`.
2. **WHEN** the `SIDEBAR_NAV_ITEMS` array is updated **THE SYSTEM SHALL** add an item `{ key: "certificates", labelKey: "certificates", iconKey: "verified", href: "/dashboard/certificates", section: "main", groupId: "grp_certificates", permission: PAGE_PERMISSIONS.certificatesList }`.
3. **WHEN** the `PAGE_PERMISSIONS` object is updated **THE SYSTEM SHALL** add three entries: `certificatesList: [AppPermission.CertificatesList, AppPermission.CertificatesViewOwn, AppPermission.CertificatesViewOther]`, `certificatesDetail: [AppPermission.CertificatesViewOwn, AppPermission.CertificatesViewOther]`, `certificatesVerifyPublic` (no permission — public route).
4. **WHEN** a user with role `super_admin` or `academy_admin` views the sidebar **THE SYSTEM SHALL** show the "Certificates" nav item because they have `CERTIFICATES_LIST` permission.
5. **WHEN** a user with role `teacher_default` views the sidebar **THE SYSTEM SHALL** show the "Certificates" nav item because they have `CERTIFICATES_LIST` and `CERTIFICATES_VIEW_OWN` permissions.
6. **WHEN** a user with role `student_default` views the sidebar **THE SYSTEM SHALL** show the "Certificates" nav item because they have `CERTIFICATES_VIEW_OWN` permission (the list page filters to own certificates).
7. **WHEN** a user with role `parent_default` views the sidebar **THE SYSTEM SHALL** show the "Certificates" nav item because they have `CERTIFICATES_VIEW_OWN` permission (scoped to children's certificates).
8. **WHEN** a user without any `CERTIFICATES_*` permission views the sidebar **THE SYSTEM SHALL** NOT show the "Certificates" nav item — filtered by `getNavItemsForPermissions()`.

**_Requirements_:** REQ-09.1, REQ-09.2, REQ-09.3

---

### REQ-10: i18n — All Labels Via Translation System

**User Story:** As a developer, I want all certificate UI labels to use the compile-time TypeScript i18n system, so that the UI is fully translatable and type-safe.

1. **WHEN** any client certificate component renders labels **THE SYSTEM SHALL** use `useAppTranslation(Translation.Dashboard.Certificates)` from `@/shared/locale/client` — never hardcoded strings.
2. **WHEN** the public verification Server Component renders labels **THE SYSTEM SHALL** use `getTranslations(locale).dashboardTranslations.certificates.verify` from `@/shared/locale` (synchronous) and pass translated strings as props to the client component.
3. **WHEN** the `CertificateLabels` interface is consumed **THE SYSTEM SHALL** use the following sub-key groups: `list` (column headers, filters, search placeholder, empty message), `generate` (dialog steps, template select, recipient group select, variable preview, confirm), `detail` (field labels, download, revoke, back), `revoke` (dialog title, reason label, confirm), `verify` (public page labels, status badges, not found), `status` (Record mapping status enum → label), `errors` (not found, generation failed, revocation failed).
4. **WHEN** pluralization is needed (e.g., certificate count) **THE SYSTEM SHALL** use typed function keys: `labels.list.count(count: number) => string`.
5. **WHEN** interpolation is needed (e.g., issued to, revoke success) **THE SYSTEM SHALL** use typed function keys: `labels.detail.issuedTo(recipientName: string) => string`, `labels.revoke.success(recipientName: string) => string`.
6. **WHEN** the `generateMetadata` function renders page titles **THE SYSTEM SHALL** use translated strings: `getTranslations(locale).dashboardTranslations.certificates.list.pageTitle` for list, `.detail.pageTitle` for detail, `.verify.pageTitle` for public verification.

**_Requirements_:** REQ-10.1, REQ-10.2, REQ-10.3

---

### REQ-11: Outcome Knowledge Base & Progress Tracking (Feature 6)

**User Story:** As a developer team, I want to capture learnings from building this certificate UI and propagate them to documentation, so that future certificate-related work benefits from our discoveries.

1. **WHEN** all certificate UI tasks are complete **THE SYSTEM SHALL** have updated `frontend/AGENTS.md` with certificate-specific frontend patterns: three-location split for certificates, GraphQL document naming, Zustand store pattern for certificate filters, dialog multi-step pattern for generation.
2. **WHEN** all certificate UI tasks are complete **THE SYSTEM SHALL** have updated `frontend/views/AGENTS.md` or created `frontend/views/dashboard/certificates/AGENTS.md` with certificate domain-specific rules if any non-obvious patterns were discovered.
3. **WHEN** the public verification page is implemented **THE SYSTEM SHALL** document the "public route" pattern in the design file and any AGENTS.md update (Server Component calling service directly, no auth, translations via `getTranslations(locale)`).
4. **WHEN** the QR code integration is implemented **THE SYSTEM SHALL** document the chosen library, its installation, and usage pattern in the design file.
5. **WHEN** the certificate generation multi-step dialog is implemented **THE SYSTEM SHALL** document the dialog multi-step pattern (Toolpad `<Stepper>` + local state, not Zustand) if it represents a new pattern not already in the codebase.

**_Requirements_:** REQ-11.1, REQ-11.2, REQ-11.3

---

## 4. Non-Functional Requirements

### NFR-01: Performance

1. **WHEN** the certificate list page loads with 20 items per page **THE SYSTEM SHALL** render the initial paint in under 2 seconds (server-rendered + Apollo cache).
2. **WHEN** the public verification page loads **THE SYSTEM SHALL** render the certificate validity in under 1 second (Server Component, direct service call, no Apollo).
3. **WHEN** the generate certificate dialog processes a batch of 50 recipients **THE SYSTEM SHALL** show a loading state and not block the UI thread.

### NFR-02: Accessibility

1. **WHEN** any certificate page renders **THE SYSTEM SHALL** use MUI components with proper ARIA attributes (tables, dialogs, buttons all have built-in accessibility).
2. **WHEN** the status badge renders **THE SYSTEM SHALL** use color + text (not color alone) to convey status — green "VALID", amber "EXPIRED", red "REVOKED".

### NFR-03: Security

1. **WHEN** the certificate list query executes **THE SYSTEM SHALL** scope results by the authenticated user's permissions — server-side filtering enforces `CERTIFICATES_VIEW_OWN` vs `CERTIFICATES_VIEW_OTHER`.
2. **WHEN** the public verification query executes **THE SYSTEM SHALL** return only public fields (recipient name, issue date, template name, academy name, status) — no internal IDs, user IDs, or file URLs.
3. **WHEN** the download button is shown **THE SYSTEM SHALL** gate it behind `AppPermission.CertificatesDownload` on the client (defense-in-depth) even though the signed URL is already on the server.

### NFR-04: Responsiveness

1. **WHEN** the certificate list is viewed on mobile (< 768px) **THE SYSTEM SHALL** render card-based layout via `CertificateListMobile.tsx`.
2. **WHEN** the certificate list is viewed on desktop (>= 768px) **THE SYSTEM SHALL** render table-based layout via `CertificateListDesktop.tsx`.
3. **WHEN** the certificate detail is viewed on mobile **THE SYSTEM SHALL** stack all info vertically with thumbnail preview.
4. **WHEN** the certificate detail is viewed on desktop **THE SYSTEM SHALL** show split layout with PDF iframe.
5. **WHEN** the public verification page is viewed on any device **THE SYSTEM SHALL** be fully responsive (single shared component, MUI responsive utilities).

---

## 5. Acceptance Criteria

### AC-01: Certificate List

- [ ] Navigate to `/dashboard/certificates` as academy admin → see paginated table with certificates
- [ ] Search by recipient name filters results in real-time (debounced)
- [ ] Filter by status (ISSUED, REVOKED, etc.) updates results
- [ ] Filter by template updates results
- [ ] Filter by date range updates results
- [ ] Click "View" navigates to certificate detail
- [ ] Click "Download" opens PDF in new tab
- [ ] Click "Generate" opens generation dialog
- [ ] Mobile view shows cards instead of table

### AC-02: Generate Certificate Dialog

- [ ] Step 1: Select a published template from the list
- [ ] Step 2: Select a recipient group — shows recipient count
- [ ] Step 3: Preview resolved variables for sample recipient
- [ ] Step 4: Confirm — calls mutation, shows success toast with count
- [ ] Error during generation shows alert in dialog
- [ ] Users without `CERTIFICATES_GENERATE` don't see the button

### AC-03: Certificate Detail

- [ ] Navigate to `/dashboard/certificates/[id]` → see full certificate info
- [ ] PDF preview shows in iframe (desktop) or thumbnail (mobile)
- [ ] QR code displays public verification URL
- [ ] Download button opens PDF
- [ ] Revoked certificate shows revocation reason with red alert
- [ ] Users with revoke permission see "Revoke" button
- [ ] Back button returns to list

### AC-04: Revocation

- [ ] Click "Revoke" → dialog opens with reason input
- [ ] Reason must be at least 10 characters
- [ ] Confirm → mutation succeeds, toast shows, detail refetches
- [ ] Already-revoked certificates don't show revoke button

### AC-05: Public Verification

- [ ] Visit `/verify/[code]` without logging in → see certificate validity
- [ ] Valid certificate shows green VALID badge, recipient, issue date, academy
- [ ] Expired certificate shows amber EXPIRED badge
- [ ] Revoked certificate shows red REVOKED badge with reason
- [ ] Invalid code shows "Not Found" page
- [ ] Page is responsive on mobile and desktop
- [ ] Page has no sidebar/nav (standalone layout)

### AC-06: Navigation

- [ ] Users with `CERTIFICATES_LIST` or `CERTIFICATES_VIEW_OWN` see "Certificates" in sidebar
- [ ] Users without any certificate permissions don't see the nav item
- [ ] Clicking "Certificates" navigates to `/dashboard/certificates`

### AC-07: i18n

- [ ] All labels change when locale switches between English and Arabic
- [ ] No hardcoded English strings in any certificate component
- [ ] Public verification page labels are server-side translated
- [ ] Pluralization functions work (e.g., "1 certificate" vs "5 certificates")

---

## 6. Constraints

1. Must use Bun runtime (not Node.js)
2. Must use `@apollo/client/react` for hooks (not `@apollo/client` directly for hooks)
3. Must use Zustand for mutable UI state (filters, pagination, search)
4. Must NOT use `useLazyQuery` — use stateful `useQuery` exclusively
5. Must use `sx` prop for MUI styling (not style props)
6. Must use `createLazyView` at module top level for code-splitting tier views
7. Must use `getTranslations(locale)` from `@/shared/locale` for server translations (synchronous)
8. Must use `useAppTranslation(handle)` for client translations
9. Public route must NOT use `getServerUserContext()` or `requirePermissionForPage()`
10. Must follow the three-location split pattern exactly (app → common/views → mobile/desktop/views)
11. Must include `id` field on all GraphQL documents for Apollo cache normalization
12. Must use `logger` from `@/frontend/common/utils/logger` — never `console.*`

---

## 7. Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Plan 05 GraphQL API not ready | Medium | High | Use mock documents with correct types from Plan 02 during development |
| Plan 06 PDF rendering not ready | Medium | High | Fallback: show "PDF not available" with download disabled if `fileUrl` is null |
| QR code library adds bundle size | Low | Medium | Use a lightweight library (`qrcode.react` ~15KB) or render via API |
| Public route locale handling | Medium | Medium | Use `[locale]` segment for public route (not cookie-based) since shared links need explicit locale |
| Apollo cache invalidation after generate/revoke | Medium | Medium | Use `fetchPolicy: "cache-and-network"` and `client.cache.evict()` or `refetchQueries` in mutations |
