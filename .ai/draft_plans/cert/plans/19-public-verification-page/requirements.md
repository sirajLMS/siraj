# Plan 19 — Public Verification Page

## Document Info

| Field | Value |
|-------|-------|
| **Feature** | Public Certificate Verification Page |
| **Plan #** | 19 |
| **Phase** | 4 — Certificate UI (parallel after Plan 5) |
| **Dependencies** | Plan 5 (GraphQL API — `verifyCertificate(code)` public query) |
| **Dependents** | Plan 20 (Testing & Quality), Plan 21 (Knowledge Propagation) |
| **Stakeholders** | Certificate recipients, external verifiers (employers, institutions), public QR-code scanners |
| **Related Docs** | `MASTER_ARCHITECTURE.md` (Entity Model — `certificate_verifications` table), `cgvs_analysis/01-generation-logic.md` (§13 verification system), `cgvs_analysis/07-auth-security-config.md` (rate limiting, security headers), `siraj_analysis/08-app-router-navigation.md` (route structure, public pages), `siraj_analysis/09-auth-permissions.md` (public queries — no auth scope), `siraj_analysis/06-i18n-system.md` (compile-time i18n, namespace pattern) |

## Introduction

### Overview

The public verification page is the external-facing endpoint of the Siraj certificate system. When a third party (employer, institution, or any member of the public) scans a QR code on a printed or digital certificate, they are redirected to `/verify/[code]` where the system looks up the certificate by its verification code and displays a verification result. This page is **not** under the `(dashboard)` route group, does not require authentication, and has its own layout (no sidebar, no dashboard shell). It is mobile-first since most QR scans happen on phones.

### Business Value

- **Trust & Authenticity**: Enables any third party to independently verify a certificate's authenticity without contacting the issuing academy
- **Fraud Prevention**: Revoked certificates are immediately flagged, preventing use of invalidated credentials
- **Institutional Credibility**: Public verification endpoint increases the value of Siraj-issued certificates
- **SEO & Sharing**: Open Graph tags allow certificate verification links to render rich previews in social media and messaging apps

### Scope

| In Scope | Out of Scope |
|----------|--------------|
| Public route `/verify/[code]` (no auth) | QR code generation (Plan 6 — PDF rendering) |
| Verification result display (valid/revoked/expired/not found) | Certificate generation flow (Plans 16-17) |
| Certificate preview card (visual representation, not PDF) | PDF download (Plan 18) |
| Verification logging to `certificate_verifications` table | Dashboard certificate management (Plan 16) |
| IP-based rate limiting on verification endpoint | Admin revocation workflow (Plan 4 — services) |
| SEO meta tags (Open Graph, Twitter cards) | Template editor (Plans 10-12) |
| Share functionality (copy link, social share buttons) | User authentication or session management |
| Mobile-first responsive design | Dark mode toggle (inherits cookie theme) |
| Loading and error states | |
| Print-friendly verification result | Email verification notifications |
| Full Arabic/English i18n | Backend verification query implementation (Plan 5) |
| WCAG 2.1 AA accessibility | |
| Rate-limit error handling and UI | |
| Academy branding (logo, name, contact) | |
| Language toggle (EN/AR — public page) | |
| Structured data (JSON-LD) for valid certs | |
| OG image from certificate render | |
| CDN caching / ISR | |
| Analytics source detection (QR/link/manual) | |
| Download button (if academy enables) | |

---

## Requirements

### FR-V1: Public Route Access

**FR-V1.1** — The system SHALL serve a public page at `/verify/[code]` that is accessible without authentication.

**FR-V1.2** — The page SHALL NOT be placed under the `(dashboard)` or `(auth)` route groups; it SHALL have its own minimal layout (no sidebar, no navigation shell, no auth guards).

**FR-V1.3** — The page SHALL NOT call `getServerUserContext()`, `requirePermissionForPage()`, or any auth-guarding helper.

**FR-V1.4** — The system SHALL detect the browser locale from cookie (`NEXT_LOCALE`) or `Accept-Language` header and render the page in the appropriate language (Arabic or English).

**FR-V1.5** — The page SHALL support a `?lang=ar` or `?lang=en` query parameter that overrides the detected locale for that render, and sets the locale cookie for subsequent visits.

**FR-V1.6** — WHEN a user navigates to `/verify` without a code segment, the system SHALL display a general verification landing page with a code-input form allowing manual entry of a verification code.

**FR-V1.7** — The `/verify/*` routes SHALL NOT be caught by any future authentication middleware. If a `middleware.ts` is added to the project, it MUST explicitly exclude `/verify/*` from auth redirects. No `middleware.ts` currently exists — this is a forward-compatible requirement.

**Acceptance Criteria — FR-V1:**
- Anonymous user (no cookies, no auth token) can access `/verify/SOME-CODE` and see a result
- No redirect to `/login` occurs
- Page renders LTR for English locale, RTL for Arabic locale
- `?lang=ar` query param sets `dir=rtl` and `lang=ar` on the HTML element
- `/verify` (no code) shows a form to enter a code

---

### FR-V2: Verification Result Display

**FR-V2.1** — WHEN the `verifyCertificate(code)` query returns a certificate with status `issued` and a valid issuance, the system SHALL display a "certificate valid" result card containing:
- Recipient full name
- Template title (certificate title)
- Issue date (formatted per locale)
- Issuing academy name
- Certificate ID (verification code)
- Verification date/time (current system time)
- Certificate preview (visual representation — not the PDF)

**FR-V2.2** — WHEN the `verifyCertificate(code)` query returns a certificate with status `revoked`, the system SHALL display a "certificate revoked" result with:
- Certificate details (same as valid, minus preview)
- Revocation date
- A visually distinct "revoked" state (red/danger color from theme palette)
- **NOTE**: `revocationReason` is NOT exposed publicly per INTER_PLAN_CONTRACTS §6 (constant-shape response — may contain PII / internal notes)

**FR-V2.3** — WHEN the `verifyCertificate(code)` query returns a certificate with status `expired`, the system SHALL display a "certificate expired" result with:
- Certificate details (same as valid, minus preview)
- Expiration date
- A visually distinct "expired" state (warning color from theme palette)

**FR-V2.4** — WHEN the `verifyCertificate(code)` query returns `null` (certificate not found), the system SHALL display a "not found" error state with a message indicating the verification code does not match any certificate.

**FR-V2.5** — WHEN the verification code format is invalid (wrong length, wrong character set), the system SHALL display a format-error state before making the API call, indicating the code format is incorrect.

**FR-V2.6** — The verification result SHALL NOT expose sensitive data: no recipient email, no recipient phone, no recipient address, no internal user IDs, no template element data, no recipient group information.

**FR-V2.7** — The system SHALL display the certificate status as a clearly labeled badge/pill using the theme palette status colors (success for valid, error for revoked, warning for expired).

**Acceptance Criteria — FR-V2:**
- Valid certificate: all 7 fields displayed, preview shown, status badge = "Valid" (green)
- Revoked certificate: details shown, revocation date shown (NOT revocation reason — §6), status badge = "Revoked" (red)
- Expired certificate: details shown, expiration date shown, badge = "Expired" (orange)
- Not found: error message displayed, no certificate info shown
- Invalid code format: format error before API call, no network request made
- No email/phone/address/internal IDs in the rendered output (verified via DOM inspection)

---

### FR-V3: Certificate Preview on Verification Page

**FR-V3.1** — The system SHALL display a visual preview of the certificate (rendered from template elements, NOT the PDF) for valid certificates.

**FR-V3.2** — The preview SHALL be an image-like representation using the template background color, template title, recipient name, and issue date rendered in a card component.

**FR-V3.3** — The preview SHALL NOT be an iframe or embedded PDF; it SHALL be a native React component rendering the key visual elements.

**FR-V3.4** — The preview SHALL be responsive — full-width on mobile, constrained to template aspect ratio on desktop.

**FR-V3.5** — The preview SHALL NOT be displayed for revoked or expired certificates (only for valid/issued certificates).

**Acceptance Criteria — FR-V3:**
- Valid certificate: preview card visible with template title, recipient name, issue date
- Revoked/expired: no preview rendered
- Mobile: preview spans full width
- No `<iframe>` or `<embed>` in the preview component

---

### FR-V4: Verification Logging

**FR-V4.1** — The system SHALL log every verification attempt to the `certificate_verifications` table, recording:
- Certificate ID (if found)
- Verification code submitted
- Verification result (valid, revoked, expired, not_found, invalid_format)
- Verifier IP address (from request headers — `x-forwarded-for` or connection IP)
- User agent string
- Timestamp (UTC)

**FR-V4.2** — Logging SHALL happen server-side within the GraphQL resolver or server component, NOT client-side.

**FR-V4.3** — Logging SHALL be non-blocking — a logging failure SHALL NOT prevent the verification result from being returned to the user.

**FR-V4.4** — The system SHALL NOT log sensitive verifier data (no cookies, no auth tokens, no browser fingerprint).

**Acceptance Criteria — FR-V4:**
- After a verification request, a row exists in `certificate_verifications` with correct IP, UA, timestamp, result
- If logging DB call fails, verification still returns result (no error to user)
- No cookies or auth tokens in the log row
- Multiple verifications create multiple log rows (no deduplication)

---

### FR-V5: Rate Limiting (Service-Level)

**FR-V5.1** — The system SHALL enforce rate limiting at the **service layer** (`CertificateVerificationService.verifySafe` and `verifyForMetadata`), NOT only at the GraphQL resolver level. This ensures both the client Apollo path AND the server-side `generateMetadata` path are protected.

**FR-V5.2** — The rate limit SHALL be two-tier:
- Per-IP: 30 requests per 5 minutes (configurable via `CERT_VERIFY_RATE_LIMIT_PER_IP`)
- Per-code: 10 requests per code per 24 hours (configurable via `CERT_VERIFY_MAX_ATTEMPTS_PER_CODE`)

**FR-V5.3** — WHEN the per-IP or per-code rate limit is exceeded, the system SHALL return the same response shape as `not_found` (`certificate: null`) — collapsed to prevent enumeration oracle attacks. The client SHALL display a "not found" result (not a rate-limit error message) to avoid signaling that the rate limit was hit.

**FR-V5.4** — A separate metadata-path rate limit SHALL be enforced for `generateMetadata` calls: 120 requests per minute (configurable via `CERT_VERIFY_METADATA_RATE_LIMIT_PER_MIN`). Exceeded requests return generic metadata (no certificate data).

**FR-V5.5** — Rate-limited requests SHALL NOT create a `certificate_verifications` log row (they are pre-service — no certificate lookup occurred). This prevents table bloat from bot traffic.

**Acceptance Criteria — FR-V5:**
- 31st request from same IP within 5 min → returns `not_found` shape (no rate-limit error message)
- 11th request for same code within 24h → returns `not_found` shape (collapsed — no REVOKED/EXPIRED oracle)
- Rate-limited requests do NOT create `certificate_verifications` rows
- Metadata path rate limit (120/min) returns generic metadata when exceeded
- Different IPs have independent rate-limit counters
- Rate limiting is enforced at the service layer, not only at the resolver (verified by calling `generateMetadata` path — also rate-limited)

---

### FR-V6: SEO Meta Tags

**FR-V6.1** — The page SHALL generate dynamic Open Graph meta tags for valid certificates:
- `og:title` — Certificate title and recipient name
- `og:description` — Verification confirmation text
- `og:image` — Template preview image (if available) or default Siraj logo
- `og:url` — Canonical verification URL
- `og:type` — `website`

**FR-V6.2** — The page SHALL generate Twitter Card meta tags:
- `twitter:card` — `summary_large_image`
- `twitter:title` — same as `og:title`
- `twitter:description` — same as `og:description`
- `twitter:image` — same as `og:image`

**FR-V6.3** — WHEN the certificate is not found or the code format is invalid, the page SHALL generate generic meta tags: "Verify Certificate — [Academy Name]" with default description, no certificate-specific data.

**FR-V6.4** — The `generateMetadata` function SHALL be a server-side function in the page module, using `getLocale()` for locale-aware meta content.

**FR-V6.5** — The meta tags SHALL be locale-aware — Arabic page generates Arabic meta content, English page generates English meta content.

**FR-V6.6** — The `og:image` for VALID certificates SHALL be the certificate render resized to 1200×630 pixels (from Plan 6's `CertificateRenderService` or a dynamically generated OG image via `next/og`). For non-valid results (revoked/expired/not-found), a static branded fallback `/og/cert-verify-default.png` SHALL be used. `og:image:width` and `og:image:height` meta tags SHALL be included.

**FR-V6.7** — The page SHALL include `<link rel="canonical" href="/verify/[code]">` (without `?lang=` query param) to deduplicate locale variants for search engines.

**FR-V6.8** — The page SHALL include `<meta name="robots" content="noindex, follow">` — verification pages are ephemeral per-certificate pages, not search destinations. `noindex` prevents SERP pollution; `follow` allows crawlers to follow academy links.

**Acceptance Criteria — FR-V6:**
- Valid certificate: `<meta property="og:title">` contains recipient name and certificate title
- Not found: `<meta property="og:title">` contains generic academy text
- Arabic locale: meta content is in Arabic
- `twitter:card` = `summary_large_image`
- `generateMetadata` runs server-side (no client-side meta injection)
- Valid: `<meta property="og:image">` points to certificate render (1200×630)
- Non-valid: `<meta property="og:image">` points to static fallback
- `<link rel="canonical">` present, does NOT include `?lang=` param
- `<meta name="robots" content="noindex, follow">` present in page source

---

### FR-V7: Share Functionality

**FR-V7.1** — The system SHALL display share buttons on the verification result page:
- Copy link button (copies canonical URL to clipboard)
- Share to WhatsApp button
- Share to X (Twitter) button
- Share to LinkedIn button
- Share to Telegram button
- Share to Facebook button

**FR-V7.2** — The copy link button SHALL use the Clipboard API and display a confirmation toast/snackbar on success.

**FR-V7.3** — Social share buttons SHALL open the platform's share dialog in a new tab/window with the verification URL pre-filled.

**FR-V7.4** — On mobile devices, the system SHALL also support the Web Share API (`navigator.share`) as a primary share method if available, falling back to individual buttons.

**FR-V7.5** — Share buttons SHALL be visible only when a verification result is displayed (not during loading or error states).

**Acceptance Criteria — FR-V7:**
- Copy link: clipboard contains the verification URL, toast appears
- WhatsApp button: opens `https://wa.me/?text=<URL>` in new tab
- Web Share API available: native share sheet appears
- Loading state: no share buttons visible
- RTL layout: share buttons ordered right-to-left

---

### FR-V8: Loading States

**FR-V8.1** — WHEN the verification query is in flight, the system SHALL display a loading state with a verifying animation (spinner or pulse animation) and a "verifying..." message.

**FR-V8.2** — The loading state SHALL include a skeleton of the verification result card (row placeholders for certificate details).

**FR-V8.3** — The loading state SHALL be accessible — `aria-busy="true"` on the container, `aria-live="polite"` for status announcements.

**FR-V8.4** — The system SHALL display the loading state immediately on page load (SSR) before the client-side Apollo query fires, using a server-rendered skeleton.

**Acceptance Criteria — FR-V8:**
- Page loads → skeleton visible immediately
- Query in flight → spinner + skeleton
- `aria-busy="true"` present on container during loading
- Transition from loading to result is smooth (no flash of empty content)

---

### FR-V9: Error States

**FR-V9.1** — WHEN the GraphQL query returns a network error, the system SHALL display a network error state with a "connection error" message and a retry button.

**FR-V9.2** — WHEN the GraphQL query returns a server error, the system SHALL display a generic server error message and a retry button.

**FR-V9.3** — WHEN the verification code format is invalid (wrong length/charset), the system SHALL display a format error without making a network request.

**FR-V9.4** — WHEN the rate limit is exceeded, the system SHALL display a rate-limit error with a countdown timer indicating when to retry.

**FR-V9.5** — All error states SHALL provide a retry mechanism (retry button or countdown auto-retry) and a link to manually enter a different code.

**FR-V9.6** — Error states SHALL be accessible — `role="alert"` on error containers, `aria-live="assertive"` for dynamic error content.

**Acceptance Criteria — FR-V9:**
- Network down: "connection error" message + retry button visible
- Server error (500): generic error + retry visible
- Invalid code format: format error, no network request (verified in dev tools)
- Rate limited: countdown timer visible, decrements every second
- All error containers have `role="alert"`

---

### FR-V10: Print-Friendly Output

**FR-V10.1** — The page SHALL support printing the verification result as proof via a "Print" button.

**FR-V10.2** — WHEN printing, the system SHALL use print-specific CSS that:
- Hides share buttons, navigation, and interactive elements
- Shows only the verification result card with certificate details
- Includes a "Verification Proof" header with date
- Uses print-friendly typography (serif fonts, black text on white)

**FR-V10.3** — The print layout SHALL include a verification watermark or seal indicator (text-based, e.g., "Verified by [Academy Name] on [date]").

**FR-V10.4** — The print button SHALL trigger `window.print()` and be hidden in the printed output itself.

**FR-V10.5** — WHEN printing a revoked certificate, the system SHALL render the `VerificationStatusBadge` prominently (high-contrast border, large text) and overlay a "REVOKED" watermark on the certificate preview. A printed revoked certificate that looks valid is a fraud vector — this is mandatory. Similarly, expired certificates SHALL print an "EXPIRED" watermark. The print button SHALL NOT be rendered for `NOT_FOUND` state (nothing to print).

**Acceptance Criteria — FR-V10:**
- Print button triggers browser print dialog
- Printed output: no share buttons, no interactive elements
- Printed output: verification result card + header + seal text
- Print CSS loaded via `@media print` rules
- Revoked cert print: "REVOKED" watermark prominently visible
- Expired cert print: "EXPIRED" watermark prominently visible
- NOT_FOUND state: no PrintButton rendered

---

### FR-V11: Accessibility (WCAG 2.1 AA)

**FR-V11.1** — All interactive elements (buttons, links) SHALL have visible focus indicators meeting WCAG 2.4.7 (Focus Visible).

**FR-V11.2** — Color contrast SHALL meet WCAG 1.4.3 (minimum 4.5:1 for normal text, 3:1 for large text and UI components).

**FR-V11.3** — The verification result status SHALL be communicated via both color AND text/aria-label (not color alone) per WCAG 1.4.1.

**FR-V11.4** — The page SHALL use semantic HTML landmarks: `<main>`, `<header>`, `<section>` with appropriate ARIA roles.

**FR-V11.5** — The loading and error states SHALL use `aria-live` regions for screen reader announcements.

**FR-V11.6** — The page SHALL be fully navigable via keyboard (Tab order logical, no keyboard traps).

**FR-V11.7** — Form inputs (manual code entry on `/verify`) SHALL have associated `<label>` elements per WCAG 3.3.2.

**Acceptance Criteria — FR-V11:**
- Lighthouse accessibility score ≥ 90
- Tab key navigates through all interactive elements
- Screen reader announces status changes (loading → result)
- Contrast checker passes for all text
- Status badges have `aria-label` text, not just color

---

### FR-V12: Manual Code Entry on `/verify`

**FR-V12.1** — The `/verify` page (no code) SHALL display a form with a text input for verification code and a submit button.

**FR-V12.2** — On submit, the system SHALL redirect to `/verify/[entered-code]`.

**FR-V12.3** — The form SHALL validate the code format client-side (minimum length, allowed character set) before redirect.

**FR-V12.4** — The form SHALL display a client-side validation error if the code is empty or format-invalid.

**Acceptance Criteria — FR-V12:**
- Empty input → validation error, no redirect
- Valid-format code → redirects to `/verify/[code]`
- Form input has `<label>` association
- Submit works via Enter key and button click

---

### FR-V13: Academy Branding

**FR-V13.1** — The verification page SHALL display academy branding on valid certificates: academy logo (MUI `Avatar`, falls back to initials if image fails) and academy name (Typography heading).

**FR-V13.2** — WHEN `academyContactEmail` is present in the verification response, the page SHALL display a `mailto:` link for the academy contact email. This is academy-configured (not automatic).

**FR-V13.3** — The page SHALL display a trust signal: "Verified by [academy name]" with the Siraj verification system branding.

**FR-V13.4** — Academy branding SHALL use the standard Siraj theme palette (no academy-specific theme override) for visual consistency.

**Acceptance Criteria — FR-V13:**
- Valid certificate: academy logo + name visible
- Academy with no logo: initials displayed in Avatar
- Academy with contact email: `mailto:` link rendered
- "Verified by [academy name]" trust signal displayed
- No academy-specific CSS theme override

---

### FR-V14: Language Toggle for Public Page

**FR-V14.1** — The verification page SHALL display a visible `LanguageToggle` component (EN/AR) because this is a PUBLIC page — the user may have arrived via a QR code without any app locale preference set.

**FR-V14.2** — The toggle SHALL use `router.replace('/verify/${code}?lang=ar|en')` to trigger a server-side locale cookie update (`NEXT_LOCALE`) and RSC re-render. No full page reload.

**FR-V14.3** — The `?lang=` query param SHALL be stripped from the canonical URL (via `rel=canonical`) to prevent duplicate-content SEO signals.

**FR-V14.4** — The toggle SHALL be accessible: `aria-label` on each toggle button ("Switch to English" / "Switch to Arabic").

**Acceptance Criteria — FR-V14:**
- LanguageToggle visible on all verification result states
- Clicking "AR" → page re-renders in Arabic (RTL), `NEXT_LOCALE` cookie set to `ar`
- Clicking "EN" → page re-renders in English (LTR), `NEXT_LOCALE` cookie set to `en`
- Canonical URL does NOT contain `?lang=` param
- Toggle buttons have `aria-label`

---

### FR-V15: Structured Data (JSON-LD)

**FR-V15.1** — The page SHALL include a `<script type="application/ld+json">` block with schema.org `EducationalOccupationalCredential` structured data for VALID certificates only.

**FR-V15.2** — The structured data SHALL include: `@type: EducationalOccupationalCredential`, `name` (certificate title), `credentialStatus: active`, `recognizedBy` (academy name), `dateCreated` (issue date), `expires` (expiration date if present), `url` (canonical verification URL).

**FR-V15.3** — Structured data SHALL NOT be rendered for revoked, expired, or not-found results (avoids signaling invalid credentials to crawlers).

**Acceptance Criteria — FR-V15:**
- Valid: JSON-LD script tag present in page source with `EducationalOccupationalCredential` type
- Revoked/expired/not-found: no JSON-LD script tag
- JSON-LD `credentialStatus` = `active` for valid certificates
- JSON-LD `url` matches canonical URL

---

### FR-V16: Download Button (Optional)

**FR-V16.1** — The page SHALL display a `DownloadButton` WHEN the academy has enabled public downloads for the certificate (indicated by `allowPublicDownload` flag in the verification response, provided by Plan 5).

**FR-V16.2** — WHEN `allowPublicDownload` is false or not present, the `DownloadButton` SHALL NOT be rendered.

**FR-V16.3** — The download SHALL trigger a certificate PDF download (from Plan 6's render service or Plan 18's download endpoint — cross-plan contract).

**Acceptance Criteria — FR-V16:**
- `allowPublicDownload: true` → DownloadButton visible
- `allowPublicDownload: false` → DownloadButton not rendered
- Click triggers PDF download

---

## Non-Functional Requirements (Extended)

### NFR-V5: Accessibility (WCAG 2.1 AA)

**NFR-V5.1** — The verification page SHALL conform to WCAG 2.1 Level AA success criteria.

**NFR-V5.2** — All interactive elements SHALL be keyboard accessible with visible focus indicators (MUI default focus ring meets this).

**NFR-V5.3** — Color contrast ratios SHALL meet 4.5:1 for normal text and 3:1 for large text against backgrounds. Status colors (success/error/warning) from the theme palette are pre-validated for WCAG AA.

**NFR-V5.4** — The page SHALL include proper ARIA landmarks: `<main>` for content, `<header>` for page header, `<footer>` for footer. LanguageToggle uses `role="group"` with `aria-label`. VerificationStatusBadge has `aria-label="Status: [valid/revoked/expired]"`. ErrorState has `role="alert"` and `aria-live="assertive"`. RateLimitError has `role="timer"` and `aria-live="assertive"`.

**NFR-V5.5** — All images SHALL have descriptive `alt` text. CertificatePreview: `alt="Certificate preview for [recipientName] — [certificateTitle]"`. Academy logo: `alt="[academyName] logo"`. Decorative icons use `aria-hidden="true"`.

**NFR-V5.6** — The page SHALL be fully navigable via keyboard: Tab order follows visual order (LanguageToggle → StatusBadge → AcademyBranding → CertificatePreview → MetadataPanel → ShareButtons → DownloadButton → PrintButton). No `tabindex` manipulation needed.

**NFR-V5.7** — Screen reader announcements: Loading state announces "Verifying certificate" (aria-busy). Rate limit countdown announces remaining seconds every 10 seconds (aria-live polite). Error states announce immediately (aria-live assertive). Success results announce "Certificate verified as [status]".

**Acceptance Criteria — NFR-V5:**
- axe-core automated scan passes with zero violations
- Manual keyboard navigation test passes (Tab, Shift+Tab, Enter, Escape)
- Screen reader test (NVDA/VoiceOver) announces all state changes correctly
- Color contrast validated via DevTools audit

### NFR-V6: Mobile Responsiveness

**NFR-V6.1** — The page SHALL be fully functional and visually correct from 320px to 1920px viewport width.

**NFR-V6.2** — Mobile layout (≤ 600px): Single-column stack, full-width certificate preview maintaining aspect ratio, accordion-based metadata panel, touch targets ≥ 44×44px (MUI Button size="large" on mobile), prominent WhatsApp share button.

**NFR-V6.3** — Desktop layout (> 600px): Two-column split (preview left 40%, details right 60%), centered max-width 800px container, grid-based metadata panel, full social share button row.

**NFR-V6.4** — Landscape mobile: Preview reflows to wider card, metadata accordion remains usable.

**NFR-V6.5** — RTL layout (Arabic): All flex/grid directions reverse, text alignment mirrors, LanguageToggle order swaps, share button order reverses.

**Acceptance Criteria — NFR-V6:**
- Chrome DevTools device toolbar: iPhone SE (375px), iPhone 14 Pro (393px), Pixel 7 (412px), iPad (768px), Desktop (1440px) all render correctly
- RTL mode (Arabic locale) renders mirrored layout correctly
- No horizontal scrolling at any breakpoint

### NFR-V7: Certificate Preview Rendering

**NFR-V7.1** — The CertificatePreview component SHALL render a visual representation of the certificate using only React/MUI components (no iframe, no PDF embed).

**NFR-V7.2** — The preview SHALL display: template background color, template title, recipient name, issue date. All positioned to match the template's visual design (centered, proportional to template dimensions).

**NFR-V7.3** — The preview SHALL maintain the template's aspect ratio (from `templatePreview.width` / `templatePreview.height`) using CSS `aspect-ratio` property.

**NFR-V7.4** — On valid certificates: A "VERIFIED" watermark SHALL be overlaid diagonally in semi-transparent text (theme `onSurface` color at 10% opacity).

**NFR-V7.5** — On revoked certificates: A "REVOKED" watermark SHALL be overlaid prominently (theme `error` color at 20% opacity, larger text).

**NFR-V7.6** — On expired certificates: An "EXPIRED" watermark SHALL be overlaid (theme `warning` color at 20% opacity).

**NFR-V7.7** — Right-click context menu SHALL be disabled on the preview area (`onContextMenu={e => e.preventDefault()}`) to discourage image saving of the visual representation.

**NFR-V7.8** — The preview SHALL be responsive: full-width on mobile (≤ 600px), constrained by aspect ratio on desktop (max 400px width in split layout).

**Acceptance Criteria — NFR-V7:**
- Preview renders correctly for portrait and landscape templates
- Watermark text matches status (VERIFIED/REVOKED/EXPIRED) with correct colors
- Aspect ratio maintained at all viewport sizes
- Right-click disabled on preview area
- No iframe or PDF dependencies

### NFR-V8: Print from Public Page

**NFR-V8.1** — The page SHALL provide a PrintButton that triggers `window.print()`.

**NFR-V8.2** — Print output SHALL include: Verification Proof header, "Verified by [academy] on [date]" seal, certificate metadata panel (all fields), verification status badge (high-contrast, no background color), status-specific watermark (VERIFIED/REVOKED/EXPIRED).

**NFR-V8.3** — Print output SHALL hide: ShareButtons, PrintButton, DownloadButton, LanguageToggle, AcademyBranding (logo), header/footer chrome, manual entry form.

**NFR-V8.4** — Revoked certificate print: Must NOT look valid. Print CSS MUST render the revoked status prominently (large text, high-contrast border) and overlay "REVOKED" watermark.

**NFR-V8.5** — Expired certificate print: Must display "EXPIRED" watermark prominently.

**NFR-V8.6** — Not-found state: No PrintButton rendered (nothing to print).

**NFR-V8.7** — Print typography: Serif font stack, black text on white background, no theme colors (except status watermarks).

**Acceptance Criteria — NFR-V8:**
- `window.print()` produces correct output for valid/revoked/expired states
- Print preview shows watermarks and status badges correctly
- Interactive elements hidden in print
- Revoked print does not resemble a valid certificate

---

## i18n Requirements

### Namespace: `certificates.verification`

This plan introduces a new i18n sub-domain under the `certificates` namespace. The translation keys below must be defined as typed interfaces in `shared/locale/types/` and implemented in both `ar/` and `en/` directories.

### Translation Keys

#### Page Labels

| Key | Type | Arabic (ar) | English (en) |
|-----|------|-------------|--------------|
| `page.title` | `string` | "التحقق من الشهادة" | "Certificate Verification" |
| `page.subtitle` | `string` | "تحقق من صحة الشهادة عبر رمز التحقق" | "Verify the authenticity of a certificate" |
| `page.verifyProof` | `string` | "إثبات التحقق" | "Verification Proof" |
| `page.verifiedBy` | `(academyName: string, date: string) => string` | `تم التحقق بواسطة ${academyName} في ${date}` | `Verified by ${academyName} on ${date}` |
| `page.manualEntryTitle` | `string` | "أدخل رمز التحقق" | "Enter Verification Code" |
| `page.manualEntryDescription` | `string` | "أدخل رمز التحقق الموجود على الشهادة للتحقق من صحتها" | "Enter the verification code found on the certificate" |
| `page.manualEntryPlaceholder` | `string` | "رمز التحقق" | "Verification code" |
| `page.manualEntrySubmit` | `string` | "تحقق" | "Verify" |

#### Status Labels

| Key | Type | Arabic (ar) | English (en) |
|-----|------|-------------|--------------|
| `status.valid` | `string` | "صالحة" | "Valid" |
| `status.revoked` | `string` | "ملغاة" | "Revoked" |
| `status.expired` | `string` | "منتهية الصلاحية" | "Expired" |
| `status.notFound` | `string` | "غير موجودة" | "Not Found" |
| `status.invalidFormat` | `string` | "تنسيق غير صالح" | "Invalid Format" |
| `status.rateLimited` | `string` | "طلبات كثيرة" | "Rate Limited" |

#### Result Labels

| Key | Type | Arabic (ar) | English (en) |
|-----|------|-------------|--------------|
| `result.valid.title` | `string` | "الشهادة صالحة" | "Certificate is Valid" |
| `result.valid.description` | `string` | "تم التحقق من صحة هذه الشهادة" | "This certificate has been verified as authentic" |
| `result.revoked.title` | `string` | "الشهادة ملغاة" | "Certificate is Revoked" |
| `result.revoked.description` | `string` | "تم إلغاء هذه الشهادة" | "This certificate has been revoked" |
| `result.revoked.dateLabel` | `string` | "تاريخ الإلغاء" | "Revocation Date" |
| `result.expired.title` | `string` | "الشهادة منتهية الصلاحية" | "Certificate is Expired" |
| `result.expired.description` | `string` | "انتهت صلاحية هذه الشهادة" | "This certificate has expired" |
| `result.expired.dateLabel` | `string` | "تاريخ الانتهاء" | "Expiration Date" |
| `result.notFound.title` | `string` | "الشهادة غير موجودة" | "Certificate Not Found" |
| `result.notFound.description` | `string` | "لم يتم العثور على شهادة بهذا الرمز" | "No certificate found with this verification code" |
| `result.invalidFormat.title` | `string` | "رمز غير صالح" | "Invalid Code" |
| `result.invalidFormat.description` | `string` | "تنسيق رمز التحقق غير صحيح" | "The verification code format is incorrect" |

#### Certificate Detail Field Labels

| Key | Type | Arabic (ar) | English (en) |
|-----|------|-------------|--------------|
| `fields.recipientName` | `string` | "اسم المستلم" | "Recipient Name" |
| `fields.certificateTitle` | `string` | "عنوان الشهادة" | "Certificate Title" |
| `fields.issueDate` | `string` | "تاريخ الإصدار" | "Issue Date" |
| `fields.expiryDate` | `string` | "تاريخ الانتهاء" | "Expiry Date" |
| `fields.issuingAcademy` | `string` | "الأكاديمية المُصدِرة" | "Issuing Academy" |
| `fields.certificateId` | `string` | "رقم الشهادة" | "Certificate ID" |
| `fields.verificationDate` | `string` | "تاريخ التحقق" | "verification Date" |
| `fields.status` | `string` | "الحالة" | "Status" |

#### Loading Labels

| Key | Type | Arabic (ar) | English (en) |
|-----|------|-------------|--------------|
| `loading.verifying` | `string` | "جارٍ التحقق..." | "Verifying..." |
| `loading.description` | `string` | "يتم الآن التحقق من صحة الشهادة" | "Checking certificate authenticity" |

#### Error Labels

| Key | Type | Arabic (ar) | English (en) |
|-----|------|-------------|--------------|
| `error.network.title` | `string` | "خطأ في الاتصال" | "Connection Error" |
| `error.network.description` | `string` | "تعذر الاتصال بالخادم. تحقق من اتصالك بالإنترنت" | "Could not connect to the server. Check your internet connection" |
| `error.server.title` | `string` | "خطأ في الخادم" | "Server Error" |
| `error.server.description` | `string` | "حدث خطأ في الخادم. حاول مرة أخرى لاحقاً" | "A server error occurred. Please try again later" |
| `error.rateLimited.title` | `string` | "طلبات كثيرة" | "Too Many Requests" |
| `error.rateLimited.description` | `string` | "لقد قمت بطلبات تحقق كثيرة. يرجى المحاولة مرة أخرى بعد" | "You've made too many verification requests. Please try again after" |
| `error.rateLimited.retryInSeconds` | `(count: number) => string` | pluralized | pluralized |
| `error.retry` | `string` | "إعادة المحاولة" | "Retry" |
| `error.enterDifferentCode` | `string` | "أدخل رمزاً آخر" | "Enter a different code" |

#### Rate Limit Pluralization

**Arabic** (`error.rateLimited.retryInSeconds`):
- `count === 0` → "الآن"
- `count === 1` → "ثانية واحدة"
- `count === 2` → "ثانيتان"
- `count >= 3 && count <= 10` → `${count} ثوان`
- `count > 10` → `${count} ثانية`

**English** (`error.rateLimited.retryInSeconds`):
- `count === 0` → "now"
- `count === 1` → "1 second"
- `count > 1` → `${count} seconds`

#### Share Labels

| Key | Type | Arabic (ar) | English (en) |
|-----|------|-------------|--------------|
| `share.title` | `string` | "مشاركة" | "Share" |
| `share.copyLink` | `string` | "نسخ الرابط" | "Copy Link" |
| `share.copied` | `string` | "تم نسخ الرابط" | "Link Copied" |
| `share.whatsapp` | `string` | "واتساب" | "WhatsApp" |
| `share.twitter` | `string` | "إكس" | "X" |
| `share.linkedin` | `string` | "لينكدإن" | "LinkedIn" |
| `share.facebook` | `string` | "فيسبوك" | "Facebook" |
| `share.telegram` | `string` | "تيليجرام" | "Telegram" |
| `share.nativeShare` | `string` | "مشاركة" | "Share" |

#### Print Labels

| Key | Type | Arabic (ar) | English (en) |
|-----|------|-------------|--------------|
| `print.button` | `string` | "طباعة" | "Print" |
| `print.proofHeader` | `string` | "إثبات التحقق من الشهادة" | "Certificate Verification Proof" |
| `print.verifiedBy` | `(academyName: string, date: string) => string` | `تم التحقق بواسطة ${academyName} بتاريخ ${date}` | `Verified by ${academyName} on ${date}` |
| `print.revokedWatermark` | `string` | "ملغاة" | "REVOKED" |
| `print.expiredWatermark` | `string` | "منتهية الصلاحية" | "EXPIRED" |
| `print.verifiedWatermark` | `string` | "مُتحقق" | "VERIFIED" |

#### Academy Branding Labels

| Key | Type | Arabic (ar) | English (en) |
|-----|------|-------------|--------------|
| `academy.verifiedBy` | `(academyName: string) => string` | `تم التحقق بواسطة ${academyName}` | `Verified by ${academyName}` |
| `academy.contactEmail` | `string` | "تواصل مع الأكاديمية" | "Contact Academy" |
| `academy.issuedBy` | `string` | "صادرة عن" | "Issued by" |

#### Accessibility Labels

| Key | Type | Arabic (ar) | English (en) |
|-----|------|-------------|--------------|
| `a11y.statusPrefix` | `string` | "الحالة:" | "Status:" |
| `a11y.loading` | `string` | "جارٍ التحقق من الشهادة" | "Verifying certificate" |
| `a11y.verified` | `(status: string) => string` | `تم التحقق من الشهادة: ${status}` | `Certificate verified: ${status}` |
| `a11y.rateLimitCountdown` | `(seconds: number) => string` | `المحاولة التالية خلال ${seconds} ثانية` | `Next attempt in ${seconds} seconds` |
| `a11y.previewAlt` | `(recipientName: string, title: string) => string` | `معاينة الشهادة لـ ${recipientName} — ${title}` | `Certificate preview for ${recipientName} — ${title}` |
| `a11y.logoAlt` | `(academyName: string) => string` | `شعار ${academyName}` | `${academyName} logo` |

#### Language Toggle Labels

| Key | Type | Arabic (ar) | English (en) |
|-----|------|-------------|--------------|
| `language.toggleToArabic` | `string` | "التبديل إلى العربية" | "Switch to Arabic" |
| `language.toggleToEnglish` | `string` | "التبديل إلى الإنجليزية" | "Switch to English" |

#### Download Labels

| Key | Type | Arabic (ar) | English (en) |
|-----|------|-------------|--------------|
| `download.button` | `string` | "تحميل الشهادة" | "Download Certificate" |
| `download.tooltip` | `string` | "تحميل نسخة PDF من الشهادة" | "Download a PDF copy of the certificate" |

#### SEO Labels

| Key | Type | Arabic (ar) | English (en) |
|-----|------|-------------|--------------|
| `seo.title.valid` | `(recipientName: string, certificateTitle: string) => string` | `شهادة ${certificateTitle} — ${recipientName}` | `${certificateTitle} — ${recipientName}` |
| `seo.description.valid` | `string` | "تم التحقق من صحة هذه الشهادة" | "This certificate has been verified as authentic" |
| `seo.title.generic` | `string` | "التحقق من الشهادة" | "Certificate Verification" |
| `seo.description.generic` | `string` | "تحقق من صحة الشهادات الصادرة من الأكاديمية" | "Verify the authenticity of certificates issued by the academy" |

### i18n Implementation Pattern

The `certificates.verification` sub-domain follows the existing `shared/locale/` compile-time TypeScript pattern:
1. Define the `VerificationLabels` interface in `shared/locale/types/certificates/verification.ts`
2. Implement Arabic translations in `shared/locale/ar/certificates/verification.ts`
3. Implement English translations in `shared/locale/en/certificates/verification.ts`
4. Register the namespace in `shared/locale/namespaces/certificates/verification.namespace.ts` using `defineNamespace("certificates.verification", { load: { en, ar } })`
5. Add to the `Translation` registry in `shared/locale/namespaces/translation.ts` under a `Certificates` top-level key
6. Add `VerificationLabels` to the `MessageSchema` type in `shared/locale/types/message.ts`

**Server-side usage**: `getTranslations(locale).certificates.verification.*`
**Client-side usage**: `useAppTranslation(Translation.Certificates).verification.*`

---

## Non-Functional Requirements

### NFR-V1: Performance

**NFR-V1.1** — The verification page SHALL achieve a First Contentful Paint (FCP) under 1.5 seconds on a 3G mobile connection.

**NFR-V1.2** — The server-side render SHALL include the initial loading skeleton (no blank page).

**NFR-V1.3** — The verification query SHALL complete within 2 seconds (including logging) under normal conditions.

**NFR-V1.4** — The page SHALL use ISR with `export const revalidate = 3600` (1-hour revalidation) and set CDN cache headers: `s-maxage=3600, stale-while-revalidate=600` for VALID/REVOKED/EXPIRED results. NOT_FOUND results SHALL use `no-store` (enumeration protection — prevents cache-timing attacks). This dramatically reduces DB load and improves TTFB for repeated verification requests.

### NFR-V2: Security

**NFR-V2.1** — The verification endpoint SHALL NOT expose internal database IDs, user account IDs, or any data not explicitly listed in FR-V2.

**NFR-V2.2** — The page SHALL set appropriate security headers (CSP, X-Content-Type-Options, X-Frame-Options) per the existing Siraj security middleware.

**NFR-V2.3** — The page SHALL NOT be embeddable in an iframe (`X-Frame-Options: DENY`) to prevent clickjacking of verification results.

**NFR-V2.4** — The verification code SHALL be treated as a case-insensitive lookup value (normalized to uppercase/lowercase before DB query).

**NFR-V2.5** — The system SHALL enforce a per-code attempt ceiling (10 requests per code per 24 hours, configurable via `CERT_VERIFY_MAX_ATTEMPTS_PER_CODE`). Once exceeded, all subsequent requests for that code SHALL return `not_found` response shape (collapsed — eliminates enumeration oracle distinguishing REVOKED/EXPIRED/NOT_FOUND). This works in concert with the per-IP rate limit but specifically targets codes being brute-forced.

### NFR-V3: Browser Support

**NFR-V3.1** — The page SHALL work on all modern browsers (Chrome 100+, Safari 15+, Firefox 100+, Edge 100+).

**NFR-V3.2** — The page SHALL be responsive from 320px (small mobile) to 1920px (large desktop).

### NFR-V4: Observability

**NFR-V4.1** — All verification queries SHALL be logged via `@/backend/lib/logger` with the verification code (hashed/truncated) and result.

**NFR-V4.2** — Rate-limit hits SHALL be logged at `warn` level with the IP and timestamp.

**NFR-V4.3** — The verification log SHALL include a `source` field inferred from the `referer` header: `qr_scan` (no referer / direct), `link_click` (has external referer), `manual_entry` (from `/verify` page). This feeds Plan 18's certificate detail timeline and enables academies to understand how their certificates are being verified. Source detection is server-side (no client-side tracking scripts — privacy-friendly).

### NFR-V5: Accessibility

**NFR-V5.1** — The verification page SHALL meet WCAG 2.1 Level AA compliance.

**NFR-V5.2** — All interactive elements (buttons, links, inputs) SHALL be keyboard navigable with visible focus indicators.

**NFR-V5.3** — The verification result status SHALL be announced to screen readers via `aria-live="polite"` when it changes.

**NFR-V5.4** — The certificate preview image SHALL have an `alt` attribute describing the recipient name and certificate title (using `a11y.previewAlt` i18n key).

**NFR-V5.5** — Form inputs SHALL have associated `<label>` elements and `aria-describedby` for error messages.

**NFR-V5.6** — Color contrast SHALL meet 4.5:1 for text and 3:1 for UI components against background.

**NFR-V5.7** — The language toggle SHALL announce the language change via `aria-live="polite"`.

### NFR-V6: Mobile Responsiveness

**NFR-V6.1** — The page SHALL render correctly from 320px to 1920px viewport width.

**NFR-V6.2** — Mobile layout (≤ 600px) SHALL use stacked single-column design with touch-friendly tap targets (minimum 44x44px).

**NFR-V6.3** — Desktop layout (> 600px) SHALL use centered card layout with appropriate max-width (max 720px for verification card).

**NFR-V6.4** — RTL layout SHALL be fully supported for Arabic locale (text alignment, icon mirroring, flex direction).

**NFR-V6.5** — The certificate preview SHALL scale proportionally on mobile without horizontal overflow.

### NFR-V7: Certificate Preview Rendering

**NFR-V7.1** — The certificate preview SHALL render as a visually faithful representation of the issued certificate using the template's design tokens.

**NFR-V7.2** — For VALID certificates: preview SHALL display a "VERIFIED" watermark (diagonal, semi-transparent, using `print.verifiedWatermark` i18n key).

**NFR-V7.3** — For REVOKED certificates: preview SHALL display a "REVOKED" watermark (diagonal, red-tinted, using `print.revokedWatermark` i18n key) AND all signature/seal elements SHALL be visually redacted/obscured.

**NFR-V7.4** — For EXPIRED certificates: preview SHALL display an "EXPIRED" watermark (diagonal, amber-tinted, using `print.expiredWatermark` i18n key).

**NFR-V7.5** — For NOT_FOUND/INVALID_FORMAT: no certificate preview SHALL render (only the result card).

**NFR-V7.6** — The preview SHALL disable right-click context menu and drag-to-save on the certificate image to discourage casual copying (note: this is a UX deterrent, not a security control).

**NFR-V7.7** — The preview SHALL render within a responsive container maintaining the certificate's original aspect ratio (typically A4 portrait or landscape).

**NFR-V7.8** — Academy logo and branding SHALL be rendered in the preview from the template configuration.

### NFR-V8: Print from Public Page

**NFR-V8.1** — The "Print" button SHALL open the browser's native print dialog (`window.print()`).

**NFR-V8.2** — The print output SHALL include: certificate preview, verification status, verification date, academy name, and a unique proof header (`print.proofHeader`).

**NFR-V8.3** — For VALID certificates: print SHALL include "VERIFIED" watermark on the certificate.

**NFR-V8.4** — For REVOKED certificates: print SHALL include "REVOKED" watermark prominently; signature/seal elements SHALL be redacted; the print SHALL clearly indicate this is a verification proof of a revoked certificate (fraud prevention).

**NFR-V8.5** — For EXPIRED certificates: print SHALL include "EXPIRED" watermark.

**NFR-V8.6** — Print layout SHALL use `@media print` CSS to hide navigation, language toggle, share buttons, and interactive elements.

**NFR-V8.7** — Print output SHALL fit on standard A4/Letter paper in portrait orientation without clipping.
