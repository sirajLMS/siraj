# Plan 18: Certificate Detail & Download — Design

**Plan #:** 18
**Plan Name:** Certificate Detail & Download
**Dependencies:** Plan 5 (GraphQL API), Plan 6 (PDF Rendering Engine), Plan 16 (Certificate List), Plan 01 (Database Schema), Plan 07 (Storage & Signed URLs)
**Status:** Draft (Enhanced)
**Created:** 2026-08-01
**Enhanced:** 2026-08-03

> **Canonical Compliance:** All status enums, permission keys, service names, and pagination patterns conform to `INTER_PLAN_CONTRACTS.md`. Where any prior section conflicts, the contract document wins.

---

## 1. Architecture Overview

The certificate detail feature follows the Siraj three-location frontend split pattern: App Router page (route definition, auth, metadata) → common container view (data orchestration, Apollo hooks, state) → desktop/mobile presentation views (visual layout). The backend leverages existing GraphQL resolvers from Plan 5, the PDF rendering engine from Plan 6, the storage/signed-URL system from Plan 7, and the database schema from Plan 1.

### Complete File Scaffold

| # | File Path | Layer | Purpose |
|---|-----------|-------|---------|
| 1 | `app/(dashboard)/certificates/[certificateId]/page.tsx` | App Router | Server component: auth guard, permission check, UUID validation, metadata, renders `<CertDetailView>` |
| 2 | `frontend/common/views/dashboard/cert-detail/certDetailContainer.tsx` | Common Views | Switcher: `createLazyView` + `ResponsiveViewSwitch`, calls `useCertDetailViewModel` |
| 3 | `frontend/common/views/dashboard/cert-detail/useCertDetailViewModel.ts` | Common Views | ViewModel hook: Apollo queries/mutations, Zustand store, all business logic |
| 4 | `frontend/common/views/dashboard/cert-detail/types.ts` | Common Views | Shared type definitions for detail view (props, data types, label interfaces) |
| 5 | `frontend/common/views/dashboard/cert-detail/components/CertificatePreview.tsx` | Common Views | Shared component: renders certificate PDF preview (iframe or object tag) |
| 6 | `frontend/common/views/dashboard/cert-detail/components/CertificateInfoPanel.tsx` | Common Views | Shared component: metadata info panel (number, template, recipient, dates, status) |
| 7 | `frontend/common/views/dashboard/cert-detail/components/RevokeDialog.tsx` | Common Views | Shared component: revoke confirmation dialog with reason input |
| 8 | `frontend/common/views/dashboard/cert-detail/components/ReissueDialog.tsx` | Common Views | Shared component: re-issue confirmation dialog |
| 9 | `frontend/common/views/dashboard/cert-detail/components/StatusTimeline.tsx` | Common Views | Shared component: certificate lifecycle timeline (generated, issued, viewed, downloaded, revoked, expired) |
| 10 | `frontend/common/views/dashboard/cert-detail/components/VerificationLinkCopy.tsx` | Common Views | Shared component: read-only URL field with copy-to-clipboard feedback |
| 11 | `frontend/common/views/dashboard/cert-detail/components/QrCodeDisplay.tsx` | Common Views | Shared component: generates QR code via `qrcode` library, SVG display + PNG download |
| 12 | `frontend/mobile/views/dashboard/cert-detail/certDetail.mobile.tsx` | Mobile Views | Mobile tier: pure presentation, accordion sections, bottom action bar, pinch-to-zoom preview |
| 13 | `frontend/mobile/views/dashboard/cert-detail/components/DownloadMenu.mobile.tsx` | Mobile Views | Mobile download dropdown: PDF, PNG, JPG |
| 14 | `frontend/mobile/views/dashboard/cert-detail/components/ShareDialog.mobile.tsx` | Mobile Views | Mobile share dialog: copy link, email, WhatsApp, download QR |
| 15 | `frontend/desktop/views/dashboard/cert-detail/certDetail.desktop.tsx` | Desktop Views | Desktop tier: pure presentation, split layout, zoomable preview, info panel |
| 16 | `frontend/desktop/views/dashboard/cert-detail/components/DownloadMenu.desktop.tsx` | Desktop Views | Desktop download dropdown: PDF, PNG, JPG |
| 17 | `frontend/desktop/views/dashboard/cert-detail/components/ShareDialog.desktop.tsx` | Desktop Views | Desktop share dialog: copy link, email, WhatsApp, download QR |
| 18 | `frontend/desktop/views/dashboard/cert-detail/components/CertificateActionsBar.desktop.tsx` | Desktop Views | Desktop action buttons: Download, Share, Revoke, Re-issue |
| 19 | `frontend/common/stores/certDetailStore.ts` | Common Stores | Zustand store (non-persisted): dialog state, download status, share dialog state, timeline state |
| 20 | `frontend/common/graphql/sharedDocuments/certificates/certDetail.documents.ts` | GraphQL Documents | All detail-page GraphQL operations |
| 21 | `shared/locale/types/dashboard/certificates/detail.ts` | i18n Types | Compile-time translation type schema |
| 22 | `shared/locale/en/dashboard/certificates/detail.ts` | i18n English | English translations |
| 23 | `shared/locale/ar/dashboard/certificates/detail.ts` | i18n Arabic | Arabic translations with pluralization |
| 24 | `shared/locale/namespaces/dashboard/certificates/detail.namespace.ts` | i18n Namespace | Namespace registration exporting `DashboardCertificateDetail` |

> **Note:** The `certificates` sub-directory under `sharedDocuments/` may already exist from Plan 16 (list management). Co-locate `certDetail.documents.ts` alongside any existing `certList.documents.ts` and update the barrel `index.ts`.

### Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        APP ROUTER (Server)                              │
│  app/(dashboard)/certificates/[certificateId]/page.tsx                 │
│  • Auth check (getServerUserContext + requirePermissionForPage)         │
│  • UUID validation (regex before Apollo query)                         │
│  • Metadata generation (title, breadcrumbs)                           │
│  • Renders <CertDetailView certificateId={id} />                       │
└──────────────────────────┬──────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────────────┐
│              COMMON VIEWS (Client — Switcher + ViewModel)              │
│  frontend/common/views/dashboard/cert-detail/                          │
│  certDetailContainer.tsx (switcher via createLazyView)                │
│  useCertDetailViewModel.ts (hook: all business logic)                 │
│  • useQuery(CertDetailQueryDocument) → cert data + loading             │
│  • useQuery(CertAuditTrailQueryDocument) → audit trail (paginated)     │
│  • useMutation(CertRevokeMutationDocument)                            │
│  • useMutation(CertReissueMutationDocument)                          │
│  • useQuery(CertPdfStatusQueryDocument) → poll for PDF readiness       │
│  • useMutation(CertCreateDownloadUrlMutationDocument) → single-use URL │
│  • certificateDetailStore (Zustand) → dialog/download/share state     │
│  • Renders <ResponsiveViewSwitch mobile={...} desktop={...} />        │
└──────────┬───────────────────────────────────┬────────────────────────┘
           │                                   │
           ▼                                   ▼
┌──────────────────────────┐         ┌─────────────────────────────────────┐
│ DESKTOP VIEW             │         │ MOBILE VIEW                          │
│ frontend/desktop/views/  │         │ frontend/mobile/views/              │
│ certificates/            │         │ certificates/                       │
│ DesktopCertificateDetail │         │ MobileCertificateDetail              │
│  View.tsx                │         │ View.tsx                             │
│                          │         │                                      │
│ • 2-column grid layout   │         │ • Single-column stack                │
│ • Left: content sections │         │ • App bar with overflow actions      │
│ • Right: actions + QR    │         │ • Collapsible accordions             │
│ • Breadcrumb at top      │         │ • Breadcrumb (truncated)             │
└──────────┬───────────────┘         └──────────┬──────────────────────────┘
           │                                    │
           └──────────────┬─────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────────────┐
│              SUB-COMPONENTS (Shared in components/)                     │
│  CertificatePreview         CertificateInfoPanel                       │
│  StatusTimeline             RevokeDialog     ReissueDialog              │
│  QrCodeDisplay              VerificationLinkCopy                        │
│  (tier-specific: DownloadMenu, ShareDialog, CertificateActionsBar)    │
└──────────────────────────────┬──────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    GRAPHQL API (Plan 5)                             │
│  certificate(id) → CertificateReturnType                              │
│  certificateAuditTrail(certId, page, perPage, sort) → PaginatedAudit │
│  revokeCertificate(input) → CertificateReturnType                     │
│  reissueCertificate(input) → CertificateReturnType                    │
│  certificatePdfStatus(id) → { pdfExists } (poll, no token mint)       │
│  createCertificateDownloadUrl(id) → { url, expiresAt } (one-shot)    │
│  triggerPdfRender(certId) → RenderResultType (Plan 6 integration)      │
│  createImageDownloadUrl(id, format) → { url, expiresAt } (PNG/JPG)   │
└──────────────────────────────┬──────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    SERVICE LAYER (Backend)                              │
│  certificate(id) → CertificateReturnType (with permission flags)       │
│  certificateAuditTrail(certId, page, perPage, sort) → Paginated       │
│  revokeCertificate(input) → CertificateReturnType                     │
│  reissueCertificate(input) → CertificateReturnType                    │
│  certificatePdfStatus(id) → { pdfExists }                            │
│  createCertificateDownloadUrl(id) → { url, expiresAt } (signedUrls)  │
│  createImageDownloadUrl(id, format) → { url, expiresAt } (PNG/JPG)  │
│  triggerPdfRender(certId) → render job                               │
│  AUDIT: download audit fired by Plan 07 claimSignedUrl (not client)  │
└──────────────────────────────┬──────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────┬──────────────────┬────────────────────────────┐
│   REPOSITORY LAYER      │  STORAGE LAYER   │   PDF RENDERER (Plan 6)   │
│  CertificateRepo        │  presigned URL   │  PDF Generation Service    │
│  findById(id)           │  GET object      │ 	Render queue              │
│  updateStatus(id,s)     │                  │  Template → PDF            │
│                        │                  │  Storage upload            │
│  AuditRepo              │                  │                            │
│  insert(entry)          │                  │                            │
│  findByCertId(certId)   │                  │                            │
└─────────────────────────┴──────────────────┴────────────────────────────┘
```

---

## 2. Design Goals

| # | Goal | How Addressed |
|---|------|---------------|
| 1 | Information Clarity | Sections with clear headers, label-value pairs, visual hierarchy via MUI Typography variants |
| 2 | Action Discoverability | Non-critical actions (download/print) in right sidebar; destructive (revoke) behind dialog confirmation |
| 3 | Secure Revocation | Confirmation dialog with mandatory reason, destructive button styling, audit entry creation, server-side authorization |
| 4 | Complete Audit Visibility | Separate lazy-loaded audit trail query, timeline component with expandable entries, chronological sorting |
| 5 | Performance via Lazy Loading | Audit trail loaded separately from main detail; PDF only rendered on demand; QR generated client-side |
| 6 | Offline-Friendly Actions | Copyable URL works without network; QR preview is client-rendered |
| 7 | Role-Based UI | Action buttons conditionally rendered based on `canRevoke`, `canDownload`, `canViewAudit` flags from server |

---

## 3. Key Design Decisions

### 3.1 PDF Download Strategy — Split Status Check from Token Mint (C.4 fix)

**Decision:** Lazy render on download, cache rendered PDF in storage. Two separate operations: (1) poll PDF readiness, (2) mint single-use download URL.

| Aspect | Design |
|--------|--------|
| **PDF status check** | `CertPdfStatusQueryDocument` returns `{ pdfExists }` only — no token mint, safe to poll frequently |
| **If PDF exists** | Call `CertCreateDownloadUrlMutationDocument` → mints a new `signedUrls` row (single-use token) → returns `{ url, expiresAt }` |
| **If PDF not exists** | Call `TriggerPdfRenderMutation` → poll `CertPdfStatusQueryDocument` every 3s up to 30s → once `pdfExists === true`, proceeds to mint download URL |
| If exists | Fetch via URL → blob → auto-download with sanitized filename |
| **Token model** | `signedUrls` table with `claimSignedUrl` using `SELECT FOR UPDATE SKIP LOCKED`, marks `used = true` atomically — URL consumed on first fetch |
| **Loading state** | Button shows circular progress; store tracks `isDownloading` + `downloadFormat` ("pdf" \| "png" \| "jpg") |
| File naming | `{certificateNumber}_{sanitizedRecipientName}.pdf` — spaces → underscores, special chars removed |
| Error handling | Distinct error codes: `PDF_OBJECT_MISSING` (storage file gone), `PDF_CORRUPTED` (invalid bytes), `TEMPLATE_NOT_FOUND` (re-render fails), `DOWNLOAD_TIMEOUT` (render > 30s) — see §8.1 |
| Audit | Server-side audit entry fired by Plan 07 `claimSignedUrl` on successful claim — client NEVER calls audit mutation directly |
| Deduplication | Zustand store tracks `activeDownloadCertId`; prevent concurrent triggers for same certificate |
| Polling logic | Poll `CertPdfStatusQueryDocument` every 3s for up to 30s; proceed when `pdfExists === true` |
| Timeout | If render polling exceeds 30s, show error toast with Retry; user can re-trigger |
| **Cross-plan dependency** | Plan 07 must expose TWO operations: `certificatePdfStatus(id)` (poll, no token) and `createCertificateDownloadUrl(id)` (one-shot, mints `signedUrls` row) |
| **Cross-plan audit** | Plan 07 must insert `certificate_audits` row with `action = DOWNLOAD` when `claimSignedUrl` succeeds |

**Rationale:** Splitting status check from token mint prevents storage waste (polling re-mints tokens) and ensures each download click produces a fresh single-use URL. The signed-URL model means a stale URL from a previous poll would be `used` and return 404.

### 3.1a Image Download (PNG/JPG)

**Decision:** Server-side render to image, or canvas capture. Same token model as PDF.

| Aspect | Design |
|--------|--------|
| PNG download | `CertCreateImageDownloadUrlMutationDocument` with `{ certificateId, format: "png" }` → `{ url, expiresAt }` |
| JPG download | Same mutation with `{ format: "jpg" }` — compressed quality |
| Format param | `format: "png" \| "jpg"` passed to mutation |
| Loading state | Button shows circular progress with format label (`downloadFormat` in store) |
| Error handling | Same error codes as PDF (plus `IMAGE_RENDER_NOT_SUPPORTED` if template lacks image export) |
| File naming | `{certificateNumber}_{sanitizedRecipientName}.{ext}` |
| **If not rendered** | Image render may piggyback on PDF render: if PDF doesn't exist yet, trigger render → poll → mint URL |

### 3.2 Print Approach — Off-Screen Iframe with Feature Detection (C.6 fix)

**Decision:** Off-screen iframe with PDF viewer, feature-detect browser support, fallback to open-in-tab.

| Aspect | Design |
|--------|--------|
| iframe element | **Off-screen technique**: `style={{ visibility: 'hidden', position: 'fixed', left: '-9999px', width: 0, height: 0, border: 0 }}` — NOT `display:none` (Safari/Firefox suppress print of invisible frames) |
| PDF source | Fresh download URL from `CertCreateDownloadUrlMutationDocument` (single-use token) |
| Viewer | Native browser PDF viewer (no PDF.js) |
| Orientation | PDF embedded page size controls orientation (Plan 06 bakes orientation into PDF) — `@page` CSS does NOT apply to PDF-in-iframe |
| Feature detection | Detect `iframe.contentWindow.print` availability; if unsupported (Safari versions), open PDF in new tab via `window.open(url)` |
| Trigger | `iframe.contentWindow.print()` after `load` event fires |
| Cleanup | Remove iframe after `afterprint` event |
| **Honest caveat** | Headers/footers are controlled by the user's browser print dialog, NOT programmatically. Document this in the UI: "Adjust headers/footers in your browser's print dialog options." |
| Error handling | If iframe load fails → show error toast with Retry; if `PDF_CORRUPTED` detected → show `PDF_CORRUPTED` with Regenerate option |
| Audit | Server-side audit entry for print action (Plan 07 claimSignedUrl path) |
| **No `@page` injection** | `@page { margin: 0 }` and `@page { size: A4 landscape }` only apply to HTML/CSS prints, NOT to PDF loaded via iframe — the PDF viewer controls print Margins and page size |
| Same render check | Reuses the same `pdfExists` check as download (lazy render if needed via `CertPdfStatusQueryDocument`) |

### 3.2 Print Approach

**Decision:** Hidden iframe with PDF viewer, trigger native print.

| Aspect | Design |
|--------|--------|
| iframe element | Hidden `display:none` iframe, `ref` in PrintFrame component |
| PDF source | Presigned URL from `DownloadCertificateUrlQueryDocument` |
| Viewer | Native browser PDF viewer (no PDF.js needed — most browsers support iframe+print) |
| Orientation | Read from `templateOrientation` field; inject CSS `@page { size: A4 landscape }` or `portrait` |
| Trigger | `iframe.contentWindow.print()` after `load` event fires |
| Cleanup | Remove iframe after print dialog closes (listen for `afterprint` event) |
| No headers/footers | `@page { margin: 0 }` injection via style element in iframe document head |
| Error handling | If iframe load fails → show error toast with Retry |
| Audit | Server-side audit entry for print action |
| Same render check | Reuses the same PDF-exists logic as download (lazy render if needed) |

**Rationale:** Simplest approach that works across browsers. No additional viewer library needed. Native print dialog respects page orientation.

### 3.3 Revocation Workflow — Canonical Status Enum + Re-issue Flow (C.1, C.3, C.7 fixes)

**Decision:** Confirmation dialog with mandatory reason, soft revoke, reversible via re-issue. Uses canonical 5-value status enum.

| Aspect | Design |
|--------|--------|
| Trigger | Revoke button visible only if `status === 'issued'` AND `canRevoke === true` |
| **Status enum** | Canonical: `pending`, `issued`, `revoked`, `expired`, `failed` — NO `ACTIVE`, NO `draft` |
| Dialog | MUI `Dialog` with WAI-ARIA dialog pattern (focus trap, Escape to close) |
| **Warning text** | Prominent `Alert severity="warning"`: "Revoking will invalidate the certificate and its verification link will stop working. The public verification page will show 'revoked'." |
| Reason field | MUI `Select` with enum options: `ISSUED_ERROR`, `DISHONESTY`, `ADMIN_ERROR`, `OTHER`; "Other" reveals conditional `TextField` |
| Notes field | MUI `TextField` with `multiline`, `maxRows={4}`, `inputProps={{ maxLength: 500 }}` |
| Validation | Reason required (disabled confirm button if empty); "Other" requires text field filled |
| Mutation | `CertRevokeMutationDocument` with input `{ id, reason, otherReason?, notes? }` |
| Cache update | Apollo `update` function: write modified status to cache OR `refetchQueries` |
| Optimistic UI | Status badge transitions to "revoked" immediately; reverts on error |
| Post-success | Close dialog, reset form, show success toast, replace Revoke button with Re-issue |
| Post-error | Keep dialog open, show error `Alert` inside dialog, re-enable button |
| **Re-issue flow** | `CertReissueMutationDocument` with input `{ id, reason? }` — optional reactivation reason for traceability |
| **Re-issue reason** | Optional (recommended for accountability, especially when revocation was `DISHONESTY`). Display as "Reason for re-issue (optional)" multiline text field |
| Re-issue availability | Re-issue available for `revoked` certificates per Plan 04 transition map: `revoked → pending` (re-creates certificate with same template/recipient) |
| **Cross-plan** | Verify Plan 04 `AllowStatusTransition`: `expired → ?` (can expired certificates be re-issued, or must they be regenerated via Plan 17?) |
| **Permission** | Uses `AppPermission.CertificateRevoke` canonical key (NOT `CERTIFICATES_MANAGE`, NOT custom boolean) |

**Rationale:** Soft revoke (status flag, not record deletion) allows reversibility. Mandatory reason ensures audit trail quality. Optional re-issue reason adds accountability without friction.

### 3.4 Audit Trail Display — Timeline with Pagination (C.9 fix)

**Decision:** Timeline component, chronological, expandable entries, lazy-loaded with pagination.

| Aspect | Design |
|--------|--------|
| Query | `CertAuditTrailQueryDocument` (separate from main detail query, **paginated**) |
| **Pagination** | `certificateAuditTrail(certId, page, perPage, sort)` returns `{ rows[], totalCount, pageInfo }` — prevents DoS on high-verification certificates |
| Default page size | `perPage: 50` with "Load more" button for next page |
| Lazy load | Starts after main detail query completes; shows skeleton initially |
| Component | Custom `StatusTimeline` using MUI `Timeline` with `TimelineItem` for each entry |
| Entry display | Icon (action-specific), timestamp (localized), actor name + role, action label |
| **Lifecycle events** | `GENERATED`, `ISSUED`, `VIEWED` (on verification page), `DOWNLOADED`, `REVOKED`, `REISSUED`, `EXPIRED` |
| Expandable | Collapsible details panel (reason, notes, result) via MUI `Collapse` |
| Sorting | Toggle button: newest first (default) / oldest first; **server-side sort** (not client-side, due to pagination) |
| Empty state | Centered message with icon: "No audit entries yet" |
| Icon mapping | Generated → FileDownloadDoneOutlined, DownloadOutlined → DownloadOutlined, Viewed → VisibilityOutlined, Revoked → BlockOutlined, Reissued → RefreshOutlined, Expired → ScheduleOutlined |
| Pluralized event count header | Header: "{count} events" using Arabic plural rules from i18n key `eventCount` |
| Accessibility | Each `TimelineItem` is focusable; Enter/Space expands details |
| Permissions | Entire section hidden if `canViewAudit === false` |
| Error state | If query fails, show inline error Alert with retry option inside the timeline area |
| **fetchPolicy** | `cache-and-network` for initial load; `nextFetchPolicy: cache-first` to avoid refetching on focus without filter change |
| **Load more** | Appends new pages to existing entries (not REPLACES) using Apollo `fetchMore` with `updateQuery` |

**Rationale:** Timeline provides visual chronological context. Lazy loading keeps initial page fast. Pagination with server-side sort prevents unbounded responses on popular certificates with many verification events.

### 3.5 QR Code Generation — Public URL, SVG Display, PNG Download (C.13 fix)

**Decision:** Client-side generation using `qrcode` npm package (browser entry), SVG data URI for display, PNG data URL for download. QR URL uses public env var, NOT `window.location.origin`.

| Aspect | Design |
|--------|--------|
| Library | `qrcode` npm package v1.5.x — browser entry `lib/browser.js` (supports `toDataURL` for PNG/JPEG, `toString` for SVG only) |
| **Package install** | `bun add qrcode` + `bun add -D @types/qrcode` (both required — `@types/qrcode` for TypeScript imports) |
| **Dynamic import** | `const QRCode = await import('qrcode')` to keep initial bundle small; only loaded when QR tab is visible |
| Input | Verification URL: `${PUBLIC_BASE_URL}/verify/${verificationCode}` — see §3.6 for URL construction |
| **Display output** | **SVG** via `QRCode.toString(url, { type: 'svg', errorCorrectionLevel: 'M', width: 256, margin: 4 })` — scalable, crisp at all zoom levels |
| **Download output** | **PNG** via `QRCode.toDataURL(url, { errorCorrectionLevel: 'M', width: 1024, type: 'image/png', margin: 4 })` — high-res for print |
| Displayed size | **200x200 px** — CSS-scaled from 256px generated width for retina clarity |
| Download size | **1024x1024 px** — sufficient for print on certificate |
| Error correction | Level **'M'** (medium, ~15% damage resistance) — good balance of density and readability |
| Margin | Default 4 modules (quiet zone) — kept at default for scanner compatibility |
| Component | `QrCodeDisplay` — takes `url` prop, generates QR SVG on mount/URL change via `useEffect` + `useState` |
| Loading state | Skeleton placeholder while generating (< 200ms typically) |
| Error handling | If QR generation fails, show fallback text: "QR unavailable" |
| No server needed | Entirely client-side; no API call |
| Accessibility | QR rendered as `<img>` with `alt` text: "QR code for verification URL" |
| Memoization | QR string memoized via `useMemo` on `url` prop; only re-generates if URL changes |
| **QR download** | "Download QR" button calls `QRCode.toDataURL` (1024x1024 PNG) → creates blob → `<a download>` triggers save as `cert_{certificateNumber}_qr.png` |
| **QR consistency** | The QR URL baked at certificate generation time (Plan 06 server-side, using `PUBLIC_BASE_URL`) must EXACTLY match the QR rendered on this detail page — otherwise the printed cert has a different QR than the on-screen preview. Both use `${PUBLIC_BASE_URL}/verify/${verificationCode}` |

**Rationale:** Client-side generation is fast, offline-capable, and avoids server load. SVG format is scalable and crisp for screen display. PNG at 1024px for download is print-quality. Using `PUBLIC_BASE_URL` (not `window.location.origin`) ensures the QR works when a verifier scans a printed certificate years later when the admin's origin domain may differ.

**Node research source:** `node_research/qrcode.md` — confirmed browser entry only supports SVG via `toString` and PNG/JPEG via `toDataURL`; `toCanvas` also available. UTF-8 and terminal renderers are server-only.

### 3.6 Verification URL Construction — Public Domain (C.13 fix)

| Aspect | Design |
|--------|-------|
| URL pattern | `${PUBLIC_BASE_URL}/verify/${verificationCode}` |
| **Domain source** | `NEXT_PUBLIC_PUBLIC_BASE_URL` environment variable — NOT `window.location.origin` |
| **Rationale** | A verifier scanning a QR on a printed certificate may scan years later; the admin's logged-in `origin` may differ. The public domain must be stable and configured at deployment time. |
| Code source | `certificate.verificationCode` field from detail query |
| Display | Read-only `TextField` with `value` = full URL, `InputProps={{ readOnly: true }}` |
| Copy | `VerificationLinkCopy` component — MUI `IconButton` with `ContentCopy` icon; uses `navigator.clipboard.writeText` |
| Feedback | Icon changes to `Check` for 2s, label shows "Copied!" |
| Open | MUI `Link` with `href` = URL, `target="_blank"`, `rel="noopener noreferrer"` |
| **Fallback** | If `NEXT_PUBLIC_PUBLIC_BASE_URL` is undefined, fall back to `window.location.origin` with `logger.warn` — but this is for the copy-text only, NOT for the QR (QR should always use the env var) |

### 3.7 Breadcrumb Navigation — Store Limitation (C.13 note)

| Aspect | Design |
|--------|-------|
| Component | MUI `Breadcrumbs` with `aria-label="breadcrumb"` |
| Items | `Link` → "Certificates" (clickable, navigates to list), then `Typography` → `{certificateNumber}` (current) |
| List state | Certificate list store (Plan 16) preserves search/filter; navigating back restores — **BUT** the store is non-persisted (in-memory) and only survives SPA navigation. If the user opens the detail page in a new tab and clicks breadcrumb, the store is fresh (no preserved filters) and they land on the default list view. Document this limitation. |
| Mobile | Breadcrumb certificateNumber truncated with ellipsis if > 20 chars |

### 3.8 Share Dialog

**Decision:** Modal dialog with multiple sharing methods — copy link, email, WhatsApp, download QR code as PNG.

| Aspect | Design |
|--------|--------|
| Component | `ShareDialog` (tier-specific: `ShareDialog.desktop.tsx`, `ShareDialog.mobile.tsx`) |
| Trigger | "Share" button in actions bar (desktop) or bottom action bar (mobile) |
| Content | Verification link display (read-only), copy button, email share, WhatsApp share, QR download |
| Copy link | `VerificationLinkCopy` component — same as info panel, with "Copied!" feedback |
| Email share | `mailto:` link: `mailto:?subject=...&body=...` — opens default email client, pre-fills subject/body with verification link |
| WhatsApp share | `https://wa.me/?text=...` — opens WhatsApp web/app with verification link prefilled |
| QR download | Button calls `QRCode.toDataURL(url, { errorCorrectionLevel: 'M', width: 1024, type: 'image/png' })` → blob → download as PNG |
| Dialog state | `shareDialogOpen` in Zustand store (shared across desktop/mobile) |
| Close | Close button, Escape key, or overlay click |
| Mobile | Bottom sheet style instead of centered dialog |

**Rationale:** Multiple sharing methods ensure certificate verification link can be distributed widely without requiring access to the admin dashboard.

### 3.9 Download Menu

**Decision:** Dropdown menu with format options, not separate buttons.

| Aspect | Design |
|--------|--------|
| Component | `DownloadMenu` (tier-specific: `DownloadMenu.desktop.tsx`, `DownloadMenu.mobile.tsx`) |
| Trigger | "Download" button with dropdown caret (MUI `Button` with `Menu` or `SplitButton`) |
| Options | "PDF (high quality)", "PNG (image)", "JPG (compressed image)" |
| PDF | Triggers server-side render (if needed) → mint single-use URL → blob → download |
| PNG | Triggers image render server-side → mint URL → blob → download |
| JPG | Same as PNG but compressed |
| Loading | Menu shows `CircularProgress` per-format; disabled while active download in progress |
| Close menu on select | Menu closes immediately; download proceeds in background; progress toast shows |

**Rationale:** Consolidating download options into a menu reduces visual clutter while supporting multiple export formats.

### 3.10 Permission Integration — Canonical AppPermission Keys (C.3 fix)

**Decision:** All permission flags derived from `AppPermission` canonical keys, not custom booleans.

| AppPermission Key | Action Guarded |
|-------------------|----------------|
| `AppPermission.CertificateView` | View detail page (page-level guard in `page.tsx`) |
| `AppPermission.CertificateManage` | Revoke, re-issue (action-level guards) |
| `AppPermission.CertificateRevoke` | Revoke specifically (could be subset of `CertificateManage`) |
| `AppPermission.CertificateDownload` | NOT a canonical key — downloads controlled by `CertificateView` OR `CertificateManage` |

> **Cross-plan constraint:** The role→permission mapping is owned by Plan 02 (Database schema + seed). Plan 18 does NOT redefine role mappings; it only checks the `AppPermission` flags returned by the server. The server derives `CanRevoke`, `CanDownload`, etc. from `AppPermission` checks and returns them as permission flags in the detail query.

| Server Permission Flag | AppPermission Source | Client Action |
|------------------------|----------------------|---------------|
| `canDownload` | `CertificateView` OR `CertificateManage` | Show Download menu |
| `canRevoke` | `CertificateManage` OR `CertificateRevoke` | Show Revoke button |
| `canReissue` | `CertificateManage` OR `CertificateRevoke` | Show Re-issue button |
| `canViewAudit` | `CertificateManage` | Show Status Timeline section |

**Teacher audit filtering:** The GraphQL resolver (Plan 05) filters audit entries based on the requesting user's role — a teacher sees only entries for actions they performed, not other users' actions. This is resolver-side logic, NOT a boolean flag.

---

## 4. Component Hierarchy

```
app/(dashboard)/certificates/[certificateId]/page.tsx (server)
└── CertDetailView (switcher — certDetailContainer.tsx)
    │  uses useCertDetailViewModel(certificateId) → CertDetailViewModel
    │  uses certificateDetailStore (Zustand)
    │
    ├── [Shared] CertificatePreview
    ├── [Shared] CertificateInfoPanel
    │   ├── CertificateStatusBadge
    │   └── Field label-value pairs
    ├── [Shared] QrCodeDisplay
    ├── [Shared] VerificationLinkCopy
    ├── [Shared] StatusTimeline
    ├── [Shared] RevokeDialog
    ├── [Shared] ReissueDialog
    │
    ├── DesktopCertDetailView (if viewport >= md)
    │   ├── PageContainer
    │   │   ├── PageHeader (breadcrumb, title, status badge)
    │   │   └── Grid container (2-column split)
    │   │       ├── Grid item left (xs=8) — Certificate Preview
    │   │       │   └── CertificatePreview (large, zoomable)
    │   │       └── Grid item right (xs=4) — Info Panel
    │   │           ├── CertificateInfoPanel
    │   │           │   ├── Overview section (number, template, recipient, dates)
    │   │           │   ├── Status section (badge, timeline)
    │   │           │   ├── Verification section (QR, link, copy)
    │   │           │   └── Actions section
    │   │           └── CertificateActionsBar.desktop
    │   │               ├── DownloadMenu.desktop (PDF, PNG, JPG)
    │   │               ├── Button (Share) → opens ShareDialog.desktop
    │   │               ├── Button (Revoke) → opens RevokeDialog
    │   │               └── Button (Re-issue) → opens ReissueDialog
    │   └── (PrintFrame — off-screen iframe)
    │
    └── MobileCertDetailView (if viewport < md)
        ├── MobilePageContainer
        │   ├── MobilePageHeader (back button, certificateNumber, status badge)
        │   ├── CertificatePreview (full width, pinch-to-zoom)
        │   ├── Accordion: Overview
        │   ├── Accordion: Status & Timeline
        │   ├── Accordion: Verification (QR + link + copy)
        │   └── Accordion: Actions
        └── MobileBottomActionBar
            ├── DownloadMenu.mobile (PDF, PNG, JPG)
            └── Button (Share) → opens ShareDialog.mobile (bottom sheet)
```

### 4.1 Component Prop Interfaces

#### CertDetailContainer (Switcher)

| Prop | Type | Description |
|------|------|-------------|
| `certificateId` | string | UUID from route param, validated server-side |

> Implements `createLazyView` + `ResponsiveViewSwitch` pattern. Calls `useCertDetailViewModel(certificateId)` and passes `CertDetailViewModel` to mobile/desktop views.

#### CertDetailViewModel (hook return type)

| Property | Type | Description |
|----------|------|-------------|
| `certificate` | CertDetailData \| null | Certificate data from `CertDetailQueryDocument` |
| `loading` | boolean | Main detail query loading |
| `error` | ApolloError \| null | Main detail query error |
| `notFound` | boolean | True if cert not found or UUID invalid |
| `accessDenied` | boolean | True if user lacks permission |
| `certNumber` | string | Certificate number for header/breadcrumb |
| `status` | CertificateStatus | Canonical enum value |
| `recipient` | { name: string, studentId: string, gradeLevel: string } | Recipient info |
| `template` | { name: string, version: string, category: string, orientation: string } | Template info |
| `dates` | { issueDate: string \| null, expiryDate: string \| null, completionDate: string \| null } | Key dates (ISO strings) |
| `verificationUrl` | string | `${PUBLIC_BASE_URL}/verify/${verificationCode}` |
| `canDownload` | boolean | Permission flag |
| `canRevoke` | boolean | Permission flag |
| `canReissue` | boolean | Permission flag |
| `canViewAudit` | boolean | Permission flag |
| `auditTrail` | { rows: AuditEntry[], totalCount: number, pageInfo: PageInfo, loading: boolean, error: ApolloError \| null } | Paginated audit trail |
| `auditSortOrder` | "newest" \| "oldest" | Current sort |
| `isDownloading` | boolean | Download in progress (any format) |
| `downloadFormat` | "pdf" \| "png" \| "jpg" \| null | Current download format |
| `downloadError` | string \| null | Error code key |
| `isRevoking` | boolean | Revoke mutation in-flight |
| `isReissuing` | boolean | Re-issue mutation in-flight |
| `revokeDialogOpen` | boolean | Revoke dialog visibility |
| `reissueDialogOpen` | boolean | Re-issue dialog visibility |
| `shareDialogOpen` | boolean | Share dialog visibility |
| `breadcrumbs` | { label: string, href?: string }[] | Breadcrumb items |
| `labels` | CertificateDetailLabels | i18n labels for all UI text |
| `onDownload` | (format: "pdf" \| "png" \| "jpg") => void | Download handler |
| `onRevoke` | (input: { reason: string, otherReason?: string, notes?: string }) => void | Revoke handler |
| `onReissue` | (input: { reason?: string }) => void | Re-issue handler |
| `onOpenShareDialog` | () => void | Open share dialog |
| `onCloseShareDialog` | () => void | Close share dialog |
| `onCopyVerificationLink` | () => Promise<void> | Copy to clipboard |
| `onDownloadQrCode` | () => Promise<void> | Download QR as PNG |
| `onShareEmail` | () => void | Open mailto share |
| `onShareWhatsApp` | () => void | Open WhatsApp share link |
| `onSortAudit` | (order: "newest" \| "oldest") => void | Change audit sort |
| `onLoadMoreAudit` | () => void | Load next page of audit entries |
| `onRetryDetail` | () => void | Refetch detail query |

#### CertificatePreview Props

| Prop | Type | Description |
|------|------|-------------|
| `url` | string \| null | PDF URL (from download URL mint) |
| `loading` | boolean | Preview loading |
| `orientation` | "portrait" \| "landscape" | Controls aspect ratio |
| `onRenderTrigger` | () => void | Trigger PDF render if not exists |
| `sx` | object | MUI sx prop for styling |

#### CertificateInfoPanel Props

| Prop | Type | Description |
|------|------|-------------|
| `certificate` | CertDetailData | Certificate data |
| `labels` | CertificateDetailLabels | i18n labels |
| `onCopyLink` | () => Promise<void> | Copy verification link |
| `copied` | boolean | Copy feedback state |

#### QrCodeDisplay Props

| Prop | Type | Description |
|------|------|-------------|
| `url` | string | Verification URL for QR content |
| `size` | number | Display size in px (default 200) |
| `onDownloadPng` | () => Promise<void> | Download QR as PNG (1024px) |

#### VerificationLinkCopy Props

| Prop | Type | Description |
|------|------|-------------|
| `url` | string | Verification URL |
| `onCopy` | () => Promise<void> | Copy handler |
| `copied` | boolean | True for 2s after copy |
| `labels` | { copied: string, copyLabel: string } | i18n labels |

#### StatusTimeline Props

| Prop | Type | Description |
|------|------|-------------|
| `entries` | AuditEntry[] | Timeline entries |
| `loading` | boolean | Loading state |
| `error` | ApolloError \| null | Error state |
| `sortOrder` | "newest" \| "oldest" | Current sort |
| `totalCount` | number | Total entries (for header + "Load more") |
| `onSortChange` | (order: "newest" \| "oldest") => void | Sort toggle |
| `onLoadMore` | () => void | Load next page |
| `labels` | CertificateAuditLabels | i18n labels |

#### RevokeDialog Props

| Prop | Type | Description |
|------|------|-------------|
| `open` | boolean | Dialog visibility |
| `isRevoking` | boolean | Mutation in-flight |
| `reason` | string \| null | Selected reason |
| `otherReason` | string | "Other" reason text |
| `notes` | string | Additional notes |
| `onReasonChange` | (reason: string) => void | Reason selection |
| `onOtherReasonChange` | (text: string) => void | Other reason input |
| `onNotesChange` | (text: string) => void | Notes input |
| `onConfirm` | () => void | Submit revoke |
| `onClose` | () => void | Cancel + reset |
| `labels` | RevokeLabels | i18n labels |

#### ReissueDialog Props

| Prop | Type | Description |
|------|------|-------------|
| `open` | boolean | Dialog visibility |
| `isReissuing` | boolean | Mutation in-flight |
| `reason` | string | Optional re-issue reason |
| `onReasonChange` | (text: string) => void | Reason input |
| `onConfirm` | () => void | Submit re-issue |
| `onClose` | () => void | Cancel + reset |
| `labels` | ReissueLabels | i18n labels |

#### DownloadMenu Props (tier-specific)

| Prop | Type | Description |
|------|------|-------------|
| `onDownload` | (format: "pdf" \| "png" \| "jpg") => void | Download handler |
| `isDownloading` | boolean | Any download in progress |
| `downloadFormat` | string \| null | Current format |
| `disabled` | boolean | Disabled if no download permission |
| `labels` | DownloadLabels | i18n labels for formats |

#### ShareDialog Props (tier-specific)

| Prop | Type | Description |
|------|------|-------------|
| `open` | boolean | Dialog visibility |
| `url` | string | Verification URL |
| `onClose` | () => void | Close handler |
| `onCopyLink` | () => Promise<void> | Copy link |
| `onDownloadQr` | () => Promise<void> | Download QR as PNG |
| `onShareEmail` | () => void | Email share |
| `onShareWhatsApp` | () => void | WhatsApp share |
| `labels` | ShareLabels | i18n labels |

#### CertificateActionsBar Props (desktop only)

| Prop | Type | Description |
|------|------|-------------|
| `canDownload` | boolean | Show download menu |
| `canRevoke` | boolean | Show revoke button |
| `canReissue` | boolean | Show re-issue button |
| `status` | CertificateStatus | Controls which actions are available |
| `isDownloading` | boolean | Any download in progress |
| `onDownload` | (format: "pdf" \| "png" \| "jpg") => void | Download handler |
| `onOpenShare` | () => void | Open share dialog |
| `onOpenRevoke` | () => void | Open revoke dialog |
| `onOpenReissue` | () => void | Open re-issue dialog |
| `labels` | ActionLabels | i18n labels |

#### types.ts Shared Types

| Type | Purpose |
|------|---------|
| `CertDetailData` | From generated `CertDetailQuery` type (do NOT redefine — import from `frontend/common/graphql/generated/`) |
| `CertDetailViewModel` | The flat return type of `useCertDetailViewModel` (see §4.1 above) |
| `AuditEntry` | From generated `CertAuditTrailQuery` type |
| `CertificateStatus` | Union type: `"pending" \| "issued" \| "revoked" \| "expired" \| "failed"` |
| `DownloadFormat` | Union type: `"pdf" \| "png" \| "jpg"` |
| `CertDetailViewProps` | `{ viewModel: CertDetailViewModel }` — props passed to mobile/desktop views |
| `CertDetailContainerProps` | `{ certificateId: string }` — props from page.tsx |

---

## 5. GraphQL Documents

All documents live in `frontend/common/graphql/sharedDocuments/certificates/certDetail.documents.ts`. Naming follows the `{entityName}QueryDocument` / `{entityName}MutationDocument` convention. All object types include `id` field for Apollo cache normalization.

> **Hard dependency (C.2 fix):** The fields below enumerate what Plan 05 must expose on `CertificateReturnType`. If any field is missing from Plan 02/05, it must be added before this plan can be implemented. See §13.1 for the hard dependency table.

### 5.1 CertDetailQueryDocument

| Field | Type | Notes |
|-------|------|-------|
| `id` | ID | For cache key |
| `certificateNumber` | String | Display in header (NOT `serial` — use canonical field name from Plan 02) |
| `status` | CertificateStatus! | Canonical: `pending` / `issued` / `revoked` / `expired` / `failed` (C.1 fix) |
| `verificationCode` | String | For URL + QR |
| `issueDate` | DateTime | Display |
| `expiryDate` | DateTime | Display (nullable) |
| `completionDate` | DateTime | Display (nullable) |
| `recipientName` | String | Display (NOT `studentName` — verify canonical name in Plan 02) |
| `recipientId` | String | Display (NOT `studentId` — verify canonical name) |
| `gradeLevel` | String | Display (verify exists in Plan 02 ReturnType) |
| `templateName` | String | Display (denormalized — verify exists) |
| `templateVersion` | String | Display (denormalized — verify exists) |
| `templateCategory` | String | Display (denormalized — verify exists) |
| `templateOrientation` | String | For print orientation |
| `createdByName` | String | Metadata (denormalized — verify exists) |
| `createdAt` | DateTime | Metadata |
| `updatedAt` | DateTime | Metadata + status tooltip |
| `pdfExists` | Boolean | Whether PDF is in storage (NOT `pdfStorageKey` — boolean only) |
| `canDownload` | Boolean | Permission flag (server-derived from `AppPermission`) |
| `canRevoke` | Boolean | Permission flag |
| `canReissue` | Boolean | Permission flag (renamed from `canReactivate`) |
| `canViewAudit` | Boolean | Permission flag |

> **Field naming:** Confirm with Plan 02 whether the canonical field is `certificateNumber` or `serialNumber`. Confirm whether `recipientName`/`recipientId` or `studentName`/`studentId` is canonical. Update all references consistently.

**Query signature:**

`query CertDetailQuery($id: ID!) → CertificateReturnType`

### 5.2 CertAuditTrailQueryDocument (Paginated — C.9 fix)

| Field | Type | Notes |
|-------|------|-------|
| `id` | ID | Audit entry cache key |
| `certificateId` | ID | Parent certificate (renamed from `certId`) |
| `action` | AuditAction! | `GENERATED` / `ISSUED` / `VIEWED` / `DOWNLOADED` / `REVOKED` / `REISSUED` / `EXPIRED` |
| `actorName` | String | Who performed action |
| `actorRole` | String | Role at time of action |
| `timestamp` | DateTime | When action occurred (field name: `createdAt` in DB, aliased as `timestamp` in GraphQL) |
| `details` | JSON | Expandable — reason, notes, result, templateVersion |

**Pagination wrapper:**

`query CertAuditTrailQuery($certId: ID!, $page: Int, $perPage: Int, $sort: SortOrder) → PaginatedAuditTrailReturnType`

Returns: `{ rows: [AuditEntryReturnType], totalCount: Int, pageInfo: { currentPage, perPage, hasMore } }`

### 5.3 CertRevokeMutationDocument

| Input Field | Type | Notes |
|-------------|------|-------|
| `id` | ID! | Certificate to revoke |
| `reason` | RevocationReason! | Enum: `ISSUED_ERROR` / `DISHONESTY` / `ADMIN_ERROR` / `OTHER` |
| `otherReason` | String | Required if reason = `OTHER` |
| `notes` | String | Optional, max 500 chars |

**Mutation signature:**

`mutation CertRevokeMutation($input: RevokeCertificateInput!) → CertificateReturnType`

Returns updated certificate with `status = revoked`. Server creates audit entry automatically.

### 5.4 CertReissueMutationDocument (renamed from Reactivate — C.1 fix)

| Input Field | Type | Notes |
|-------------|------|-------|
| `id` | ID! | Certificate to re-issue |
| `reason` | String | Optional re-issue reason for traceability |

**Mutation signature:**

`mutation CertReissueMutation($input: ReissueCertificateInput!) → CertificateReturnType`

Returns updated certificate with `status = pending` (re-enters generation queue per Plan 04 transition map: `revoked → pending`). Server creates audit entry with `action = REISSUED`.

### 5.5 CertPdfStatusQueryDocument (NEW — C.4 fix: poll PDF readiness, no token mint)

| Return Field | Type | Notes |
|--------------|------|-------|
| `pdfExists` | Boolean | Whether PDF exists in storage (safe to poll frequently — no token mint) |

**Query signature:**

`query CertPdfStatusQuery($id: ID!) → CertificatePdfStatusReturnType`

**fetchPolicy:** `"no-cache"` — page may change as PDF renders; never serve stale `pdfExists` from cache.

### 5.6 CertCreateDownloadUrlMutationDocument (C.4 fix: mints single-use signedUrls row)

| Input Field | Type | Notes |
|-------------|------|-------|
| `certificateId` | ID! | Certificate to download |

| Return Field | Type | Notes |
|--------------|------|-------|
| `url` | String | Single-use signed URL (consumed on first `claimSignedUrl` fetch) |
| `expiresAt` | DateTime | URL expiration timestamp |

**Mutation signature:**

`mutation CertCreateDownloadUrlMutation($input: CreateDownloadUrlInput!) → DownloadUrlReturnType`

> **Critical:** Each call mints a NEW `signedUrls` row. The URL is single-use (`claimSignedUrl` uses `SELECT FOR UPDATE SKIP LOCKED`, marks `used = true`). Do NOT store the URL in Apollo cache — always mint fresh. `fetchPolicy: "no-cache"`.

### 5.7 CertCreateImageDownloadUrlMutationDocument (NEW — PNG/JPG)

| Input Field | Type | Notes |
|-------------|------|-------|
| `certificateId` | ID! | Certificate to download |
| `format` | ImageFormat! | `png` or `jpg` |

| Return Field | Type | Notes |
|--------------|------|-------|
| `url` | String | Single-use signed URL for image download |
| `expiresAt` | DateTime | URL expiration timestamp |

**Mutation signature:**

`mutation CertCreateImageDownloadUrlMutation($input: CreateImageDownloadUrlInput!) → DownloadUrlReturnType`

### 5.8 TriggerPdfRenderMutation (renamed for consistency)

| Input Field | Type | Notes |
|-------------|------|-------|
| `certificateId` | ID! | Certificate to render |

| Return Field | Type | Notes |
|--------------|------|-------|
| `success` | Boolean | Whether render was triggered |
| `renderId` | String | Job ID for polling |

**Mutation signature:**

`mutation TriggerPdfRenderMutation($input: TriggerPdfRenderInput!) → RenderResultReturnType`

### 5.9 Apollo Hook Conventions

All GraphQL hooks follow Siraj conventions:

- Import hooks from `"@apollo/client/react"` (NOT `@apollo/client`)
- Use stateful `useQuery` exclusively (NO `useLazyQuery`)
- Use `useMutation` with `update` or `refetchQueries` for cache management
- All documents include `id` field on object types for Apollo cache normalization
- Documents use `TypedDocumentNode` for type-safe operations
- Export from barrel `frontend/common/graphql/sharedDocuments/index.ts`

---

## 6. Zustand Store: certDetailStore

File: `frontend/common/stores/certDetailStore.ts`

### State Shape

| Property | Type | Default | Purpose | C.8 Note |
|----------|------|---------|---------|----------|
| `isDownloading` | boolean | false | Download in-progress flag (any format) | Keep in store (shared across tiers) |
| `downloadFormat` | "pdf" \| "png" \| "jpg" \| null | null | Current download format | Keep in store |
| `downloadError` | string \| null | null | Last download error code key | Keep in store |
| `isPreparingPrint` | boolean | false | Print iframe preparation flag | Keep in store |
| `printError` | string \| null | null | Last print error code key | Keep in store |
| `revokeDialogOpen` | boolean | false | Revoke dialog visibility | Keep in store |
| `reissueDialogOpen` | boolean | false | Re-issue dialog visibility | Keep in store |
| `revokeReason` | string \| null | null | Selected reason | Keep in store |
| `revokeOtherReason` | string | "" | "Other" reason text | Keep in store |
| `revokeNotes` | string | "" | Additional notes | Keep in store |
| `isRevoking` | boolean | false | Revoke mutation in-flight | Keep in store |
| `isReissuing` | boolean | false | Re-issue mutation in-flight | Keep in store |
| `reissueReason` | string | "" | Optional re-issue reason | Keep in store |
| `shareDialogOpen` | boolean | false | Share dialog visibility | Keep in store (shared across tiers) |
| `auditSortOrder` | "newest" \| "oldest" | "newest" | Sort order for timeline | Keep in store (both tiers show audit) |
| `activeDownloadCertId` | string \| null | null | Prevents concurrent downloads | Keep in store |

> **C.8 fix — state moved to ViewModel hook:** `expandedAuditIds: Set<string>` should live in the ViewModel `useRef` local state, NOT in the Zustand store. Timeline expand state is local to the timeline component which only renders in one tier at a time.

### Actions

| Action | Signature | Purpose |
|--------|----------|---------|
| `setDownloading` | (val: boolean) → void | Toggle download in-progress flag |
| `setDownloadFormat` | (format: "pdf" \| "png" \| "jpg" \| null) → void | Set current download format |
| `setDownloadError` | (key: string \| null) → void | Set/clear download error |
| `setPreparingPrint` | (val: boolean) → void | Toggle print flag |
| `setPrintError` | (key: string \| null) → void | Set/clear print error |
| `openRevokeDialog` | () → void | Show revoke dialog |
| `closeRevokeDialog` | () → void | Hide + reset revoke form |
| `setRevokeReason` | (reason: string) → void | Update selected reason |
| `setRevokeOtherReason` | (text: string) → void | Update other text |
| `setRevokeNotes` | (text: string) → void | Update notes |
| `setRevoking` | (val: boolean) → void | Mutation in-flight |
| `openReissueDialog` | () → void | Show re-issue dialog |
| `closeReissueDialog` | () → void | Hide + reset re-issue form |
| `setReissueReason` | (text: string) → void | Update re-issue reason |
| `setReissuing` | (val: boolean) → void | Mutation in-flight |
| `openShareDialog` | () → void | Show share dialog |
| `closeShareDialog` | () → void | Hide share dialog |
| `setAuditSortOrder` | (order: "newest" \| "oldest") → void | Sort toggle |
| `setActiveDownloadCertId` | (id: string \| null) → void | Track active download |
| `reset` | () → void | Reset all state to defaults |

### Design Constraints

- Store is client-side only (Zustand, NOT persisted — NOT wrapped with `persist()` middleware).
- Dialog/form state lives here so views don't need prop drilling.
- Follows `frontend/common/stores/AGENTS.md` conventions (non-persisted, minimal cross-tier state).

---

## 7. Data Model References

> **C.1 fix:** Status enum uses canonical 5 values: `pending`, `issued`, `revoked`, `expired`, `failed`. NO `ACTIVE`.

### 7.1 certificates table (from Plan 1)

| Column | Type | Used In |
|--------|------|---------|
| `id` | UUID PK | Route param, cache key |
| `certificate_number` | varchar | Header display (confirm: `certificate_number` or `serial_number`? — Plan 02 canonical) |
| `status` | enum (`pending`/`issued`/`revoked`/`expired`/`failed`) | Status badge |
| `verification_code` | varchar | Verification URL, QR |
| `recipient_name` | varchar | Recipient section (confirm: `recipient_name` or `student_name`? — Plan 02 canonical) |
| `recipient_id` | varchar | Recipient section (confirm: `recipient_id` or `student_id`? — Plan 02 canonical) |
| `grade_level` | varchar | Recipient section (verify exists in Plan 02 ReturnType) |
| `issue_date` | timestamp | Content section |
| `expiry_date` | timestamp (nullable) | Content section |
| `completion_date` | timestamp (nullable) | Content section (verify exists) |
| `template_id` | UUID FK → templates | Template info |
| `template_name` | varchar (denormalized) | Template info |
| `template_version` | varchar (denormalized) | Template info |
| `template_category` | varchar (denormalized) | Template info |
| `template_orientation` | enum (portrait/landscape) | Print orientation |
| `created_by` | UUID FK → users | Metadata |
| `created_by_name` | varchar (denormalized) | Metadata (verify exists) |
| `created_at` | timestamp | Metadata |
| `updated_at` | timestamp | Metadata, status tooltip |
| `pdf_storage_key` | varchar (nullable) | PDF existence check (`pdfExists` = key IS NOT NULL) |

### 7.2 certificate_audits table (from Plan 1)

| Column | Type | Used In |
|--------|------|---------|
| `id` | UUID PK | Audit entry cache key |
| `certificate_id` | UUID FK → certificates | Parent reference |
| `action` | enum (`generated`/`issued`/`viewed`/`downloaded`/`revoked`/`reissued`/`expired`) | Lifecycle event label |
| `actor_id` | UUID FK → users (nullable for anon) | Actor display |
| `actor_name` | varchar (denormalized) | Actor display |
| `actor_role` | varchar (denormalized) | Actor role display |
| `reason` | enum (nullable) | Revoke details |
| `other_reason` | varchar (nullable) | Revoke "Other" text |
| `notes` | text (nullable) | Revoke/re-issue details |
| `details` | JSONB | Expandable details |
| `created_at` | timestamp | Timeline timestamp (aliased as `timestamp` in GraphQL) |

### 7.3 certificate_verifications table (from Plan 1 — Plan 19 creates public-facing)

| Column | Type | Used In |
|--------|------|---------|
| `id` | UUID PK | Verification audit entry |
| `certificate_id` | UUID FK → certificates | Parent reference |
| `verifier_ip` | varchar | Anonymous actor display |
| `verifier_user_id` | UUID FK → users (nullable) | If logged-in user verified |
| `result` | enum (`valid`/`invalid_revoked`/`invalid_expired`/`not_found`) | Results display |
| `created_at` | timestamp | Timeline timestamp |

---

## 8. Error Handling Strategy

### 8.1 GraphQL Error Categories — Complete Error Code Table (C.5 fix)

| Error Code | Trigger | User-Facing Action | Technical Recovery |
|------------|---------|-------------------|-------------------|
| `NOT_FOUND` (detail query) | Certificate ID doesn't exist | Render `<DashboardNotFoundContent />` | N/A — route not found |
| `FORBIDDEN` (detail query) | User lacks `AppPermission.CertificateView` | Render `<DashboardAccessDeniedContent />` | N/A — permission denied |
| `UUID_INVALID` (route param) | `id` is not a valid UUID | Render `<DashboardNotFoundContent />` without calling Apollo | Regex validate before query (C.12) |
| `NETWORK_ERROR` (any query/mutation) | Network failure | Toast + Retry button | Apollo retry link |
| `REVOCATION_FAILED` (mutation) | Server rejects revoke | Error `Alert` in dialog, button re-enabled | Mutation `onError` handler |
| `REISSUE_FAILED` (mutation) | Server rejects re-issue | Error `Alert` in dialog, button re-enabled | Mutation `onError` handler |
| `PDF_RENDER_TIMEOUT` (polling) | Render > 30s | Toast: "PDF rendering is taking longer than expected. Try again later." | Store `downloadError` set |
| `PDF_OBJECT_MISSING` (storage) | `pdfExists = true` but file gone (S3 NoSuchKey) | Toast: "PDF file is missing on server." + "Regenerate PDF" button | Calls `TriggerPdfRenderMutation` to re-render (C.5) |
| `PDF_CORRUPTED` (file invalid) | File present but invalid bytes (truncated, charset) | Toast: "PDF file appears corrupted." + "Regenerate PDF" button | Heuristic: blob text includes `%PDF`; calls re-render (C.5) |
| `TEMPLATE_NOT_FOUND` (re-render) | Template hard-deleted, re-render fails | Toast: "The original template no longer exists; the existing PDF cannot be rebuilt." | Suggest Plan 09 only archives templates, never hard-deletes (C.5) |
| `IMAGE_RENDER_NOT_SUPPORTED` (PNG/JPG) | Template lacks image export | Toast: "Image download not available for this certificate." | Fall back to PDF download |
| `DOWNLOAD_TOKEN_EXPIRED` | Signed URL expired before fetch | Auto-mint fresh URL and retry once | `CertCreateDownloadUrlMutation` re-call |
| `AUDIT_TRAIL_ERROR` (query) | Audit query fails | Inline `Alert` in timeline area + retry link | `onError` → local error state |

### 8.2 Error Display Components (C.11 fix)

| Location | Component | Behavior |
|----------|-----------|----------|
| Detail page — 404 (not found) | `<DashboardNotFoundContent />` | Existing component: `frontend/common/views/dashboard/components/DashboardNotFoundContent.tsx` |
| Detail page — 403 (access denied) | `<DashboardAccessDeniedContent />` | **NEW** small component (in-scope for this plan): composes `DashboardNotFoundContent` with a "no access" variant/mode prop, OR a new `DashboardAccessDeniedContent.tsx` alongside it |
| Detail page — retryable error | `<ErrorState onRetry={refetch} />` | Error message + Retry button |
| Download/Print | MUI `Alert` in actions panel | Inline alert, auto-dismisses on retry |
| Dialogs | MUI `Alert severity="error"` inside dialog content | Stays until dismissed or retry succeeds |
| Audit trail | `<Alert severity="error">` inside timeline area | Inline, with retry link |
| Download errors (storage) | Toast + Regenerate button | Shows error code-specific message + action button |

> **C.11 note:** The detail page's `not-found.tsx` should route to the existing `app/(dashboard)/not-found.tsx` (file exists in codebase). For 403, create `DashboardAccessDeniedContent.tsx` as a small component in `frontend/common/views/dashboard/components/`.

### 8.3 Error Logging

All errors logged via `logger.error` from `@/frontend/common/utils/logger` (never `console.error`). GraphQL errors include the operation name and variables (excluding sensitive data like verification codes). Network errors include the endpoint and status code.

### 8.4 UUID Validation (C.12 fix)

The `page.tsx` server component validates the route param `id` against UUID v4 regex (`/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i`) BEFORE passing to the client component. Invalid UUID → render `notFound()` (Next.js `notFound` function) without calling Apollo. This prevents wasteful GraphQL queries for malformed IDs.

---

## 9. i18n Design

### 9.1 Translation Key Structure

The detail page uses a flat dashboard namespace handle `Translation.Dashboard.CertificateDetail` (base keys) and an optional `Translation.Dashboard.CertificateAudit` (audit keys). All keys are defined in the compile-time TypeScript i18n system in `shared/locale/` via `defineNamespace`.

**Type Schema Location:** `shared/locale/types/dashboard/certificates/detail.ts`

**English Locale:** `shared/locale/en/dashboard/certificates/detail.ts`
**Arabic Locale:** `shared/locale/ar/dashboard/certificates/detail.ts`

### 9.2 Translation Key Catalog — Complete

| Key Path | English | Notes |
|----------|---------|-------|
| | **Base — header/navigation** | |
| `title` | "Certificate Details" | Page title |
| `breadcrumb.certificates` | "Certificates" | Breadcrumb root label |
| `backToList` | "Back to Certificates" | Back button aria-label |
| | **Base — info panel** | |
| `sections.overview` | "Overview" | Info panel section header |
| `sections.status` | "Status" | Info panel section header |
| `sections.verification` | "Verification" | Info panel section header |
| `sections.actions` | "Actions" | Info panel section header |
| `fields.certificateNumber` | "Certificate Number" | Field label |
| `fields.template` | "Template" | Field label |
| `fields.recipient` | "Recipient" | Field label |
| `fields.gradeLevel` | "Grade Level" | Field label |
| `fields.issueDate` | "Issue Date" | Field label |
| `fields.expiryDate` | "Expiry Date" | Field label |
| `fields.completionDate` | "Completion Date" | Field label |
| `fields.createdBy` | "Created By" | Field label |
| `fields.createdAt` | "Created At" | Field label |
| `fields.orientation` | "Orientation" | Field label |
| `fields.verificationCode` | "Verification Code" | Field label |
| `fields.pdfStatus` | "PDF Status" | Field label |
| `pdfStatus.ready` | "Ready" | PDF ready badge |
| `pdfStatus.pending` | "Pending — not yet rendered" | PDF pending badge |
| | **Status labels** | |
| `status.pending` | "Pending" | Status badge label |
| `status.issued` | "Issued" | Status badge label |
| `status.revoked` | "Revoked" | Status badge label |
| `status.expired` | "Expired" | Status badge label |
| `status.failed` | "Failed" | Status badge label |
| `status.tooltip.lastChanged` | "Last changed: {date}" | Tooltip (interpolation `{date}`) |
| | **Download menu** | |
| `download.title` | "Download" | Menu button label |
| `download.pdf` | "PDF (High Quality)" | MenuItem |
| `download.png` | "PNG (Image)" | MenuItem |
| `download.jpg` | "JPG (Compressed)" | MenuItem |
| `download.loading` | "Preparing download..." | Loading state (interpolation `{format}`) |
| `download.success` | "Download started" | Success toast |
| `download.error` | "Download failed: {message}" | Error toast (interpolation `{message}`) |
| `download.regenerate` | "Regenerate PDF" | Button for missing/corrupt PDF |
| `download.regenerating` | "Regenerating PDF..." | Re-render in-progress |
| `download.errors.pdfMissing` | "PDF file is missing on server" | C.5 error message |
| `download.errors.pdfCorrupted` | "PDF file appears corrupted" | C.5 error message |
| `download.errors.templateNotFound` | "The original template no longer exists; the existing PDF cannot be rebuilt." | C.5 error message |
| `download.errors.renderTimeout` | "PDF rendering is taking longer than expected. Try again later." | Timeout message |
| `download.errors.imageNotSupported` | "Image download not available for this certificate." | PNG/JPG fallback |
| | **Share dialog** | |
| `share.title` | "Share Certificate" | Dialog title |
| `share.verificationLink` | "Verification Link" | Section label |
| `share.copyLink` | "Copy Link" | Button label |
| `share.copied` | "Copied!" | Copied feedback |
| `share.copyFailed` | "Copy failed" | Clipboard error |
| `share.emailShare` | "Share via Email" | Button/MenuItem |
| `share.whatsappShare` | "Share via WhatsApp" | Button/MenuItem |
| `share.qrCode` | "QR Code" | Section label |
| `share.downloadQr` | "Download QR Code (PNG)" | Button |
| `share.qrDownloaded` | "QR Code downloaded" | Success toast |
| `share.close` | "Close" | Dialog close button |
| | **Print** | |
| `print.button` | "Print" | Button label |
| `print.preparing` | "Preparing print..." | Loading state |
| `print.error` | "Print preparation failed" | Error toast |
| `print.notSupported` | "Printing is not supported in this browser" | Feature detection fallback |
| | **Verification** | |
| `verification.url` | "Verification URL" | Section label |
| `verification.copy` | "Copy" | Button label |
| `verification.copied` | "Copied to clipboard" | Copied feedback |
| `verification.open` | "Open Verification Page" | Button/Link |
| `verification.qrTitle` | "Scan to Verify" | QR code caption |
| `verification.qrInstructions` | "Scan this QR code to verify the certificate" | QR help text |
| | **Revoke dialog** | |
| `revoke.title` | "Revoke Certificate" | Dialog title |
| `revoke.warning` | "Revoking will invalidate the certificate and its verification link will stop working." | Warning text |
| `revoke.reason` | "Reason for Revocation" | Field label |
| `revoke.reasons.error` | "Error in data/recipient" | Reason option |
| `revoke.reasons.wrongRecipient` | "Issued to wrong recipient" | Reason option |
| `revoke.reasons.duplicate` | "Duplicate certificate" | Reason option |
| `revoke.reasons.other` | "Other" | Reason option |
| `revoke.otherReason` | "Please specify" | Other reason field label |
| `revoke.otherReasonRequired` | "Please specify the reason" | Validation error |
| `revoke.notes` | "Additional Notes (optional)" | Field label |
| `revoke.confirm` | "Revoke Certificate" | Confirm button |
| `revoke.cancel` | "Cancel" | Cancel button |
| `revoke.loading` | "Revoking..." | Button loading state |
| `revoke.success` | "Certificate revoked" | Success toast |
| `revoke.error` | "Failed to revoke certificate" | Error toast |
| | **Re-issue dialog** | |
| `reissue.title` | "Re-issue Certificate" | Dialog title |
| `reissue.description` | "This will create a new certificate with the same template and recipient details." | Description text |
| `reissue.reason` | "Reason for Re-issue (optional)" | Field label |
| `reissue.confirm` | "Re-issue Certificate" | Confirm button |
| `reissue.cancel` | "Cancel" | Cancel button |
| `reissue.loading` | "Re-issuing..." | Button loading state |
| `reissue.success` | "Certificate re-issued" | Success toast |
| `reissue.error` | "Failed to re-issue certificate" | Error toast |
| | **Actions bar** | |
| `actions.download` | "Download" | Action button |
| `actions.share` | "Share" | Action button |
| `actions.print` | "Print" | Action button |
| `actions.revoke` | "Revoke" | Action button |
| `actions.reissue` | "Re-issue" | Action button (visible when status = revoked) |
| `actions.noPermissions` | "You don't have permission for this action" | Tooltip for disabled actions |
| | **Error states** | |
| `error.notFound` | "Certificate not found" | 404 page |
| `error.accessDenied` | "You don't have access to view this certificate" | 403 page |
| `error.retry` | "Try Again" | Retry button |
| `error.loadFailed` | "Failed to load certificate details" | Generic load error |

### 9.3 Audit Trail Namespace — `Translation.Dashboard.CertificateAudit`

| Key Path | English | Notes |
|----------|---------|-------|
| `title` | "Certificate Timeline" | Section title |
| `sortNewest` | "Newest First" | Sort toggle label |
| `sortOldest` | "Oldest First" | Sort toggle label |
| `loadMore` | "Load More" | Pagination button |
| `loadingMore` | "Loading more..." | Loading more indicator |
| `empty` | "No events recorded yet" | Empty state |
| `errorLoading` | "Failed to load timeline" | Error state |
| `expandDetails` | "View Details" | Expand button |
| `collapseDetails` | "Hide Details" | Collapse button |
| `eventCount` | `(count: number) => string` | Typed pluralization function |
| | **Action labels** | |
| `action.generated` | "Certificate Generated" | Lifecycle event |
| `action.issued` | "Certificate Issued" | Lifecycle event |
| `action.viewed` | "Verified on Public Page" | Lifecycle event |
| `action.downloaded` | "Downloaded" | Lifecycle event |
| `action.revoked` | "Certificate Revoked" | Lifecycle event |
| `action.reissued` | "Certificate Re-issued" | Lifecycle event |
| `action.expired` | "Certificate Expired" | Lifecycle event |
| | **Fields** | |
| `fields.actor` | "Actor" | Actor label |
| `fields.timestamp` | "Timestamp" | Timestamp label |
| `fields.reason` | "Reason" | Reason label |
| `fields.notes` | "Notes" | Notes label |

### 9.4 Arabic Pluralization — `eventCount`

The `eventCount` function is a typed pluralization function:

| English | Arabic | Rule |
|---------|--------|------|
| 0 | "0 events" | "لا توجد أحداث" | Zero rule |
| 1 | "1 event" | "حدث واحد" | Singular masculine |
| 2 | "2 events" | "حدثان" | Dual |
| 3-10 | "{count} events" | "{count} أحداث" | Plural (جمع تكسير) |
| 11-99 | "{count} events" | "{count} حدثًا" | Accusative singular |
| 100+ | "{count} events" | "{count} حدث" | Singular form |

**Type signature:** `eventCount: (count: number) => string`

### 9.5 Interpolation Keys

| Key | Interpolation Param | Example (en) | Example (ar) |
|-----|---------------------|--------------|--------------|
| `status.tooltip.lastChanged` | `{date}` | Last changed: Aug 1, 2026 | آخر تغيير: ١ أغسطس ٢٠٢٦ |
| `download.loading` | `{format}` | Preparing PDF download... | جارٍ تحضير تنزيل PDF... |
| `download.error` | `{message}` | Download failed: PDF file is missing | فشل التنزيل: ملف PDF مفقود |

### 9.6 Server-Side vs Client-Side Usage

| Context | Translation Source | Import |
|---------|-------------------|--------|
| Server Component (page metadata) | `getTranslations(locale).dashboardTranslations.certificateDetail` | `@/shared/locale/server` |
| Client Component (views, dialogs) | `useAppTranslation(Translation.Dashboard.CertificateDetail)` | `@/shared/locale/client` |
| Client Component (audit namespace) | `useAppTranslation(Translation.Dashboard.CertificateAudit)` | `@/shared/locale/client` |
| GraphQL error messages (server) | `ctx.t().dashboardTranslations.certificateDetail` | Pothos context |

### 9.7 Date Formatting (C.10 fix)

> **C.10 fix:** Use the existing `formatDate` utility from `frontend/common/components/intl/dateFormat.ts` (Intl-based), NOT `date-fns` with Hijri plugin. The existing utility uses `Intl.DateTimeFormat` which already handles Arabic-Indic digits and locale-specific month names. Hijri calendar support is deferred (not available via standard `Intl` in all browsers; would need a separate calendar library).

| Locale | Format | Example | Implementation |
|--------|--------|---------|----------------|
| en | `Intl.DateTimeFormat('en', { dateStyle: 'medium' })` | "Aug 1, 2026" | Existing `formatDate(date, locale)` |
| ar | `Intl.DateTimeFormat('ar', { dateStyle: 'medium' })` | "١ أغسطس ٢٠٢٦" | Existing `formatDate(date, locale)` |
| ar (Hijri, future) | `Intl.DateTimeFormat('ar-SA-u-ca-islamic', ...)` | "١٨ محرم ١٤٤٨" | Deferred — add when user research confirms need |

**Import:** `import { formatDate } from '@/frontend/common/components/intl/dateFormat'`

---

## 10. UX / Navigation Specification

### 10.1 Route

| Aspect | Value |
|--------|-------|
| Route path | `app/(dashboard)/certificates/[certificateId]/page.tsx` |
| Route type | Dynamic segment (`[certificateId]` = UUID v4) |
| Auth | Required (middleware enforces) |
| Layout | `(dashboard)` layout group (sidebar + topbar from Plan 08) |
| Metadata title | "Certificate {certificateNumber} — Siraj" |
| Metadata description | Template-based description |
| Params | `certificateId: UUID` from URL |
| UUID validation | `page.tsx` validates `certificateId` against UUID v4 regex before rendering client component (C.12). Invalid → `notFound()` |

### 10.2 Sidebar Integration (Plan 08)

| Aspect | Design |
|--------|--------|
| Sidebar item | "Certificates" under the main navigation group (Plan 08) |
| Active state | When on `/certificates/*`, the "Certificates" sidebar item is highlighted |
| Icon | `WorkspacePremiumOutlined` or `SchoolOutlined` (Material icon, `*Outlined` suffix per MUI v9) |
| Tooltip | "Certificates" / "الشهادات" |

### 10.3 Permission Integration (C.3 fix — uses canonical `AppPermission` keys)

> **C.3 fix:** Permission checks use canonical `AppPermission` keys from Plan 02, NOT free-form server booleans. Role→permission mapping is owned by Plan 02's permission group seeding. This plan does NOT hardcode role matrices.

| AppPermission Key | Server-Side Source | Client-Side Usage |
|-------------------|--------------------|--------------------|
| `AppPermission.CertificateView` (`certificates.view`) | Plan 02 permission service | Gates page access; `requirePermissionForPage` in `page.tsx` |
| `AppPermission.CertificateManage` (`certificates.manage`) | Plan 02 permission service | Gates download, print, re-issue actions |
| `AppPermission.CertificateRevoke` (`certificates.revoke`) | Plan 02 permission service | Gates revoke action |
| `AppPermission.CertificateGenerate` (`certificates.generate`) | Plan 02 permission service | Gates re-generate / trigger PDF render |

> **Downloads** controlled by `CertificateView` OR `CertificateManage` (NO separate `CERTIFICATES_DOWNLOAD` permission — per INTER_PLAN_CONTRACTS.md).
> **Re-issue** controlled by `CertificateGenerate` (creates a new certificate, same as generation flow).
> **Audit trail visibility**: `CertificateManage` gates the timeline section. Teacher row-level filtering (only own actions) is resolver-side in Plan 05, NOT a client boolean.
> **Client-side check**: use existing `usePermission(AppPermission.CertificateRevoke)` pattern or server-returned `permissionFlags` object in the query — pick one pattern and use consistently. Recommended: server-returned flags (works for impersonated/admin contexts).

### 10.4 Server-Side Authorization (Plan 5 Integration)

The `CertificateDetailQuery` returns a `permissionFlags` object computed server-side from `PermissionsService.hasPermission()`:

| Flag | Computed From | Notes |
|------|---------------|-------|
| `canDownload` | `CertificateView` OR `CertificateManage` | Per INTER_PLAN_CONTRACTS |
| `canPrint` | `CertificateManage` | Print is a management action |
| `canRevoke` | `CertificateRevoke` | Specific revoke permission |
| `canReissue` | `CertificateGenerate` | Re-issue = new generation |
| `canViewAudit` | `CertificateManage` | Audit trail for managers |
| `canRegeneratePdf` | `CertificateGenerate` | Re-render trigger |

> **C.3 note:** Teacher audit filtering (only own actions) is resolver-side in Plan 05. `canViewAudit` only gates section visibility. The resolver filters `WHERE actor_id = ctx.userId` for teacher roles.

### 10.5 Mobile Layout Specification

| Aspect | Mobile Design |
|--------|--------------|
| Container | `MobilePageContainer` |
| Header | `MobilePageHeader`: back arrow, `certificateNumber` title, status badge (small), overflow menu |
| Overflow menu | `IconButton` with `Menu`: Download (PDF/PNG/JPG submenu), Share, Print, Revoke/Re-issue (based on permissions) |
| Certificate preview | Full-width, pinch-to-zoom (CSS `touch-action: pinch-zoom`), max-height 60vh |
| Info sections | MUI `Accordion` components: Overview, Status, Verification, Actions |
| Overview accordion | Fields: certificate number, template, recipient, grade level, issue date, expiry date |
| Status accordion | Status badge + status timeline (compact) |
| Verification accordion | Verification link (read-only `TextField`), copy button, QR code (200x200), open link button |
| Actions accordion | Download menu (PDF/PNG/JPG), Share button, Revoke/Re-issue buttons (permission-gated) |
| Status timeline | Full-width below accordions, paginated with "Load More" button |
| Bottom action bar | `AppBar position="fixed"` with Download + Share buttons (primary actions) |
| Share dialog | Full-screen `Dialog` on mobile: copy link, email, WhatsApp, download QR as PNG |
| QR code | Inside "Verification" accordion — 200x200 SVG, with "Download QR" button |
| Print frame | Off-screen iframe, same technique as desktop |

### 10.6 Desktop Layout Specification

| Area | Content |
|------|---------|
| Container | `PageContainer` with `maxWidth="lg"` |
| Header | `PageHeader`: breadcrumb (Certificates > `{certificateNumber}`), title, status badge |
| Breadcrumb | `BreadcrumbNav`: "Certificates" (links to `/certificates`) > certificate number. NOTE: Plan 16 list store is non-persisted; if user opens detail in new tab, breadcrumb back to list lands on default view (no preserved filters). This is acceptable — document it (C.13). |
| Main layout | Split: `Grid` 2-column (left 8/12, right 4/12) |
| Left column | `<CertificatePreview />` — large, zoomable (CSS `transform: scale()` with zoom controls), renders certificate as it appears |
| Right column (sticky) | `<CertificateInfoPanel />` with sections: |
| — Overview section | Fields: certificate number, template (name, version, category, orientation), recipient (name, ID, grade level), issue date, expiry date, completion date, created by, created at |
| — Status section | Status badge + `<StatusTimeline />` (paginated, sorted, expandable entries) |
| — Verification section | `<QrCodeDisplay />` (200x200 SVG), `<VerificationLinkCopy />` (link + copy button), "Open Verification Page" link |
| — Actions section | `<CertificateActionsBar />`: `<DownloadMenu />` (PDF/PNG/JPG dropdown), Share button (opens `<ShareDialog />`), Print button, Revoke button (permission-gated, opens `<RevokeDialog />`), Re-issue button (visible when status = revoked, opens `<ReissueDialog />`) |
| Print frame | Off-screen iframe at page bottom (C.6 technique) |
| Spacing | MUI `sx={{ p: 2 }}` on sections, card spacing `gap: 2` |
| Status badge colors | `pending` = warning, `issued` = success, `revoked` = error, `expired` = default, `failed` = error (theme palette only) |

---

## 11. API Integration Points

### 11.1 Apollo Cache Strategy (C.4 + C.9 fixes)

| Operation | Document | fetchPolicy | nextFetchPolicy | Notes |
|-----------|----------|-------------|------------------|-------|
| Detail query | `CertDetailQueryDocument` | `cache-first` | — | Apollo cache normalization on `id` |
| Audit trail query | `CertAuditTrailQueryDocument` | `cache-and-network` | `cache-first` | Paginated; avoids refetch on focus when no filter change (C.9) |
| PDF status poll | `CertPdfStatusQueryDocument` | `no-cache` | — | Polls every 3s; no token mint, just `pdfExists` check (C.4) |
| Download URL mutation | `CertCreateDownloadUrlMutationDocument` | `no-cache` | — | One-shot token mint; always fresh per click (C.4) |
| Image download URL mutation | `CertCreateImageDownloadUrlMutationDocument` | `no-cache` | — | Same single-use token model for PNG/JPG |
| Revoke mutation | `CertRevokeMutationDocument` | `update` cache write | — | Write updated status to cache; `refetchQueries` for audit trail |
| Re-issue mutation | `CertReissueMutationDocument` | `update` cache write | — | Same as revoke; new cert ID triggers cache merge |
| PDF render trigger | `TriggerPdfRenderMutationDocument` | `no-cache` | — | Fire-and-forget; returns `renderId` for polling |

### 11.2 Mutation Cache Updates (Revoke / Re-issue)

**Revoke:** `update` function writes the updated certificate (status = `revoked`) back to the `CertDetailQuery` cache. Also triggers `refetchQueries: [{ query: CertAuditTrailQueryDocument, variables: { certId } }]` to load the new `revoked` audit entry.

**Re-issue:** `update` function writes the new certificate to the cache with its new `id`. The old certificate's cache entry remains (status = `revoked`). The user is navigated to the new certificate's detail page (`router.push(/certificates/${newId})`).

### 11.3 PDF Render Polling (C.4 fix)

When `TriggerPdfRenderMutation` returns `success: false` and a `renderId` (render is async), the client polls `CertPdfStatusQueryDocument` (NOT `DownloadCertificateUrlQueryDocument`) every 3 seconds for up to 30 seconds. Once `pdfExists === true`, the download proceeds by calling `CertCreateDownloadUrlMutation` to mint a fresh single-use token. If timeout occurs, `downloadError` store state is set to `PDF_RENDER_TIMEOUT` with a Retry button.

> **C.4 critical:** The polling query (`CertPdfStatusQuery`) checks PDF existence WITHOUT minting a token. The actual download always mints a fresh single-use `signedUrls` row via `CertCreateDownloadUrlMutation`. This avoids wasting storage rows on poll iterations.

### 11.4 Download Flow Sequence

1. User clicks Download → format (PDF/PNG/JPG)
2. Store: `setDownloading(true)`, `setDownloadFormat(format)`
3. For PDF: check `pdfExists` from cached detail query
   - If `pdfExists = false`: call `TriggerPdfRenderMutation` → poll `CertPdfStatusQuery` every 3s (max 30s)
   - If `pdfExists = true`: proceed to step 4
4. Call `CertCreateDownloadUrlMutation` (or `CertCreateImageDownloadUrlMutation` for PNG/JPG)
5. Browser `fetch(url)` → blob → create object URL → `<a download>` click
6. On success: `setDownloading(false)`, success toast
7. On error: `setDownloadError(errorCode)`, show error toast + Retry/Regenerate button

---

## 12. Testing Strategy

### 12.1 Integration Tests (frontend/common/graphql/test/)

| Test | Scope |
|------|-------|
| CertDetailQuery | Returns certificate fields, permission flags |
| CertRevokeMutation | Updates status to `revoked`, creates audit entry with `action: revoked` |
| CertReissueMutation | Creates new certificate, old cert remains `revoked`, creates audit entry with `action: reissued` |
| CertAuditTrailQuery | Returns entries in correct order, pagination works (first page + Load More) |
| CertPdfStatusQuery | Returns `{ pdfExists: boolean }` without minting token |
| CertCreateDownloadUrlMutation | Mints single-use URL, returns `{ url, expiresAt }` |
| CertCreateImageDownloadUrlMutation | Mints single-use URL for PNG/JPG |
| TriggerPdfRenderMutation | Returns `{ success, renderId }` for async rendering |

---

## 13. Dependencies

### 13.1 Plan Dependencies — Hard Dependency Table (C.2 fix)

> **C.2 fix:** The following table enumerates EXACTLY which fields/operations Plan 02 (types), Plan 05 (GraphQL), and Plan 07 (Storage) must expose for this page to function. Without these, the page cannot render.

#### Plan 02 / Plan 05 — `CertificateReturnType` fields required by Plan 18:

| Field | Type | Required For | Notes |
|-------|------|--------------|-------|
| `id` | UUID | Route param, cache key | Already in Plan 02 |
| `certificateNumber` | string | Header, breadcrumb, file naming | **VERIFY canonical name** — Plan 02 may use `serialNumber` or `verificationCode` for this. Plan 16 design calls it "certificate number". Plan 02 MUST declare this field. |
| `status` | `CertificateStatus` enum | Status badge | 5 canonical values: `pending`/`issued`/`revoked`/`expired`/`failed` |
| `verificationCode` | string | Verification URL, QR code | Already in Plan 02 |
| `recipientName` | string | Recipient section | **VERIFY**: Plan 02 uses `studentName` — confirm if this is renamed or same field |
| `recipientId` | string | Recipient section | **VERIFY**: Plan 02 uses `studentId` — confirm |
| `gradeLevel` | string | Recipient section | **Plan 02 must add** — currently not in ReturnType |
| `issueDate` | timestamp | Content section | Plan 02 may call this `issuedAt` — align naming |
| `expiryDate` | timestamp (nullable) | Content section | **Plan 02 must add** — currently not in ReturnType |
| `completionDate` | timestamp (nullable) | Content section | **Plan 02 must add** — currently not in ReturnType |
| `templateName` | string | Template info section | Denormalized — Plan 05 must join or Plan 01 must store |
| `templateVersion` | string | Template info section | Denormalized — same as above |
| `templateCategory` | string | Template info section | Denormalized — same as above |
| `templateOrientation` | `TemplateOrientation` enum | Print orientation, preview sizing | Denormalized — same as above |
| `createdByName` | string | Metadata section | Denormalized — Plan 05 must join users table |
| `createdAt` | timestamp | Metadata section | Already in Plan 02 |
| `updatedAt` | timestamp | Status tooltip | Already in Plan 02 |
| `pdfStorageKey` | string (nullable) | PDF existence check | **Plan 05 must expose** — `pdfExists = pdfStorageKey IS NOT NULL` |
| `permissionFlags` | object | Client-side action gating | Plan 05 must compute from `PermissionsService` (C.3) |

#### Plan 04 — Service layer operations required:

| Operation | Required For | Notes |
|-----------|--------------|-------|
| `revokeCertificate(id, reason, notes)` | Revoke flow | Already in Plan 04 — confirm signature |
| `reissueCertificate(id, reason?)` | Re-issue flow | **Plan 04 must add** — replaces `reactivateCertificate`; creates new cert with same template/recipient; status transitions: `revoked → pending → issued` (new cert). Old cert stays `revoked`. |

#### Plan 05 — GraphQL resolvers required:

| Resolver | Required For | Notes |
|----------|--------------|-------|
| `certificate(id)` | Detail query | Already in Plan 05 — must expose all fields above |
| `certificateAuditTrail(certId, pagination, sort)` | Timeline query | Must support pagination (C.9) |
| `revokeCertificate(input)` | Revoke mutation | Must return updated cert + audit entry |
| `reissueCertificate(input)` | Re-issue mutation | Must return new cert ID |
| `certificatePdfStatus(id)` | PDF poll query | Returns `{ pdfExists }` without token mint (C.4) |
| `createCertificateDownloadUrl(id)` | PDF download | Mints single-use `signedUrls` row (C.4) |
| `createImageDownloadUrl(id, format)` | PNG/JPG download | Mints single-use `signedUrls` row |
| `triggerPdfRender(id)` | Render trigger | Fire async render, returns `{ success, renderId }` |

#### Plan 07 — Storage / Signed URLs (C.4 fix):

| Requirement | Notes |
|-------------|-------|
| `signedUrls` table with single-use tokens | Already in Plan 07 |
| `claimSignedUrl(id)` atomic claim | Already in Plan 07 |
| Plan 07 fires `certificate_audits` row with `action = downloaded` on successful claim | **HARD REQUIREMENT** — Plan 18 does NOT fire download audit from client. Plan 07's `claimSignedUrl` path is the only place that observes a successful download. If Plan 07 doesn't audit, the promised "audit trail is complete" is broken. |

#### Other Plan Dependencies:

| Plan | Dependency Type | What's Needed |
|------|----------------|---------------|
| Plan 1 (Database Schema) | Hard | `certificates`, `certificate_audits`, `certificate_verifications` tables |
| Plan 6 (PDF Rendering Engine) | Hard | PDF render trigger endpoint, async render + storage of rendered PDFs |
| Plan 7 (Storage & Signed URLs) | Hard | Single-use token model, `claimSignedUrl`, download audit firing |
| Plan 8 (Sidebar) | Soft | "Certificates" sidebar item registered |
| Plan 9 (Template Management) | Soft | Templates only archived (never hard-deleted) so re-render always possible (C.5) |
| Plan 16 (Certificate List) | Soft | List store with search/filter state preservation for back navigation (non-persisted; new tab loses filters — documented in §10.6) |
| Plan 19 (Public Verification Page) | Soft | `/verify/[verificationCode]` route exists for QR code link target |

### 13.2 NPM Dependencies

| Package | Purpose | Version | Install |
|---------|---------|---------|---------|
| `qrcode` | Client-side QR code generation (SVG + PNG) | ^1.5.4 | `bun add qrcode` — NOT yet installed |
| `@types/qrcode` | TypeScript types for qrcode | ^1.5.5 | `bun add -D @types/qrcode` — required for tsgo |
| `@apollo/client` | GraphQL client (existing) | v4 | Already installed |
| `zustand` | State management (existing) | v4/v5 | Already installed |
| `@mui/material` | UI components (existing) | v9 | Already installed |

---

## 14. Risk Assessment

| # | Risk | Probability | Impact | Mitigation |
|---|------|------------|--------|-----------|
| 1 | PDF render polling exceeds timeout | Medium | Medium | Show "rendering in background" message; user can retry later |
| 2 | Browser print dialog behavior varies across browsers (C.6 fix) | Medium | Low | Off-screen iframe technique (NOT `display:none`); feature-detect `contentWindow.print`; fall back to opening PDF in new tab for unsupported browsers (Safari); honestly document that headers/footers/orientation are controlled by the browser's PDF viewer, not by iframe CSS |
| 3 | QR code library adds bundle size | Low | Low | Dynamic `import()` for `qrcode` to keep initial bundle smaller; `@types/qrcode` as devDependency |
| 4 | Single-use download token expired or already claimed before fetch (C.4 fix) | Low | Medium | Tokens are single-use with `expiresAt`; always mint a fresh token via `CertCreateDownloadUrlMutation` per download click. If token expired before fetch, auto-mint a new one and retry once |
| 5 | Apollo cache becomes stale after revoke/re-issue | Medium | Low | Use `update` mutation option for cache invalidation + `refetchQueries` for audit trail |
| 6 | QR code URL mismatch between on-screen QR and printed-on-PDF QR (C.13 fix) | Medium | High | Both must use `NEXT_PUBLIC_PUBLIC_BASE_URL` env var (NOT `window.location.origin`). Preview QR generated client-side using env var; printed PDF QR generated server-side (Plan 06) using same env var. |
| 7 | Field naming mismatch with Plan 02 ReturnType (C.2) | Medium | High | Hard dependency table in §13.1 enumerates all required fields with "VERIFY" notes. Implementation task must verify `certificateNumber` vs `serialNumber` and `recipientName` vs `studentName` against Plan 02 before coding. |
| 8 | Breadcrumb back-navigation loses list filters in new tab (C.13) | Low | Low | Document: Plan 16 store is non-persisted (in-memory); SPA navigation preserves filters, page refresh or new tab does not. Breadcrumb falls back to default list view. Acceptable for v1. |
| 9 | Audit trail query returns unbounded results for high-verification certificates (C.9) | Medium | Medium | Pagination with `LIMIT 50` + "Load More" button; `nextFetchPolicy: "cache-first"` to avoid refetch on focus |

---

## 15. Design Decisions Log

| # | Decision | Date | Rationale |
|---|----------|------|----------|
| 1 | Lazy PDF render on download — split status check from token mint (C.4) | 2026-08-01 | Avoids pre-rendering all PDFs; `CertPdfStatusQuery` checks existence without minting token; `CertCreateDownloadUrlMutation` mints single-use token only when user actually downloads |
| 2 | Off-screen iframe for print (C.6) | 2026-08-01 | `visibility:hidden; position:fixed; left:-9999px` (NOT `display:none`) for cross-browser reliability; feature-detect `contentWindow.print`; fallback to opening in new tab for Safari; honest caveats re: headers/footers/orientation controlled by PDF viewer |
| 3 | Soft revoke with 5-value canonical status enum (C.1, C.7) | 2026-08-01 | 5 values: `pending`/`issued`/`revoked`/`expired`/`failed`; revoke transitions `issued → revoked`; re-issue creates new cert (does NOT transition old cert back to `issued`); optional reason for re-issue traceability |
| 4 | Client-side QR generation with SVG display + PNG download (C.13) | 2026-08-01 | Dynamic import `qrcode` v1.5.4; SVG at 200x200 for screen (CSS-scaled from 256px); PNG at 1024x1024 for download; `NEXT_PUBLIC_PUBLIC_BASE_URL` for URL consistency with printed PDF; error correction level M |
| 5 | Separate audit trail query with pagination (C.9) | 2026-08-01 | Keeps initial page load fast; pagination `LIMIT 50` + Load More prevents DoS on high-verification certificates; `cache-and-network` + `nextFetchPolicy: cache-first` |
| 6 | Zustand store for cross-tier dialog state; ViewModel for timeline-local state (C.8) | 2026-08-01 | Dialog state (revoke, re-issue, share) shared across desktop/mobile in store; `expandedAuditIds` moved to ViewModel `useRef` (timeline-local, one tier at a time); store NOT persist-wrapped |
| 7 | Server-side permission flags computed from `AppPermission` (C.3) | 2026-08-01 | Server computes flags from `PermissionsService.hasPermission()` using canonical `AppPermission.CertificateView`/`Manage`/`Revoke`/`Generate` keys; client hides buttons based on flags; works for impersonated/admin contexts; avoids hardcoding role matrices that drift from Plan 02 seeds |
| 8 | Arabic pluralization for event count | 2026-08-01 | Correct Arabic grammar for audit entry count (zero, singular, dual, plural rules) |
| 9 | Share dialog: copy link, email, WhatsApp, download QR as PNG | 2026-08-01 | One-stop sharing interface; SMS/WhatsApp via `mailto:` and `https://wa.me/` deep links; QR download at 1024x1024 PNG for print quality |
| 10 | Download menu: PDF (high quality), PNG (image), JPG (compressed) | 2026-08-01 | Three format options serve different use cases; PDF for archival/printing, PNG for high-quality image embedding, JPG for compressed sharing; all use single-use token model from Plan 07 |
| 11 | UUID validation before Apollo query (C.12) | 2026-08-01 | `page.tsx` validates `certificateId` against UUID v4 regex before rendering client component; invalid UUID → `notFound()` without wasteful GraphQL call |
| 12 | Use existing `formatDate` (Intl-based) — defer Hijri (C.10) | 2026-08-01 | `frontend/common/components/intl/dateFormat.ts` already handles en/ar via `Intl.DateTimeFormat`; no `date-fns` Hijri plugin needed for v1; Arabic-Indic digits handled by Intl; Hijri deferred to future if stakeholders confirm need |


---

## Reality Check Notes

> Verified against the actual codebase at `/home/ahmed/Projects/siraj-cert/` on 2026-08-02.

### Corrections applied to this plan

1. **Store path `frontend/stores/` → `frontend/common/stores/`** (CRITICAL)
   - Verified: `frontend/stores/` does **NOT** exist. Stores live at `frontend/common/stores/` with camelCase `{entity}Store.ts` naming (see `frontend/common/stores/AGENTS.md`).
   - Fixed: `frontend/stores/certificateDetailStore.ts` → `frontend/common/stores/certificateDetailStore.ts`; `frontend/stores/__mocks__/certificateDetailStore.ts` → `frontend/common/stores/__mocks__/certificateDetailStore.ts`; `@/frontend/stores/certificateDetailStore` → `@/frontend/common/stores/certificateDetailStore`; `frontend/stores/AGENTS.md` → `frontend/common/stores/AGENTS.md` (that file does not exist at the `frontend/stores/` path).

2. **i18n: removed string-based namespaces — use typed handles**
   - Verified: the codebase uses **handle-based** `useAppTranslation(NamespaceHandle)` from `@/shared/locale/client` and `getTranslations(locale).dashboardTranslations.{handle}` from `@/shared/locale` (server). There is **NO** `useAppTranslation("string.namespace")` overload and `getTranslations` takes a **single** `locale` arg (not `(locale, namespace)`).
   - Fixed: `useAppTranslation(Translation.Dashboard.CertificateDetail)` → `useAppTranslation(Translation.Dashboard.CertificateDetail)`; `useAppTranslation(Translation.Dashboard.CertificateDetail)` → `useAppTranslation(Translation.Dashboard.CertificateAudit)`; `getTranslations(locale).dashboardTranslations.certificateDetail` → `getTranslations(locale).dashboardTranslations.certificateDetail`; all `certificates.detail.*` namespace strings → flat `certificateDetail.*` / `certificateAudit` group references.
   - Namespace handles are **FLAT** under `Dashboard` (verified: `Translation.Dashboard.StaffDirectory`, etc., no nesting), so the detail namespace is `Translation.Dashboard.CertificateDetail`.

3. **i18n file paths: root `certificates.ts` → domain-folder dashboard layout**
   - The plan placed type/locale files at the repository root (`shared/locale/types/certificates.ts`, `shared/locale/en/certificates.ts`, `shared/locale/ar/certificates.ts`). Verified the actual layout is per-domain under `dashboard/`: `shared/locale/types/dashboard/{domain}/{feature}.ts`, `shared/locale/en/dashboard/{domain}/{feature}.ts`, `shared/locale/ar/dashboard/{domain}/{feature}.ts`.
   - Fixed: type schema → `shared/locale/types/dashboard/certificates/detail.ts`; en → `shared/locale/en/dashboard/certificates/detail.ts`; ar → `shared/locale/ar/dashboard/certificates/detail.ts`.
   - **NOTE for implementation**: also create `shared/locale/namespaces/dashboard/certificates/detail.namespace.ts` exporting `DashboardCertificateDetail` (and a separate `audit.namespace.ts` exporting `DashboardCertificateAudit` if audit keys are split), then register flat entries in `shared/locale/namespaces/translation.ts` (`Translation.Dashboard.CertificateDetail`) and `shared/locale/types/message.ts` (`certificateDetail: CertificateDetailLabels` on `DashboardTranslations`), and re-export handles from `shared/locale/namespaces/index.ts`. These registration steps were not enumerated — add them.

4. **Date formatting utility path fixed**
   - `shared/locale/dateFormat.ts` does **NOT** exist. The locale-aware date formatter is `frontend/common/components/intl/dateFormat.ts` (exports `formatDate`, `formatDateTime`, `formatTime`, `formatMonthYear`, using `Intl.DateTimeFormat` with Latin-locale tags — getLatnLocaleTag). Fixed all references to that path.
   - `date-fns` IS present (`^4.1.0`) — may still be used for parsing/formats, but the existing `dateFormat.ts` is Intl-based and already handles en/ar display. Prefer it for displayed dates rather than re-introducing a `shared/locale/dateFormat.ts`.

5. **Logger import path typo fixed**: `@/frontend/utils/logger` → `@/frontend/common/utils/logger`.

### Package dependency check (no edits needed — flagged)

- **`qrcode` is NOT installed** in `package.json`. Task T10 decision to install it (`bun add qrcode`) is correctly noted as conditional. Ensure `bun add qrcode` (and `@types/qrcode` for dev) runs before the QR generation task. Risk mitigation via dynamic import (DD-3) is sound.
- **`date-fns`** present (`^4.1.0`) ✅.
- **`pdf-lib`** present (`^1.17.1`) ✅ (used by Plan 6 rendering; not directly imported here).
- **No `file-saver`** package exists — download via blob URL + `<a download>` (REQ-18-02 step 2) must be implemented without a save-as library; that is fine.
- **No existing clipboard utility** in `frontend/common/utils` or `frontend/common/lib` — `CopyableUrl` will use `navigator.clipboard.writeText` directly (matches REQ verification assumption #6).

### Verified-correct (no change needed)

- **Three-location split** for the detail page: `frontend/common/views/dashboard/certificates/` + `frontend/desktop/views/dashboard/certificates/` + `frontend/mobile/views/dashboard/certificates/` — aligns with `staff/home/` and `teachers/students/` patterns.
- **Dynamic route** `app/(dashboard)/certificates/[id]/page.tsx` — matches existing `app/(dashboard)/students/[id]/page.tsx` dynamic-route pattern.
- **App Router page pattern**: `getServerUserContext`, `requirePermissionForPage`, `getLocale` from `@/shared/locale/server-cookies`, `getTranslations` from `@/shared/locale`, generate-lined metadata. Matches `app/(dashboard)/staff/page.tsx` and `app/AGENTS.md`.
- **AGENTS.md files** referenced exist: `frontend/AGENTS.md`, `frontend/common/stores/AGENTS.md`, `frontend/common/graphql/AGENTS.md`, `frontend/common/graphql/sharedDocuments/AGENTS.md`, `app/AGENTS.md`, `frontend/views/AGENTS.md`, `frontend/mobile/AGENTS.md`, `frontend/desktop/AGENTS.md`.

### Structural mismatch flagged (left for implementer)

- This plan atomizes shared sub-components flat under `frontend/common/views/dashboard/certificates/` (e.g. `AuditTimeline.tsx`, `CopyableUrl.tsx`, `QrPreview.tsx`). The dominant codebase pattern is sub-component folders/pair-files (`{feature}View.desktop.tsx` / `{feature}View.mobile.tsx` with a `components/` subdir for sub-pieces, as in `staff/home/components/managersDataGrid.desktop.tsx`). Reorganizing the detail-page sub-components into a comparable `components/` subfolder (or co-locating desktop/mobile variants) would better match neighboring views. The functional content is unaffected; this is a layout recommendation, not a correctness fix.

---

## SWE Expert Review Notes

> Expert SWE architectural review + codebase reality check layered on top of the existing "Reality Check Notes". Verified against `/home/ahmed/Projects/siraj-cert/` on 2026-08-02. Cross-refs Plans 01 (db enums/schema), 02 (types/permissions), 04 (services), 05 (GraphQL), 06 (PDF engine), 07 (storage/signed URLs), 16 (list), 17 (generation).

### C.1 Status enum contradicts the canonical Plan 02 — `ACTIVE` does not exist (CRITICAL)

Plan 02 §4.1 `CertificateStatus` defines exactly 5 lowercase db values: `pending`/`issued`/`revoked`/`expired`/`failed` (TS keys `PENDING`/`ISSUED`/`REVOKED`/`EXPIRED`/`FAILED`). This plan's design and requirements use a **3-value ACTIVE/REVOKED/EXPIRED** set everywhere:
- §3.3 revocation: "Revoke button visible only if `status === 'active'`" → must be `issued`.
- §5.1 `CertificateDetailQueryDocument.status` enum comment: "ACTIVE / REVOKED / EXPIRED" → must be `pending`/`issued`/`revoked`/`expired`/`failed`.
- §3.4 AuditTimeline icons include Reactivate → RestoreIcon — reactivate is `revoked → issued`. There is **no** restore-from-`expired` semantic in Plan 02's transition set (Plan 04 owns `ALLOWED_STATUS_TRANSITIONS`). Confirm with Plan 04 whether `expired` is reactivatable; this plan currently treats expired the same as revoked for Reactivate.
- `CertificateStatusBadge` "All 3 status colors" → must be 5.
- REQ-18-01 header "status badge (active/revoked/expired)" → fix to the 5-status set.

This is a **cross-plan contract break** with Plan 02 AND with Plans 16/17 (which use `pending`/`issued`/`revoked`/`expired` but invent `draft`). The three plans must align to one canonical set: `pending`, `issued`, `revoked`, `expired`, `failed`. **Action:** sweep this design.md and requirements.md for `ACTIVE`/`active` and `serial` (see C.2) and replace.

### C.2 `serial` / `certificateId` / `student*` field naming vs canonical Plan 02 ReturnType

Plan 02 §3 `CertificateReturnType` exposes `studentName`, `verificationCode`, `issuedAt`, `fileUrl`, `fileSize`, `status`, `id`, `createdAt`, `updatedAt`, `createdByUserId` (and `studentId`, `templateId`, `categoryId` UUIDs). This plan invents the following fields not in the canonical shape:
- `serial` (used ~15× for the header/breadcrumb/file naming) — verify Plan 05/02. If "certificate serial" is the human-readable ID, Plan 02 must declare it (it's called `verificationCode` there for verification, but a separate "certificate number" for display). Resolve against Plan 05 — likely the human-readable ID is `certificateId` (Plan 16's design) or a new `serialNumber` field in Plan 02's ReturnType to be added. The breadcrumb/filename code assumes it exists.
- `studentId` Plan 02 declares (string); fine. But `gradeLevel`, `templateVersion`, `templateCategory` (denormalized onto `certificates`), `createdByName`, `pdfExists` are surfaces this design assumes **without confirmation** — Plan 01's `certificates` table schema must declare those denormalized columns OR Plan 05 must derive/return them from joins.
- `expiryDate` / `completionDate` (REQ-18-01) — Plan 02 ReturnType must declare `expiryDate`/`completionDate`; Plan 02 §3 ReturnType list per the cross-cutting review does NOT show these explicitly. Either Plan 02 returns them (document the addition) or Plan 18 stops promising them.

**Action:** Add a hard dependency table in §13.1 enumerating EXACTLY which `CertificateReturnType` fields Plan 05 must expose for this page (serial-or-equivalent, gradeLevel, expiryDate, completionDate, templateName, templateVersion, templateCategory, templateOrientation, createdByName, pdfExists/fileUrl, canDownload/canPrint/canRevoke/canReactivate/canViewAudit). Without these, the page cannot render and the plan currently silently assumes them.

### C.3 Permission flags `canRevoke` etc. must map to `AppPermission` rules — not free-form server booleans (HIGH)

§10.4 declares `canRevoke = SUPER_ADMIN or ACADEMY_ADMIN`, `canDownload = ADMIN OR (TEACHER owns) OR (STUDENT owns)`, etc. Plan 02 §5.1 declares `AppPermission.CERT_VIEW`/`CERT_MANAGE`/`CERT_REVOKE`/`CERT_GENERATE` etc. These two MUST agree. Currently:
- `canRevoke` ↔ `AppPermission.CertRevoke`. Plan 02 owns permission group seed mapping for which roles get `cert.revoke`. Do NOT redefine "SUPER_ADMIN or ACADEMY_ADMIN" here arbitrarily — defer to Plan 02's role→permission seeding. Otherwise a new permission group assignment in Plan 02 silently makes Plan 18's hard-coded matrix stale.
- Plan 18 mints a NEW capability ("TEACHER can see audit entries only for actions they performed, not other users' actions") — this is **row-level audit filtering**, NOT a binary permission flag. It cannot be a single boolean; the `certificateAuditTrail` query must accept an `audience` argument OR the resolver must filter by `actorId = ctx.userId` for teachers (Plan 05). Plan 5 must support this. Add §10.4 footnote: "teacher audit filtering is resolver-side; `canViewAudit` only gates the section's visibility".
- Students/parents: `canViewAudit = false` for STUDENT/PARENT per §10.4, but REQ-18-01 lists a "Metadata" section which the requirement text doesn't say hides "created by" for students/parents. The `createdByName` field is metadata derivable; minor — but `canViewAudit` only hides audit timeline, not metadata. Clarify.

**Decision:** Either drive all 5 flags from `ctx.permissions` server-side (have Plan 05 compute them from the permission service, like `BillingViewHistory` is derived) OR remove the boolean flags entirely and have the client call `usePermission(AppPermission.CertRevoke)` via the existing `<RequirePermission>` helper. Mixing both creates drift. Pick one — recommended: server-side computation from `PermissionsService.hasPermission` (matches existing patterns) so the page works for impersonated/admin contexts too.

### C.4 Download security — the signed-URL model is single-use DB tokens, NOT a 5-min presign (HIGH)

Plan 18 §3.1 and Risk #4 assume an S3-style presigned URL with "5-minute expiry; regenerate URL on download click (always fetch fresh)". The actual codebase (`backend/db/repo/shared/signedUrl.repository.ts`, `backend/db/schema/storage/storage.ts` `signedUrls` table) is a **PostgreSQL-backed single-use token** model:
- `signedUrls` row has `id` (token), `filePath`, `expiresAt`, `used: boolean`, `contentHash`, indexes on `(used, expiresAt)`, `(filePath)`, `(contentHash)`.
- `claimSignedUrl(id)` uses `SELECT FOR UPDATE SKIP LOCKED`, verifies `expiresAt > now`, marks `used = true` atomically. **The signed URL is consumed on the first successful fetch.**
- That means `DownloadCertificateUrlQueryDocument` returning `url` must point to a backend route that **creates a fresh `signedUrls` row** per request (POST `/api/...?certId=…`) so each download click mints a new single-use token. A `fetchPolicy: "no-cache"` query that just returns a previously-minted URL is wrong — the URL was likely `used` already.
- Polling `DownloadCertificateUrlQueryDocument` (§11.3) every 3s is fine for "is the PDF rendered yet" (`pdfExists`) but the actual download must **always mint a fresh token**; otherwise the second `claimSignedUrl` returns `null` and the user sees a 404 even though the PDF exists. Plan 18 §5.5 query returns `{ url, expiresAt, pdfExists }` — confirm Plan 05/07 whether re-querying returns a NEW token each time or a stale one; the polling sequence in §3.1 ("Poll `DownloadCertificateUrlQueryDocument` every 3s → once `pdfExists === true`, download proceeds") re-runs the query to detect completion — each re-run mints a new signed URL row (storage waste) unless Plan 07 separates "PDF-exists check" from "mint-download-URL". Recommend Plan 07 expose TWO operations: `certificatePdfStatus(id) → { pdfExists }` (poll, no token mint) and `createCertificateDownloadUrl(id) → { url, expiresAt }` (one-shot, mints a `signedUrls` row). Update REQ-18-02 and §5.5 accordingly.
- Audit on download is correctly server-side (REQ-18-02 step 6) — but it MUST fire from Plan 07's `claimSignedUrl` path (the only place that observes a successful download), NOT from Plan 18 client code ("client does not call audit mutation" — §3.1 says right). Cross-plan: Plan 07 must insert the `certificate_audits` row with `action = DOWNLOAD` when `claimSignedUrl` succeeds. Flag this as a hard Plan 07 task. If Plan 07 doesn't audit, the promised "audit trail is complete" is a lie.

### C.5 Partial / corrupted PDF & "missing file" error handling — undefined

The reviewer asks specifically: PDF corrupted? storage file missing? template deleted? The plan handles PDF render failure but not these:
- **Storage file** referenced by `fileUrl` deleted out-of-band (manual S3 cleanup, retention policy). `pdfExists` is true in DB but the actual file is gone; the `signedUrls` `claimSignedUrl` → object GET returns 404 (S3 NoSuchKey) or the token `claimSignedUrl` succeeds but the storage GET fails. Plan 18 §3.1 "Error handling: Toast + Retry button" is generic. Specify an error code `PDF_OBJECT_MISSING` returned by Plan 07 and a clear user message "PDF file is missing on server, please trigger regeneration"; a "Regenerate PDF" button calls `TriggerPdfRenderMutation` to re-render & link. The "downloadError" store key needs distinct codes for retry-render vs file-actually-gone.
- **Corrupted PDF** (file present but invalid bytes — e.g. truncated upload, charset mishap, pdf-lib edge case): the browser's iframe/blob viewer will fail to load (`onError` / `onload` fires but viewer shows blank). Detect via iframe `error` event (print path, §3.2) or `blob.text().includes('%PDF')` heuristic for download (cheap, mostly reliable). Show `PDF_CORRUPTED` with Regenerate option.
- **Template deleted** (Plan 18 calls Plan 06 rendering which references the template). If a template is hard-deleted (NOT just archived) the certificate's denormalized `templateName`/`templateVersion` columns preserve display (good design) but if re-render is triggered (`TriggerPdfRenderMutation`) it may fail with `TEMPLATE_NOT_FOUND`. Add to error table: `TEMPLATE_NOT_FOUND` on re-render → "The original template no longer exists; the existing PDF cannot be rebuilt." Suggest Plan 09 only archives templates, never hard-deletes, to keep re-render always possible — flag to Plan 09.

### C.6 Print approach — `iframe.contentWindow.print()` reliability + heading

§3.2 plan: hidden `display:none` iframe, native browser PDF viewer, `iframe.contentWindow.print()` on `load`. Reality check:
- `display:none` iframes on **Safari and some Firefox versions** do NOT invoke print dialogs reliably for PDF content — the browser suppresses render of invisible frames. Use `visibility:hidden; position:fixed; left:-9999px; width:0; height:0; border:0` instead of `display:none`. Plan 18 should specify the off-screen technique, not `display:none`.
- `iframe.contentWindow.print()` only works reliably on Chrome; Safari's built-in PDF viewer in an iframe doesn't expose `contentWindow.print` to the parent in some versions. The "fallback" mentioned in Risk #2 ("fallback to opening PDF in new tab") should be the primary-on-unsupported-browser behavior: feature-detect, and for Safari use `window.open(presignedUrl)` then let the user print from the PDF viewer's toolbar.
- `@page { margin: 0 }` injection only applies to **HTML/CSS prints**, NOT to print of PDF loaded via `<iframe>` (the PDF viewer controls print margins, not the iframe's CSS). The "no headers/footers" promise cannot be delivered with iframe+PDF; the browser's print dialog has a "Headers and footers" toggle the user controls. Document this honestly: "removing headers/footers depends on the user's browser print dialog options; we cannot programmatically disable them."
- The `templateOrientation` for `@page { size: A4 landscape }` again only applies to HTML print; PDF viewer print uses the embedded page size of the PDF (which Plan 06 must bake in — flag to Plan 06). So §3.2's orientation handling is incorrect for the iframe+PDF approach. If true WYSIWYG orientation must be honored, the PDF generation (Plan 06) must emit the correct orientation embedded in the PDF.

**Action:** Either (a) clarify Plan 18 print as "open PDF, invoke print where supported, else open-in-tab" with the honest caveats above, or (b) switch the print approach to render an **HTML overlay** of the certificate fields (not the PDF) for printing — more flexible `@page` control, no PDF viewer dependency, but duplicated layout. Recommend (a) for scope. Update DD-2 and Risk #2.

### C.7 Revocation workflow multi-step correctness — confirm Plan 04 transition map

DED-3.3 "Soft revoke (status flag, not record deletion) allows reversibility." Plan 02 has `AllowStatusTransition` (modeled after student-lifecycle) owned by Plan 04. Plan 18 currently assumes ANY revoked certificate can be reactivated to "active". Verify with Plan 04:
- Is `expired → issued` a legal transition? If a cert is expired and an admin "reactivates", does it become `issued` (re-issued, new `issuedAt`?) or is it impossible to re-issue expired certificates (re-generation via Plan 17 needed instead)?
- Reactivation row's audit `action` = `REACTIVATE`. The audit `reason` for reactivation is **not collected** by the plan (only revoke collects a reason). Decide whether reactivation needs a reason — institutional accountability sometimes mandates a reason for reactivation, especially when the cert was revoked for `DISHONESTY`. Current draft allows reactivation without any rationale. Recommend adding an optional "reactivation reason" note for traceability. Confirm with stakeholders (REQ-18-05 references reactivate "always available" — verify the business owner).
- Optimistic UI on revoke returns "status to revoked immediately" — but if the revoke mutation in Plan 05 doesn't return the full updated `CertificateReturnType`, the optimistic cache write is partial. Confirm Plan 05 revoke return type. Same as Plan 16 (A.12) — cite that contract here.

### C.8 Zustand store — `expandedAuditIds: Set<string>` + non-persisted (OK, but state in store vs ViewModel)

The store design mixes UI dialog state (revoke/reactivate forms) with audit-timeline UI state (sort, expanded). Per `frontend/common/stores/AGENTS.md` (verified in Plan 16 review): the dominant pattern (`useStaffDirectoryStore`) keeps stores minimal — `{ filter, page, pageSize }` only — and view-local UI stays in the ViewModel hook / component. **Recommendation:**
- Keep in store: `revokeDialogOpen`, `revokeReason`/`revokeOtherReason`/`revokeNotes`, `isRevoking`, `reactivateDialogOpen`, `isReactivating` (cross desktop/mobile views both render these dialogs and need shared state).
- Move to `useCertificateDetailViewModel` `useRef`/local state: `expandedAuditIds` (timeline-local, only renders in one tier at a time), `auditSortOrder` (also timeline-local — store only if used by both tier views; the desktop+mobile both show audit, so keep in store), `activeDownloadCertId` (download flow local to action).
- `Set<string>` is non-serializable BUT the store is non-persisted (matches the AGENTS.md "non-persisted store" mitigation), so OK. Add a single-code-review-check comment confirming this store is NOT wrapped with `persist`.

### C.9 Audit trail query — pagination missing + caching policy mismatch

§5.2 `CertificateAuditTrailQueryDocument` returns `[AuditEntryReturnType]` (a flat array). For a long-lived certificate with hundreds of download/verify events this becomes a HUGE single array (verification events can fire many times per public viewer). Add **pagination**: `certificateAuditTrail(certId, paginationArgs, sort)` returning `{ rows[], totalCount, pageInfo }` (matching the codebase paginator pattern from Plan 16's reality check — `paginationArgs` + Laravel `pageInfo`). Alternatively cap with `LIMIT 100` + "Load more". An unbounded array is a denial-of-service vector on popular high-verification certificates. Update REQ-18-04 / §5.2 / §11.1 (`fetchPolicy: "cache-and-network"` is fine but add pagination).

§11.1 audit `fetchPolicy: "cache-and-network"` is fine for stale-while-revalidate, but with a `totalCount` pagination wrapper set `nextFetchPolicy: "cache-first"` to avoid refetching on every focus when there's no filter change.

### C.10 i18n: `date-fns` Hijri plugin assumed but not installed; date util is Intl-based

The existing `frontend/common/components/intl/dateFormat.ts` uses `Intl.DateTimeFormat` with `getLatnLocaleTag`, NOT `date-fns`. §9.6 says "Hijri future option via date-fns Hijri plugin" — but `date-fns` IS installed (`^4.1.0`, package.json), though the actual formatter uses `Intl`. For Arabic-Indic digits, `Intl.NumberFormat('ar-EG', { useGrouping: false })` handles digit conversion; the existing formatter uses `getLatnLocaleTag` so it emits Latin digits even for `ar`. REQ-18-01 says "Gregorian for en, Hijri option for ar" — but the existing `formatDate` outputs Gregorian with Latin digits for both locales (verified). If Hijri is truly required, a `formatHijriDate` helper must be added (using `Intl.DateTimeFormat('ar-SA-u-ca-islamic', …)`), NOT the date-fns Hijri plugin. Confirm with i18n stakeholders whether Hijri is in-scope for v1 or explicitly deferred; if deferred (the design marks it "(future)"), drop the §9.6 Hijri column from the implementation tasks to avoid a false dependency. Arabic-Indic digit rendering should still be enabled for Arabic (separate concern from calendar). Recommend: use existing `formatDate(date, locale)` for v1, defer Hijri, log a Plan-02/06 follow-up.

### C.11 "PageContainer" vs NotFound/AccessDenied components — only one exists

§8.2 references `<NotFound />` and `<AccessDenied />` full-page error states. Verified: only `frontend/common/views/dashboard/components/DashboardNotFoundContent.tsx` exists (a content component, not a route-level page). There is NO `AccessDenied` component in the codebase. **Action:**
- For 404 (cert not found): use `<DashboardNotFoundContent />` or compose into a route-level not-found page. Confirm what `app/(dashboard)/not-found.tsx` currently renders (file exists — checked) and route the detail page's not-found case to it rather than inventing `<NotFound />`.
- For 403 (access denied): no component exists. Either (a) reuse `DashboardNotFoundContent` with a "no access" variant/mode prop, or (b) add a small `DashboardAccessDeniedContent` component (in-scope for this plan). Pick one and document it; remove the dangling reference. The status-code-aware behavior (the detail query's GraphQL `error.extensions.code === 'NOT_FOUND'` vs `'FORBIDDEN'`) must dispatch to the right component — currently the plan just says "redirect to 404 if ID does not exist OR user lacks access" (REQ-18-01) which conflates 404 and 403. Split: cert-not-found → NotFound; user-owns-not → AccessDenied.

### C.12 route param — UUID validation before query

`[id]` is a UUID v4 per §10.1. The page.tsx should validate the param shape (`/^[0-9a-f-]{36}$/i`) BEFORE running the Apollo detail query; invalid → NotFound. Otherwise Apollo fires a query that the backend rejects with a parse error (wasteful and exposes GraphQL errors to the UI). Add to REQ-18-01: "If `id` is not a valid UUID, redirect to NotFound without calling the detail query."

### C.13 Remaining risks
- `qrcode` not installed (already flagged in existing Reality Check); the dynamic-import mitigation (DD-3 / Risk #3) is correct, but ensure `@types/qrcode` is also added as a devDependency or the `import type` will fail at `tsgo`. Also the QR URL must include the public verification route (Plan 19) — confirm the APP_DOMAIN env var exists (it's referenced in Plan 19 too). The `window.location.origin` fallback for QR is acceptable only for the verifier-page copy; the BAKED-INTO-QR URL should use the public domain (since a verifier scanning the QR on a printed certificate may scan years later when the admin's logged-in `window.location.origin` differs). Prefer `process.env.NEXT_PUBLIC_PUBLIC_VERIFY_BASE_URL` baked at cert-GENERATION time (server-side, Plan 06) into a QR-on-the-PDF, and Plan 18's preview QR mirroring that exact URL. Otherwise the on-screen QR ≠ printed-on-PDF QR mismatch is a correctness bug.
- Breadcrumb: §3.7 says "Certificate list store (Plan 16) preserves search/filter; navigating back restores" — but Plan 16's store is non-persisted (in-memory) AND only survives SPA navigation, NOT page refresh. A user who opens detail in a new tab → clicks breadcrumb → the store is fresh (no preserved filters). Document this limitation; the breadcrumb link to `/certificates` will land on the default list view in that case. Acceptable, but state it.
- `reactivateCertificate(id)` mutations in §5 — verify Plan 05 input shape (`input` object vs flat `id`); the plan is inconsistent (`RevokeCertificate` uses `$input: RevokeCertificateInput!`, `Reactivate` uses `$id: ID!`). Pick the convention Plan 05 standardizes and align all input mutations.

### Summary of edits required in this file
- Sweep `ACTIVE`/`active` → `issued`; expand status set to the 5 canonical values; align `CertificateStatusBadge` (3 colors → 5); fix §10.3 permissions to `AppPermission.Cert*` keys; defer role→permission mapping to Plan 02.
- §5.1 / §7.1: enumerate canonical `CertificateReturnType` fields Plan 05 must expose (serial-equivalent, gradeLevel, expiry/completion, denormalized template fields, fileUrl/pdfExists); add hard Plan 02/05 dependency.
- §3.1 / §5.5 download: split "PDF-status check" (pollable, no token mint) from "mint single-use download URL" (one-shot) — align with `signedUrls` + `claimSignedUrl` model; cross-plan: Plan 07 fires DOWNLOAD audit on successful claim.
- §3.2 print: replace `display:none` with off-screen technique; honest caveats re: PDF viewer print, headers/footers, orientation; or fall back to open-in-tab.
- §8 error: split 404 vs 403; reuse `DashboardNotFoundContent`; create `DashboardAccessDeniedContent` or reuse; add UUID validation; add `PDF_OBJECT_MISSING`/`PDF_CORRUPTED`/`TEMPLATE_NOT_FOUND` error codes + Regenerate flow.
- §5.2 audit: add pagination (`paginationArgs` + Laravel `pageInfo`); cap to avoid DoS on high-verification certs.
- §6 store: keep cross-tier dialog state in store; move timeline-local UI to ViewModel; confirm non-persisted; expect store mock via MSW not a manual mock unless verified.
- §9.6 dates: defer Hijri; use existing `formatDate`; Arabic-Indic via `Intl.NumberFormat`.
- §3.6 QR: bake verify URL from public env at print-time (server Plan 06); preview QR must match printed QR exactly.
- §3.3/§3.7 revoke/reactivate: confirm Plan 04 transitions; add optional reactivation reason; document breadcrumb store-preservation caveat (new tab loses filters).

---

# ADDENDUM: Enhanced Detail Page, Preview Viewer & Tabbed Panels (Phase 2)

**Added:** 2026-08-02
**Status:** Supplemental — adds the following components atop the original design (NO removals; augments T01–T12).

## 20. Certificate Detail Page (Presentation Shell)

**Component:** `CertificateDetailPage`
**File:** `frontend/views/dashboard/cert/certificates/detail/CertificateDetailPage.tsx`
**Route:** `/dashboard/cert/certificates/[id]`

### Layout

- **Breadcrumb**: `Certificates > Certificate #ABC123` (MUI Breadcrumbs; back link preserves Plan 16 filter state in-store for SPA navigation; C.7 caveat re: new tab losing store).
- **Header bar**:
  - Left: Certificate number rendered in monospace font, large size (`sx={{ fontFamily: 'monospace', fontSize: 24, fontWeight: 700 }}`); adjacent `CertificateStatusBadge` (5-color variant per C.1).
  - Right action cluster: Download PDF (`PdfDownloadButton`), Verify Online (opens public verify URL in new tab), Print (off-screen iframe technique from C.6), Revoke (opens `RevokeConfirmDialog`; hidden if `status === 'REVOKED'`).
- **Body**: Two-column responsive grid
  - Left column (60%, `xl={7}`): `CertificatePreviewViewer` — immersive, zoomable render of the issued PDF.
  - Right column (40%, `xl={5}`): `CertificateDetailsPanel` — four-tab details surface (`Overview`, `Variable Values`, `Audit Trail`, `Download History`).
- Below grid: `QrVerificationCard` (full width, centered) — QR preview + download QR PNG.

### Accessibility
- Header uses `<h1>` for certificate number; tab labels have `aria-label`.
- All action buttons expose `tooltip` and `aria-describedby` for screen reader users.
- The two-column layout collapses to stacked single column below `lg` breakpoint (MUI Grid `direction={{ xs: 'column', xl: 'row' }}`).
- Preview viewer modal/portal must restore focus on close and trap focus while open.

## 21. Certificate Preview Viewer

**Component:** `CertificatePreviewViewer`
**File:** `frontend/views/dashboard/cert/certificates/detail/CertificatePreviewViewer.tsx`
**Props:** `{ certificateId: string; pdfUrl: string | null }`

### Features
- **Zoom controls** (toolbar top-left): zoom in, zoom out, fit-to-screen, actual size (100%), zoom percentage label.
- **Pan**: click-and-drag to pan when zoomed in; cursor transitions to `grab`/`grabbing` (respect `prefers-reduced-motion`).
- **Rotate**: rotate 90° left/right; state held in `useCertificateDetailStore.rotation`.
- **Fullscreen**: enters browser fullscreen via `requestFullscreen()`; exit on `Esc` or toggle button.
- **Page navigation**: prev/next buttons + `Page X of Y` indicator (if multi-page PDF; disabled for single-page certs).
- **Download overlay**: persistent top-right `Download PDF` button pinned over the viewer canvas.
- **Print button**: opens browser print dialog (uses `window.print()` scoped to the preview iframe; falls back to `window.open(blobUrl)` when print fails — C.6 iframe pattern).
- Uses **`react-zoom-pan-pinch`** (new dependency — add to `package.json` devDeps + verify peer deps with React 19) OR a custom `useTransform` hook if peer deps block the library.

### Implementation Notes
- PDF rendering via `<iframe>` or `<object>` with `blob:` URL (created from the minted single-use signed URL — C.4 split-download pattern).
- Zoom/pan/rotate transforms applied via CSS `transform: scale(zoom) rotate(rotation) translate(...)` on a wrapper div.
- `prefers-reduced-motion`: disable pan/zoom animations (instant transitions).
- Mobile: pinch-to-zoom delegated to native gesture on the iframe wrapper; toolbar collapses to icon-only.

## 22. Details Panel (Tabbed)

**Component:** `CertificateDetailsPanel`
**File:** `frontend/views/dashboard/cert/certificates/detail/CertificateDetailsPanel.tsx`
**Tabs** (MUI `Tabs`):
1. **Overview** — `tab="overview"`
2. **Variable Values** — `tab="variables"`
3. **Audit Trail** — `tab="audit"`
4. **Download History** — `tab="downloads"`

Active tab retained in `useCertificateDetailStore.activeTab`; persistence is in-memory only (non-persisted store per C.8).

### 22.1 Tab 1: Overview

**Composite components**: `OverviewInfoCard` + `OverviewRecipientCard`.

#### OverviewInfoCard
- Certificate Number (TextField readonly, monospace, with copy icon button).
- Status (`CertificateStatusBadge` — canonical 5-value, C.1).
- Template Name (link to `/dashboard/cert/templates/[id]` opens template detail page).
- Issue Date (`formatDate(issuedAt, locale)` — Gregorian; C.10 defers Hijri).
- Expiry Date (formatted OR literal `"None"` when `expiresAt IS NULL`).
- Verification URL (TextField readonly + Copy icon button + Open-in-new-tab icon button; URL via `NEXT_PUBLIC_PUBLIC_BASE_URL` per C.13).
- Verification Code (TextField readonly + Copy icon button).

#### OverviewRecipientCard
- Name (with copy icon — `CopyOutlined` per MUI v9 naming).
- Email (with copy icon).
- Phone (conditional render — hidden if `recipientPhone IS NULL`).
- Recipient group (conditional — if `generatedFromGroup` flag true, render `Link` to recipient-group detail page).

### 22.2 Tab 2: Variable Values

**Component**: `VariableValuesTable`

- **Table schema**: `Variable Name | Template Default | Actual Value | Source`
- **Source badges** (chip components):
  - `Auto-mapped` (chip color: `primary`)
  - `Manual` (chip color: `secondary`)
  - `Static` (chip color: `default`)
  - `CSV column` (chip color: `info`, includes column name as subtitle)
- Renders all template variables and their resolved values for this certificate (joins `templateVariables` + `certificateVariableValues`).
- **"Export as CSV"** button: downloads the table contents as a CSV file (client-side conversion via `Blob` + `URL.createObjectURL`; filename follows Plan 16 naming convention).
- Empty state: `No variables defined for this certificate` (i18n key `cert.detail.variables.empty`).

### 22.3 Tab 3: Audit Trail

**Component**: `AuditTimeline`

- Vertical timeline using **MUI Timeline** (`@mui/lab/Timeline`).
- Each entry:
  - Timestamp (`formatDate(createdAt, locale)` + relative time e.g. `"2 hours ago"`).
  - Event type icon (canonical mapping per T08 Section 12.8):
    - `Created` → `AddCircleOutlined`
    - `Issued` → `VerifiedOutlined`
    - `Downloaded` → `DownloadOutlined`
    - `Emailed` → `EmailOutlined`
    - `Verified` → `CheckCircleOutlined`
    - `Revoked` → `BlockOutlined` (with reason chip)
    - `Viewed` → `VisibilityOutlined`
  - Description (i18n template per event type).
  - User (name + email; `System` label for system-triggered events).
- **For revoked entries**: chip with `reason` (i18n key; C.7 reactivation reason optional).
- **For verified entries**: includes source chip — `public page`, `QR scan`, `direct URL` (i18n keys).
- **Filter**: segmented control — `All Events`, `User Actions`, `System Events` (controlled by `auditFilter` store field).
- **"Export audit trail"** button: downloads as CSV (timestamp,event,user,description).
- Pagination: server-paginated per C.9 — `Load more` button appears when `hasMore === true`; `totalCount` shown.

### 22.4 Tab 4: Download History

**Component**: `DownloadHistoryTable`

- **MUI Table columns**: `Date | User | Format | IP Address | User Agent`
- Shows every `DOWNLOAD` audit event for this certificate (filtered by `action='DOWNLOAD'`).
- **Date** column sorts descending by default (server-sorted per C.9; no client toggle).
- **"Export download history"** button: downloads as CSV.
- Empty state: `No downloads recorded yet` (i18n key `cert.detail.downloads.empty`).
- Pagination: same pattern as audit trail (skip if events < page size; `loadMore` button when `hasMoreDownloads === true`).

## 23. Revoke Confirmation Dialog

**Component:** `RevokeConfirmDialog`
**File:** `frontend/views/dashboard/cert/certificates/detail/RevokeConfirmDialog.tsx`
**Props:** `{ open: boolean; certificateId: string; onClose: () => void; onRevoked: (cert: CertificateReturnType) => void }`

### Contents
- **Alert** (severity=`warning`): "Revoking this certificate will invalidate its verification code. Anyone who tries to verify it will see 'Revoked' status." (i18n key `cert.detail.revoke.warning`).
- **Reason select** (reuse Plan 16's `RevokeReasonSelect`; emits canonical reason enum — C.7 reasons).
- **Custom reason** (conditional TextField — shown when reason === `OTHER`; max 200 chars).
- **Notify recipient switch** (MUI `Switch`) — when ON, server sends revoke notification email to recipient.
- **Confirm revoke** button (MUI `LoadingButton`, color=`error`, i18n label `cert.detail.revoke.confirm`).
- **Cancel** button (text variant).

### Success
- Snack bar dispatched via global snackbar store: `Certificate revoked successfully` (i18n key `cert.detail.revoke.success`).
- `onRevoked(updatedCert)` called — caller writes the returned `CertificateReturnType` to Apollo cache (evict + refetch `CertificateDetail` query).
- Audit trail auto-refreshes via `cache-and-network` policy (T09 wiring).

## 24. PDF Download Button

**Component:** `PdfDownloadButton`
**File:** `frontend/views/dashboard/cert/certificates/detail/PdfDownloadButton.tsx`
**Props:** `{ certificateId: string; variant?: 'contained' | 'outlined' | 'text'; size?: 'small' | 'medium' | 'large' }`
**Default:** `variant='contained'`, `size='medium'`

### Behavior
- Click → calls `checkRenderStatus` (pollable, non-sensitive — C.4 split-download) → then `mintDownloadUrl` (single-use `claimSignedUrl`) → triggers `window.location = signedUrl` (browser-initiated download).
- Shows circular progress spinner inside button during download (replaces icon).
- Progress indicator: for large files, a linear progress bar appears below the button (visible when `downloadProgress > 0 && < 100`).
- On success: toast snackbar `Download started` (i18n key `cert.detail.download.started`); the actual download is browser-managed.
- On `PDF_OBJECT_MISSING` / `PDF_CORRUPTED` / `TEMPLATE_NOT_FOUND` errors: snackbar with **Retry** action button — Retry triggers the PDF regeneration flow (in-scope for Plan 18 per C.11 reality check).
- **Server-side**: DOWNLOAD audit event fires inside `mintDownloadUrl` resolver (Plan 07 reference — C.4 contract).
- Disabled state: shown when `pdfExists = false` OR `status === 'REVOKED'` (revoked certs cannot download).
- Tooltip explains disabled state (i18n key `cert.detail.download.disabled.tooltip`).

## 25. Zustand Certificate Detail Store (Enhanced)

**File:** `frontend/stores/useCertificateDetailStore.ts`

```typescript
interface CertificateDetailState {
  // Data
  certificate: CertificateReturnType | null;
  auditTrail: AuditEntryReturnType[];
  auditTotalCount: number;
  auditHasMore: boolean;
  downloadHistory: AuditEntryReturnType[];
  downloadHasMore: boolean;
  loading: boolean;
  error: string | null;

  // UI Tab
  activeTab: 'overview' | 'variables' | 'audit' | 'downloads';

  // Viewer state
  zoom: number;          // 0.5–3.0; default 1.0
  rotation: number;      // degrees; 0/90/180/270
  isFullscreen: boolean;

  // Revoke dialog
  revokeDialogOpen: boolean;
  revokeReason: string | null;
  revokeCustomReason: string;
  revokeNotifyRecipient: boolean;
  isRevoking: boolean;

  // Audit tab
  auditFilter: 'all' | 'user' | 'system';

  // Actions
  loadCertificate: (id: string) => Promise<void>;
  refreshAuditTrail: () => Promise<void>;
  loadMoreAudit: () => Promise<void>;
  loadMoreDownloads: () => Promise<void>;
  setActiveTab: (tab) => void;
  setZoom: (zoom: number) => void;
  resetZoom: () => void;
  setRotation: (deg: number) => void;
  rotateLeft: () => void;
  rotateRight: () => void;
  toggleFullscreen: () => void;
  downloadPdf: (certId: string) => Promise<void>;
  printCertificate: (certId: string) => Promise<void>;
  openRevokeDialog: () => void;
  closeRevokeDialog: () => void;
  setRevokeReason: (reason) => void;
  setRevokeCustomReason: (text) => void;
  setRevokeNotifyRecipient: (v: boolean) => void;
  revokeCertificate: () => Promise<void>;
  setAuditFilter: (filter) => void;
  reset: () => void;
}
```

### State Discipline (C.8 reinforced)
- Store is **NOT** wrapped with `persist` — confirm via a `// non-persisted: C.8 mitigation` comment at top.
- Dialog state stays in store (revoke dialog renders on both desktop + mobile views).
- Timeline-local UI (`expandedAuditIds`) stays in **ViewModel**, NOT store.
- `zoom`/`rotation`/`isFullscreen` in store so both desktop + mobile share viewer state.

## 26. QR Code Verification Display

**Component:** `QrVerificationCard`
**File:** `frontend/views/dashboard/cert/certificates/detail/QrVerificationCard.tsx`
**Props:** `{ verificationCode: string; certificateId: string }`

### Contents
- MUI `Card` containing:
  - QR code canvas (200×200px) — generates QR linking to public verification URL: `${process.env.NEXT_PUBLIC_PUBLIC_BASE_URL}/verify/${verificationCode}` (C.13 — NEVER `window.location.origin`).
  - "Scan to verify" caption below QR (i18n key `cert.detail.qr.caption`).
  - `Download QR Code` button (exports QR as PNG — canvas `toDataURL('image/png')` → browser download; filename `certificate-${certNumber}-qr.png`).
- QR rendered via `qrcode` package (T00 install task); `@types/qrcode` devDep for tsgo (T00 addendum).
- Memoized via `useMemo` on `verificationCode` prop to avoid re-render churn (C.13 cross-check).
- The displayed QR MUST exactly match the QR baked into the PDF at generation time (Plan 06) — enforcement: same env var source; add `// QR mirror invariant: Plan 06 / Plan 18 must use same base URL` comment.

---

## Round 4 Enhancement — Production Hardening

Round 4 extends the certificate detail & download experience with production-grade
interaction patterns: a full-screen zoom/pan viewer, multi-format export, share-link
lifecycle, revision history, timeline visualization, accessibility compliance, and an
auditable download trail with GDPR-aware tracking. All enhancements follow the layer
separation, MUI v9 sx-prop, and C.8 store discipline established in Rounds 1–3.

### R4.1 Zoom/Pan Gesture Support

**Component:** `CertificatePreviewViewer` (extended — Section 21)
**File:** `frontend/views/dashboard/cert/certificates/detail/CertificatePreviewViewer.tsx`

#### Gesture Matrix

| Input | Action | Implementation |
|-------|--------|----------------|
| Touch pinch (two-finger) | Zoom in/out | `onTouchMove` with two `touches`; compute scale delta from distance ratio; clamp 10%–400% |
| Touch swipe (single finger) | Pan | `onTouchMove` with single `touch`; translate delta to `panX`/`panY` store fields |
| Trackpad pinch | Zoom in/out | `onWheel` with `evt.ctrlKey === true`; `deltaY` maps to zoom delta; `preventDefault` to stop browser zoom |
| Trackpad two-finger scroll | Pan | `onWheel` with `evt.ctrlKey === false`; `deltaX`/`deltaY` map to pan delta |
| Mouse wheel | Zoom in/out | `onWheel` without `ctrlKey`; `deltaY < 0` zooms in, `deltaY > 0` zooms out; zoom toward cursor position |
| Mouse drag | Pan | `onMouseDown` sets `isPanning=true` + cursor becomes `grabbing`; `onMouseMove` updates `panX`/`panY`; `onMouseUp`/`onMouseLeave` ends pan |

#### Zoom Controls (Toolbar)
- **Zoom to fit**: computes scale so certificate fits viewport width/height; sets `zoom` to computed value + resets `panX`/`panY` to `0`.
- **Zoom to 100%**: sets `zoom=1.0` + resets pan.
- **Zoom slider**: MUI `Slider` (min=0.1, max=4.0, step=0.1) bound to `store.zoom`; label shows `${Math.round(zoom * 100)}%`.
- **Zoom in/out buttons**: `IconButton` with `ZoomInOutlined`/`ZoomOutOutlined` (MUI v9 naming); increment/decrement by 0.25; clamp.

#### Pan Bounds
- `panX` clamped to `[-(canvasWidth * zoom - viewportWidth) / 2, (canvasWidth * zoom - viewportWidth) / 2]` — can't pan beyond canvas edges.
- When `canvasWidth * zoom <= viewportWidth` (zoomed out fully), pan is disabled (no overflow).
- `panY` clamped symmetrically against `canvasHeight * zoom`.
- Bounds recomputed on `ResizeObserver` of the viewer container; stored in a `useRef` to avoid re-render churn.

#### CSS Transform
```
transform: translate(${panX}px, ${panY}px) scale(${zoom}) rotate(${rotation}deg)
transform-origin: center center
will-change: transform
transition: transform 200ms ease-out
```
- `prefers-reduced-motion: reduce` → `transition: none` (instant pan/zoom).

#### Store Additions (C.8)
```typescript
panX: number;          // default 0
panY: number;          // default 0
isPanning: boolean;    // default false
zoomTo: (zoom: number) => void;
zoomBy: (delta: number) => void;
setPan: (x: number, y: number) => void;
zoomToFit: (canvasW: number, canvasH: number, vpW: number, vpH: number) => void;
```
- Pan state lives in store (not ViewModel) so desktop + mobile viewers share gesture state (C.8 reinforced).

### R4.2 Full-Screen Viewer

**Component:** `CertificateFullscreenViewer`
**File:** `frontend/views/dashboard/cert/certificates/detail/CertificateFullscreenViewer.tsx`
**Props:** `{ open: boolean; onClose: () => void; certificateId: string }`

#### Layout
- MUI `Dialog` with `fullScreen` prop; `PaperProps` sx sets background to `theme.palette.background.default`.
- Top toolbar: `AppBar` (position=`sticky`):
  - Left: certificate number (monospace `Typography` sx={{ fontFamily: 'monospace' }}).
  - Center: zoom slider + rotate buttons + zoom-to-fit + zoom-to-100%.
  - Right: download menu (`PdfDownloadButton` inside `IconButton`), print button, close button (`CloseOutlined`).
- Content area: absolutely positioned wrapper holding the PDF `<iframe>`/`<object>` with transform applied (reuses `CertificatePreviewViewer` transform logic).

#### Keyboard Shortcuts
| Key | Action |
|-----|--------|
| `Escape` | Close dialog (`onClose()`) |
| `+` / `=` | Zoom in (`zoomBy(0.25)`) |
| `-` / `_` | Zoom out (`zoomBy(-0.25)`) |
| `0` | Zoom to 100% |
| `f` | Zoom to fit |
| `ArrowLeft` | Pan left (`panX -= 20`) |
| `ArrowRight` | Pan right (`panX += 20`) |
| `ArrowUp` | Pan up (`panY -= 20`) |
| `ArrowDown` | Pan down (`panY += 20`) |
| `r` | Rotate right 90° |

- Keyboard handler attached via `useEffect` listening on `window` when `open === true`; cleaned up on close.
- `aria-keyshortcuts` attribute on the dialog root announces shortcuts to screen readers.

#### Touch Swipe Pan
- Single-finger touch-drag translates to pan (shared with R4.1 gesture).
- Two-finger pinch zooms (shared).
- Swiping beyond pan bounds triggers a subtle bounce (CSS `transition` overshoot then snap back to bound).

#### Focus Trap
- MUI `Dialog` provides focus trap by default in v9 — verify `disableEnforceFocus={false}` (the default).
- Initial focus lands on the close button (`autoFocus` on `CloseOutlined` button).
- Tab order: toolbar buttons left→right, then content area.

#### Minimum Zoom
- `zoom` clamped to minimum 0.1 (10%) — below this the certificate becomes unreadable; UI prevents further zoom-out.

### R4.3 Download Format Options

**Component:** `DownloadFormatMenu`
**File:** `frontend/views/dashboard/cert/certificates/detail/DownloadFormatMenu.tsx`
**Props:** `{ certificateId: string; certificateNumber: string; anchorEl: HTMLElement | null; onClose: () => void }`

This replaces the single `PdfDownloadButton` in the toolbar with an `IconButton` + `Menu` pattern offering all formats.

#### Format Options

| Format | Backend Endpoint | Client Flow | Filename |
|--------|------------------|-------------|----------|
| PDF (single) | `mintDownloadUrl(format='PDF')` | split-download → browser save | `certificate-{number}.pdf` |
| PDF (multi-page) | `mintDownloadUrl(format='PDF_BUNDLE')` | ZIP of cert + related certs | `certificate-{number}-bundle.pdf` |
| PNG (300dpi) | `mintDownloadUrl(format='PNG', dpi=300)` | split-download → save | `certificate-{number}.png` |
| JPEG (quality slider) | `mintDownloadUrl(format='JPEG', quality=0.X)` | quality slider 50–100 client-side | `certificate-{number}.jpg` |
| JSON | `fetchCertificateExportJson` query | client-side `Blob` from JSON response | `certificate-{number}.json` |
| SVG | `mintDownloadUrl(format='SVG')` | split-download → save | `certificate-{number}.svg` |
| ZIP bundle | `mintDownloadUrl(format='ZIP')` | all formats + metadata.json | `certificate-{number}-bundle.zip` |

#### With/Without QR Code Toggle
- `Switch` labeled `Include QR code` in the menu footer.
- When OFF, backend renders PDF/PNG/JPEG without the QR overlay (query param `embedQr=false`).
- Default: ON (matches Plan 06 baked-QR invariant).
- For JSON format, QR toggle is disabled (JSON contains `verificationUrl` regardless).

#### JPEG Quality Slider
- MUI `Slider` (min=50, max=100, step=5, default=85) shown only when JPEG selected.
- Label: `Quality: {value}%`.
- Quality value passed to `mintDownloadUrl` as `quality` param.

#### Download Progress
- Linear `Progress` bar appears below menu when a download is in-flight (reuses `downloadProgress` store field).
- Menu closes after download triggers; progress bar persists on the main page toolbar until complete.

### R4.4 Certificate Timeline Visualization

**Component:** `CertificateTimeline`
**File:** `frontend/views/dashboard/cert/certificates/detail/CertificateTimeline.tsx`
**Mounted in:** Overview tab (below `OverviewInfoCard`).

A horizontal timeline complements the vertical `AuditTimeline` (Section 22.3) with a visual summary.

#### Timeline Events (canonical set)
| Event | Icon | Color |
|-------|------|-------|
| Created | `AddCircleOutlined` | `theme.palette.info.main` |
| Issued | `VerifiedOutlined` | `theme.palette.success.main` |
| Viewed | `VisibilityOutlined` | `theme.palette.text.secondary` |
| Downloaded | `DownloadOutlined` | `theme.palette.primary.main` |
| Shared | `ShareOutlined` | `theme.palette.secondary.main` |
| Verified | `CheckCircleOutlined` | `theme.palette.success.main` |
| Revoked | `BlockOutlined` | `theme.palette.error.main` |

#### Layout
- MUI `Timeline` with `position="horizontal"` (v9 supports horizontal).
- Each `TimelineItem` has a `TimelineSeparator` (icon in colored `Avatar`), `TimelineContent` (event label + timestamp), and a connecting `TimelineConnector` colored by severity gradient.
- Dense mode: when `events.length > 8`, collapses to icon-only (tooltip shows full details); expandable via a chevron button.

#### Event Metadata
- Each node's `Tooltip` shows: event type, timestamp (`formatDate`), actor (user name or `System`), and metadata (e.g., `IP: 1.2.3.4` for downloads, `source: QR scan` for verified).

#### Timeline Zoom
- A zoom control above the timeline adjusts the horizontal spread: 1x (dense) → 5x (expanded). Implemented via CSS `gap` on the timeline flex container: `sx={{ gap: `${zoom * 24}px` }}`.

#### Event Type Filter
- MUI `ToggleButtonGroup` (size=`small`) with: `All`, `Issued`, `Viewed`, `Downloaded`, `Verified`, `Revoked`.
- Filter stored in `store.timelineFilter`; timeline events re-derived client-side from full audit trail (no re-fetch — uses already-loaded `auditTrail` data).

### R4.5 Revision History

**Component:** `RevisionHistoryPanel`
**File:** `frontend/views/dashboard/cert/certificates/detail/RevisionHistoryPanel.tsx`
**Mounted in:** new Tab 5 `Revisions` in `CertificateDetailsPanel`.

#### Tab Addition
`CertificateDetailsPanel` gains a fifth tab: `Revisions` (`tab="revisions"`). Active tab handled by existing `store.activeTab` field.

#### Revision List
- MUI `List` of `ListItem` entries; each shows:
  - Revision number (e.g., `v3`), author avatar + name, timestamp.
  - Revision reason/note (if provided at creation time).
  - `Before` / `After` preview toggle (expands to show a diff snippet).
- Sort: descending by revision number (latest first).

#### Revision Actions
- **View**: expands a side-by-side diff (`react-diff-viewer` or simple `<Grid>` two-column layout).
- **Revert**: `LoadingButton` (color=`warning`) — calls `revertCertificateRevision` mutation with confirmation dialog; on success, Apollo cache evict + refetch `CertificateDetail`.
- **Compare**: multi-select two revisions → opens `RevisionCompareDialog` for side-by-side diff.

#### Diff View
- For template-level changes (variable values), shows a table diff: `Variable | Old Value | New Value`.
- For status changes, shows a chip diff: `Draft → Issued`.
- Uses `react-diff-viewer-continued` package (React 19 compatible); install in T00 update.

#### GraphQL Additions
- `CertificateRevisionType` (new Pothos object in `backend/graphql/pothos/certificate-revision.pothos.ts`).
- `revisions(certificateId): [CertificateRevisionType!]!` query (server-paginated).
- `revertCertificateRevision(revisionId): CertificateReturnType!` mutation.

### R4.6 Share Link Generation

**Component:** `ShareLinkDialog`
**File:** `frontend/views/dashboard/cert/certificates/detail/ShareLinkDialog.tsx`
**Props:** `{ open: boolean; certificateId: string; certificateNumber: string; onClose: () => void }`

#### Dialog Layout
- MUI `Dialog` (`maxWidth='sm'` `fullWidth`).
- Sections:
  1. **Link URL**: `TextField` readonly (full width, monospace) + `Copy` `IconButton` + `Open in new tab` `IconButton`.
  2. **Expiry**: `ToggleButtonGroup` — `1 day`, `7 days`, `30 days`, `Never`. Stores `expiresInDays` (null = never).
  3. **Password protection**: `Switch` + conditional `TextField` (type=`password`, min 8 chars). When ON, share link requires password entry on the public verification page.
  4. **QR code**: auto-generated QR of the share URL (200×200, same `qrcode` package); `Download QR` button.
  5. **Analytics**: shows current `viewsCount` and `uniqueVisitors` (fetched via `ShareLinkAnalyticsQueryDocument`); updates on dialog open.
  6. **Revoke**: `LoadingButton` (color=`error`) labeled `Revoke share link`; confirmation alert before revoking.

#### URL Format
```
${NEXT_PUBLIC_PUBLIC_BASE_URL}/share/${shareToken}
```
- `shareToken` is a cryptographically random URL-safe string (generated server-side).
- Public verification page (`app/[locale]/share/[token]/page.tsx`) resolves token → certificate (if not expired/revoked) → renders read-only certificate detail.

#### GraphQL Additions
- `generateShareLink(certificateId, expiresInDays?, password?): ShareLinkReturnType!` mutation.
- `revokeShareLink(shareLinkId): Boolean!` mutation.
- `ShareLinkReturnType`: `{ id, url, expiresAt, hasPassword, viewsCount, uniqueVisitors, createdAt }`.
- `ShareLinkAnalyticsQueryDocument` in `frontend/common/graphql/sharedDocuments/certificate-share.documents.ts`.

#### Store Additions
```typescript
shareLink: ShareLinkReturnType | null;
isGeneratingShareLink: boolean;
shareLinkDialogOpen: boolean;
generateShareLink: (certId, opts) => Promise<void>;
revokeShareLink: (linkId) => Promise<void>;
openShareLinkDialog: () => void;
closeShareLinkDialog: () => void;
```

### R4.7 QR Code Card (Enhanced)

**Component:** `QrVerificationCard` (extended — Section 26)

#### New Features
- **Standalone PNG download**: already in Section 26; add SVG download option (vector, scales to any size).
- **Academy branding overlay**: `Switch` labeled `Add academy logo overlay` — when ON, renders academy logo (from `tenant.academyLogoUrl`) as a semi-transparent watermark behind QR. Client-side canvas compositing.
- **Size selector**: MUI `Select` with options `Small (150px)`, `Medium (200px)`, `Large (400px)`. Updates canvas size + download dimensions.
- **Placement guide**: collapsible `Accordion` with a visual guide showing recommended QR placement on printed certificates (top-right, bottom-center, etc.) — static images from `public/assets/qr-placement/`.
- **QR in PDF metadata**: the verification URL embedded in PDF `/Metadata` via Plan 06 PDF gen (cross-reference — not a client-side change; documented as a Plan 06 follow-up).

#### Store Additions
```typescript
qrSize: 150 | 200 | 400;     // default 200
qrIncludeOverlay: boolean;    // default false
setQrSize: (size) => void;
toggleQrOverlay: () => void;
```

### R4.8 Accessibility

#### Viewer ARIA Roles
- `CertificateFullscreenViewer` root: `role="dialog"` `aria-modal="true"` `aria-label={i18n('cert.detail.viewer.ariaLabel')}`.
- Toolbar: `role="toolbar"` `aria-label={i18n('cert.detail.viewer.toolbar.ariaLabel')}`.
- Each zoom/rotate control: `role="button"` with `aria-label` (e.g., `Zoom in`).
- Zoom slider: `aria-label={i18n('cert.detail.viewer.zoom.ariaLabel')}` `aria-valuemin={10}` `aria-valuemax={400}` `aria-valuenow={Math.round(zoom*100)}`.

#### Keyboard Navigation (Tabs)
- `CertificateDetailsPanel` `Tabs`: full keyboard support — `Tab` to focus, `Arrow` keys to switch tabs, `Enter`/`Space` to activate (MUI v9 provides this natively; verify no `disableKeyboardNavigation`).
- Each tab panel: `role="tabpanel"` with `aria-labelledby` matching tab `id`.

#### Screen Reader for Certificate Metadata
- `OverviewInfoCard` fields: each `TextField` readonly has `aria-label` from i18n key (`cert.detail.overview.certificateNumber.ariaLabel`, etc.).
- Copy buttons: `aria-label={i18n('common.copy.ariaLabel')}`.
- Status badge: `aria-label={i18n('cert.status.' + status.toLowerCase())}`.

#### Focus Trap
- `CertificateFullscreenViewer` uses MUI `Dialog` default focus trap (verified `disableEnforceFocus={false}`).
- `RevokeConfirmDialog` and `ShareLinkDialog` same — no custom focus management needed.

#### Reduced Motion
- `prefers-reduced-motion: reduce` media query (via `sx` callback):
  ```typescript
  sx={(theme) => ({
    transition: 'none',
    '@media (prefers-reduced-motion: reduce)': { transition: 'none' },
  })}
  ```
- Applied to: zoom/pan transform, timeline slide-in, dialog transitions.

### R4.9 Loading & Error States

#### Skeleton Certificate Preview
- `CertificatePreviewViewer` initial render: MUI `Skeleton` variant=`rectangular` sized to the certificate aspect ratio (800×1131 for A4 portrait).
- Duration: skeleton visible until PDF iframe `onLoad` fires; then cross-fade to actual content.

#### Progressive Image Loading
- For PNG/JPEG previews: `img` with `loading="lazy"` + `decoding="async"` + a low-res placeholder (16×16 blur-up).
- Placeholder URL: backend serves a tiny LQIP version (`?w=16&format=jpeg&q=20`).

#### PDF Generation In-Progress Spinner
- When `checkRenderStatus` returns `PENDING`, show a `CircularProgress` overlay on the preview with message `Generating PDF…` (i18n `cert.detail.download.generating`).
- Polls every 2s (existing T06 poll; reused).

#### Download Progress Indicator
- Linear `Progress` (determinate) with `value={downloadProgress}` shown below the toolbar during split-download.
- Label: `${downloadProgress}%` right-aligned.
- Appears only when `0 < downloadProgress < 100`.

#### Corrupted Certificate Handler
- If `checkRenderStatus` returns `CORRUPTED` or iframe `onError` fires:
  - Preview area shows `Alert` severity=`error`: `This certificate appears to be corrupted` (i18n `cert.detail.preview.corrupted`).
  - `Regenerate PDF` `LoadingButton` — triggers `regeneratePdf` mutation → rechecks render status.
  - Disabled download buttons (all formats).

### R4.10 Performance Budgets

| Metric | Target | Measurement |
|--------|--------|--------------|
| Image preview render | < 500ms | `performance.mark/masure` around iframe `onLoad` |
| PDF download (start → save dialog) | < 3s | Time from click to browser save dialog |
| PNG download (300dpi) | < 2s | Time from click to save dialog |
| Timeline render (50 events) | < 100ms | `useDeferredValue` for filter; measure with Profiler |
| Share link generation | < 1s | Mutation round-trip |
| Full-screen transition | < 300ms | Dialog open → content visible |
| Zoom/pan frame budget | 60fps | `requestAnimationFrame` throttle; `will-change: transform` |
| Bundle size (all new R4 components) | < 40KB gzip | Dynamic import of viewer; tree-shake revision diff |

- All measurements logged via `logger.debug` with `performance.measure` results (NEVER `console.log`).

### R4.11 Print Preview

**Component:** integrated into `CertificatePreviewViewer` toolbar (no separate component).

#### Browser Print Integration
- Print button (`PrintOutlined` `IconButton`) calls `window.print()` after injecting print-only CSS.
- `window.print()` deferred until the certificate iframe is fully loaded (await `onLoad`).

#### Print-Only CSS
- Injected via a `<style>` tag added to `document.head` when print is triggered; removed after `afterprint` event.
```css
@media print {
  body * { visibility: hidden; }
  #certificate-print-area, #certificate-print-area * { visibility: visible; }
  #certificate-print-area { position: absolute; left: 0; top: 0; width: 100%; }
  @page { margin: 0; size: A4; }
}
```

#### Page Break Control
- Multi-certificate print (from list page): `page-break-after: always` between each certificate wrapper.
- Single certificate: no page breaks (fits one A4).

#### Header/Footer Removal
- `@page { margin: 0 }` removes browser headers/footers (URL, date, page number).
- Fallback: if browser still shows headers, instruct user in tooltip (i18n `cert.detail.print.pageSetup`).

### R4.12 Audit Trail (Download-Specific)

**Component:** extended `DownloadHistoryTable` (Section 22.4).

#### Download Audit Entries
- Every download (any format) logs an `AUDIT` entry server-side in `mintDownloadUrl` resolver:
  - `action: 'DOWNLOAD'`
  - `metadata: { format, ip, userAgent, withQr }`
- New columns in `DownloadHistoryTable`: `Format | IP Address | User Agent | With QR`.
- Existing `Date | User` columns retained.

#### IP Address Tracking (GDPR)
- IP stored in audit `metadata.ip` — truncated to `/24` (last octet zeroed for IPv4) to reduce PII exposure.
- **GDPR notice**: a `Snackbar`/`Alert` shown on first download: `Your IP address is logged for security purposes. See our privacy policy.` (i18n `cert.detail.download.gdpr.notice`); dismissible; remembered in `localStorage` to not re-show.
- Privacy policy link: `<Link href="/privacy">` (i18n `cert.detail.download.gdpr.privacyPolicy`).

#### User Agent Logging
- `metadata.userAgent` stores the browser UA string (used for analytics: browser distribution, mobile vs desktop).
- Displayed truncated in table (hover shows full string via `Tooltip`).

#### Consent Checkbox
- Before first download, a `FormControlLabel` checkbox: `I consent to having my download activity logged` (i18n `cert.detail.download.consent.label`).
- Stored in `localStorage` (`cert-download-consent=true`); if not checked, download button is disabled with tooltip explaining consent requirement.
- Once checked, remembered for the session (not re-prompted).

#### Store Additions
```typescript
downloadConsent: boolean;          // from localStorage
downloadGdprNoticeDismissed: boolean;
setDownloadConsent: (v: boolean) => void;
dismissGdprNotice: () => void;
```
- Persisted to `localStorage` directly (not via Zustand `persist` — one-off key).

### R4.13 Cross-Cutting GraphQL Schema Additions

New Pothos types and mutations required by Round 4 (summary; detailed in backend layer tasks):

| Type/Mutation | File | Purpose |
|----------------|------|---------|
| `CertificateRevisionType` | `backend/graphql/pothos/certificate-revision.pothos.ts` | Revision history objects |
| `revisions(certificateId)` query | same file | Paginated revision list |
| `revertCertificateRevision(revisionId)` mutation | same file | Revert to prior version |
| `ShareLinkType` | `backend/graphql/pothos/certificate-share.pothos.ts` | Share link objects |
| `generateShareLink(certId, opts)` mutation | same file | Create share URL |
| `revokeShareLink(linkId)` mutation | same file | Revoke share URL |
| `mintDownloadUrl` extended params | `backend/graphql/pothos/certificate-download.pothos.ts` | Add `format`, `dpi`, `quality`, `withQr` params |
| `fetchCertificateExportJson(certId)` query | `backend/graphql/pothos/certificate-export.pothos.ts` | JSON export data |

### R4.14 i18n Namespace Additions

New translation keys (in `shared/locale/` — compile-time typed):

| Namespace | Keys |
|-----------|------|
| `cert.detail.viewer` | `ariaLabel`, `toolbar.ariaLabel`, `zoom.ariaLabel`, `zoomToFit`, `zoomTo100`, `zoomIn`, `zoomOut`, `rotateLeft`, `rotateRight`, `close` |
| `cert.detail.download` | `format.pdf`, `format.png`, `format.jpeg`, `format.json`, `format.svg`, `format.zip`, `format.multiPdf`, `quality.label`, `includeQr`, `generating`, `started`, `consent.label`, `gdpr.notice`, `gdpr.privacyPolicy` |
| `cert.detail.timeline` | `created`, `issued`, `viewed`, `downloaded`, `shared`, `verified`, `revoked`, `filterAll`, `filterIssued`, etc. |
| `cert.detail.revisions` | `title`, `author`, `timestamp`, `reason`, `revert`, `revertConfirm`, `compare`, `diff.before`, `diff.after` |
| `cert.detail.share` | `title`, `url`, `expiry`, `expiry.1day`, `expiry.7days`, `expiry.30days`, `expiry.never`, `password`, `passwordHint`, `qr`, `downloadQr`, `revoke`, `revokeConfirm`, `analytics.views`, `analytics.visitors` |
| `cert.detail.qr` | `sizeSmall`, `sizeMedium`, `sizeLarge`, `overlay`, `placementGuide` |
| `cert.detail.print` | `pageSetup`, `multiCert` |
| `cert.detail.preview` | `corrupted`, `regenerate` |

### R4.15 Store Summary (C.8 Reference)

Final `CertificateDetailState` after Round 4 (additions to Section 25):

```typescript
// R4 additions to CertificateDetailState
panX: number;
panY: number;
isPanning: boolean;
zoomBy: (delta: number) => void;
zoomTo: (zoom: number) => void;
setPan: (x: number, y: number) => void;
zoomToFit: (canvasW: number, canvasH: number, vpW: number, vpH: number) => void;

// Timeline
timelineFilter: 'all' | 'issued' | 'viewed' | 'downloaded' | 'verified' | 'revoked';
setTimelineFilter: (filter) => void;

// Share link
shareLink: ShareLinkReturnType | null;
isGeneratingShareLink: boolean;
shareLinkDialogOpen: boolean;
generateShareLink: (certId: string, opts: ShareLinkOpts) => Promise<void>;
revokeShareLink: (linkId: string) => Promise<void>;
openShareLinkDialog: () => void;
closeShareLinkDialog: () => void;

// QR enhanced
qrSize: 150 | 200 | 400;
qrIncludeOverlay: boolean;
setQrSize: (size) => void;
toggleQrOverlay: () => void;

// Download consent + GDPR
downloadConsent: boolean;
downloadGdprNoticeDismissed: boolean;
setDownloadConsent: (v: boolean) => void;
dismissGdprNotice: () => void;
```

All state non-persisted (C.8 — `// non-persisted: C.8 mitigation` header comment). Dialog state in store; Viewer-local transient gesture state (`isPanning`) also in store so desktop + mobile share.
