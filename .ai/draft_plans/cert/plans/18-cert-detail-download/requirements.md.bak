# Plan 18: Certificate Detail & Download — Requirements

**Plan #:** 18
**Plan Name:** Certificate Detail & Download
**Dependencies:** Plan 2 (Types & Permissions), Plan 4 (Services), Plan 5 (GraphQL API), Plan 6 (PDF Rendering Engine), Plan 7 (Storage & Signed URLs)
**Status:** Draft
**Created:** 2026-08-01

---

## 1. Purpose

The certificate detail page provides a comprehensive view of a single generated certificate, including all metadata, recipient information, template details, verification links, and a complete audit trail. Users can download the PDF, print it, revoke (or reactivate) the certificate, and observe a chronological history of all actions performed on that certificate.

This page serves as the operational hub for certificate lifecycle management — once a certificate is generated (Plan 6) and appears in the list (Plan 16), this detail view is where administrators manage the certificate's ongoing state.

---

## 2. Scope

### In Scope

- Certificate detail page at route `app/(dashboard)/certificates/[certificateId]/page.tsx`
- Structured display of all certificate fields across organized sections (Header, Overview, Verification, Status, Actions)
- Certificate preview rendering with full specification:
  - PDF preview via iframe (lazy load, zoom/pan on desktop with zoom controls)
  - Image preview fallback (PNG/JPG) if PDF not rendered
  - Full-screen preview mode (modal overlay, ESC to close, keyboard navigation)
  - Print from preview mode (uses same off-screen iframe technique)
- PDF download with lazy render if not yet generated, using single-use token model (Plan 07)
- PNG and JPG image downloads (in addition to PDF) with server-side rendering
- Print via off-screen iframe technique with feature detection, triggering native print dialog (Safari fallback: open in new tab)
- Revocation workflow with reason selection and notes (soft revoke; status transitions `issued → revoked` per Plan 04 matrix)
- Re-issue workflow creating a new certificate with same template/recipient (replaces "reactivate"; old cert stays revoked; optional reason for traceability per C.7)
- Share dialog: copy verification link, email share (mailto: with subject/body), WhatsApp share, download QR code as PNG
- Email certificate flow (dedicated "Email Certificate" action in share dialog, pre-fills recipient email if available, uses i18n template)
- Status timeline (audit trail) showing all lifecycle events with cursor-based pagination (20 per page, "Load More")
- Status badge with color-coded indicator (5 canonical values: pending/issued/revoked/expired/failed) and tooltip showing last status change date
- Verification URL display with copy button and QR code (200x200 SVG display, 1024x1024 PNG download)
- Breadcrumb navigation back to certificate list (preserves list store search/filter state when available)
- Download menu with format selection (PDF high quality, PNG image, JPG compressed) and progress indicators per format
- Mobile responsive layout (single column, accordions, bottom action bar, collapsible sections, pinch-to-zoom preview)
- Permission-based access control using canonical `AppPermission` keys (CertificateView, CertificateManage, CertificateRevoke, CertificateGenerate)
- UUID validation of route param before GraphQL query (redirect to NotFound without GraphQL call on invalid UUID)
- i18n for all user-facing strings in English and Arabic with pluralization for audit entries and interpolation for status tooltip
- Error handling for PDF missing/corrupted/template-not-found with Regenerate PDF option; IMAGE_RENDER_NOT_SUPPORTED for PNG/JPG
- 404 (not found) vs 403 (access denied) error page separation using DashboardNotFoundContent and DashboardAccessDeniedContent
- Preview zoom/pan on desktop: zoom controls (+/-), reset zoom, full-screen toggle; mouse wheel zoom with Ctrl, drag to pan
- Full-screen preview mode: modal overlay with close button, ESC key, focus trap, zoom/pan controls inherited
- Print certificate option: feature detection, off-screen iframe, Safari fallback, orientation from PDF metadata (Plan 06), honest caveats about headers/footers
- Share certificate link: public verification URL from `NEXT_PUBLIC_PUBLIC_BASE_URL`, copy to clipboard, QR code download
- Edit certificate (pre-generation) vs view-only (post-generation) distinction: status `pending` shows "Edit" action linking to generation flow; status `issued`/`revoked`/`expired`/`failed` are view-only

### Out of Scope

- Certificate list view (Plan 16)
- Certificate generation flow (Plan 6)
- Public verification page UI (Plan 19) — but verification check events may appear in audit trail
- Template management (Plan 3, Plan 7)
- Bulk certificate operations (Plan 17)
- Certificate sharing via email or external links (Plan 20)

---

## 3. Stakeholders

| Role | Interest |
|------|----------|
| SUPER_ADMIN | Full control of all certificates including revoke/reactivate |
| ACADEMY_ADMIN | Full control of certificates within their academy |
| TEACHER | View/download/print certificates they generated or for students they teach |
| PARENT | View-only access to their children's certificates |
| STUDENT | View + download their own certificates |
| System Auditors | Rely on audit trail for compliance verification |

---

## 4. Functional Requirements (EARS Format)

### REQ-18-01: Certificate Detail View

**WHEN** the user navigates to the certificate detail page via direct URL or list item click,
**THEN** the system **SHALL** display the certificate information in organized sections:

| Section | Fields | Notes |
|---------|--------|-------|
| Header | Certificate number, status badge (pending/issued/revoked/expired/failed), template name | Status badge color-coded per REQ-18-07 |
| Overview | Certificate number, template (name, version, category, orientation), recipient (name, ID, grade level), issue date, expiry date, completion date, created by, created at | Read from certificate record |
| Verification | Verification code, verification URL (copyable), QR code (200x200 SVG), open verification page link | Per REQ-18-08 |
| Status | Status badge + status timeline (audit trail per REQ-18-06) | Timeline visible only with `AppPermission.CertificateManage` |
| Actions | Download menu (PDF/PNG/JPG), Share, Print, Revoke (if issued), Re-issue (if revoked), Edit (if pending) | Action visibility per REQ-18-11 |

**SHALL** validate the route param `certificateId` against UUID v4 regex before calling Apollo. Invalid UUID → `notFound()` without GraphQL call (C.12).
**SHALL** load certificate data via `CertDetailQueryDocument` (single Apollo `useQuery`).
**SHALL** show skeleton loading state while fetching.
**SHALL** show error state with retry button if query fails.
**SHALL** render `DashboardNotFoundContent` if certificate ID does not exist (GraphQL `NOT_FOUND`).
**SHALL** render `DashboardAccessDeniedContent` if user lacks `AppPermission.CertificateView` (GraphQL `FORBIDDEN`). (C.11)
**SHALL** display certificate preview in Header/Overview area: if `pdfExists`, render PDF in iframe with zoom/pan controls (desktop) or pinch-to-zoom (mobile); if not rendered, show "PDF not yet generated" placeholder with "Generate" button.
**SHALL** provide "Full-screen Preview" button on preview that opens modal overlay with same zoom/pan controls, ESC to close, focus trap.
**SHALL** distinguish pre-generation (status `pending`) vs post-generation (status `issued`/`revoked`/`expired`/`failed`): `pending` shows "Edit" action linking to certificate generation flow (Plan 06); post-generation statuses are view-only.

---

### REQ-18-02: Download (PDF, PNG, JPG)

**WHEN** the user clicks the "Download" action button and selects a format from the download menu,
**THEN** the system **SHALL**:

1. For PDF: check if a rendered PDF already exists (via `CertPdfStatusQueryDocument` returning `{ pdfExists }` — NO token minted during status check, per C.4)
2. If PDF exists: mint a single-use download token (via `CertCreateDownloadUrlMutation`), fetch via token URL, create blob URL, trigger download with filename `{certificate_number}_{recipient_name}.pdf`
3. If PDF does not exist: trigger lazy render (calling `TriggerPdfRenderMutation`), poll `CertPdfStatusQueryDocument` every 3s (max 30s), then mint token and download once `pdfExists === true`
4. For PNG: mint image download token (via `CertCreateImageDownloadUrlMutation` with `format: "png"`), fetch, download as `{certificate_number}_{recipient_name}.png`
5. For JPG: same as PNG but `format: "jpg"`, compressed, download as `{certificate_number}_{recipient_name}.jpg`
6. If render fails: display error message with a "Retry" button
7. During download: button shows circular progress indicator, disabled state per format
8. **Audit entry created server-side** by Plan 07's `claimSignedUrl` path (NOT by client code) with action "downloaded" (C.4)

**SHALL** sanitize the filename (remove special characters, replace spaces with underscores).
**SHALL** handle network errors with a user-facing error message.
**SHALL** handle `PDF_OBJECT_MISSING` error (file gone from storage) with "Regenerate PDF" button calling `TriggerPdfRenderMutation` (C.5).
**SHALL** handle `PDF_CORRUPTED` error (invalid bytes) with "Regenerate PDF" button (C.5).
**SHALL** handle `TEMPLATE_NOT_FOUND` error (template hard-deleted) with message "The original template no longer exists" (C.5).
**SHALL** handle `IMAGE_RENDER_NOT_SUPPORTED` error for PNG/JPG with fallback message and suggestion to download PDF.
**SHALL** not block the UI during download — download runs in background.
**SHALL** limit concurrent download triggers to 1 per certificate (store `activeDownloadCertId` guard).
**SHALL** always mint a fresh single-use token per download click (no URL reuse — C.4).
**SHALL** show per-format progress: Download menu item for active format shows spinner, other formats remain clickable but only one download at a time per certificate.

---

### REQ-18-03: Print Certificate

**WHEN** the user clicks the "Print" action button,
**THEN** the system **SHALL**:

1. Ensure PDF is rendered (same lazy-render logic as REQ-18-02)
2. Load the PDF into an off-screen iframe (`visibility:hidden; position:fixed; left:-9999px; width:0; height:0; border:0` — NOT `display:none`, per C.6)
3. Feature-detect `iframe.contentWindow.print()` capability; on supported browsers, trigger native print dialog
4. On unsupported browsers (Safari): fall back to opening PDF in a new tab (`window.open(url)`) so user can print from the PDF viewer toolbar
5. After print dialog closes: clean up the off-screen iframe
6. **Honest caveat:** headers/footers and page orientation in the print output are controlled by the browser's PDF viewer, NOT by iframe CSS. `@page` CSS rules do NOT apply to PDF content in an iframe. The PDF's embedded page size (set by Plan 06 during render) determines orientation (C.6).
7. Audit entry created server-side with action "downloaded" (print uses same download token model)

**SHALL** show loading state while preparing the print iframe.
**SHALL** handle print errors (PDF load failure) with an error message.
**SHALL** clean up the off-screen iframe after print completes.
**SHALL** not interfere with the main page when print is active.

---

### REQ-18-03a: Full-Screen Preview Mode

**WHEN** the user clicks the "Full-screen Preview" button on the certificate preview area,
**THEN** the system **SHALL** open a modal overlay containing:

- The certificate PDF rendered in an iframe occupying 90vw x 90vh (desktop) or 100vw x 100vh (mobile)
- Zoom controls: Zoom In (+), Zoom Out (-), Reset (100%), Fit to Width, Fit to Page
- Pan support: mouse drag to pan (desktop), pinch-to-zoom + drag to pan (mobile)
- Keyboard shortcuts: `+`/`-` for zoom, `0` for reset, Arrow keys for pan
- Close button (top-right), ESC key closes modal
- Focus trap within modal (FocusTrap pattern)
- Print button in modal header (same logic as REQ-18-03)
- Download button in modal header (same logic as REQ-18-02)

**SHALL** use MUI Dialog with `fullScreen={true}` on mobile, `maxWidth="xl"` on desktop.
**SHALL** initialize zoom to "Fit to Page" on open.
**SHALL** maintain zoom/pan state while modal is open.
**SHALL** clean up iframe on modal close.

---

### REQ-18-03b: Share Certificate Link (Public Verification URL)

**WHEN** the user clicks "Copy Link" in the Share dialog or the copy button next to the verification URL,
**THEN** the system **SHALL**:

1. Construct the verification URL: `${NEXT_PUBLIC_PUBLIC_BASE_URL}/verify/${verificationCode}` (C.13)
2. Copy to clipboard using `navigator.clipboard.writeText()`
3. Show toast `t('certificates.verification.urlCopied')` for 2 seconds
4. If clipboard API unavailable (insecure context): fallback to `document.execCommand('copy')` on a temporary textarea

**SHALL** handle clipboard permission errors gracefully (show `t('certificates.verification.copyFailed')`).
**SHALL** not expose the certificate ID in the public URL — only the verification code.

---

### REQ-18-03c: Pre-Generation vs Post-Generation Distinction

**WHEN** the certificate detail page loads,
**THEN** the system **SHALL** distinguish between:

| Status | Label (i18n) | Preview | Actions Available | Notes |
|--------|--------------|---------|-------------------|-------|
| `pending` | `t('certificates.status.pending')` | "PDF not yet generated" placeholder + "Generate" button linking to Plan 06 generation flow | Edit (→ Plan 06), Download disabled, Print disabled, Share disabled, Revoke hidden | Pre-generation state |
| `issued` | `t('certificates.status.issued')` | Full PDF preview with zoom/pan | Download (PDF/PNG/JPG), Print, Share, Revoke | Post-generation, active |
| `revoked` | `t('certificates.status.revoked')` | PDF preview with "Revoked" watermark overlay | Download (PDF only), Print, Share (link shows revoked status), Re-issue | Post-generation, invalidated |
| `expired` | `t('certificates.status.expired')` | PDF preview with "Expired" watermark overlay | Download (PDF only), Print, Share | Post-generation, expired |
| `failed` | `t('certificates.status.failed')` | "PDF generation failed" placeholder + "Retry" button calling `TriggerPdfRenderMutation` | Download disabled, Print disabled, Share disabled, Revoke hidden | Post-generation, failed render |

**SHALL** show "Generate" button for `pending` status linking to the certificate generation flow (Plan 06) with the template and recipient pre-selected.
**SHALL** show "Retry" button for `failed` status that calls `TriggerPdfRenderMutation` and polls for completion.
**SHALL** display status-appropriate watermark overlay on PDF preview for `revoked` and `expired` (CSS overlay on iframe, not re-render).
**SHALL** disable actions per the table above — use `disabled` prop, not hide, so users see what's available.
**SHALL** hide Revoke button entirely for non-`issued` statuses.

---

### REQ-18-04: Revoke Certificate

**WHEN** the user clicks the "Revoke" action button (visible only if `status === 'issued'` and user has `AppPermission.CertificateRevoke`),
**THEN** the system **SHALL** display a confirmation dialog containing:

| Dialog Element | Type | Details |
|----------------|------|---------|
| Warning text | Typography (warning color) | "Revoking will invalidate the certificate and its verification link will stop working." |
| Reason dropdown | Select | Required. Options: "Error in data/recipient", "Issued to wrong recipient", "Duplicate certificate", "Other" |
| Other reason text field | TextField | Conditionally visible when "Other" selected. Required if "Other" chosen. |
| Additional notes | TextField (multiline) | Optional. Max 500 characters. |
| Cancel button | Button (secondary) | Closes dialog without action |
| Revoke button | Button (destructive, error color) | Disabled until reason is selected. Triggers `CertRevokeMutation`. |

**After successful revocation:**
- Certificate status changes to "revoked" (status transition: `issued → revoked`)
- Detail page Apollo cache updated via `update` function
- Audit entry created with action "revoked", reason, notes
- Verification page (Plan 19) shows revoked status
- Success notification shown
- Revoke button replaced by Re-issue button

**SHALL** prevent double-submission (disable button while mutation is in flight).
**SHALL** show error notification if mutation fails.
**SHALL** close dialog and reset form on success.
**SHALL** use canonical status enum — NO `active` status, only `issued` (C.1).

---

### REQ-18-05: Re-issue Certificate

**WHEN** the user clicks the "Re-issue" action button (visible only if `status === 'revoked'` and user has `AppPermission.CertificateGenerate`),
**THEN** the system **SHALL** display a confirmation dialog containing:

| Dialog Element | Type | Details |
|----------------|------|---------|
| Info text | Typography (info color) | "This will create a new certificate with the same template and recipient details." |
| Reason text field | TextField (optional) | Optional reason for re-issue traceability (C.7) |
| Cancel button | Button (secondary) | Closes dialog without action |
| Re-issue button | Button (primary) | Triggers `CertReissueMutation` |

**After successful re-issue (C.7 fix):**
- A NEW certificate is created with the same template and recipient (old cert stays `revoked`)
- New cert status: `pending` → `issued` (after generation by Plan 06)
- User is navigated to the new certificate's detail page
- Audit entry created on the old cert with action "reissued"
- Success notification shown

**SHALL** prevent double-submission.
**SHALL** show error notification if mutation fails.
**SHALL** confirm Plan 04 transition map — re-issue is `revoked → pending` (new cert) NOT `revoked → issued` (same cert). The old cert is permanently revoked.

---

### REQ-18-06: Audit Trail (Status Timeline)

**WHEN** the audit trail section loads (separate lazy query via `CertAuditTrailQueryDocument` with pagination, C.9),
**THEN** the system **SHALL** display a vertical timeline of all lifecycle events:

| Event Action | Label (key) | Description |
|--------------|-------------|-------------|
| `generated` | action.generated | Certificate first created/rendered |
| `issued` | action.issued | Certificate formally issued (status → issued) |
| `viewed` | action.viewed | Certificate viewed on verification page (by public visitor) |
| `downloaded` | action.downloaded | Certificate PDF/image downloaded by authenticated user |
| `revoked` | action.revoked | Certificate revoked (with reason/notes) |
| `reissued` | action.reissued | Certificate superseded by a re-issue (old cert audit entry) |
| `expired` | action.expired | Certificate passed expiry date (system-triggered) |

**SHALL** require `AppPermission.CertificateManage` to view the audit trail section (hidden for PARENT/STUDENT).
**SHALL** display entries in server-sorted chronological order (server sorts by `createdAt DESC`; client-side re-sort toggle is NOT supported — C.9).
**SHALL** paginate the audit trail: initial page = 20 entries, with "Load More" button fetching next 20 (`first`, `after` cursor). No infinite scroll by default.
**SHALL** show each entry with: timestamp (Intl-based `formatDate`), actor name, actor role, action label.
**SHALL** show expandable entries with additional details (reason, notes, verification result) via expanding/collapsing (state managed in ViewModel, NOT store — C.8).
**SHALL** use `cache-and-network` fetch policy with `nextFetchPolicy: cache-first` for subsequent renders (C.9).
**SHALL** show empty state message when no audit entries exist.
**SHALL** show loading skeleton while fetching.
**SHALL** use event count header with correct Arabic pluralization.

---

### REQ-18-07: Certificate Status Badge

**WHEN** the certificate detail page loads and the certificate status is determined,
**THEN** the system **SHALL** display a status badge in the header:

| Status | Color Theme Token | Label Key |
|--------|------------------|-----------|
| pending | `theme.palette.warning` | `certificates.detail.status.pending` |
| issued | `theme.palette.success` | `certificates.detail.status.issued` |
| revoked | `theme.palette.error` | `certificates.detail.status.revoked` |
| expired | `theme.palette.warning` | `certificates.detail.status.expired` |
| failed | `theme.palette.error` | `certificates.detail.status.failed` |

**SHALL** show a tooltip with the last status change date (from latest audit entry or `updatedAt`).
**SHALL** use MUI Chip component with `sx` prop for color styling (no hardcoded colors — C.1).
**SHALL** localize the status label.
**SHALL** use the 5 canonical status values — NO `active` or `draft` (C.1).

---

### REQ-18-08: Verification URL & QR Code

**WHEN** the user views the verification section of the certificate detail page,
**THEN** the system **SHALL** display:

| Element | Description |
|---------|-------------|
| Verification URL | Full URL: `${NEXT_PUBLIC_PUBLIC_BASE_URL}/verify/{verificationCode}` displayed in a read-only text field. URL constructed from `NEXT_PUBLIC_PUBLIC_BASE_URL` env var (NOT `window.location.origin` — C.13) |
| Copy button | `VerificationLinkCopy` component — icon button that copies URL to clipboard, shows "Copied!" feedback for 2 seconds |
| QR code display | 200x200 px SVG rendered client-side using `qrcode` library (dynamic import), error correction level M, encoding the verification URL (C.13) |
| QR code download | Button to download QR code as 1024x1024 px PNG (print quality) via `qrcode.toDataURL()` — per node_research/qrcode.md |
| Open verification page link | Opens verification URL in new tab (`target="_blank"`, `rel="noopener noreferrer"`) |

**SHALL** generate the QR code entirely on the client-side (no server call).
**SHALL** use `qrcode` library (v1.5.4+) with dynamic import to keep initial bundle small.
**SHALL** use error correction level M (medium, ~15% resistance) per node_research findings.
**SHALL** show placeholder while QR is generating.
**SHALL** use the verification code from the certificate record (not the certificate ID).
**SHALL** support RTL layout (URL and QR side-by-side on desktop, stacked on mobile).
**SHALL** use SVG for screen display (crisp at any zoom, small payload) and PNG only for download.

### REQ-18-08a: Share Dialog

**WHEN** the user clicks the "Share" action button,
**THEN** the system **SHALL** display a `ShareDialog` containing:

| Element | Description |
|---------|-------------|
| Copy link | `VerificationLinkCopy` component — same as REQ-18-08 |
| Email share | Opens dedicated email dialog (see REQ-18-03a) with full compose form |
| WhatsApp share | `https://wa.me/?text=` link with the verification URL |
| Download QR | Button to download QR code as 1024x1024 PNG (same as REQ-18-08 QR download) |
| Close button | Closes dialog |

**SHALL** manage dialog open state via Zustand store (`shareDialogOpen`).
**SHALL** close on Escape key or backdrop click.
**SHALL** use MUI Dialog with WAI-ARIA dialog pattern.

---

### REQ-18-03a: Email Certificate Dialog

**WHEN** the user selects "Email" from the Share dialog,
**THEN** the system **SHALL** open an email compose dialog containing:

| Field | Type | Validation | Notes |
|-------|------|------------|-------|
| Recipient Email | Email input | Required, valid email format (HTML5 email type), max 254 chars | Multiple emails comma-separated |
| Subject | Text input | Required, pre-filled with `t('certificates.email.defaultSubject', { certificateNumber })`, max 200 chars | i18n key: `certificates.email.defaultSubject` |
| Message | Textarea | Optional, pre-filled with `t('certificates.email.defaultBody', { certificateNumber, verificationUrl })`, max 2000 chars | i18n key: `certificates.email.defaultBody` |
| Include PDF | Checkbox | Default checked | If unchecked, only verification link sent |
| Send Copy to Me | Checkbox | Default unchecked | Sends copy to current user's email |

**SHALL** validate all fields client-side before submission (show inline validation errors).
**SHALL** show "Sending..." state with disabled submit button during mutation.
**SHALL** call `EmailCertificateMutation` with `{ certificateId, recipientEmails[], subject, message, includePdf, sendCopyToMe }`.
**SHALL** on success: show toast `t('certificates.email.sentSuccess')`, close dialog, add audit entry (server-side, Plan 07) with action "emailed" (C.4).
**SHALL** on failure: show error toast with specific message (network, validation, rate limit, send failure).
**SHALL** enforce rate limit: max 5 emails per certificate per hour per user (server-enforced, 429 response → show `t('certificates.email.rateLimited')`).
**SHALL** persist form state in Zustand store so reopening dialog retains entries.
**SHALL** support keyboard: Tab navigation, Enter on send button submits, ESC closes dialog.
**SHALL** trap focus in dialog (FocusTrap pattern).

---

### REQ-18-09: Certificate List Navigation

**WHEN** the user clicks "Back to list" or the "Certificates" breadcrumb item,
**THEN** the system **SHALL** navigate back to the certificate list page (Plan 16) preserving the previous search/filter state.

**SHALL** display a breadcrumb at the top of the page: "Certificates > {certificate_number}".
**SHALL** use Next.js `useRouter().back()` for browser back, or navigate to the list route with preserved query params.
**SHALL** preserve list search/filter state via the certificate list store (Plan 16) so returning to the list restores the user's previous context.
**SHALL** note that store-preservation depends on the list store being instantiated (if user navigated directly to detail via URL, the list store may be empty — caveat documented in design.md C.13).

---

### REQ-18-10: Mobile Responsive Layout

**WHEN** the certificate detail page is viewed on a mobile device or narrow viewport,
**THEN** the system **SHALL** adapt the layout:

| Aspect | Desktop | Mobile |
|--------|---------|--------|
| Layout | Split: left = certificate preview (large, zoomable), right = info panel (Overview, Status, Verification, Actions) | Single column: preview → accordion sections → bottom action bar |
| Preview | Zoomable preview with zoom controls | Full-width preview, pinch-to-zoom |
| Actions | Action buttons in info panel Actions section | Bottom action bar: Download, Share (fixed position) |
| QR code | 200x200 SVG in Verification section | In collapsible accordion section or dialog |
| Audit timeline | Full-width timeline in Status section | Full-width timeline (same component) |
| Breadcrumb | Full breadcrumb: Certificates > {certificate_number} | Back button + truncated certificate number |
| Download | Download menu (PDF/PNG/JPG) dropdown | Download menu accessible from bottom action bar |
| Share | Share button in Actions section | Share button in bottom action bar |

**SHALL** use the tier switcher pattern (`certDetailView.tsx`) with `useMediaQuery` to switch between `CertDetailDesktop` and `CertDetailMobile`.
**SHALL** render the mobile view via `CertDetailMobile` at `frontend/mobile/views/dashboard/cert-detail/certDetail.mobile.tsx` and desktop via `CertDetailDesktop` at `frontend/desktop/views/dashboard/cert-detail/certDetail.desktop.tsx`.
**SHALL** ensure all actions are accessible on mobile (none hidden without an alternative access path).
**SHALL** use MUI Accordion for collapsible sections on mobile.

---

### REQ-18-11: Access Control

**WHEN** the user views the certificate detail page,
**THEN** the system **SHALL** enforce permission-based access using canonical `AppPermission` keys (C.3):

| Permission Key | Description | Grants |
|----------------|-------------|--------|
| `AppPermission.CertificateView` (`certificates.view`) | View certificate detail | View page, download PDF/PNG/JPG, print, copy verification URL, view QR code |
| `AppPermission.CertificateManage` (`certificates.manage`) | Manage certificates | View audit trail, share dialog |
| `AppPermission.CertificateRevoke` (`certificates.revoke`) | Revoke certificates | Revoke button visibility |
| `AppPermission.CertificateGenerate` (`certificates.generate`) | Generate/re-issue certificates | Re-issue button visibility |

**SHALL** check access on the server side (GraphQL resolver authorization in Plan 5) and client side (UI action visibility).
**SHALL** hide the Revoke button if user lacks `AppPermission.CertificateRevoke`.
**SHALL** hide the Re-issue button if user lacks `AppPermission.CertificateGenerate`.
**SHALL** hide the audit trail section entirely if user lacks `AppPermission.CertificateManage`.
**SHALL** render `DashboardAccessDeniedContent` if user lacks `AppPermission.CertificateView` (GraphQL `FORBIDDEN`) — NOT a redirect to 404 (C.11).
**SHALL** render `DashboardNotFoundContent` if certificate ID does not exist (GraphQL `NOT_FOUND`) — separate from access denied (C.11).
**SHALL** note: downloads (PDF/PNG/JPG) are controlled by `CertificateView` OR `CertificateManage` — there is NO separate `CERTIFICATES_DOWNLOAD` permission (C.3).

---

## 5. Non-Functional Requirements

### NFR-18-01: Performance

- Certificate detail query response < 500ms for the primary certificate record.
- Audit trail query (separate, lazy-loaded) response < 300ms.
- PDF download initiation (click to blob URL) < 2s if PDF already exists.
- QR code generation < 200ms (client-side).
- Initial page render (skeleton) < 100ms.

### NFR-18-02: Security

- All actions (download, print, revoke, re-issue) require authentication.
- Revocation requires `AppPermission.CertificateRevoke`; re-issue requires `AppPermission.CertificateGenerate`.
- Single-use download tokens expire within 5 minutes and can only be claimed once (C.4).
- Verification code is never exposed in logs or error messages.
- UUID v4 validation on route param prevents invalid GraphQL queries (C.12).

### NFR-18-03: Accessibility

- All interactive elements (buttons, links, copy, dialogs) are keyboard navigable.
- Status badge has `aria-label` with full status description.
- QR code has `alt` text describing its purpose.
- Audit timeline entries are focusable and expandable via keyboard.
- Dialogs follow WAI-ARIA dialog pattern (focus trap, Escape to close, `aria-labelledby`).

### NFR-18-04: Internationalization

- All user-facing strings use compile-time translation system in `shared/locale/`.
- English and Arabic translations provided for all keys.
- Arabic pluralization rules applied to audit event count.
- Date formatting uses existing Intl-based `formatDate` from `frontend/common/components/intl/dateFormat.ts` (NOT date-fns, C.10). Hijri formatting deferred to future enhancement.
- RTL layout fully supported (MUI `dir="rtl"` with logical properties).

### NFR-18-05: Data Consistency

- Revocation and re-issue mutations update Apollo cache via `update` function or refetchQueries.
- Optimistic UI update for status badge on revoke/re-issue (revert on error).
- Audit entries are append-only (never modified or deleted).
- Expanded audit entry IDs managed in ViewModel (NOT store) to avoid stale state (C.8).

---

## 6. i18n Key Catalog

### Namespace: `certificates.detail`

| Key | English (en) | Arabic (ar) | Context |
|-----|--------------|-------------|---------|
| `title` | Certificate Details | تفاصيل الشهادة | Page title |
| `backToList` | Back to List | العودة للقائمة | Back button |
| `breadcrumb.certificates` | Certificates | الشهادات | Breadcrumb root |
| `sections.header` | Certificate Information | معلومات الشهادة | Header section |
| `sections.recipient` | Recipient | المستلم | Recipient section |
| `sections.content` | Certificate Details | تفاصيل الشهادة | Content section |
| `sections.verification` | Verification | التحقق | Verification section |
| `sections.template` | Template | القالب | Template section |
| `sections.metadata` | Metadata | البيانات الوصفية | Metadata section |
| `sections.audit` | Audit Trail | سجل التدقيق | Audit section |
| `fields.certificateNumber` | Certificate Number | رقم الشهادة | Certificate number label |
| `fields.recipientName` | Recipient Name | اسم المستلم | Recipient name label |
| `fields.recipientId` | Recipient ID | معرف المستلم | Recipient ID label |
| `fields.gradeLevel` | Grade Level | الصف الدراسي | Grade label |
| `fields.issueDate` | Issue Date | تاريخ الإصدار | Issue date label |
| `fields.expiryDate` | Expiry Date | تاريخ الانتهاء | Expiry date label |
| `fields.completionDate` | Completion Date | تاريخ الإكمال | Completion date label |
| `fields.verificationCode` | Verification Code | رمز التحقق | Verification code label |
| `fields.templateName` | Template Name | اسم القالب | Template name label |
| `fields.templateVersion` | Template Version | إصدار القالب | Template version label |
| `fields.templateCategory` | Category | الفئة | Template category label |
| `fields.createdBy` | Created By | أنشأ بواسطة | Created by label |
| `fields.createdAt` | Created At | تاريخ الإنشاء | Created at label |
| `fields.updatedAt` | Last Updated | آخر تحديث | Updated at label |

### Namespace: `certificates.detail.status`

| Key | English (en) | Arabic (ar) | Context |
|-----|--------------|-------------|---------|
| `pending` | Pending | قيد الانتظار | Pending status |
| `issued` | Issued | صادر | Issued status |
| `revoked` | Revoked | مُلغى | Revoked status |
| `expired` | Expired | منتهي الصلاحية | Expired status |
| `failed` | Failed | فشل | Failed status |
| `tooltip.lastChanged` | Last changed: {date} | آخر تغيير: {date} | Status tooltip (interpolation) |

### Namespace: `certificates.detail.revoke`

| Key | English (en) | Arabic (ar) | Context |
|-----|--------------|-------------|---------|
| `title` | Revoke Certificate | إلغاء الشهادة | Dialog title |
| `warning` | Revoking will invalidate the certificate and its verification link will stop working. | إلغاء الشهادة سيُبطلها ويتوقف رابط التحقق عن العمل. | Warning text |
| `reason.label` | Reason | السبب | Reason label |
| `reason.dataError` | Error in data/recipient | خطأ في البيانات/المستلم | Reason option |
| `reason.wrongRecipient` | Issued to wrong recipient | صادر لمستلم خطأ | Reason option |
| `reason.duplicate` | Duplicate certificate | شهادة مكررة | Reason option |
| `reason.other` | Other | أخرى | Reason option |
| `reason.otherPlaceholder` | Please specify | يرجى التحديد | Other text placeholder |
| `notes.label` | Additional Notes | ملاحظات إضافية | Notes label |
| `notes.placeholder` | Enter any additional context... | أدخل أي سياق إضافي... | Notes placeholder |
| `confirm` | Revoke | إلغاء | Confirm button |
| `cancel` | Cancel | إلغاء | Cancel button |
| `success` | Certificate revoked successfully | تم إلغاء الشهادة بنجاح | Success toast |
| `error` | Failed to revoke certificate | فشل إلغاء الشهادة | Error toast |
| `reasonRequired` | Please select a reason | يرجى اختيار سبب | Validation error |

### Namespace: `certificates.detail.reissue`

| Key | English (en) | Arabic (ar) | Context |
|-----|--------------|-------------|---------|
| `title` | Re-issue Certificate | إعادة إصدار الشهادة | Dialog title |
| `info` | This will create a new certificate with the same template and recipient details. | سيؤدي هذا إلى إنشاء شهادة جديدة بنفس القالب وتفاصيل المستلم. | Info text |
| `reason.label` | Reason (optional) | السبب (اختياري) | Reason label |
| `reason.placeholder` | Enter reason for re-issue... | أدخل سبب إعادة الإصدار... | Reason placeholder |
| `confirm` | Re-issue | إعادة إصدار | Confirm button |
| `cancel` | Cancel | إلغاء | Cancel button |
| `success` | Certificate re-issued successfully | تمت إعادة إصدار الشهادة بنجاح | Success toast |
| `error` | Failed to re-issue certificate | فشلت إعادة إصدار الشهادة | Error toast |

### Namespace: `certificates.detail.audit`

| Key | English (en) | Arabic (ar) | Context |
|-----|--------------|-------------|---------|
| `title` | Status Timeline | سجل الحالة | Timeline title |
| `action.generated` | Certificate Generated | تم إنشاء الشهادة | Action label |
| `action.issued` | Certificate Issued | تم إصدار الشهادة | Action label |
| `action.viewed` | Viewed on Verification Page | عُرضت في صفحة التحقق | Action label |
| `action.downloaded` | Downloaded | تم التنزيل | Action label |
| `action.revoked` | Revoked | تم الإلغاء | Action label |
| `action.reissued` | Re-issued | تمت إعادة الإصدار | Action label |
| `action.expired` | Expired | انتهت الصلاحية | Action label |
| `empty` | No audit entries yet | لا توجد سجلات تدقيق بعد | Empty state |
| `loading` | Loading audit trail... | جارٍ تحميل سجل التدقيق... | Loading state |
| `loadMore` | Load More | تحميل المزيد | Load more button |
| `fields.actor` | By | بواسطة | Actor label |
| `fields.role` | Role | الدور | Role label |
| `fields.timestamp` | When | متى | Timestamp label |
| `fields.reason` | Reason | السبب | Reason in details |
| `fields.notes` | Notes | ملاحظات | Notes in details |
| `fields.result` | Result | النتيجة | Verification result |
| `eventCount` | (count: number) => string | (count: number) => string | Pluralization |

**Arabic Pluralization for `eventCount`:**

- 0 events: "لا توجد أحداث"
- 1 event: "حدث واحد"
- 2 events: "حدثان"
- 3-10 events: "{count} أحداث"
- 11+ events: "{count} حدثًا"
- 100+ events: "{count} حدث"

**English Pluralization for `eventCount`:**

- 0 events: "0 events"
- 1 event: "1 event"
- 2+ events: "{count} events"

### Namespace: `certificates.detail.download`

| Key | English (en) | Arabic (ar) | Context |
|-----|--------------|-------------|---------|
| `button` | Download | تنزيل | Button label |
| `menu.pdf` | PDF (High Quality) | PDF (جودة عالية) | PDF menu option |
| `menu.png` | PNG (Image) | PNG (صورة) | PNG menu option |
| `menu.jpg` | JPG (Compressed) | JPG (مضغوط) | JPG menu option |
| `loading` | Preparing download... | جارٍ تجهيز التنزيل... | Loading state |
| `success` | Download started | بدأ التنزيل | Success toast |
| `error` | Failed to download | فشل التنزيل | Error toast |
| `retry` | Retry | إعادة المحاولة | Retry button |
| `notReady` | File is being generated... | جارٍ إنشاء الملف... | Render in progress |
| `regenerate` | Regenerate PDF | إعادة إنشاء PDF | Regenerate button (C.5) |
| `error.pdfMissing` | PDF file is missing from storage. Click "Regenerate" to create a new copy. | ملف PDF مفقود من التخزين. انقر على "إعادة الإنشاء" لإنشاء نسخة جديدة. | PDF_OBJECT_MISSING error (C.5) |
| `error.pdfCorrupted` | The PDF file is corrupted. Click "Regenerate" to create a new copy. | ملف PDF تالف. انقر على "إعادة الإنشاء" لإنشاء نسخة جديدة. | PDF_CORRUPTED error (C.5) |
| `error.templateNotFound` | The original template no longer exists. Contact an administrator. | القالب الأصلي لم يعد موجودًا. اتصل بالمسؤول. | TEMPLATE_NOT_FOUND error (C.5) |
| `error.imageNotSupported` | Image download is not available for this certificate. Please download the PDF instead. | تنزيل الصورة غير متاح لهذه الشهادة. يرجى تنزيل PDF بدلاً من ذلك. | IMAGE_RENDER_NOT_SUPPORTED error |

### Namespace: `certificates.detail.share`

| Key | English (en) | Arabic (ar) | Context |
|-----|--------------|-------------|---------|
| `title` | Share Certificate | مشاركة الشهادة | Dialog title |
| `copyLink` | Copy Link | نسخ الرابط | Copy link button |
| `copied` | Copied! | تم النسخ! | Copy feedback |
| `email` | Share via Email | مشاركة عبر البريد | Email share button |
| `whatsapp` | Share via WhatsApp | مشاركة عبر واتساب | WhatsApp share button |
| `downloadQr` | Download QR Code | تنزيل رمز QR | Download QR button |
| `emailSubject` | Certificate Verification | التحقق من الشهادة | Email subject |
| `emailBody` | You can verify this certificate at: {url} | يمكنك التحقق من هذه الشهادة على: {url} | Email body (interpolation) |

### Namespace: `certificates.detail.print`

| Key | English (en) | Arabic (ar) | Context |
|-----|--------------|-------------|---------|
| `button` | Print | طباعة | Button label |
| `loading` | Preparing print... | جارٍ التجهيز للطباعة... | Loading state |
| `error` | Failed to prepare print | فشل تجهيز الطباعة | Error toast |
| `retry` | Retry | إعادة المحاولة | Retry button |

### Namespace: `certificates.detail.verification`

| Key | English (en) | Arabic (ar) | Context |
|-----|--------------|-------------|---------|
| `urlLabel` | Verification URL | رابط التحقق | URL label |
| `copy` | Copy URL | نسخ الرابط | Copy button |
| `copied` | Copied! | تم النسخ! | Copy feedback |
| `qrLabel` | QR Code | رمز QR | QR label |
| `qrDownload` | Download QR Code | تنزيل رمز QR | QR download button |
| `qrGenerating` | Generating QR code... | جارٍ إنشاء رمز QR... | QR loading state |
| `openPage` | Open verification page | فتح صفحة التحقق | Open link |

### Namespace: `certificates.detail.actions`

| Key | English (en) | Arabic (ar) | Context |
|-----|--------------|-------------|---------|
| `download` | Download | تنزيل | Download button |
| `share` | Share | مشاركة | Share button |
| `print` | Print | طباعة | Print button |
| `revoke` | Revoke | إلغاء | Revoke button |
| `reissue` | Re-issue | إعادة إصدار | Re-issue button |
| `printLoading` | Preparing print... | جارٍ التجهيز للطباعة... | Print loading |
| `printError` | Failed to prepare print | فشل تجهيز الطباعة | Print error |

### Namespace: `certificates.detail.error`

| Key | English (en) | Arabic (ar) | Context |
|-----|--------------|-------------|---------|
| `notFound.title` | Certificate Not Found | الشهادة غير موجودة | 404 title |
| `notFound.message` | The certificate you are looking for does not exist or has been deleted. | الشهادة التي تبحث عنها غير موجودة أو تم حذفها. | 404 message |
| `notFound.backToList` | Back to Certificates | العودة للشهادات | 404 back button |
| `denied.title` | Access Denied | الوصول مرفوض | 403 title |
| `denied.message` | You do not have permission to view this certificate. | ليس لديك صلاحية لعرض هذه الشهادة. | 403 message |
| `invalidId.title` | Invalid Certificate ID | معرف الشهادة غير صالح | UUID validation failure |
| `invalidId.message` | The certificate ID in the URL is not valid. | معرف الشهادة في الرابط غير صالح. | UUID validation failure |

---

## 7. Acceptance Criteria

### AC-18-01: Certificate Detail Display

**Given** a user with `AppPermission.CertificateView` navigates to `app/(dashboard)/certificates/[certificateId]`
**When** the page loads with a valid UUID
**Then** all certificate fields are displayed in organized sections (Overview, Status, Verification, Actions)
**And** each section shows its label-value pairs in the correct locale
**And** a skeleton loading state appears during data fetch
**And** `DashboardNotFoundContent` is rendered if the certificate does not exist (GraphQL `NOT_FOUND`)
**And** `DashboardAccessDeniedContent` is rendered if user lacks `AppPermission.CertificateView` (GraphQL `FORBIDDEN`) (C.11)

### AC-18-01a: UUID Validation

**Given** a user navigates to `app/(dashboard)/certificates/invalid-uuid`
**When** the route param fails UUID v4 regex validation
**Then** `notFound()` is called without a GraphQL request (C.12)
**And** `DashboardNotFoundContent` is rendered with "Invalid Certificate ID" message

### AC-18-02: PDF Download Exists

**Given** a user with `AppPermission.CertificateView` views a certificate with an already-generated PDF
**When** they click "Download" and select "PDF (High Quality)" from the download menu
**Then** a single-use download token is minted via `CertCreateDownloadUrlMutation` (C.4)
**And** the browser downloads a file named `{certificate_number}_{recipient_name}.pdf`
**And** the download audit entry is created server-side by Plan 07's `claimSignedUrl` (C.4)
**And** the button shows progress during the operation

### AC-18-02a: PNG Download

**Given** a user with `AppPermission.CertificateView` views a certificate
**When** they click "Download" and select "PNG (Image)"
**Then** a single-use image download token is minted via `CertCreateImageDownloadUrlMutation` with `format: "png"`
**And** the browser downloads a file named `{certificate_number}_{recipient_name}.png`

### AC-18-02b: JPG Download

**Given** a user with `AppPermission.CertificateView` views a certificate
**When** they click "Download" and select "JPG (Compressed)"
**Then** a single-use image download token is minted via `CertCreateImageDownloadUrlMutation` with `format: "jpg"`
**And** the browser downloads a file named `{certificate_number}_{recipient_name}.jpg`

### AC-18-03: PDF Download Lazy Render

**Given** a user with `AppPermission.CertificateView` views a certificate without a pre-rendered PDF
**When** they click "Download" and select "PDF"
**Then** the system triggers PDF rendering via `TriggerPdfRenderMutation`
**And** `CertPdfStatusQueryDocument` is polled every 3s (max 30s) for `pdfExists`
**And** a loading state shows "Preparing download..."
**And** once `pdfExists === true`, a single-use token is minted and download begins
**And** an audit entry for download is created server-side (C.4)

### AC-18-04: PDF Download Error

**Given** the PDF render or download request fails
**When** the error occurs
**Then** an error toast appears with the appropriate message
**And** a "Retry" button appears for network errors
**And** a "Regenerate PDF" button appears for `PDF_OBJECT_MISSING` or `PDF_CORRUPTED` errors (C.5)
**And** a "The original template no longer exists" message appears for `TEMPLATE_NOT_FOUND` error (C.5)
**And** clicking retry/regenerate re-attempts the download

### AC-18-05: Print

**Given** a user with `AppPermission.CertificateView` clicks "Print"
**When** the PDF is loaded into the off-screen iframe (`visibility:hidden; position:fixed; left:-9999px` — NOT `display:none`, C.6)
**Then** the browser's native print dialog opens on supported browsers
**And** on unsupported browsers (Safari), the PDF opens in a new tab as fallback
**And** the iframe is cleaned up after print completes
**And** the PDF's embedded page size (set by Plan 06) determines orientation (C.6)

### AC-18-06: Revoke Certificate

**Given** a user with `AppPermission.CertificateRevoke` views a certificate with `status === 'issued'`
**When** they click "Revoke", select a reason, optionally add notes, and confirm
**Then** the certificate status changes to "revoked" (transition: `issued → revoked`)
**And** the status badge updates to red "Revoked"
**And** a revoke audit entry is created with the reason and notes
**And** the Revoke button is replaced by a Re-issue button
**And** a success toast appears

### AC-18-07: Revoke Validation

**Given** a user opens the revoke dialog
**When** they click "Revoke" without selecting a reason
**Then** the Revoke button remains disabled
**And** a validation message "Please select a reason" appears if they attempt to submit

### AC-18-08: Re-issue Certificate

**Given** a user with `AppPermission.CertificateGenerate` views a certificate with `status === 'revoked'`
**When** they click "Re-issue" and confirm
**Then** a NEW certificate is created with the same template and recipient (C.7)
**And** the old certificate stays "revoked" (NOT restored to "issued")
**And** an audit entry with action "reissued" is created on the old certificate
**And** the user is navigated to the new certificate's detail page
**And** a success toast appears

### AC-18-09: Audit Trail Display

**Given** a user with `AppPermission.CertificateManage` views the certificate detail
**When** the audit trail section loads (separate lazy query `CertAuditTrailQueryDocument`)
**Then** a vertical timeline displays up to 20 lifecycle events (first page, C.9)
**And** each entry shows timestamp (Intl-based `formatDate`, C.10), actor name, actor role, action label
**And** expandable entries show additional details (reason, notes, result)
**And** a "Load More" button fetches the next 20 entries via cursor pagination
**And** entries are sorted server-side by `createdAt DESC` (no client-side re-sort, C.9)
**And** the event count header uses correct Arabic pluralization

### AC-18-10: Status Badge

**Given** the certificate detail page loads
**When** the certificate status is determined
**Then** a color-coded badge appears: success for issued, error for revoked/failed, warning for pending/expired
**And** hovering the badge shows a tooltip with the last status change date
**And** the badge label is localized
**And** the 5 canonical status values are used (pending/issued/revoked/expired/failed) — no "active" (C.1)

### AC-18-11: Verification URL and QR

**Given** a user views the verification section
**When** the section renders
**Then** the verification URL is displayed in a read-only field, constructed from `NEXT_PUBLIC_PUBLIC_BASE_URL` (C.13)
**And** clicking the copy button copies the URL to clipboard and shows "Copied!" for 2s
**And** a 200x200 px QR code SVG is rendered client-side (error correction M, C.13)
**And** a "Download QR Code" button downloads a 1024x1024 px PNG
**And** the "Open verification page" link opens the URL in a new tab

### AC-18-11a: Share Dialog

**Given** a user with `AppPermission.CertificateManage` clicks "Share"
**When** the share dialog opens
**Then** options are displayed: Copy Link, Share via Email, Share via WhatsApp, Download QR Code
**And** the email link opens a `mailto:` with prefilled subject and body
**And** the WhatsApp link opens `https://wa.me/?text=` with the verification URL
**And** the dialog closes on Escape or backdrop click

### AC-18-12: Mobile Responsive

**Given** the certificate detail is viewed on a mobile viewport
**When** the page renders
**Then** a single-column layout appears with certificate preview at top
**And** preview supports pinch-to-zoom
**And** sections are displayed as expandable accordions
**And** a bottom action bar shows Download and Share buttons
**And** the QR code appears in a collapsible accordion section
**And** all sections are accessible via scroll

### AC-18-13: Permission-Based Access

**Given** a user lacks `AppPermission.CertificateView`
**When** they attempt to navigate to the detail page
**Then** `DashboardAccessDeniedContent` is rendered (NOT 404, C.11)
**And** a user lacking `AppPermission.CertificateManage` does not see the audit trail section
**And** a user lacking `AppPermission.CertificateRevoke` does not see the Revoke button
**And** a user lacking `AppPermission.CertificateGenerate` does not see the Re-issue button
**And** downloads are available with `CertificateView` OR `CertificateManage` (no separate download permission, C.3)

### AC-18-14: Breadcrumb Navigation

**Given** a user is on the certificate detail page
**When** they click the "Certificates" breadcrumb
**Then** they return to the certificate list with their previous search/filter state preserved (if list store was instantiated)

### AC-18-15: Keyboard Accessibility

**Given** a user navigates the detail page using only keyboard
**When** they tab through elements
**Then** all interactive elements receive focus
**And** dialogs trap focus and close on Escape
**And** audit timeline entries expand on Enter/Space
**And** the download menu is keyboard navigable

---

## 8. Constraints

- Certificate ID in the URL is a UUID v4 — validated by regex before GraphQL call (C.12).
- Verification code is a separate field (not the certificate ID) — alphanumeric, 12-16 chars.
- PDF file size limit: 50MB (enforced by storage layer).
- Audit trail entries are immutable — no edit or delete on the client.
- Revocation reason is stored as an enum in the database with an optional text field for "Other".
- QR code generation is client-side only — no server endpoint for QR images.
- QR codes use `qrcode` library v1.5.4+ with dynamic import (bundle splitting).
- Downloads use single-use tokens from Plan 07's `signedUrls` table (C.4) — NOT presigned URLs.
- Audit entries for downloads are created server-side by Plan 07's `claimSignedUrl` (C.4) — NOT by Plan 18 client code.
- Print uses off-screen iframe technique (`visibility:hidden; position:fixed; left:-9999px`) — NOT `display:none` (C.6).
- `NEXT_PUBLIC_PUBLIC_BASE_URL` env var is the source of truth for the verification URL (C.13) — NOT `window.location.origin`.
- Status enum has exactly 5 values: `pending`, `issued`, `revoked`, `expired`, `failed` (C.1) — no `active` or `draft`.
- Date formatting uses existing Intl-based `formatDate` utility (C.10) — NOT date-fns. Hijri deferred.

---

## 9. Assumptions

1. Plan 2 (Types & Permissions) has defined `AppPermission` keys including `CertificateView`, `CertificateManage`, `CertificateRevoke`, `CertificateGenerate`.
2. Plan 4 (Services) has implemented `getCertificateDetail`, `revokeCertificate`, `reissueCertificate`, `triggerPdfRender`, `getCertificatePdfStatus`, `createCertificateDownloadUrl`, `createImageDownloadUrl`, `getCertificateAuditTrail` service methods.
3. Plan 5 (GraphQL API) has defined the certificate detail, revoke, re-issue, download, and audit trail resolvers.
4. Plan 6 (PDF Rendering Engine) has implemented the lazy render endpoint and storage for rendered PDFs.
5. Plan 7 (Storage & Signed URLs) has implemented the `signedUrls` table, `claimSignedUrl` with row-level locking, and fires `certificate_audits` rows with `action = downloaded` on successful claim (C.4).
6. Plan 16 (Certificate List) has implemented the list store with search/filter state preservation.
7. Plan 1 (Database Schema) has created the `certificates`, `certificate_audits`, `certificate_verifications`, and `signedUrls` tables.
8. Plan 08 (Sidebar) has registered the "Certificates" sidebar item.
9. The `qrcode` npm package (v1.5.4+) and `@types/qrcode` are installed via `bun add qrcode` and `bun add -D @types/qrcode`.
10. `NEXT_PUBLIC_PUBLIC_BASE_URL` environment variable is defined in `.env` or deployment config (C.13).

---

## 10. Open Questions

| # | Question | Impact | Resolution |
|---|----------|--------|------------|
| 1 | Should verification check events appear in real-time on the audit trail (websocket/polling) or only on page load? | Low | Initial: page load only. Real-time in future plan. |
| 2 | Should expired certificates show a "Renew" action in addition to Re-issue? | Medium | No — renewal is a separate flow (future plan). |
| 3 | Should the QR code be downloadable as a standalone image? | Low | **YES — resolved.** QR download as 1024x1024 PNG is in scope (ShareDialog + VerificationSection). |
| 4 | Should print allow page range selection or always print the full certificate? | Low | Always full certificate. |
| 5 | Should audit trail be exportable (CSV/PDF)? | Medium | No — exportable audit trail is a future plan. |
| 6 | Should PNG/JPG image downloads be rendered client-side (canvas) or server-side? | Medium | Server-side via Plan 06. If unsupported, show `IMAGE_RENDER_NOT_SUPPORTED` error with PDF fallback suggestion. |
| 7 | What is the exact field name for the certificate number? (`certificateNumber` vs `serialNumber` vs `serial`) | Medium | Assumed `certificateNumber` based on INTER_PLAN_CONTRACTS.md. Verify against Plan 02 `CertificateReturnType` (C.2). |
| 8 | Does Plan 06's image rendering support both PNG and JPG formats? | Medium | Assume yes. If not, only PDF download is available and PNG/JPG menu items are hidden. Verify in Plan 06 design. |

---

## 11. Requirements Traceability Matrix

| Requirement | Acceptance Criteria | Implementation Area |
|-------------|-------------------|---------------------|
| REQ-18-01 | AC-18-01, AC-18-01a | CertDetailContainer, ViewModel, GraphQL query, UUID validation |
| REQ-18-02 | AC-18-02, AC-18-02a, AC-18-02b, AC-18-03, AC-18-04 | DownloadMenu, download flow, single-use token, PNG/JPG, error handling |
| REQ-18-03 | AC-18-05 | Print action, off-screen iframe, Safari fallback |
| REQ-18-04 | AC-18-06, AC-18-07 | RevokeDialog, CertRevokeMutation, validation |
| REQ-18-05 | AC-18-08 | ReissueDialog, CertReissueMutation, navigation to new cert |
| REQ-18-06 | AC-18-09 | StatusTimeline, CertAuditTrailQuery (paginated), Load More |
| REQ-18-07 | AC-18-10 | StatusBadge (5 canonical values) |
| REQ-18-08 | AC-18-11 | VerificationSection, QrCodeDisplay (200x200 SVG, 1024x1024 PNG download) |
| REQ-18-08a | AC-18-11a | ShareDialog, VerificationLinkCopy, email/WhatsApp share |
| REQ-18-09 | AC-18-14 | Breadcrumb, router navigation, store caveat |
| REQ-18-10 | AC-18-12 | CertDetailMobile (accordion, bottom action bar, pinch-to-zoom) |
| REQ-18-11 | AC-18-13, AC-18-15 | AppPermission checks, DashboardAccessDeniedContent, DashboardNotFoundContent |
