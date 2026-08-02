# Plan 19 — Public Verification Page: Design Document

## Document Info

| Field | Value |
|-------|-------|
| **Plan** | 19 — Public Verification Page |
| **Dependencies** | Plan 5 (GraphQL API — `verifyCertificate(code)` public query) |
| **Related Docs** | `MASTER_ARCHITECTURE.md`, `cgvs_analysis/07-auth-security-config.md` (rate limiting), `siraj_analysis/08-app-router-navigation.md` (public routes), `siraj_analysis/09-auth-permissions.md` (public queries), `siraj_analysis/06-i18n-system.md` (namespace pattern) |

---

## Architecture Overview

### Layer Position

This plan operates across all layers but follows a **public page** pattern distinct from the dashboard pattern used by Plans 16-18.

```
                    ┌─────────────────────────────────────────────────┐
                    │              PUBLIC ROUTE (no auth)               │
                    │                                                   │
  QR Scan ──────►   │  app/verify/[code]/page.tsx   (Server Component)  │
                    │       │                                            │
                    │       ├─► generateMetadata() → SEO tags           │
                    │       ├─► getLocale() → i18n locale detection      │
                    │       └─► <VerificationContainer /> (Client)      │
                    │              │                                    │
                    │              ├─► useQuery(VERIFY_CERTIFICATE)      │
                    │              │      → Apollo Client                │
                    │              │      → POST /api/graphql            │
                    │              │                                    │
                    │              ├─► <VerificationView />             │
                    │              │      ├─ LoadingState               │
                    │              │      ├─ CertificateMetadataPanel      │
                    │              │      ├─ CertificatePreview         │
                    │              │      ├─ ShareButtons                 │
                    │              │      ├─ PrintButton                  │
                    │              │      └─ ErrorState                   │
                    │              │                                    │
                    │              └─► <ManualCodeForm /> (on /verify)   │
                    └─────────────────────────────────────────────────┘
                                        │
                                        ▼
                    ┌─────────────────────────────────────────────────┐
                    │           BACKEND (Plan 5 provides)               │
                    │                                                   │
                    │  Pothos Query: verifyCertificate(code)             │
                    │       │                                            │
                    │       ├─► Rate limiting check (IP-based)           │
                    │       ├─► VerificationLogService.log(...)          │
                    │       └─► CertificateVerificationService.verify()  │
                    │              └─► CertificateRepository             │
                    │                     └─► certificate_verifications  │
                    └─────────────────────────────────────────────────┘
```

### Key Architectural Decision: Public Route Outside Route Groups

**Decision**: The verification page lives at `app/verify/[code]/page.tsx` — directly under `app/`, NOT under `app/(dashboard)/` or `app/(auth)/`.

**Rationale**:
- `(dashboard)` route group wraps pages with the dashboard layout (sidebar, header, auth guard). The verification page has none of these.
- `(auth)` route group is for login/signup. The verification page is not an auth page.
- A standalone public route is the only option that delivers a clean full-page layout without dashboard shell.
- The root `app/layout.tsx` already provides MUI provider, theme, fonts, and locale — the verification page reuses these but adds its own nested layout.

**Alternative Considered**: Place under `(dashboard)` with a conditional layout. Rejected because it mixes public and auth-gated concerns, risks accidental auth leaks, and requires layout-switching logic.

---

## Route Design

### Route Structure

```
app/
├── layout.tsx                    ← Root layout (MUI, theme, locale) — already exists
├── (dashboard)/                  ← Auth-required dashboard (NOT used by this plan)
├── (auth)/                        ← Login/signup (NOT used by this plan)
├── verify/                       ← NEW — public verification
│   ├── layout.tsx                ← Minimal public layout (no sidebar, no shell)
│   ├── page.tsx                  ← Manual code entry form (/verify)
│   └── [code]/
│       └── page.tsx              ← Verification result (/verify/[code])
```

### Public Layout (`app/verify/layout.tsx`)

The `verify/layout.tsx` is a minimal server component that:
- Renders children directly within a `<main>` element
- Does NOT include sidebar, navigation header, or any dashboard chrome
- Does NOT call `getServerUserContext()` or any auth guard
- Includes a minimal header with the academy logo/name (for branding context)
- Includes a footer with a "Powered by Siraj" / academy name link
- Sets `X-Frame-Options: DENY` via response headers to prevent iframe embedding
- Uses `getLocale()` for locale detection and `getTranslations(locale)` for header/footer strings

### Public Page (`app/verify/[code]/page.tsx`)

The page server component:
- Extracts the `code` param from `params` (async in Next.js 16)
- Detects locale from `getLocale()` (cookie-based, same as root layout)
- Calls `generateMetadata()` for SEO tags — fetches certificate data server-side to populate OG tags
- Renders `<VerificationContainer>` with the code and locale as props
- Passes already-translated SEO strings to metadata generation
- Does NOT fetch certificate data in the server component (the client Apollo query handles data fetching — this allows for loading states and rate-limit-specific UI)

**Why not SSR the certificate data?** The public page uses a client-side Apollo query for the verification result because:
1. Loading animations/skeletons need a client-side query lifecycle
2. Rate-limit countdown and retry logic require client-side state
3. SEO meta tags are handled by `generateMetadata` which makes its own server-side data fetch for OG tags
4. The verification result itself does not need to be SSR'd for SEO (the OG tags from `generateMetadata` are what search engines/social platforms read)

### Manual Code Entry Page (`app/verify/page.tsx`)

The `/verify` page (no code):
- Server component that renders `<ManualCodeForm />` client component
- Form validates code format client-side, then redirects to `/verify/[code]` using `next/navigation` `router.push()`
- Uses `getTranslations(locale)` for form labels

---

## GraphQL API Surface

### Public Verification Query (Provided by Plan 5)

Plan 5 defines the public `verifyCertificate(code)` query. This plan consumes it. The interface contract:

**Query**: `verifyCertificate(code: String!): VerificationResult`

**Type: VerificationResult** (union or discriminated type):

| Field | Type | Description |
|-------|------|-------------|
| `status` | `CertificateVerificationStatus` | enum: `VALID`, `REVOKED`, `EXPIRED`, `NOT_FOUND` |
| `certificate` | `VerificationCertificate?` | null if NOT_FOUND; present otherwise |
| `verificationId` | `String` | unique ID for this verification log entry |

**Type: VerificationCertificate** (verification-safe — no sensitive data):

| Field | Type | Description |
|-------|------|-------------|
| `id` | `String` | certificate ID (for Apollo cache normalization) |
| `verificationCode` | `String` | the verification code |
| `recipientName` | `String` | full name of the certificate recipient |
| `certificateTitle` | `String` | template title at time of issuance |
| `issueDate` | `String` | ISO date string — certificate issue date |
| `issuingAcademyName` | `String` | academy name at time of issuance |
| `status` | `CertificateStatus` | `issued`, `revoked`, `expired` |
| `revocationDate` | `String?` | present only if revoked (date is non-sensitive; reason is stripped) |
| `expirationDate` | `String?` | present only if expired |
| `academyLogoUrl` | `String?` | academy logo image URL (for branding/trust display) |
| `academyContactEmail` | `String?` | academy public contact email (optional — only if academy configured it) |
| `templatePreview` | `TemplatePreview?` | present only if status = issued |
| `verificationDate` | `String` | current UTC timestamp of verification |

> **CRITICAL — INTER_PLAN_CONTRACTS §6**: `revocationReason` is **NOT included** in the public verification path. Plan 04 MUST strip `revocationReason` before returning. The public response must be **constant-shape** — `not_found` returns `certificate: null`; `revoked` returns certificate with revoked status but WITHOUT `revocationReason`. This prevents enumeration oracle attacks. Do NOT add `revocationReason` to this type.

**Type: TemplatePreview** (visual representation data):

| Field | Type | Description |
|-------|------|-------------|
| `backgroundColor` | `String` | hex color of template background |
| `title` | `String` | template title text |
| `orientation` | `String` | `landscape` or `portrait` |
| `width` | `Int` | template width in px (for aspect ratio) |
| `height` | `Int` | template height in px (for aspect ratio) |

### GraphQL Document

The verification query document lives in `frontend/common/graphql/sharedDocuments/certificates.verification.documents.ts`:

| Document Name | Type | Usage |
|---------------|------|-------|
| `VerifyCertificateQueryDocument` | Query | Client-side Apollo `useQuery` hook |

**Convention compliance** (per `frontend/common/graphql/AGENTS.md`):
- Document includes `id` field on all object types for Apollo cache normalization
- Uses `useQuery` (NOT `useLazyQuery`) — stateful query fired on mount
- Import hook from `@apollo/client/react`
- Naming: `{EntityName}QueryDocument`

### Rate Limiting on the Query

Plan 5's resolver for `verifyCertificate` handles rate limiting at the GraphQL resolver level. This plan depends on that implementation. The rate-limiting design (from `cgvs_analysis/07-auth-security-config.md`):

| Aspect | Design |
|--------|--------|
| Identifier | Client IP (from `x-forwarded-for` header or connection remote address) |
| Limiter | Cache-service backed (Redis), sliding window |
| Default limit | 30 requests per minute per IP |
| Exceeded response | GraphQL error with `RATE_LIMITED` code + `retryAfter` seconds |
| Client handling | Apollo error link catches `RATE_LIMITED` → triggers rate-limit UI state |

---

## Complete File Scaffold

Every file that this plan creates or edits, with full path and component type:

### App Router (Server Components — no auth)

| File | Type | Purpose |
|------|------|---------|
| `app/verify/layout.tsx` | Server Component | Minimal `<main>` wrapper, no sidebar/nav. Inherits root layout's MUI provider + locale. |
| `app/verify/page.tsx` | Server Component | Manual code entry page (`/verify`). Renders `<ManualCodeEntryPage />`. |
| `app/verify/[code]/page.tsx` | Server Component | Verification result page. Calls `getLocale()`, `generateMetadata()`, renders `<VerificationContainer />`. |
| `app/verify/[code]/not-found.tsx` | Server Component | (Optional) Custom 404 for malformed code routes. |

**Route decision**: `app/verify/[code]/page.tsx` — directly under `app/`, NOT under `app/(dashboard)/` or `app/(auth)/`. NO `[locale]` URL segment (Siraj uses custom compile-time i18n with `getLocale()` from `@/shared/locale/server-cookies`, not next-intl). The root `app/layout.tsx` provides MUI provider, theme, fonts, and `LocaleProvider` — the verify layout inherits all of this.

**No auth middleware**: The project has no `middleware.ts`. Route protection is handled by layout-level auth guards in `app/(dashboard)/layout.tsx`. The `app/verify/` route MUST NOT have any auth guard. If a future `middleware.ts` is added, it MUST exclude `/verify/*` from auth redirects (documented in requirements FR-V1.7).

### Frontend Common Views (Container + ViewModel + Switcher)

| File | Type | Purpose |
|------|------|---------|
| `frontend/common/views/verify/verificationContainer.tsx` | Client Component | Apollo `useQuery`, state management, error handling, renders `verificationView` |
| `frontend/common/views/verify/verificationView.tsx` | Client Component | Mobile/desktop responsive switch via `useMediaQuery`, delegates to tier views |
| `frontend/common/views/verify/verificationViewModel.ts` | TypeScript (no Zustand) | Pure state derivation + event handlers (no store needed — component state only) |
| `frontend/common/views/verify/index.ts` | Barrel | Re-exports container and view |

### Frontend Desktop Views (Tier — Pure Presentation)

| File | Type | Purpose |
|------|------|---------|
| `frontend/desktop/views/verify/verificationDesktopView.tsx` | Client Component | Desktop layout: split (preview left, details right), centered max-width 800px |
| `frontend/desktop/views/verify/index.ts` | Barrel | Re-export |

### Frontend Mobile Views (Tier — Pure Presentation)

| File | Type | Purpose |
|------|------|---------|
| `frontend/mobile/views/verify/verificationMobileView.tsx` | Client Component | Mobile layout: full-width, stacked, accordion details, prominent WhatsApp share |
| `frontend/mobile/views/verify/index.ts` | Barrel | Re-export |

### Shared UI Components (used by both tiers)

| File | Type | Purpose |
|------|------|---------|
| `frontend/common/views/verify/components/verificationStatusBadge.tsx` | Client Component | Status chip (valid/revoked/expired) with icon |
| `frontend/common/views/verify/components/academyBranding.tsx` | Client Component | Academy logo, name, contact, trust signal |
| `frontend/common/views/verify/components/certificatePreview.tsx` | Client Component | Visual certificate card with watermark overlay |
| `frontend/common/views/verify/components/certificateMetadataPanel.tsx` | Client Component | Detail rows in accordion (mobile) / grid (desktop) |
| `frontend/common/views/verify/components/shareButtons.tsx` | Client Component | Web Share API + social share links |
| `frontend/common/views/verify/components/downloadButton.tsx` | Client Component | Conditional PDF download |
| `frontend/common/views/verify/components/printButton.tsx` | Client Component | Triggers `window.print()` |
| `frontend/common/views/verify/components/languageToggle.tsx` | Client Component | EN/AR toggle with `?lang=` cookie switch |
| `frontend/common/views/verify/components/manualCodeForm.tsx` | Client Component | Text input + submit for manual code entry |
| `frontend/common/views/verify/components/revocationInfo.tsx` | Client Component | Revocation date display (no reason) |
| `frontend/common/views/verify/components/expirationInfo.tsx` | Client Component | Expiration date + validity period display |
| `frontend/common/views/verify/components/notFoundState.tsx` | Client Component | Not-found warning + manual entry form |
| `frontend/common/views/verify/components/revokedState.tsx` | Client Component | Revoked wrapper (metadata panel + revocation info) |
| `frontend/common/views/verify/components/expiredState.tsx` | Client Component | Expired wrapper (metadata panel + expiration info) |
| `frontend/common/views/verify/components/verificationLoading.tsx` | Client Component | Loading spinner + skeleton card |
| `frontend/common/views/verify/components/errorState.tsx` | Client Component | Generic error display with retry |
| `frontend/common/views/verify/components/rateLimitError.tsx` | Client Component | Rate-limit countdown timer |
| `frontend/common/views/verify/components/index.ts` | Barrel | Re-exports all components |

### GraphQL Document

| File | Type | Purpose |
|------|------|---------|
| `frontend/common/graphql/sharedDocuments/certificates.verification.documents.ts` | TypeScript | `VerifyCertificateQueryDocument` — Apollo query document |

### i18n Files (6 registration points)

| File | Purpose |
|------|---------|
| `shared/locale/types/certificates/verification.ts` | `VerificationLabels` interface definition |
| `shared/locale/namespaces/certificates/verification.namespace.ts` | `defineNamespace("certificates.verification", ...)` |
| `shared/locale/en/certificates/verification.ts` | English implementation |
| `shared/locale/ar/certificates/verification.ts` | Arabic implementation with pluralization |
| `shared/locale/namespaces/translation.ts` | Edit — add `Certificates: { Verification }` |
| `shared/locale/types/message.ts` | Edit — add `VerificationLabels` to `MessageSchema` |

### Test Files

| File | Type | Purpose |
|------|------|---------|
| `test/ui/components/verify/VerificationContainer.test.tsx` | Component test | Container: loading, valid, revoked, expired, not-found, error states |
| `test/ui/components/verify/VerificationView.test.tsx` | Component test | View: responsive switch, state delegation |
| `test/ui/components/verify/ShareButtons.test.tsx` | Component test | Share: clipboard, Web Share API, social links |
| `test/ui/components/verify/LanguageToggle.test.tsx` | Component test | Language toggle: cookie set, router replace |
| `test/ui/components/verify/ManualCodeForm.test.tsx` | Component test | Form: validation, submit, navigation |
| `test/ui/e2e/verify/verify-page.spec.ts` | E2E test | Full page: QR scan flow, invalid code, revoked, print |

---

## Component Hierarchy

### Three-Location Split (Adapted for Public Page)

The Siraj three-location split normally applies to dashboard pages. For this public page, the split is adapted:

| Location | Path | Responsibility |
|----------|------|----------------|
| App Router page | `app/verify/[code]/page.tsx` | Server component — locale detection, metadata, pass-through |
| Container + ViewModel | `frontend/common/views/verify/` | Apollo query, state management, event handlers |
| Presentation | `frontend/desktop/views/verify/` + `frontend/mobile/views/verify/` | Pure UI components, responsive |

### Full Component Tree

```
app/verify/[code]/page.tsx (Server Component)
│
├─ generateMetadata(code, locale) → Metadata
│   (service-level rate limit enforced for metadata path too)
│
└─ <VerificationContainer code={code} locale={locale} />
     │
     ├─ State: loading, error, data, rateLimitRetryAfter
     │
     ├─ useQuery(VerifyCertificateQueryDocument, { variables: { code } })
     │
     ├─ <LanguageToggle currentLocale={locale} /> (Client — ?lang= switch)
     │
     ├─ <VerificationView labels={t} result={data} status={status} />
     │    │
     │    ├─ Mobile/Desktop responsive switch (via useMediaQuery)
     │    │
     │    ├─ Loading State:
     │    │    └─ <VerificationLoading labels={t.loading} />
     │    │         ├─ <CircularProgress /> (spinner)
     │    │         └─ <SkeletonCard /> (detail row placeholders)
     │    │
     │    ├─ Valid Result:
     │    │    ├─ <VerificationStatusBadge status="valid" labels={t.status.valid} />
     │    │    ├─ <AcademyBranding logoUrl={data.certificate.academyLogoUrl}
     │    │    │                    name={data.certificate.issuingAcademyName}
     │    │    │                    contactEmail={data.certificate.academyContactEmail}
     │    │    │                    labels={t.academy} />
     │    │    ├─ <CertificatePreview template={data.certificate.templatePreview}
     │    │    │                    recipientName={data.certificate.recipientName}
     │    │    │                    issueDate={data.certificate.issueDate}
     │    │    │                    watermark="VERIFIED" />
     │    │    ├─ <CertificateMetadataPanel labels={t.fields}
     │    │    │                              certificate={data.certificate} />
     │    │    │    ├─ DetailRow (recipientName)
     │    │    │    ├─ DetailRow (certificateTitle)
     │    │    │    ├─ DetailRow (issueDate)
     │    │    │    ├─ DetailRow (expirationDate — if present)
     │    │    │    ├─ DetailRow (issuingAcademyName)
     │    │    │    ├─ DetailRow (certificateId/verificationCode)
     │    │    │    └─ DetailRow (verificationDate)
     │    │    ├─ <ShareButtons url={canonicalUrl} labels={t.share} />
     │    │    ├─ <DownloadButton code={code} labels={t.download} /> (conditional)
     │    │    └─ <PrintButton labels={t.print} />
     │    │
     │    ├─ Revoked Result:
     │    │    ├─ <VerificationStatusBadge status="revoked" labels={t.status.revoked} />
     │    │    ├─ <RevokedState certificate={data.certificate} labels={t.result.revoked} />
     │    │    │    ├─ <CertificateMetadataPanel ... /> (reduced — no preview)
     │    │    │    └─ <RevocationInfo date={data.certificate.revocationDate}
     │    │    │                        labels={t.result.revoked} />
     │    │    │      (NOTE: revocationReason NOT available — stripped per §6)
     │    │    └─ <ShareButtons /> + <PrintButton />
     │    │
     │    ├─ Expired Result:
     │    │    ├─ <VerificationStatusBadge status="expired" labels={t.status.expired} />
     │    │    ├─ <ExpiredState certificate={data.certificate} labels={t.result.expired} />
     │    │    │    ├─ <CertificateMetadataPanel ... />
     │    │    │    └─ <ExpirationInfo date={data.certificate.expirationDate}
     │    │    │                        issueDate={data.certificate.issueDate}
     │    │    │                        labels={t.result.expired} />
     │    │    └─ <ShareButtons /> + <PrintButton />
     │    │
     │    ├─ Not Found State:
     │    │    └─ <NotFoundState labels={t.result.notFound} showEnterDifferentCode />
     │    │
     │    └─ Error States:
     │         ├─ Network Error → <ErrorState title={t.error.network.title} ... retry />
     │         ├─ Server Error → <ErrorState title={t.error.server.title} ... retry />
     │         ├─ Rate Limit → <RateLimitError retryAfter={seconds}
     │         │                    labels={t.error.rateLimited} />
     │         └─ Invalid Format → <ErrorState title={t.result.invalidFormat.title} ... />
     │
     └─ (client-side validation of code format before query)
```

### Component Interface Contracts

#### VerificationContainer

| Prop | Type | Description |
|------|------|-------------|
| `code` | `string` | verification code from URL param |
| `locale` | `AppLocale` | detected locale from server |
| `labels` | `VerificationLabels` | translation strings from i18n |

**Full TypeScript Interface**:
```typescript
interface VerificationContainerProps {
  code: string;
  locale: AppLocale;
  labels: VerificationLabels;
}
```

**Internal state**:
```typescript
type VerificationViewStatus = 
  | 'loading'
  | 'valid'
  | 'revoked'
  | 'expired'
  | 'notFound'
  | 'networkError'
  | 'serverError'
  | 'rateLimited'
  | 'invalidFormat';

interface VerificationContainerState {
  status: VerificationViewStatus;
  data: VerificationResult | null;
  error: Error | null;
  rateLimitRetryAfter: number | null;
  codeFormatValid: boolean;
}
```

**Responsibilities**:
- Validates code format before firing query (if invalid, sets error state without network request)
- Calls `useQuery(VerifyCertificateQueryDocument, { variables: { code }, skip: !codeFormatValid })`
- Parses Apollo errors for RATE_LIMITED code and extracts `retryAfter`
- Renders appropriate sub-component based on state

#### VerificationView

| Prop | Type | Description |
|------|------|-------------|
| `labels` | `VerificationLabels` | translation strings from i18n |
| `result` | `VerificationResult \| null` | query result data |
| `status` | `VerificationViewStatus` | `loading`, `valid`, `revoked`, `expired`, `notFound`, `networkError`, `serverError`, `rateLimited`, `invalidFormat` |
| `rateLimitRetryAfter` | `number \| null` | seconds until retry (for rate-limit countdown) |

**Full TypeScript Interface**:
```typescript
interface VerificationViewProps {
  labels: VerificationLabels;
  result: VerificationResult | null;
  status: VerificationViewStatus;
  rateLimitRetryAfter: number | null;
}
```

**Responsibilities**: Mobile/desktop responsive switch, delegates to sub-components based on status

#### CertificatePreview

| Prop | Type | Description |
|------|------|-------------|
| `template` | `TemplatePreview` | preview data (bg color, title, orientation, dimensions) |
| `recipientName` | `string` | recipient name to display in preview |
| `issueDate` | `string` | issue date to display in preview |

**Responsibilities**: Renders a visual card mimicking the certificate layout — background color, centered title, recipient name, issue date. Not an iframe/PDF. Responsive (full-width mobile, aspect-ratio-constrained desktop). Uses MUI Card + Box components.

#### ShareButtons

| Prop | Type | Description |
|------|------|-------------|
| `url` | `string` | canonical verification URL to share |
| `labels` | `ShareLabels` | translation strings for share UI |

**Responsibilities**: Clipboard API for copy, Web Share API for native share (mobile), social share links (WhatsApp, X, LinkedIn, Facebook, Telegram). Each platform opens share dialog in new tab.

#### CertificateMetadataPanel (replaces ResultCard)

| Prop | Type | Description |
|------|------|-------------|
| `certificate` | `VerificationCertificate` | certificate data to display |
| `labels` | `VerificationLabels` | translation strings from i18n (includes field labels) |
| `locale` | `AppLocale` | current locale for date formatting |
| `status` | `'valid' \| 'revoked' \| 'expired'` | verification status for conditional rendering |

**Full TypeScript Interface**:
```typescript
interface CertificateMetadataPanelProps {
  certificate: VerificationCertificate;
  labels: VerificationLabels;
  locale: AppLocale;
  status: 'valid' | 'revoked' | 'expired';
}
```

**Responsibilities**: Renders certificate detail rows in a structured panel. Each row: localized label + value. Dates formatted per locale using `Intl.DateTimeFormat`. RTL-aware layout. On mobile, uses MUI `Accordion` (expandable sections) for compact display; on desktop, uses a two-column grid. Rows conditionally rendered: `expirationDate` only if present; `verificationDate` always shown. Shows full fields for valid, limited fields for revoked/expired (hides preview).

#### VerificationStatusBadge (replaces StatusBadge)

| Prop | Type | Description |
|------|------|-------------|
| `status` | `'valid' \| 'revoked' \| 'expired'` | determines color and icon |
| `labels` | `VerificationLabels` | localized status text + aria-label prefix |
| `locale` | `AppLocale` | current locale |

**Full TypeScript Interface**:
```typescript
interface VerificationStatusBadgeProps {
  status: 'valid' | 'revoked' | 'expired';
  labels: VerificationLabels;
  locale: AppLocale;
}
```

**Responsibilities**: MUI `Chip` with status color from theme palette (`success`/`error`/`warning`). Icon: `CheckCircleOutlined` for valid, `CancelOutlined` for revoked, `WarningOutlined` for expired. Has `aria-label` text prefix for screen readers (e.g., "Status: Valid"). Font size larger on mobile (touch-readable). In print CSS, the badge renders with high-contrast border and text (no color background — black on white).

#### AcademyBranding

| Prop | Type | Description |
|------|------|-------------|
| `logoUrl` | `string \| null` | academy logo image URL |
| `name` | `string` | academy display name |
| `contactEmail` | `string \| null` | optional public contact email |
| `labels` | `AcademyLabels` | branding label strings |

**Responsibilities**: Displays academy logo (via MUI `Avatar` or `Box` with `img` — falls back to initials if logo fails to load), academy name as heading, optional contact email as `mailto:` link. Renders a "Verified by [academy name]" trust signal below the logo. Uses academy-safe colors (no academy-specific theme override — uses Siraj theme palette). On mobile: logo + name stacked, centered. On desktop: logo left, name + contact right, inline.

#### CertificatePreview

| Prop | Type | Description |
|------|------|-------------|
| `certificate` | `VerificationCertificate` | certificate data (includes templatePreview, recipientName, issueDate) |
| `labels` | `VerificationLabels` | translation strings from i18n |
| `locale` | `AppLocale` | current locale |
| `status` | `'valid' \| 'revoked' \| 'expired'` | verification status for watermark overlay |

**Full TypeScript Interface**:
```typescript
interface CertificatePreviewProps {
  certificate: VerificationCertificate;
  labels: VerificationLabels;
  locale: AppLocale;
  status: 'valid' | 'revoked' | 'expired';
}
```

**Responsibilities**: Renders a visual representation of the certificate (not PDF). Applies status-specific watermark via CSS overlay:
- `valid`: "VERIFIED" watermark (faint, centered, green-tinted)
- `revoked`: "REVOKED" watermark (faint, centered, red-tinted)
- `expired`: "EXPIRED" watermark (faint, centered, amber-tinted)
- Disables right-click/context menu on preview image (`onContextMenu={e => e.preventDefault()}`)
- Responsive: full-width on mobile (< 600px), aspect-ratio-constrained on desktop (uses template `width`/`height`)
- Uses MUI `Card` + `Box` with `position: relative` for watermark overlay

#### ShareButtons

| Prop | Type | Description |
|------|------|-------------|
| `url` | `string` | canonical verification URL to share (without `?lang=` — canonical) |
| `labels` | `VerificationLabels` | translation strings for share UI |

**Full TypeScript Interface**:
```typescript
interface ShareButtonsProps {
  url: string;
  labels: VerificationLabels;
}
```

**Responsibilities**: Clipboard API for copy (with fallback), Web Share API for native share (mobile — primary if available), social share links (WhatsApp, X, LinkedIn, Facebook, Telegram). Each platform opens share dialog in new tab. Copy button shows "Copied!" feedback for 2 seconds. RTL-aware: button order reversed for Arabic. Hidden in print CSS via `sx={{ '@media print': { display: 'none' } }}`.

#### DownloadButton

| Prop | Type | Description |
|------|------|-------------|
| `code` | `string` | verification code (for the download request) |
| `labels` | `VerificationLabels` | download button label strings |
| `locale` | `AppLocale` | current locale |

**Full TypeScript Interface**:
```typescript
interface DownloadButtonProps {
  code: string;
  labels: VerificationLabels;
  locale: AppLocale;
}
```

**Responsibilities**: Conditional — only rendered when academy allows public downloads (flag from certificate data). Triggers a download flow: navigates to `/api/certificates/verify/${code}/download` which returns the certificate PDF. Shows loading state during download. Error handling: if download fails, shows snackbar error. Hidden in print CSS via `sx={{ '@media print': { display: 'none' } }}`.

#### LanguageToggle

| Prop | Type | Description |
|------|------|-------------|
| `currentLocale` | `AppLocale` | currently active locale |
| `code` | `string` | verification code (for maintaining URL context) |
| `labels` | `VerificationLabels` | aria-label strings from i18n |

**Full TypeScript Interface**:
```typescript
interface LanguageToggleProps {
  currentLocale: AppLocale;
  code: string;
  labels: VerificationLabels;
}
```

**Responsibilities**: Client component — renders EN/AR toggle (MUI `ToggleButtonGroup` with two `ToggleButton`s). On click: calls `router.replace('/verify/${code}?lang=${newLocale}')` using `next/navigation` `useRouter().replace()` (no full page reload). The RSC re-renders with the new locale by reading `?lang=` query param. Also sets `NEXT_LOCALE` cookie via existing cookie-set mechanism. The `?lang=` param is stripped from canonical URL. RTL-aware: toggle order and icon direction respects current locale. Visible in all states. Hidden in print CSS.

#### RevocationInfo

| Prop | Type | Description |
|------|------|-------------|
| `date` | `string \| null` | revocation date (ISO 8601) |
| `labels` | `VerificationLabels` | revocation display strings |
| `locale` | `AppLocale` | current locale for date formatting |

**Full TypeScript Interface**:
```typescript
interface RevocationInfoProps {
  date: string | null;
  labels: VerificationLabels;
  locale: AppLocale;
}
```

**Responsibilities**: Displays "This certificate was revoked on [date]" (date formatted per locale via `Intl.DateTimeFormat`). Does NOT display revocation reason — `revocationReason` is stripped from the public response per INTER_PLAN_CONTRACTS §6. Uses warning/error typography. Shown only in the revoked state. `aria-live="polite"`.

#### ExpirationInfo

| Prop | Type | Description |
|------|------|-------------|
| `date` | `string` | expiration date (ISO 8601) |
| `issueDate` | `string \| null` | issue date (ISO 8601) |
| `labels` | `VerificationLabels` | expiration display strings |
| `locale` | `AppLocale` | current locale for date formatting |

**Full TypeScript Interface**:
```typescript
interface ExpirationInfoProps {
  date: string;
  issueDate: string | null;
  labels: VerificationLabels;
  locale: AppLocale;
}
```

**Responsibilities**: Displays validity period: "The certificate was valid from [issueDate] to [expiryDate]" using `validityPeriod(issueDate, expiryDate)` i18n function. Dates formatted per locale. `aria-live="polite"`.

#### NotFoundState

| Prop | Type | Description |
|------|------|-------------|
| `labels` | `VerificationLabels` | not-found title/description/guidance strings |
| `showEnterDifferentCode` | `boolean` | whether to show manual entry form |

**Full TypeScript Interface**:
```typescript
interface NotFoundStateProps {
  labels: VerificationLabels;
  showEnterDifferentCode: boolean;
}
```

**Responsibilities**: Shows warning icon (MUI `WarningOutlined` or `SearchOffOutlined`), "This verification code does not match any certificate" message, and optionally a `ManualCodeForm` for trying another code. Does NOT share or print. No `ShareButtons` or `PrintButton` rendered. `role="status"`, `aria-live="polite"`.

#### RevokedState

| Prop | Type | Description |
|------|------|-------------|
| `certificate` | `VerificationCertificate` | certificate data (has revocationDate, no reason) |
| `labels` | `VerificationLabels` | revoked state UI strings |
| `locale` | `AppLocale` | current locale |

**Full TypeScript Interface**:
```typescript
interface RevokedStateProps {
  certificate: VerificationCertificate;
  labels: VerificationLabels;
  locale: AppLocale;
}
```

**Responsibilities**: Wraps `CertificateMetadataPanel` (compact variant — no preview) + `RevocationInfo`. Shows a red `CancelOutlined` icon prominently. Print CSS renders "REVOKED" watermark on any printed output. `role="status"`, `aria-live="polite"`.

#### ExpiredState

| Prop | Type | Description |
|------|------|-------------|
| `certificate` | `VerificationCertificate` | certificate data (has expirationDate) |
| `labels` | `VerificationLabels` | expired state UI strings |
| `locale` | `AppLocale` | current locale |

**Full TypeScript Interface**:
```typescript
interface ExpiredStateProps {
  certificate: VerificationCertificate;
  labels: VerificationLabels;
  locale: AppLocale;
}
```

**Responsibilities**: Wraps `CertificateMetadataPanel` (compact variant) + `ExpirationInfo`. Shows a warning icon. Certificate preview (if shown) has a "EXPIRED" watermark overlay. `role="status"`, `aria-live="polite"`.

#### ManualCodeForm

| Prop | Type | Description |
|------|------|-------------|
| `labels` | `VerificationLabels` | form label/placeholder/button strings |

**Full TypeScript Interface**:
```typescript
interface ManualCodeFormProps {
  labels: VerificationLabels;
}
```

**Responsibilities**: Text input + submit button. Client-side format validation. On submit: `router.push('/verify/${normalizedCode}')`. Submit via Enter key or button click. Uses `React.SyntheticEvent<HTMLFormElement>` for form submit (React 19 — no `FormEvent`). Includes `LanguageToggle` at the top. Accessible: `<label>` association on TextField, `aria-invalid` on input when validation fails.

---

### ViewModel Return Type

The `verificationViewModel.ts` file exports a pure function (no Zustand store — component state only, per `frontend/common/stores/AGENTS.md` exception for ephemeral state). The ViewModel derives view-ready state from Apollo query state + i18n labels:

```typescript
// frontend/common/views/verify/verificationViewModel.ts

interface VerificationViewModel {
  status: VerificationViewStatus;
  certificate: VerificationCertificate | null;
  rateLimitRetryAfter: number | null;
  codeFormatValid: boolean;
  error: ApolloError | null;
  refetch: (() => void) | null;
}

function useVerificationViewModel(
  code: string,
  labels: VerificationLabels,
  locale: AppLocale,
): VerificationViewModel {
  // 1. Validate code format (UUID v4 or system-defined format)
  const codeFormatValid = isValidVerificationCode(code);

  // 2. Fire Apollo query (skipped if code format invalid)
  const { data, error, loading, refetch } = useQuery(
    VerifyCertificateQueryDocument,
    {
      variables: { code },
      skip: !codeFormatValid,
      context: { headers: { 'X-Verification-Source': detectSource() } },
    },
  );

  // 3. Derive status from Apollo state
  // ... (loading, error with RATE_LIMITED extension, data.verifyCertificate)

  return { status, certificate, rateLimitRetryAfter, codeFormatValid, error, refetch };
}
```

### Store State Shape (No Zustand — Component State Only)

Per `frontend/common/stores/AGENTS.md`: Zustand stores are for cross-component shared state. The verification page uses **ephemeral component-local state only** (not persisted, not shared between views). No Zustand store is created for this feature. State lives in:

1. **Apollo `useQuery` hook state**: `loading`, `error`, `data` (managed by Apollo Client)
2. **React component state**: `rateLimitRetryAfter` countdown (managed by `useState` + `useEffect` in RateLimitError)
3. **React component state**: `codeInput` text (managed by `useState` in ManualCodeForm)

If a future requirement needs to cache the last verification result across navigation, a Zustand store can be added at `frontend/common/stores/verificationStore.ts`. For now, this is explicitly NOT needed.

### GraphQL Document — Full Field Selection

```graphql
# frontend/common/graphql/sharedDocuments/certificates.verification.documents.ts

query VerifyCertificate($code: String!) {
  verifyCertificate(code: $code) {
    id
    status
    verificationDate
    certificate {
      id
      verificationCode
      certificateTitle
      recipientName
      issueDate
      status
      revocationDate
      expirationDate
      academyName
      academyLogoUrl
      academyContactEmail
      templatePreview {
        id
        backgroundColor
        title
        orientation
        width
        height
      }
    }
    # NOTE: revocationReason is NOT requested or returned
    # per INTER_PLAN_CONTRACTS §6 (constant-shape response)
  }
}
```

**Field selection rationale**:
- `id` on all object types for Apollo cache normalization (per GraphQL conventions)
- `status` on both the top-level result AND the nested certificate (top-level = verification result status, certificate-level = certificate lifecycle status)
- `templatePreview` is nullable — only present for valid certificates (absent for revoked/expired to save bandwidth)
- `revocationDate` and `expirationDate` are nullable — present only when status is `revoked` or `expired` respectively
- `academyContactEmail` is nullable — only present if the academy has configured a public contact email
- `verificationDate` is always present — the UTC timestamp of the verification request

### Mobile vs Desktop Layout Specification

| Aspect | Mobile (< 600px / `xs`) | Desktop (≥ 900px / `md`+) |
|--------|-------------------------|---------------------------|
| **Container width** | 100vw, `px: 2` (16px padding) | Max 800px, centered, `mx: auto` |
| **Certificate Preview** | Full-width, aspect-ratio preserved, max-height 400px | Fixed width (360px), left side of split layout |
| **Metadata Panel** | MUI `Accordion` (expandable sections) | Two-column grid, all rows expanded |
| **Status Badge** | Full-width row, centered text | Inline, right-aligned in header |
| **Share Buttons** | WhatsApp prominent (first), others in horizontal scroll | All buttons inline, equal width |
| **Language Toggle** | Top-right, `size="small"` | Top-right, `size="small"` |
| **Print Button** | Full-width `Button` below share | Inline `Button` next to share |
| **Academy Branding** | Stacked vertically (logo above name, centered) | Horizontal (logo left, name + contact right) |
| **Loading Skeleton** | Single column, 4 skeleton rows | Two-column skeleton matching split layout |
| **Error State** | Full-width card, centered | Max-width 600px card, centered |
| **Rate Limit Error** | Full-width, countdown prominent | Max-width 500px, centered |
| **Manual Entry Form** | Full-width TextField, large touch target | Max-width 400px, centered |
| **RTL (Arabic)** | `dir="rtl"`, text right-aligned, icon order reversed | `dir="rtl"`, layout flex-reversed |

**Breakpoint strategy** (MUI v9 `theme.breakpoints`):
- `xs` (0-599px): Mobile layout
- `sm` (600-899px): Tablet — mobile layout with larger touch targets
- `md` (900-1239px): Desktop layout
- `lg`+ (1240px+): Desktop layout, centered with max-width 800px

**Responsive switch implementation**:
```typescript
// verificationView.tsx
const isMobile = useMediaQuery((theme: Theme) => theme.breakpoints.down('md'));

if (isMobile) {
  return <VerificationMobileView {...viewProps} />;
}
return <VerificationDesktopView {...viewProps} />;
```

### Interaction States

Each component must define the following interaction states:

#### CertificateMetadataPanel
| State | Behavior |
|-------|----------|
| **Default** | MUI `Box` with `borderRadius: 2`, `p: 3`, `bgcolor: 'background.paper'` |
| **Hover** | N/A (informational display — no hover effect) |
| **Focus** | MUI `Accordion` summary gets visible focus ring (keyboard navigation) |
| **Loading** | Replaced by `VerificationLoading` at the view level — not rendered individually |
| **Error** | Replaced by `ErrorState` at the view level — not rendered individually |

#### VerificationStatusBadge
| State | Behavior |
|-------|----------|
| **Default** | MUI `Chip` with status color (`success`/`error`/`warning`), hovered `sx={{ opacity: 0.9 }}` |
| **Hover** | `cursor: default` (non-interactive badge); subtle elevation |
| **Focus** | N/A (non-interactive — no tabindex) |
| **Print** | Black text on white background, border-only (no color fill) — per `@media print` sx override |

#### ShareButtons
| State | Behavior |
|-------|----------|
| **Default** | MUI `IconButton` row/stack, `variant="outlined"`, `size="small"` |
| **Hover** | `variant="contained"` background, `cursor: pointer` |
| **Focus** | Visible focus ring (keyboard navigation — `tabindex: 0`) |
| **Active (Copied)** | Copy button shows checkmark icon + "Copied!" text for 2s, then reverts |
| **Error (Copy failed)** | Copy button shows error icon + "Failed" text for 2s, then reverts |
| **Print** | `sx={{ '@media print': { display: 'none' } }}` — hidden in print |

#### PrintButton
| State | Behavior |
|-------|----------|
| **Default** | MUI `Button` with print icon, `variant="outlined"`, `size="small"` |
| **Hover** | `variant="contained"` background |
| **Focus** | Visible focus ring (keyboard navigation) |
| **Active (Printing)** | Briefly shows "Opening print dialog..." text, then calls `window.print()` |
| **Print** | `sx={{ '@media print': { display: 'none' } }}` — hidden in print |

#### LanguageToggle
| State | Behavior |
|-------|----------|
| **Default** | MUI `ToggleButtonGroup`, `size="small"`, `exclusive`, selected button has `contained` variant |
| **Hover** | Unselected buttons get subtle background highlight |
| **Focus** | Visible focus ring on the toggle group (keyboard arrow navigation) |
| **Print** | `sx={{ '@media print': { display: 'none' } }}` — hidden in print |

#### ManualCodeForm
| State | Behavior |
|-------|----------|
| **Default** | MUI `TextField` (outlined), `Button` (contained), `fullWidth` on mobile |
| **Focus** | TextField outline color → `primary.main`, visible focus ring |
| **Validation Error** | TextField `error: true`, `helperText` shows `status.invalidFormat.*` message, `aria-invalid: true` |
| **Submitting** | Button shows `CircularProgress` spinner, `disabled: true` |
| **Empty Submit** | Shows validation error ("Please enter a verification code") |

#### RateLimitError
| State | Behavior |
|-------|----------|
| **Default** | MUI `Alert` with `severity="warning"`, countdown text centered |
| **Countdown Active** | `setInterval` decrements `retryAfter` every 1s, text updates via `retryInSeconds(count)` |
| **Countdown Complete** | Auto-calls `onRetry` callback, component unmounts (replaced by loading state) |
| **Print** | `sx={{ '@media print': { display: 'none' } }}` — hidden in print |

#### DownloadButton
| State | Behavior |
|-------|----------|
| **Default** | MUI `Button` with download icon, `variant="outlined"`, `size="small"` |
| **Hover** | `variant="contained"` background |
| **Focus** | Visible focus ring (keyboard navigation) |
| **Loading** | Button shows `CircularProgress` spinner (small), `disabled: true` |
| **Error** | MUI `Snackbar` with error message, button returns to default state |
| **Print** | `sx={{ '@media print': { display: 'none' } }}` — hidden in print |

---

## Design Decisions

### DD-1: Client-Side Apollo Query vs. Server-Side Data Fetch

**Decision**: Use client-side `useQuery` for verification data. Use `generateMetadata` (server-side) only for SEO meta tags.

**Rationale**:
- Loading skeletons, rate-limit countdowns, and retry logic all require client-side query lifecycle
- The verification result is user-interactive (share, print, retry) — client-side state is natural
- SEO only needs the certificate title/description/image for OG tags — `generateMetadata` handles this with a lightweight server-side fetch
- If we SSR'd the full result, we'd need to hydrate Apollo cache from the server data, adding complexity for a public page

**Alternative**: Server component fetches certificate data, passes as serialized props to client container. Rejected because loading/error state management becomes split between server and client, and rate-limit retry needs pure client-side control.

### DD-2: Verification Code Format Validation

**Decision**: Validate code format client-side using a regex pattern before firing the GraphQL query. If invalid, skip the query and display an invalid-format error.

**Code format** (from Plan 1 — `certificate_verifications` entity model): verification codes are alphanumeric strings of a defined length (exact pattern TBD by Plan 1 schema). The client-side validator checks:
- Non-empty
- Matches allowed character set (alphanumeric + hyphens)
- Within expected length range

**Rationale**: Avoids wasted network requests for obviously malformed codes (e.g., someone types random text in the manual entry form).

### DD-3: Rate Limit Handling

**Decision**: When the Apollo query returns a `RATE_LIMITED` GraphQL error, the client container extracts the `retryAfter` seconds from the error extensions and displays a countdown timer. The countdown decrements every 1 second using `setInterval`. When it reaches 0, it auto-refires the query.

**Error shape** (from Plan 5 resolver):

```
GraphQL error:
  message: "Rate limit exceeded"
  extensions:
    code: "RATE_LIMITED"
    retryAfter: 60  (seconds)
```

**Rationale**: Countdown UX is more user-friendly than a static "try again later" message. Auto-retry eliminates a manual retry click.

### DD-4: SEO Metadata Strategy

**Decision**: The `generateMetadata` function in `app/verify/[code]/page.tsx` calls `CertificateVerificationService.verifyForMetadata(code)` — a lightweight server-side service call (NOT via GraphQL). Rate limiting at the service layer (`CERT_VERIFY_METADATA_RATE_LIMIT_PER_MIN`, default 120) applies to this path too (see DD-5a).

**Data flow**:

```
generateMetadata(code, locale)
  │
 └─► CertificateVerificationService.verifySafe(code)
      │
      └─► Returns: { status, certificate? }
          │
          └─► If VALID: build OG/Twitter tags with recipient name + title
              If NOT_FOUND/INVALID: build generic tags
```

**Rationale**:
- Server components can call services directly (per Siraj architecture — no need for a GraphQL roundtrip)
- `generateMetadata` is already server-side — it can fetch data for meta tags
- The client-side Apollo query is separate and runs after hydration for the interactive UI
- This means the certificate data is fetched twice on first load (once in `generateMetadata` for SEO, once in Apollo for UI), but:
  - `generateMetadata` runs in the Next.js build/render pipeline (edge or Node)
  - The Apollo query is cached and normalized
  - The SEO fetch is a single-lightweight-query (just title + recipient name)
  - The double-fetch is acceptable for a public page where SEO correctness is critical

**Alternative**: Generate meta tags from the Apollo query result client-side. Rejected because meta tags must be in the initial HTML for crawlers — client-side injection doesn't work reliably for Open Graph.

### DD-5: Verification Logging Architecture

**Decision**: Verification logging happens in the backend service layer (Plan 5's `CertificateVerificationService`), called from the GraphQL resolver, not from the frontend.

**Flow**:

```
Client Apollo query
  → POST /api/graphql
  → Pothos resolver (verifyCertificate)
    → CertificateVerificationService.verifySafe(code, requestContext)
      → Rate limit check (service-level, cache)
      → CertificateRepository.findByVerificationCode(code)
      → VerificationLogService.log({
          certificateId, code, result, ip, userAgent, source, timestamp
        })
      → Return result
    → Return GraphQL response
  → Client receives result
```

**Service-level rate limiting (P0)**: The rate limit check lives INSIDE `verifySafe()` — not at the resolver. This ensures both the GraphQL resolver path AND the `generateMetadata` server-side path (`verifyForMetadata()`) are protected. See Security Considerations → Rate Limiting for the full two-tier spec.

**Request context** (passed to logging):
- `ip`: extracted from `x-forwarded-for` or connection remote address
- `userAgent`: from request headers
- `timestamp`: server UTC time

**Non-blocking**: The `VerificationLogService.log()` call is wrapped in a try-catch that logs the error but does not throw. Verification result is returned regardless of logging success.

### DD-6: Public Layout Design

**Decision**: `app/verify/layout.tsx` renders a minimal layout:
- `<main>` wrapping children
- A centered, constrained container (max-width 800px) for the verification card
- A minimal header with academy logo/brand (small, top-center or top-start depending on locale) — provided by `AcademyBranding` component (see DD-9)
- A minimal footer with academy name + "Powered by Siraj"
- LanguageToggle component in the top-right corner (see DD-10)
- No sidebar, no navigation menu, no user menu, no theme toggle

**Rationale**: Public verification page should look like a standalone landing page, not part of the dashboard. Clean, focused on the verification result. Minimal branding for trust context.

### DD-7: Print CSS Strategy

**Decision**: Use MUI's `sx` prop with `@media print` media query to hide interactive elements and style the print output.

**Print-visible elements**: CertificateMetadataPanel, certificate details, VerificationStatusBadge, "Verification Proof" header, verified-by seal text.
**Print-hidden elements**: ShareButtons, PrintButton, DownloadButton, LanguageToggle, manual entry form, header/footer chrome.

**Revoked certificate print**: When `status === 'revoked'`, the print output MUST render the VerificationStatusBadge prominently (high-contrast border, large text) and overlay a "REVOKED" watermark on any certificate preview. A printed revoked certificate that looks valid is a fraud vector — this is mandatory.

**Expired certificate print**: Similarly, print an "EXPIRED" watermark prominently.

**Not-found print**: Print is excluded entirely for `NOT_FOUND` state (no PrintButton rendered).

### DD-8: Accessibility Design

**Decision**:
- Use MUI semantic components (Card, Chip, Button) which provide base ARIA roles
- Add `aria-busy="true"` on the container during loading
- Add `role="alert"` and `aria-live="assertive"` on error containers
- Add `aria-label` on VerificationStatusBadge (e.g., "Status: Valid")
- Add `<label htmlFor>` on manual code input
- Ensure Tab order follows visual order (no tabindex manipulation)
- Color contrast: use theme palette status colors (success/error/warning) which meet WCAG AA by design
- LanguageToggle: `aria-label` on each toggle button ("Switch to English" / "Switch to Arabic")
- ShareButtons: `aria-label` on each share button
- Certificate preview: `alt` text describing the certificate ("Certificate preview for [recipientName]")

### DD-9: Academy Branding

**Decision**: The verification page displays academy branding (logo + name + optional contact email) on valid certificates to build trust. This is a verified-safe display — the academy name is already part of the `VerificationCertificate` type.

**Display rules**:
- Logo: MUI `Avatar` with `src={academyLogoUrl}` — falls back to academy initials if image fails
- Name: `Typography` heading (h6 on mobile, h5 on desktop)
- Contact email: `mailto:` link (only if `academyContactEmail` is present — academy-configured, not automatic)
- Trust signal: "Verified by [academy name]" with the Siraj verification system branding
- No academy-specific theme override — uses Siraj theme palette for consistency

**Rationale**: When someone scans a QR code, they need to see WHO issued the certificate. The academy name and logo provide immediate trust context. Contact email allows the verifier to reach the academy directly if they have questions.

### DD-10: Language Toggle for Public Page

**Decision**: The verification page includes a visible `LanguageToggle` component (EN/AR) because this is a PUBLIC page — the user may have arrived via a QR code without any app locale preference set. Unlike dashboard pages (where the user has already chosen their locale), the public verifier may be anyone.

**Mechanism**: The toggle uses `router.replace('/verify/${code}?lang=ar|en')` to trigger a server-side locale cookie update and RSC re-render. No full page reload — the RSC pipeline re-renders with the new locale. The `?lang=` param is stripped from the canonical URL (for SEO) via `rel=canonical`.

### DD-11: CDN Caching and ISR

**Decision**: The verification page uses `export const revalidate = 3600` (1-hour ISR) and sets `Cache-Control` headers:
- `VALID` / `REVOKED` / `EXPIRED`: `s-maxage=3600, stale-while-revalidate=600` — CDN caches for 1 hour
- `NOT_FOUND`: `no-store` — no caching (enumeration protection)

**Rationale**: Verification pages are identical for all viewers of the same code — CDN caching dramatically reduces DB load and improves TTFB. The `NOT_FOUND` exception prevents cache-timing enumeration. This addresses SWE Review issue #3 (P1).

### DD-12: SEO — Canonical URL and Robots Directive

**Decision**:
- `<link rel="canonical" href="/verify/[code]">` — deduplicates `?lang=ar` and `?lang=en` variants (both canonical to the bare URL)
- `<meta name="robots" content="noindex, follow">` — verification pages are ephemeral per-certificate pages, not search destinations. `noindex` prevents SERP pollution; `follow` allows crawlers to follow academy links.

**Rationale**: Without canonical, `?lang=ar` and `?lang=en` create duplicate-content signals. Without `noindex`, every certificate verification page could be indexed, polluting SERPs. This addresses SWE Review issues #13 and #14 (P1).

### DD-13: OG Image Strategy

**Decision**: For `VALID` certificates, the OG image is the certificate render (from Plan 6's `CertificateRenderService`) resized to 1200×630, or a dynamically generated OG image via `next/og` `ImageResponse`. For non-valid results, a static branded fallback `/og/cert-verify-default.png`.

**Rationale**: Social sharing previews are critical for trust. A certificate verification page shared on social media should show the actual certificate, not just text. The 1200×630 dimension is the Open Graph standard. This addresses SWE Review issue #14 (P1).

### DD-14: JSON-LD Structured Data

**Decision**: The page includes a `<script type="application/ld+json">` block with `EducationalOccupationalCredential` structured data for `VALID` certificates only.

**Rationale**: Structured data helps search engines understand the page content type (educational credential). Only rendered for valid certificates to avoid signaling revoked/expired credentials to crawlers.

### DD-15: Analytics Source Detection

**Decision**: The verification log includes a `source` field inferred from the `referer` header: `qr_scan` (no referer / direct), `link_click` (has external referer), `manual_entry` (from `/verify` page).

**Rationale**: Academies need to know how their certificates are being verified (QR scans vs email links vs manual entry). This data feeds Plan 18's certificate detail timeline. The source is inferred server-side from request headers — no client-side tracking scripts needed (privacy-friendly).

---

## Data Model References

### Tables Touched (Read Only — this plan does not create tables)

| Table | Usage | Plan that Creates Schema |
|-------|-------|--------------------------|
| `certificates` | Lookup by verification code, read fields for display | Plan 1 |
| `certificate_verifications` | Insert verification log entries | Plan 1 |
| `certificate_templates` | Join for template preview data | Plan 1 |

### Repository Methods (Consumed — Provided by Plan 3)

| Method | Signature | Usage |
|--------|-----------|-------|
| `CertificateRepository.findByVerificationCode` | `(tx, code: string) => CertificateSelectType \| null` | Main lookup |
| `VerificationLogRepository.create` | `(tx, input: VerificationLogInsertType) => void` | Log entry insertion |

### Service Methods (Consumed — Provided by Plan 4)

| Method | Signature | Usage |
|--------|-----------|-------|
| `CertificateVerificationService.verifySafe` | `(code: string, requestContext: { ip, userAgent }) => VerificationReturnType` | Public verification logic + logging |
| `CertificateVerificationService.verifyForMetadata` | `(code: string) => VerificationMetadataReturnType` | Lightweight fetch for `generateMetadata` (no logging) |

### Types (Consumed — Provided by Plan 2)

| Type | Source | Usage |
|------|--------|-------|
| `VerificationReturnType` | `backend/types/certificate-verification.types.ts` | Service return type for public verification |
| `VerificationCertificateReturnType` | `backend/types/certificate-verification.types.ts` | Certificate-safe fields for public display |
| `VerificationMetadataReturnType` | `backend/types/certificate-verification.types.ts` | Lightweight metadata-only return type |
| `VerificationLogInsertType` | `backend/types/certificate-verification.types.ts` | Insert type for `certificate_verifications` |

---

## i18n Design

### Namespace Structure

```
shared/locale/
├── types/
│   └── certificates/
│       └── verification.ts          ← VerificationLabels interface
├── namespaces/
│   └── certificates/
│       └── verification.namespace.ts ← defineNamespace registration
├── ar/
│   └── certificates/
│       └── verification.ts           ← Arabic implementation
└── en/
    └── certificates/
        └── verification.ts           ← English implementation
```

### Registration Points (6 files to edit/create)

1. **Create** `shared/locale/types/certificates/verification.ts` — `VerificationLabels` interface with all key groups: `page`, `status`, `result`, `fields`, `loading`, `error`, `share`, `print`, `seo`
2. **Create** `shared/locale/ar/certificates/verification.ts` — Arabic implementation with pluralization rules for `error.rateLimited.retryInSeconds`
3. **Create** `shared/locale/en/certificates/verification.ts` — English implementation with pluralization
4. **Create** `shared/locale/namespaces/certificates/verification.namespace.ts` — `defineNamespace("certificates.verification", { load: { en, ar } })`
5. **Edit** `shared/locale/namespaces/translation.ts` — Add `Certificates: { Verification: CertificatesVerification }` to the `Translation` registry
6. **Edit** `shared/locale/types/message.ts` — Add `VerificationLabels` to `MessageSchema` type under `Certificates.Verification`

### Server-Side Usage (in `page.tsx` and `generateMetadata`)

```
getTranslations(locale).certificates.verification.page.title
getTranslations(locale).certificates.verification.seo.title.valid(recipientName, certificateTitle)
```

### Client-Side Usage (in Container and View components)

```
useAppTranslation(Translation.Certificates).verification.page.title
useAppTranslation(Translation.Certificates).verification.share.copyLink
```

### Pluralization Implementation

The `error.rateLimited.retryInSeconds` key is a `(count: number) => string` function:

**Arabic rules** (per `shared/locale/` convention):
- `count === 0` → "الآن" (now)
- `count === 1` → "ثانية واحدة" (one second)
- `count === 2` → "ثانيتان" (two seconds)
- `count >= 3 && count <= 10` → `${count} ثوان` (few seconds)
- `count > 10` → `${count} ثانية` (many seconds)

**English rules**:
- `count === 0` → "now"
- `count === 1` → "1 second"
- `count > 1` → `${count} seconds`

### Interpolation Usage

- `page.verifiedBy(academyName, date)` — used in print header
- `seo.title.valid(recipientName, certificateTitle)` — used in OG title meta tag
- `print.verifiedBy(academyName, date)` — used in print seal text

### i18n Key Tables — Full VerificationLabels Interface (English + Arabic)

The `VerificationLabels` interface in `shared/locale/types/certificates/verification.ts` defines all translation keys. Below are the complete tables with English and Arabic values.

#### Page Labels (`page.*`)

| Key | English | Arabic |
|-----|---------|--------|
| `page.title` | "Verify Certificate" | "التحقق من الشهادة" |
| `page.subtitle` | "Enter a verification code to check certificate validity" | "أدخل رمز التحقق للتحقق من صلاحية الشهادة" |
| `page.manualEntry.title` | "Manual Verification" | "التحقق اليدوي" |
| `page.manualEntry.placeholder` | "Enter verification code" | "أدخل رمز التحقق" |
| `page.manualEntry.submit` | "Verify" | "تحقق" |
| `page.manualEntry.helpText` | "Find the code on your certificate or scan the QR code" | "ابحث عن الرمز على شهادتك أو امسح رمز QR" |
| `page.verifiedBy(academyName, date)` | "Verified by {academyName} on {date}" | "تم التحقق بواسطة {academyName} في {date}" |
| `page.verifyProof` | "Verification Proof" | "إثبات التحقق" |
| `page.poweredBy` | "Powered by Siraj" | "بدعم من سراج" |

#### Status Labels (`status.*`)

| Key | English | Arabic |
|-----|---------|--------|
| `status.valid.title` | "Valid" | "صالحة" |
| `status.valid.verified` | "This certificate is verified and valid" | "هذه الشهادة موثقة وصالحة" |
| `status.revoked.title` | "Revoked" | "ملغاة" |
| `status.revoked.revoked` | "This certificate has been revoked" | "تم إلغاء هذه الشهادة" |
| `status.revoked.description` | "The certificate is no longer valid" | "الشهادة لم تعد صالحة" |
| `status.expired.title` | "Expired" | "منتهية" |
| `status.expired.expired` | "This certificate has expired" | "انتهت صلاحية هذه الشهادة" |
| `status.expired.description` | "The certificate validity period has ended" | "انتهت فترة صلاحية الشهادة" |

#### Result Labels (`result.*`)

| Key | English | Arabic |
|-----|---------|--------|
| `result.valid.title` | "Certificate Verified" | "تم التحقق من الشهادة" |
| `result.valid.description` | "This certificate is authentic and currently valid" | "هذه الشهادة أصلية وصالحة حالياً" |
| `result.revoked.title` | "Certificate Revoked" | "الشهادة ملغاة" |
| `result.revoked.description` | "This certificate has been revoked and is no longer valid" | "تم إلغاء هذه الشهادة ولم تعد صالحة" |
| `result.revoked.revocationDate` | "Revoked on" | "ألغيت في" |
| `result.expired.title` | "Certificate Expired" | "الشهادة منتهية الصلاحية" |
| `result.expired.description` | "This certificate has expired" | "انتهت صلاحية هذه الشهادة" |
| `result.expired.validityPeriod(issueDate, expiryDate)` | "Valid from {issueDate} to {expiryDate}" | "صالحة من {issueDate} إلى {expiryDate}" |
| `result.expired.expiryDate` | "Expired on" | "انتهت في" |
| `result.notFound.title` | "Certificate Not Found" | "الشهادة غير موجودة" |
| `result.notFound.description` | "No certificate matches this verification code" | "لا توجد شهادة تطابق رمز التحقق هذا" |
| `result.notFound.tryManualEntry` | "Try a different code" | "جرب رمزاً مختلفاً" |
| `result.invalidFormat.title` | "Invalid Code Format" | "تنسيق رمز غير صالح" |
| `result.invalidFormat.description` | "The verification code format is not recognized" | "تنسيق رمز التحقق غير معروف" |
| `result.invalidFormat.tryAgain` | "Enter a different code" | "أدخل رمزاً مختلفاً" |

#### Field Labels (`fields.*`)

| Key | English | Arabic |
|-----|---------|--------|
| `fields.certificateTitle` | "Certificate Title" | "عنوان الشهادة" |
| `fields.recipientName` | "Recipient Name" | "اسم المستلم" |
| `fields.issueDate` | "Issue Date" | "تاريخ الإصدار" |
| `fields.expiryDate` | "Expiry Date" | "تاريخ الانتهاء" |
| `fields.revocationDate` | "Revocation Date" | "تاريخ الإلغاء" |
| `fields.verificationDate` | "Verification Date" | "تاريخ التحقق" |
| `fields.academyName` | "Issued By" | "أصدرتها" |
| `fields.academyContact` | "Contact" | "تواصل" |
| `fields.verificationCode` | "Verification Code" | "رمز التحقق" |

#### Loading Labels (`loading.*`)

| Key | English | Arabic |
|-----|---------|--------|
| `loading.verifying` | "Verifying certificate..." | "جاري التحقق من الشهادة..." |
| `loading.loadingPreview` | "Loading preview..." | "جاري تحميل المعاينة..." |

#### Error Labels (`error.*`)

| Key | English | Arabic |
|-----|---------|--------|
| `error.network.title` | "Connection Error" | "خطأ في الاتصال" |
| `error.network.description` | "Unable to connect. Please check your internet and try again." | "تعذر الاتصال. يرجى التحقق من اتصالك بالإنترنت والمحاولة مرة أخرى." |
| `error.network.retry` | "Retry" | "إعادة المحاولة" |
| `error.server.title` | "Server Error" | "خطأ في الخادم" |
| `error.server.description` | "Something went wrong. Please try again later." | "حدث خطأ ما. يرجى المحاولة مرة أخرى لاحقاً." |
| `error.server.retry` | "Retry" | "إعادة المحاولة" |
| `error.rateLimited.title` | "Too Many Requests" | "عدد طلبات كبير جداً" |
| `error.rateLimited.description` | "Please wait before trying again." | "يرجى الانتظار قبل المحاولة مرة أخرى." |
| `error.rateLimited.retryInSeconds(count)` | (pluralized) "Retry in {count} seconds" | (مُعرب) "إعادة المحاولة خلال {count} ثوانٍ" |
| `error.rateLimited.waiting` | "Waiting..." | "جاري الانتظار..." |

#### Share Labels (`share.*`)

| Key | English | Arabic |
|-----|---------|--------|
| `share.title` | "Share Verification" | "مشاركة التحقق" |
| `share.copyLink` | "Copy Link" | "نسخ الرابط" |
| `share.copied` | "Copied!" | "تم النسخ!" |
| `share.copyFailed` | "Failed to copy" | "فشل النسخ" |
| `share.native` | "Share" | "مشاركة" |
| `share.whatsapp` | "WhatsApp" | "واتساب" |
| `share.twitter` | "X (Twitter)" | "X (تويتر)" |
| `share.linkedin` | "LinkedIn" | "لينكد إن" |
| `share.facebook` | "Facebook" | "فيسبوك" |
| `share.telegram` | "Telegram" | "تيليجرام" |

#### Print Labels (`print.*`)

| Key | English | Arabic |
|-----|---------|--------|
| `print.title` | "Print" | "طباعة" |
| `print.printing` | "Opening print dialog..." | "جاري فتح نافذة الطباعة..." |
| `print.verifiedWatermark` | "VERIFIED" | "مُوثَق" |
| `print.revokedWatermark` | "REVOKED" | "مُلغَاة" |
| `print.expiredWatermark` | "EXPIRED" | "مُنتهية" |
| `print.verifiedBy(academyName, date)` | "Verified by {academyName} on {date}" | "تم التحقق بواسطة {academyName} في {date}" |
| `print.verificationProof` | "Verification Proof" | "إثبات التحقق" |
| `print.certificateDetails` | "Certificate Details" | "تفاصيل الشهادة" |

#### SEO Labels (`seo.*`)

| Key | English | Arabic |
|-----|---------|--------|
| `seo.title.valid(recipientName, certificateTitle)` | "{recipientName} — {certificateTitle} (Verified)" | "{recipientName} — {certificateTitle} (مُوثَق)" |
| `seo.title.generic` | "Certificate Verification — Siraj" | "التحقق من الشهادة — سراج" |
| `seo.description.valid` | "Verify the authenticity of this certificate" | "تحقق من أصالة هذه الشهادة" |
| `seo.description.generic` | "Certificate verification system by Siraj" | "نظام التحقق من الشهادات من سراج" |

#### Accessibility Labels (`a11y.*`)

| Key | English | Arabic |
|-----|---------|--------|
| `a11y.statusPrefix` | "Status:" | "الحالة:" |
| `a11y.loading` | "Loading, please wait" | "جاري التحميل، يرجى الانتظار" |
| `a11y.verified` | "Certificate verified" | "تم التحقق من الشهادة" |
| `a11y.rateLimitCountdown` | "Retry in {count} seconds" | "إعادة المحاولة خلال {count} ثوانٍ" |
| `a11y.previewAlt` | "Certificate preview for {recipientName}" | "معاينة الشهادة لـ {recipientName}" |
| `a11y.logoAlt` | "{academyName} logo" | "شعار {academyName}" |
| `a11y.toggleToEnglish` | "Switch to English" | "التبديل للإنجليزية" |
| `a11y.toggleToArabic` | "Switch to Arabic" | "التبديل للعربية" |
| `a11y.share.copy` | "Copy verification link" | "نسخ رابط التحقق" |
| `a11y.share.whatsapp` | "Share on WhatsApp" | "مشاركة على واتساب" |
| `a11y.share.twitter` | "Share on X" | "مشاركة على X" |
| `a11y.share.linkedin` | "Share on LinkedIn" | "مشاركة على لينكد إن" |
| `a11y.share.facebook` | "Share on Facebook" | "مشاركة على فيسبوك" |
| `a11y.share.telegram` | "Share on Telegram" | "مشاركة على تيليجرام" |
| `a11y.print` | "Print verification proof" | "طباعة إثبات التحقق" |
| `a11y.download` | "Download certificate" | "تحميل الشهادة" |

---

## Error Handling Strategy

### Error Categories and Response

| Error Category | Source | UI State | Retry Behavior |
|----------------|--------|----------|----------------|
| Invalid code format | Client-side validation | InvalidFormat error state | Manual retry (enter new code) |
| Certificate not found | GraphQL `status: NOT_FOUND` | NotFound error state | Enter different code |
| Network error | Apollo `networkError` | NetworkError state | Retry button |
| Server error | Apollo `graphQLErrors` (non-rate-limit) | ServerError state | Retry button |
| Rate limit exceeded | Apollo `graphQLErrors` with `RATE_LIMITED` code | RateLimited state with countdown | Auto-retry after countdown |
| Revoked certificate | GraphQL `status: REVOKED` | Valid response with revoked display | N/A (valid response) |
| Expired certificate | GraphQL `status: EXPIRED` | Valid response with expired display | N/A (valid response) |

### Apollo Error Link

The client container processes errors from `useQuery`:
1. Check `error.networkError` → set status to `networkError`
2. Check `error.graphQLErrors` → iterate to find:
   - `extensions.code === 'RATE_LIMITED'` → extract `extensions.retryAfter`, set status to `rateLimited`
   - Other GraphQL errors → set status to `serverError`
3. On success → check `data.verifyCertificate.status`:
   - `VALID` → set status to `valid`
   - `REVOKED` → set status to `revoked`
   - `EXPIRED` → set status to `expired`
   - `NOT_FOUND` → set status to `notFound`

---

## UX / Navigation Specification

### Routes

| Route | Auth Required | Layout | Purpose |
|-------|---------------|--------|---------|
| `/verify` | No | Public | Manual code entry form |
| `/verify/[code]` | No | Public | Verification result display |

### Mobile-First Design

Most QR code scans originate from mobile devices. The mobile layout is the primary design target.

**Mobile layout (`verificationMobileView.tsx`)**:
- Full-width container (`width: 100%`, no max-width constraint)
- Vertical stack: LanguageToggle → VerificationStatusBadge → AcademyBranding → CertificatePreview → CertificateMetadataPanel → ShareButtons → DownloadButton → PrintButton
- Certificate preview: full-width card, aspect ratio maintained from template dimensions, `max-width: 100%` to prevent horizontal overflow
- CertificateMetadataPanel: MUI `Accordion` (expandable sections) — first section expanded by default, subsequent sections collapsed to reduce scroll
- ShareButtons: if `navigator.share` is available, renders a single "Share" button that triggers the native share sheet; below it, a row of small icon buttons (WhatsApp prominent — first position; copy link; X; email). If `navigator.share` is unavailable, shows the full button row
- Touch targets: minimum 44×44px (MUI Button default size `large` on mobile)
- WhatsApp share button: prominent, larger than other share buttons, uses `https://wa.me/?text=` URL
- Print button: visible — mobile printing via browser's save-to-PDF is supported
- Works in portrait (default) and landscape (preview reflows to wider card)
- LanguageToggle: in the top-right corner, two compact `IconButton`s (EN | AR)

**Desktop layout (`verificationDesktopView.tsx`)**:
- Centered container, `max-width: 800px`, `margin: 0 auto`
- Split layout: certificate preview on the left (40% width), details panel on the right (60% width) — using MUI `Grid` or `Stack` with `direction="row"`
- CertificateMetadataPanel: two-column grid for detail rows (label left, value right)
- ShareButtons: full button row visible (copy, WhatsApp, X, LinkedIn, Facebook, Telegram, email)
- Print button: visible, in a toolbar with share buttons
- LanguageToggle: top-right corner of the page header

### Locale Detection (4-Step Cascade)

1. Check `?lang=ar|en` query param → if present, use and set `NEXT_LOCALE` cookie
2. Check `NEXT_LOCALE` cookie from `getLocale()` (in `@/shared/locale/server-cookies`)
3. Check `Accept-Language` header for `ar` or `en` preference
4. Default: `en`

The root `app/layout.tsx` already handles locale detection and sets `<html lang dir>`. The verify layout inherits this. The `?lang=` param triggers the same `NEXT_LOCALE` cookie writer used by the rest of the app (no new locale-switch mechanism — reuses existing one).

**`?lang=` cookie switch in RSC**: When a user clicks the `LanguageToggle`, it calls `router.replace('/verify/${code}?lang=ar')`. The server component reads `?lang` and sets the `NEXT_LOCALE` cookie via the existing cookie-set mechanism (same one used by locale switcher in the dashboard header). This triggers a RSC re-render with the new locale. No full page reload.

---

## Security Considerations

### Data Exposure Prevention

The `verifyCertificate` query (Plan 5) returns only verification-safe fields. The following are NOT exposed:
- Recipient email, phone, address
- Internal user/account IDs
- Template element data (positions, fonts, etc.)
- Recipient group information
- Any internal academy settings
- **`revocationReason`** — stripped per INTER_PLAN_CONTRACTS §6 (contains PII / internal notes)

### Rate Limiting (Service-Level — P0 Correction)

Rate limiting MUST be enforced at the **service layer** (`CertificateVerificationService.verifySafe` and `verifyForMetadata`), NOT only at the GraphQL resolver level. The `generateMetadata` server-side fetch path bypasses the resolver entirely — if rate limiting is only at the resolver, the metadata path is unprotected.

**Two-tier rate limiting** (per INTER_PLAN_CONTRACTS §13):

| Tier | Identifier | Default Limit | Env Var | Exceeded Behavior |
|------|-----------|---------------|---------|-------------------|
| Per-IP | Client IP (`x-forwarded-for` or connection remote) | 30 req / 5 min | `CERT_VERIFY_RATE_LIMIT_PER_IP` | Return `result: 'not_found'` (constant shape — no oracle) |
| Per-code | Verification code | 10 req / code / 24h | `CERT_VERIFY_MAX_ATTEMPTS_PER_CODE` | Return `result: 'not_found'` (collapsed — no oracle) |
| Metadata path | Client IP | 120 req / min | `CERT_VERIFY_METADATA_RATE_LIMIT_PER_MIN` | Return generic metadata (no certificate data) |

**Key**: When rate limit is exceeded, the response returns `result: 'not_found'` with `certificate: null` — the same shape as a genuinely not-found code. This prevents enumeration oracle attacks (attacker cannot distinguish "rate limited" from "doesn't exist").

**Per-code ceiling**: Tracked in the `certificate_verifications` table (query count per code over 24h window). Once exceeded, all subsequent requests for that code return `not_found` until the window resets. This collapses the `REVOKED` / `EXPIRED` / `NOT_FOUND` distinction for an abused code, eliminating the enumeration oracle.

**UUIDv4 entropy justification**: Verification codes are UUIDv4 (from Plan 1 — `verificationCode` entity model). UUIDv4 provides ≥128 bits of entropy (22+ base32 characters). Brute-forcing the code space even at 30 req/min is computationally infeasible (≈10^24 years). The rate limit is a defense-in-depth measure, not the primary protection.

### Code Enumeration Protection (P0)

Per INTER_PLAN_CONTRACTS §6, the public verification response MUST be **constant-shape**:
- `not_found` → `certificate: null`
- `revoked` → `certificate` with revoked status (but WITHOUT `revocationReason`)
- `expired` → `certificate` with expired status
- `valid` → full certificate info
- Rate limit exceeded → same as `not_found` (collapsed)

The distinction between `revoked`, `expired`, and `not_found` is maintained for UX clarity (the user who scanned a valid QR code deserves to know their certificate was revoked vs. not found). The per-code attempt ceiling (above) collapses this distinction only for codes being brute-forced, not for legitimate one-time verifications.

### GraphQL Public Query Allow-List

The `verifyCertificate` query MUST be:
- Registered on a Pothos builder/branch with **no auth scope** (Siraj's `authScope` system — uses `public()` scope, not `@authRequired`)
- Added to the GraphQL endpoint's **public-query allow-list** (next to any other public queries)
- A **query, not mutation** (idempotent read — CSRF rules for non-safe methods don't apply)
- Exempt from the GraphQL CSRF token requirement (no auth, no CSRF token for this one query)

**Cross-plan contract with Plan 5**: Plan 5's resolver implementation MUST:
1. Register `verifyCertificate` with `public()` auth scope (no `@authRequired`)
2. Add it to the public-query allow-list
3. Call `CertificateVerificationService.verifySafe()` which enforces service-level rate limiting
4. Log verification attempt non-blocking (try-catch, log error but don't throw)
5. Return the constant-shape response per §6

No separate public schema — Pothos per-field auth scopes gate the query; codegen remains unified.

### Headers

The public layout sets:
- `X-Frame-Options: DENY` — prevent iframe embedding (clickjacking)
- `Content-Security-Policy: frame-ancestors 'none'` — modern CSP equivalent (keep both for legacy browser support)
- `X-Content-Type-Options: nosniff`
- CORS: `Access-Control-Allow-Origin: *` for the GraphQL endpoint on the `verifyCertificate` query only (public, credentialess access — no cookies required)

### Input Sanitization

The verification code from the URL param is:
- Treated as untrusted input
- Validated against UUIDv4 format client-side and server-side
- Sanitized/normalized (uppercase, trim whitespace) before DB query
- Parameterized in DB queries (Drizzle ORM prevents SQL injection)

### Print Fraud Prevention

A printed revoked certificate must NOT look valid. Print CSS MUST:
- Render the `status="revoked"` badge prominently (high-contrast, large text)
- Overlay a "REVOKED" watermark on the certificate preview in print
- Exclude print for `NOT_FOUND` state (nothing to print)
- For `EXPIRED`, print the "EXPIRED" watermark prominently

---

## SEO and Performance

### Meta Tags (`generateMetadata`)

The `generateMetadata` function in `app/verify/[code]/page.tsx` generates:

| Meta Tag | Value | Source |
|----------|-------|--------|
| `<title>` | `"Certificate Verified — [recipientName], [certificateTitle]"` (VALID) or `"Certificate Verification"` (others) | `verifyForMetadata().recipientName + title` |
| `<meta name="description">` | Short description of the verified certificate (VALID) or generic (others) | `seo.description.valid(...) ` or `seo.description.generic` |
| `<link rel="canonical">` | `https://[domain]/verify/[code]` (without `?lang=` — dedup locale variants) | Hardcoded canonical URL |
| `<meta name="robots">` | `noindex, follow` — verification pages are ephemeral, not search destinations | Constant |
| `<meta property="og:title">` | Same as `<title>` (VALID) or generic (others) | From metadata |
| `<meta property="og:description">` | Same as description | From metadata |
| `<meta property="og:image">` | Certificate render PNG (VALID) or static fallback `/og/cert-verify-default.png` (others) | See OG Image below |
| `<meta property="og:image:width">` | `1200` | Constant |
| `<meta property="og:image:height">` | `630` | Constant |
| `<meta property="og:type">` | `website` | Constant |
| `<meta property="og:url">` | Canonical URL | Same as `rel=canonical` |
| `<meta name="twitter:card">` | `summary_large_image` | Constant |

**Revoked/Expired/NOT_FOUND**: `verifyForMetadata` returns generic "Certificate Verification" title + description. Recipient name and certificate title are NOT exposed in OG tags for non-valid certificates (prevents social preview of revoked certificates).

### OG Image

**VALID certificate**: `verifyForMetadata` returns a `ogImageUrl` field — either:
- A signed URL to the certificate render PNG (from Plan 6's `CertificateRenderService`) cached and resized to 1200×630
- Or a dynamically generated OG image via a Next.js image generation route (e.g., `app/verify/[code]/opengraph-image.tsx` using `ImageResponse` from `next/og`)

**Non-valid certificates**: Static fallback `/og/cert-verify-default.png` — a branded generic image with the Siraj certificate verification logo.

**Cache**: OG image is cached at the CDN level (same `revalidate` as the page). The image generation route uses `export const revalidate = 3600`.

### Robots Directive

`<meta name="robots" content="noindex, follow">` — verification pages are:
- `noindex` — not indexed by search engines (ephemeral per-certificate pages, not search destinations)
- `follow` — search engines can follow links on this page (e.g., to the academy website)

### Structured Data (JSON-LD)

The page includes a `<script type="application/ld+json">` block with a schema.org `EducationalOccupationalCredential` (or `Certificate` if available) structured data entry:

- `@type`: `EducationalOccupationalCredential`
- `name`: certificate title
- `credentialStatus`: `active` (valid), `revoked`, or `expired`
- `recognizedBy`: academy name
- `dateCreated`: issue date
- `expires`: expiration date (if present)
- `url`: canonical verification URL

This is only rendered for `VALID` results (no structured data for not-found/revoked/expired to avoid indexing signals).

### Performance — CDN Caching and ISR

**Route export**:
- `export const revalidate = 3600` (1 hour) — ISR revalidation interval
- `generateStaticParams` returns empty array (dynamic, not pre-rendered — codes are not known at build time)

**Cache headers** (per INTER_PLAN_CONTRACTS §13):

| Result | `Cache-Control` | Rationale |
|--------|-----------------|-----------|
| `VALID` | `s-maxage=3600, stale-while-revalidate=600` | CDN caches for 1 hour, serves stale for 10 min during revalidation |
| `REVOKED` / `EXPIRED` | `s-maxage=3600, stale-while-revalidate=600` | Same as valid — state doesn't change frequently |
| `NOT_FOUND` | `no-store` | No caching — prevents enumeration via cache timing |

**Double-fetch cost**: The `generateMetadata` (server) + Apollo `useQuery` (client) double-fetch is acknowledged (DD-4). With CDN caching, the metadata fetch is amortized — the first request hits the DB, subsequent requests within the `s-maxage` window are served from CDN. Without caching, every page load = 2 DB lookups (mitigated by caching).

**No heavy dependencies**: This page does NOT load XLSX, PDF-lib, editor libraries, or any heavy client-side deps. The Apollo client is the only significant client-side dependency (already loaded by the root layout).

### Analytics / Verification Tracking

**Verification log entry** (written by `CertificateVerificationService.verifySafe` in the backend):

| Field | Source | Purpose |
|-------|--------|---------|
| `certificateId` | From certificate lookup | Links to certificate |
| `verificationCode` | From URL param | Which code was used |
| `result` | `valid` / `revoked` / `expired` / `not_found` | Verification outcome |
| `ip` | `x-forwarded-for` or connection | Rate limiting + analytics |
| `userAgent` | Request headers | Source detection |
| `source` | Inferred from `referer` header | `qr_scan` (no referer / direct), `link_click` (has referer), `manual_entry` (from `/verify` page) |
| `timestamp` | Server UTC | When verified |

**Source detection**:
- No `referer` header or `referer` is external → `qr_scan` (QR code opened browser directly)
- `referer` from within the app (e.g., `/verify` manual entry) → `manual_entry`
- `referer` from another website/email → `link_click`

**Non-blocking**: The log write is wrapped in try-catch — failures are logged but do not throw. The verification result is returned regardless of logging success.

**Rate-limited requests**: Requests that fail the rate limit check do NOT create a `certificate_verifications` row (they're pre-service — no certificate lookup happened). This prevents table bloat from bot traffic.

**Integration with Plan 18**: The verification log feeds the certificate status timeline in Plan 18's detail page (academy dashboard shows "Last verified: [date], [source]"). This is a read-only cross-plan dependency — Plan 18 reads the log, Plan 19 writes it.

### Route Specification

| Route | Auth | Layout | Middleware Exclusion |
|-------|------|--------|---------------------|
| `/verify` | No | `app/verify/layout.tsx` | Must NOT be caught by any future auth middleware |
| `/verify/[code]` | No | `app/verify/layout.tsx` | Must NOT be caught by any future auth middleware |
| `/api/graphql` (for `verifyCertificate` query) | No (public allow-list) | N/A | Public query — no auth scope |

**No `middleware.ts` currently exists** in the project. Route protection is handled by layout-level auth guards in `app/(dashboard)/layout.tsx`. The `app/verify/` route MUST NOT have any auth guard in its layout. If a future `middleware.ts` is added, it MUST exclude `/verify/*` from auth redirects — documented as a requirement (FR-V1.7).

**Trailing slashes**: Next.js default dedupes trailing slashes. `/verify/CODE/` redirects to `/verify/CODE`. Confirm in `next.config.ts` during implementation.

**Query params**: `?lang=ar|en` (locale switch), `?download=pdf` (future — download intent from QR). The `[code]` page reuses the same 4-step locale detection as `/verify`.

---

## Outcome & Knowledge Transfer Protocol

### Knowledge This Plan Produces

1. **Public page pattern** — How to create public (non-auth) pages in Siraj's App Router, outside the `(dashboard)` route group
2. **Verification result UX** — Mobile-first design patterns for displaying certificate verification results
3. **Rate-limit client handling** — How to parse and display GraphQL rate-limit errors with countdown timers
4. **SEO for dynamic public pages** — Pattern for `generateMetadata` with server-side data fetch for OG tags
5. **Web Share API integration** — Native share sheet + fallback social buttons
6. **Print-friendly CSS** — Pattern for print-specific layouts hiding interactive elements

### Knowledge Propagation

- Update `frontend/NEW_PAGE_WORKFLOW.md` with public page creation steps (distinct from dashboard page workflow)
- Document the public route pattern in `frontend/COMPONENT_PATTERNS.md`
- Record SEO metadata pattern in `frontend/IMPLEMENTATION_LEARNINGS.md` if any gotchas encountered
- Final task in `tasks.md` handles this propagation

---

## Reality Check Notes

Verified against the actual codebase at `/home/ahmed/Projects/siraj-cert/` on 2026-08-02.

### Verified Correct
- **Public route placement**: `app/verify/[code]/page.tsx` directly under `app/` (not under `(dashboard)` or `(auth)`) matches the existing public-route pattern. Confirmed `app/(auth)/login`, `app/logout`, and `app/page.tsx` (redirects via `getServerUserContext`/`redirectToLogin`) are top-level public routes, and the dashboard is isolated under `app/(dashboard)/`. The plan's decision rationale is accurate.
- **Root layout reuse**: `app/layout.tsx` already provides MUI provider, theme detection, fonts, and `getLocale()`/`LocaleProvider` locale handling — exactly as the plan states. The public `app/verify/layout.tsx` nesting on top of it (minimal `<main>`, no sidebar/shell) is the correct pattern.
- **Locale/i18n**: `getLocale()` (from `@/shared/locale/server-cookies`) + `getTranslations(locale)` matches the actual compile-time i18n system in `shared/locale/`. NO `[locale]` dynamic route segment is used by Siraj (custom compile-time system replaces next-intl) — the plan correctly uses `app/verify/[code]` with no locale segment.
- **View location**: `frontend/common/views/verify/` (NOT nested under `frontend/common/views/dashboard/`) is a reasonable adaptation. The existing convention is `frontend/common/views/dashboard/<domain>/`, but `this` public page is single-tier/mobile-first and not dashboard-scoped, so a non-`dashboard/` sibling is appropriate. The tier view paths `frontend/mobile/views/verify/` and `frontend/desktop/views/verify/` follow the established tier split.
- **No `frontend/stores/` reference**: This plan correctly uses `frontend/common/graphql/sharedDocuments/` for the Apollo document and does not reference the non-existent `frontend/stores/` path. (`VerificationContainer` keeps state in component state, not a Zustand store — appropriate for a stateless public page.)
- **GraphQL document conventions**: `VerifyCertificateQueryDocument` in `frontend/common/graphql/sharedDocuments/certificates.verification.documents.ts` follows the `<domain>.documents.ts` + `{Entity}QueryDocument` naming documented in `frontend/common/graphql/AGENTS.md`. The `certificates` domain is new (no existing `.documents.ts` for it), so this is additive, not a path mismatch.
- **AGENTS.md / instruction file references**: All referenced files exist (`frontend/AGENTS.md`, `frontend/views/AGENTS.md`, `frontend/common/graphql/AGENTS.md`, `frontend/common/graphql/sharedDocuments/AGENTS.md`, `test/ui/AGENTS.md`, `shared/AGENTS.md`, `app/AGENTS.md`, `.agents/instructions/frontend.instructions.md`, `.agents/instructions/tests.instructions.md`). Knowledge-propagation targets (`frontend/NEW_PAGE_WORKFLOW.md`, `frontend/COMPONENT_PATTERNS.md`, `frontend/IMPLEMENTATION_LEARNINGS.md`) all exist.
- **No existing QR/verify pattern** in the repo — this is greenfield, so the plan is creating the verification UI from scratch (no stale references to override).

### Corrections Made
- None required. Plan 19's paths, route structure, layout decisions, and view/document conventions all match the actual codebase.

### Notes
- The `VerificationView` switcher in tasks.md §3.4 uses a manual `useMediaQuery` branch (rather than `ResponsiveViewSwitch` + `createLazyView`). For a single-tier public mobile-first page this is acceptable; the strict `no-restricted-imports` rule on `useMediaQuery`/`useViewport` applies to `.mobile.tsx`/`.desktop.tsx` tier files, not to a common switcher.


---

## SWE Expert Review Notes

> Review performed 2026-08-02 against the actual codebase at `/home/ahmed/Projects/siraj-cert/`.
>
> **All P0/P1/P2 issues below have been addressed in the enhanced design above.** Each issue is annotated with where the fix was applied:

### Architecture

1. **Route isolation — VERIFIED CORRECT.** `app/verify/[code]/page.tsx` directly under `app/` (not under `app/(dashboard)/` or `app/(auth)/`) matches the established public-route precedent. Confirmed: `app/(dashboard)/` is gated (has `layout.tsx` shell + auth); `app/(auth)/` is login; `app/logout`, `app/page.tsx` are the only other top-level public routes. DD in `design.md` is accurate.
2. **Rate limiting — IMPLEMENTED AT THE WRONG LAYER (P0 Gap — FIXED).** The design pushes rate limiting to the **GraphQL resolver** ("Plan 5's resolver for `verifyCertificate` handles rate limiting"). That is correct for the client-side Apollo path, BUT the design ALSO calls the `CertificateVerificationService.verifySafe(code)` directly from `generateMetadata` (DD-4) as a Server Component — this server-side path **bypasses the resolver-level rate limit entirely**. A crawler or attacker hitting the page triggers an unprotected server-side lookup per request. **Fix:** the service itself (or a shared `rateLimiter` middleware called by BOTH the resolver AND `verifySafeForMetadata`) must enforce IP-based limiting; do not rely on the resolver only. Add a distinct env (`CERT_VERIFY_METADATA_RATE_LIMIT_PER_MIN`, default 120) for the lighter metadata path.
   - **✅ ADDRESSED**: See Security Considerations → Rate Limiting (Service-Level — P0 Correction) — two-tier rate limiting at service layer (`verifySafe` + `verifyForMetadata`), with metadata-path limit of 120 req/min. DD-4 updated to reference service-level rate limiting.
3. **Verification-result cacheability / CDN — MISSING (P1 — FIXED).** No mention of `Cache-Control` / `s-maxage` / `stale-while-revalidate` headers on the `app/verify/[code]` route, and no `generateStaticParams`. For a public page that is identical for every viewer of the same code, this is a missed CDN win and a DoS-amplification risk (each request hits the DB via `generateMetadata`). **Fix:** add `export const revalidate = 60` (or ISR) + `Cache-Control: s-maxage=60, stale-while-revalidate=600` for `VALID` results; `NOT_FOUND` should be `no-store` (enumeration protection — see Security). Distinguish caching for the HTML page from the GraphQL POST (which is inherently not CDN-cached).
   - **✅ ADDRESSED**: See DD-11 (CDN Caching and ISR) + SEO and Performance → CDN Caching table. `revalidate = 3600`, `s-maxage=3600, stale-while-revalidate=600` for VALID/REVOKED/EXPIRED, `no-store` for NOT_FOUND.
4. **QR landing mobile optimization — adequately specified.** DD-6 + Mobile/Desktop table cover full-width card, Web Share API, touch targets. Acceptable.
5. **Deep linking — PARTIALLY ADDRESSED (P2 — FIXED).** The `/verify/[code]` route is deep-linkable, but the design does not specify handling of QR-encoded URLs that may carry a trailing slash, query params (e.g. `?lang=ar`), or a `?download=pdf` intent. Locale detection table covers `?lang=ar` for /verify, but the `[code]` page locale-detection rules (§UX/Navigation) are not restated. **Fix:** state that the `[code]` page reuses the same 4-step locale detection and that trailing slashes are normalized (Next.js default already dedupes — confirm in `next.config.ts`).
   - **✅ ADDRESSED**: See UX/Navigation → Locale Detection cascade note ("The `[code]` page reuses the same 4-step locale detection as `/verify`") and Route Specification section (trailing slash normalization + query params documented).

### Security

6. **Code enumeration — WEAK (P0 — FIXED).** The GraphQL `verifyCertificate(code)` returns a **distinct `NOT_FOUND` status** versus `VALID/REVOKED/EXPIRED`. Combined with no per-code rate limit (only per-IP), an attacker with the 30/min IP limit can distinguish "code does not exist" from "exists but revoked/expired" — an enumeration oracle. The design explicitly separates `NOT_FOUND` from other states for UX clarity (DD error table). **Fix:** (a) collapse `REVOKED`/`EXPIRED`/`NOT_FOUND` into a single public "invalid" envelope when the policy demands confidentiality, OR (b) keep the distinct statuses (needed for UX) but add a **per-code** attempt ceiling (e.g. `CERT_VERIFY_MAX_ATTEMPTS_PER_CODE=10` over 24h) tracked in `certificate_verifications`, returning the same merged payload once exceeded. State the decision explicitly.
   - **✅ ADDRESSED**: See Security Considerations → Code Enumeration Protection + Rate Limiting → Per-code ceiling. Decision: keep distinct statuses for legitimate one-time QR scans (UX clarity), but add per-code ceiling (10 req/code/24h). Once exceeded, response collapses to `not_found` (no oracle). Rate-limited requests also return `not_found` shape. INTER_PLAN_CONTRACTS §6 constant-shape mandate documented.
7. **Rate limit on verification attempts — PARTIAL.** Per-IP at 30/min is defined, but no per-code limit (see #6) and no IP rotation handling. Document the UUIDv4 code entropy assumption quantitatively (length ≥ 22 base32 chars ⇒ ≥ 128 bits ⇒ brute infeasible) to justify relying on IP limits alone *only if* the code space is large; otherwise #6 is mandatory.
8. **API information leak — ABOVE-QUOTA MESSAGE FINE; METADATA LEAK (P1 — FIXED).** The metadata fetch path (`verifyForMetadata`, DD-4) returns enough to populate OG tags (recipient name + title). For a **revoked** certificate, must `verifyForMetadata` return the recipient name into OG tags? A revoked cert's data arguably should not be broadcast via social preview. **Fix:** `verifyForMetadata` should return only `recipientName`+`title` for `VALID`; return a generic "Certificate Verification" title/description for `REVOKED`/`EXPIRED`/`NOT_FOUND`. Specify this branching.
   - **✅ ADDRESSED**: See SEO and Performance → Meta Tags table note: "Revoked/Expired/NOT_FOUND: `verifyForMetadata` returns generic 'Certificate Verification' title + description. Recipient name and certificate title are NOT exposed in OG tags for non-valid certificates."
9. **CSRF on public endpoint — N/A but state it.** The public path is: `GET /verify/[code]` (page render, idempotent) + `POST /api/graphql` (`verifyCertificate`, a query — Apollo uses POST for queries). GraphQL `POST` queries are protected by Siraj's existing CSRF posture on `/api/graphql`; the public query must be explicitly allow-listed in the GraphQL CSRF/introspection guard (no auth, no CSRF token requirement for this one query). The design omits whether the public query bypasses the site's GraphQL CSRF token middleware. **Fix:** add an explicit note that `verifyCertificate` is on the public allow-list of the GraphQL endpoint (next to any other public queries) and that it is a **query, not mutation** (sounsafe-method CSRF rules don't apply), and document the GraphQL endpoint's CORS for credentialed vs uncredentialed access from the public origin.
   - **✅ ADDRESSED**: See Security Considerations → GraphQL Public Query Allow-List — `verifyCertificate` registered with `public()` auth scope, added to public-query allow-list, query (not mutation), exempt from CSRF token, CORS `Access-Control-Allow-Origin: *` for this query only.
10. **`X-Frame-Options: DENY` — VERIFIED reasonable** but modern Siraj should use `Content-Security-Policy: frame-ancestors 'none'` (CSP already inherited per design). Keep both for legacy; note the redundancy.

### UX

11. **Result clarity — GOOD.** Four states (valid/revoked/expired/not-found) + distinct UI per state are clear.
12. **Share button — GOOD.** Web Share API + fallback social links + clipboard; canonical URL parameter (`url` prop) is correct.
13. **SEO-friendly — PARTIALLY (P1 — FIXED).** `generateMetadata` server-side fetch is the right call (DD-4). BUT: (a) no `<link rel="canonical" href>` is specified — multiple URLs (`/verify/CODE`, `/verify/CODE?lang=ar`) would create duplicate-content signals; (b) no `robots` directive — should `/verify/*` be `noindex,follow`? The verification page is per-certificate ephemeral content; indexing every code may pollute SERPs. **Decision required:** either `noindex` (recommended — these are not search destinations) or canonical. State it.
   - **✅ ADDRESSED**: See DD-12 (SEO — Canonical URL and Robots Directive) + SEO and Performance → Meta Tags table. Canonical to `/verify/[code]` (strips `?lang=`). Robots `noindex, follow`.
14. **Open Graph image — INCOMPLETE (P1 — FIXED).** The design lists OG title/description via `verifyForMetadata` but never specifies the OG **image**. A verification page shares the certificate visually — the natural OG image is the rendered certificate PNG (Plan 6 produces a render) OR a static branded fallback. **Fix:** specify OG image resolution: (a) if `VALID`, attempt `getOgImageForCertificate(code)` returning a signed URL or a generated PNG from the render service (cache it); (b) else static `/og/cert-verify-default.png`. Provide `og:image:width/height` (1200×630). Without this, social shares render without a preview card.
   - **✅ ADDRESSED**: See DD-13 (OG Image Strategy) + SEO and Performance → OG Image section. 1200×630 certificate render for VALID, static fallback for others. `og:image:width/height` specified.

### GraphQL

15. **Public query scoping — RELIES ON PLAN 5 (cross-plan risk — DOCUMENTED).** The design defers the resolver to Plan 5. This plan must state the **contract guarantee** it depends on: the `verifyCertificate` resolver must be registered on a Pothos builder/branch with **no auth scope** (Siraj's auth-scope system), and the query must be added to the GraphQL endpoint's public-query allow-list. Without verifiable cross-plan coupling, the public query risks inheriting the global `@authRequired` middleware. **Fix:** add an explicit "Cross-Plan Contract" note listing the must-haves from Plan 5 (no auth scope, allow-listed, rate-limited, logging non-blocking).
   - **✅ ADDRESSED**: See Security Considerations → GraphQL Public Query Allow-List → "Cross-plan contract with Plan 5" — lists 5 must-haves: `public()` auth scope, allow-listed, service-level rate limiting, non-blocking logging, constant-shape response per §6.
16. **Separate public schema — NOT NEEDED, but state why.** Siraj uses one Pothos schema with per-field auth scopes; a separate schema would fragment the codegen. The design correctly reuses the single schema. Recommend adding one line: "No separate public schema — Pothos per-field auth scopes (`public()` scope) gate the query; codegen remains unified."
17. **Field minimality — GOOD.** `VerificationCertificate` excludes email/phone/internal IDs (design §Security). Verify `templatePreview` does not leak `templateElement` coordinate arrays (it currently exposes only bg color, title, orientation, dimensions — correct).

### i18n

18. **Arabic + English — VERIFIED.** Namespace `certificates.verification` with `ar`/`en` implementations and 6 registration points match `shared/locale/` structure (verified `shared/locale/{types,namespaces,ar,en}/` exist).
19. **Language detection — SPECIFIED** (4-step: `?lang` → cookie → Accept-Language → en default) and notes root `layout.tsx` already handles `<html lang dir>`. **Gap (P2):** the `?lang=ar` switch on `/verify/[code]` must call `cookies().set(NEXT_LOCALE, 'ar')` in a Server Action or route handler — the design says step 1 "sets cookie" but doesn't say *how* in an RSC. **Fix:** specify that locale switching is via the existing locale-switch mechanism (cookie set on the root layout's existing `NEXT_LOCALE` writer), not a new one.
   - **✅ ADDRESSED**: See DD-10 (Language Toggle for Public Page) + UX/Navigation → Locale Detection → "`?lang=` cookie switch in RSC" note. Uses `router.replace('/verify/${code}?lang=ar|en')` → RSC reads `?lang` → sets `NEXT_LOCALE` cookie via existing cookie-set mechanism (same as dashboard locale switcher). No new mechanism.

### Reality-Check Corrections to Apply

A. **Add `export const revalidate` + `Cache-Control` headers to `/verify/[code]`** (issue #3).
B. **Move rate limiting into the service, not just the resolver** (issue #2); add per-code ceiling (issue #6).
C. **Specify OG image** + canonical/robots meta decision (issues #13, #14).
D. **State the public-query allow-list + no-auth-scope contract** with Plan 5 (issues #9, #15).

### Remaining Risks

- **Double-fetch cost** (server `generateMetadata` + client Apollo) is acknowledged (DD-4) but not bounded. With CDN caching (#3) the metadata fetch is amortized; without it, every page load = 2 DB lookups. Risk materializes if CDN caching is omitted.
  - **✅ MITIGATED**: DD-11 adds CDN caching (`revalidate = 3600`, `s-maxage=3600`). The SEO and Performance section documents that the first request hits DB, subsequent within `s-maxage` are CDN-served. Double-fetch cost is amortized.
- **Logging volume**: every verification (including bots) writes a `certificate_verifications` row. With Plan 22's 90-day retention + aggregation this is bounded, but high bot traffic could bloat the table rapidly. Consider not logging requests that fail the rate limit (they're pre-service) — they shouldn't create rows.
  - **✅ ADDRESSED**: See Analytics → Rate-limited requests: "Requests that fail the rate limit check do NOT create a `certificate_verifications` row (they're pre-service — no certificate lookup happened). This prevents table bloat from bot traffic."
- **Print of a revoked cert**: DD-7 marks print-visible elements but doesn't say a revoked cert should print a "REVOKED" watermark. A printed revoked certificate that looks valid is a fraud vector. **Fix:** print CSS must render the `status="revoked"` badge prominently on print, and exclude print for `NOT_FOUND`.
  - **✅ ADDRESSED**: See DD-7 (Print CSS Strategy) → "Revoked certificate print" and "Expired certificate print" and "Not-found print" subsections. Revoked/expired watermarks mandatory. NOT_FOUND excluded from print.

---

## Public Verification Page Components (Supplementary)

The following sections add public-facing verification components that complement the existing design. These components live under `frontend/views/public/verify/` (a new public views directory, distinct from the dashboard `frontend/common/views/verify/`). All components are additive — no existing files are modified.

### A. PublicVerificationPage

**Component**: `PublicVerificationPage`
**File**: `frontend/views/public/verify/PublicVerificationPage.tsx`
**Route**: `/[locale]/verify/[certificateNumber]` (public route, no auth required)

This is the public-facing verification entry point that renders the full verification result page. It uses the REST API route (§F below) instead of the GraphQL query for the public page, providing a simpler surface for unauthenticated access and SEO-friendly server-side rendering.

**Layout**:
- Full-screen page, centered content, branded with academy logo
- Three states: Loading, Valid (green theme), Invalid/Revoked (red theme), Not Found (gray theme)
- MUI `Container` with `maxWidth="sm"`, centered via `sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minHeight: '100vh', justifyContent: 'center' }}`
- Academy logo at top center (from `academyLogo` in API response), fallback to default `/logos/siraj.png`

**Loading state**:
- MUI `CircularProgress` (size 48, centered)
- Typography text: "Verifying certificate..."
- Uses `Skeleton` placeholders for card structure below the spinner
- Auth: no auth; the page shows loading while the `useQuery` / fetch to the REST endpoint is in flight

**Valid state** (green theme):
- **Header**: Academy logo (`<img>` with `maxWidth: 80`), academy name (`Typography variant="h6"`), "Certificate Verified" with `CheckCircleOutlined` icon (green — `sx={{ color: theme.palette.success.main }}`)
- **Certificate card** (`PublicCertificateCard` — see §D):
  - Certificate preview (rendered certificate image or PDF iframe)
  - Certificate number (mono font, large — `Typography` with `sx={{ fontFamily: 'monospace', fontSize: '1.5rem' }}`)
  - Recipient name (large, bold — `Typography variant="h4" sx={{ fontWeight: 700 }}`)
  - Template/course name (`Typography variant="subtitle1"`)
  - Issue date (`Typography variant="body2"`)
  - Expiry date (if any — `Typography variant="body2"`, omitted if `expiryDate` is null)
- **Verification details card** (`Card` with `CardContent`):
  - "This certificate was issued on [date]" — interpolated from `issueDate`
  - "Verification confirmed at [current timestamp]" — uses `verifiedAt` from API response, formatted with `Intl.DateTimeFormat` based on `locale`
  - Verification ID (`uuid` — displayed in mono font with copy button)
  - QR code (renders via `qrcode.react` or server-generated QR image) linking back to this page (canonical URL)
- **Actions** (CardActions row, responsive — stacks on mobile):
  - Download PDF button (conditional — `showActions && certificate.downloadEnabled`, uses `LoadingButton` from `@mui/lab`)
  - Print button (calls `window.print()`, hidden for NOT_FOUND)
  - Share button (opens `ShareCertificateDialog` — see §E)

**Invalid/Revoked state** (red theme):
- `Alert` with `severity="error"`: "This certificate has been revoked"
- Revocation reason (from `revocationReason` in API response)
- Revocation date (from `revokedAt` in API response, formatted)
- "Contact the academy for more information" text (with `contactEmail` from API response if available, as a `mailto:` link)
- No download or print options (actions row is hidden)
- Uses `sx={{ color: theme.palette.error.main }}` for icon and header accents
- Status badge via `VerificationStatusBadge` with `status="revoked"`

**Not Found state** (gray theme):
- `Alert` with `severity="info"`: "Certificate not found"
- "The certificate number [X] does not exist in our system" — interpolated with the entered certificate number
- "Check the number and try again" helper text
- Search field (`TextField` with `placeholder="Enter certificate number..."`) to re-enter certificate number
- Submit redirects to `/[locale]/verify/[certificateNumber]` on submit
- Uses `sx={{ color: theme.palette.text.secondary }}` for accents

**Responsive**: Uses `useMediaQuery(theme.breakpoints.down('sm'))` to stack actions vertically on mobile, and adjusts typography sizes.

**Translation keys**: Uses `useAppTranslation(Translation.Dashboard.PublicVerification)` from `@/shared/locale/client` for all text — consistent with the existing i18n namespace from Task 1.

---

### B. VerificationSearchPage

**Component**: `VerificationSearchPage`
**File**: `frontend/views/public/verify/VerificationSearchPage.tsx`
**Route**: `/[locale]/verify` (public landing page for verification)

This is the landing page where users enter a certificate number or scan a QR code to start verification. It is separate from the result page (PublicVerificationPage) and is a client component.

**Layout**:
- Centered hero section: Academy logo, "Verify a Certificate" heading (`Typography variant="h3" sx={{ fontWeight: 700, mt: 4, mb: 2 }}`)
- **Search form** (centered, `Box` with `maxWidth: 480, mx: 'auto'`):
  - Certificate Number (`TextField`, large — `variant="outlined"`, `fullWidth`, `placeholder="Enter certificate number..."`, `size="medium"`)
  - Verify button (`LoadingButton` from `@mui/lab`, large — `size="large"`, `fullWidth`, loading state while navigating)
- **Recent verifications** (if user has verified before, read from `localStorage` key `siraj:recentVerifications` — array of certificate numbers, max 5):
  - Renders as a list of `Chip` components with the certificate number, click to re-verify
  - "Clear history" `IconButton` to remove all recent searches
- **"How verification works" `Accordion`** (with 3 `AccordionSummary` / `AccordionDetails` pairs):
  - Step 1: "Enter the certificate number" — explains manual entry
  - Step 2: "We verify it in our database" — explains the backend check
  - Step 3: "See the certificate details and validity" — explains the result page
- **QR code scanner button** (`Button` with `QrCodeOutlined` icon, opens `QrScanner` component — see §C):
  - On mobile: opens camera for live scanning
  - On desktop: opens file upload for QR image drag-drop

**On submit**: Calls `router.push('/${locale}/verify/${certificateNumber}')` — redirects to the `PublicVerificationPage` with the entered certificate number. Before redirect, calls `addRecentSearch` on the `useVerificationStore` (see §G) to persist the search in `localStorage`.

**State**: Uses `useVerificationStore` for `certificateNumber`, `scannerOpen`, and `recentSearches`.

**Translation keys**: Uses `useAppTranslation(Translation.Dashboard.PublicVerification)` for the hero, form, accordion, and recent searches text.

---

### C. QrScanner Component

**Component**: `QrScanner`
**File**: `frontend/views/public/verify/QrScanner.tsx`

A QR code scanner that works on both mobile (camera) and desktop (file upload). The component is opened via a `Dialog` (MUI `Dialog` with `fullScreen` on mobile via `useMediaQuery`).

**Library**: Uses `html5-qrcode` package (or `@yudiel/react-qr-scanner` as an alternative — both support camera and file-based QR decoding). Install via `bun add html5-qrcode`.

**Features**:
- **Camera toggle**: Front/back camera switch on mobile (uses `facingMode: 'environment'` default, toggle to `'user'`). Renders a `Switch` or `IconButton` with `CameraFrontOutlined` / `CameraRearOutlined` icons.
- **Scan area overlay**: Visual scanning frame with corner indicators (4 L-shaped corner brackets rendered via `Box` with borders, centered on the video feed). Uses `sx` positioning to overlay on the `<video>` element.
- **On scan**: Extracts certificate number from the QR URL (the QR encodes the full canonical URL `https://${domain}/${locale}/verify/${certificateNumber}` — parse with `new URL(result).pathname.split('/').pop()`). On success, calls the `onScan(certificateNumber)` callback and closes the dialog. Redirects to the `PublicVerificationPage` (the parent `VerificationSearchPage` handles the redirect).
- **Manual entry fallback**: A `Link` at the bottom: "Enter certificate number manually" — closes the scanner dialog and focuses the search form's input.
- **Error handling**:
  - Camera permission denied: `Alert severity="error"` with "Camera permission denied. Please enable camera access in your browser settings."
  - No camera found: `Alert severity="error"` with "No camera found on this device."
  - Generic scan error: `Alert severity="error"` with the error message
  - All errors include the manual entry fallback link.

**Desktop mode** (no camera or camera permission denied): Renders a `Button` "Upload QR Image" which opens a file picker (`<input type="file" accept="image/*">`). The selected image is decoded via `html5-qrcode`'s `scanFile()` method. Supports drag-drop via a `Box` with `onDrop` handler that reads the dropped image file.

**Mobile mode**: Camera with torch toggle if available (uses `html5-qrcode`'s torch API — ` Html5Qrcode.prototype.applyVideoConstraints({ advanced: [{ torch: true }] })`). Torch toggle button is only visible if the torch capability is available.

**Props**:
```typescript
interface QrScannerProps {
  open: boolean;
  onClose: () => void;
  onScan: (certificateNumber: string) => void;
}
```

**Translation keys**: Uses `useAppTranslation(Translation.Dashboard.PublicVerification)` for all error messages, toggle labels, and fallback text.

---

### D. PublicCertificateCard Component

**Component**: `PublicCertificateCard`
**File**: `frontend/views/public/verify/PublicCertificateCard.tsx`

A reusable MUI `Card` that displays the certificate preview, metadata, and status badge. Used by `PublicVerificationPage` in the Valid state.

```typescript
interface PublicCertificateCardProps {
  certificate: PublicCertificate;
  showActions: boolean;
}
```

Where `PublicCertificate` is:
```typescript
interface PublicCertificate {
  number: string;
  recipientName: string;
  templateName: string;
  issueDate: string;
  expiryDate: string | null;
  academyName: string;
  academyLogo: string;
  previewUrl?: string;
  downloadEnabled?: boolean;
  status: 'issued' | 'revoked' | 'expired';
}
```

**Layout** (MUI `Card`, `sx={{ maxWidth: 600, mx: 'auto' }}`, centered):
- **CardHeader**: Template name (`title`), category badge (`subheader` — a `Chip` with template category label). Uses `avatar` for the academy logo (`<Avatar src={certificate.academyLogo} />`).
- **CardMedia**: Certificate preview image (from server-rendered thumbnail at `certificate.previewUrl`). Uses `component="img"` with `height={200}`, `objectFit: 'contain'`. If `previewUrl` is absent, renders a placeholder `Box` with the template name as text.
- **CardContent**:
  - Recipient name (`Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}`)
  - Certificate number (`Typography variant="subtitle1" sx={{ fontFamily: 'monospace', color: theme => theme.palette.primary.main, mb: 2 }}`)
  - `Grid` (container, spacing 2) with 3 columns:
    - Issue Date: `Grid` item with `Typography variant="caption"` label and `Typography variant="body2"` value
    - Expiry Date: `Grid` item, same pattern (value is "N/A" if `expiryDate` is null)
    - Template: `Grid` item, same pattern with `certificate.templateName`
  - Status badge (large): `Chip` with `size="medium"`, `label` from status, color based on status:
    - Valid (`status === 'issued'`): `color="success"` with `CheckCircleOutlined` icon
    - Revoked (`status === 'revoked'`): `color="error"` with `CancelOutlined` icon
    - Expired (`status === 'expired'`): `color="warning"` with `WarningAmberOutlined` icon
  - Badge is centered in a `Box` with `sx={{ textAlign: 'center', mt: 2 }}`
- **CardActions** (if `showActions`):
  - Download PDF button (`Button` with `DownloadOutlined` icon, `href={certificate.downloadUrl}`, conditional on `certificate.downloadEnabled`)
  - Print button (`Button` with `PrintOutlined` icon, `onClick={() => window.print()}`)
  - Share button (`Button` with `ShareOutlined` icon, `onClick={() => setShareDialogOpen(true)}` — opens `ShareCertificateDialog`)

**Responsive**: Stacks vertically on mobile (`< 600px`) via `useMediaQuery(theme.breakpoints.down('sm'))` — the `Grid` switches to a single column, and `CardActions` switches to `Stack` with `direction="column"`.

**Translation keys**: Uses `useAppTranslation(Translation.Dashboard.PublicVerification)` for all labels (issueDate, expiryDate, template, status badges, action buttons).

---

### E. ShareCertificateDialog Component

**Component**: `ShareCertificateDialog`
**File**: `frontend/views/public/verify/ShareCertificateDialog.tsx`

A MUI `Dialog` that provides share options for a verified certificate. Opened from `PublicCertificateCard` or `PublicVerificationPage` actions.

```typescript
interface ShareCertificateDialogProps {
  open: boolean;
  certificate: PublicCertificate | null;
  onClose: () => void;
}
```

**Content** (`DialogContent`, centered):
- **Verification URL** (`TextField`, `readonly`, `fullWidth`, `value={verificationUrl}`):
  - Copy icon button (`IconButton` with `ContentCopyOutlined` icon) at end adornment
  - On click: calls `navigator.clipboard.writeText(verificationUrl)` and shows a `Snackbar` with "Copied to clipboard"
- **Social share buttons** (a `Stack` with `direction="row"`, `spacing: 2`, centered):
  - WhatsApp (`IconButton` with WhatsApp logo): `href={https://wa.me/?text=Verify%20certificate%20${certNumber}%20at%20${url}}` — opens WhatsApp share intent
  - Telegram (`IconButton` with Telegram logo): `href={https://t.me/share/url?url=${url}&text=Verify%20certificate%20${certNumber}}`
  - Email (`IconButton` with `EmailOutlined` icon): `href={mailto:?subject=Certificate%20Verification&body=Verify%20at%20${url}}`
  - Copy Link (`IconButton` with `LinkOutlined` icon): copies verification URL to clipboard
- **QR code image** (200×200, rendered via `qrcode.react` `QRCodeSVG` component with `value={verificationUrl}`, `size={200}`):
  - "Scan this QR code to verify the certificate" text below the QR
  - "Download QR" button (`Button` with `DownloadOutlined` icon): generates a PNG of the QR code by rendering the SVG to a canvas and triggering download via `canvas.toDataURL('image/png')` + an `<a download>` element

**Web Share API**: On mount, checks `if (navigator.share)`. If available, renders a primary "Share" button that calls `navigator.share({ title: 'Certificate Verification', text: 'Verify this certificate', url: verificationUrl })`. Falls back to individual share targets (the social buttons above) if Web Share API is not available.

**Social share message generation**: The message is pre-formatted URL-encoded:
- WhatsApp: `https://wa.me/?text=Verify%20certificate%20${certNumber}%20at%20${url}` (uses `encodeURIComponent`)
- Telegram: `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent('Verify certificate ' + certNumber)}`
- Email: `mailto:?subject=${encodeURIComponent('Certificate Verification')}&body=${encodeURIComponent('Verify at ' + url)}`

**Translation keys**: Uses `useAppTranslation(Translation.Dashboard.PublicVerification)` for dialog title, labels, and the QR code caption.

---

### F. Verification API Route Handler (Server-Side)

**Route handler**: `app/api/certificates/verify/[certificateNumber]/route.ts`
**Method**: GET only (POST not supported — this is a read-only public endpoint)

A Next.js App Router route handler (not a GraphQL resolver) that provides a REST-style public verification endpoint. This is an ALTERNATIVE to the GraphQL `verifyCertificate` query for the public page — simpler to cache, rate-limit, and SEO-optimize. The GraphQL query remains for internal/admin use.

**Response shape** (HTTP 200, valid certificate):
```json
{
  "valid": true,
  "status": "issued",
  "certificate": {
    "number": "ABC123",
    "recipientName": "Ahmed Hassan",
    "templateName": "Course Completion Certificate",
    "issueDate": "2024-01-15",
    "expiryDate": null,
    "academyName": "Siraj Academy",
    "academyLogo": "/logos/siraj.png"
  },
  "verificationId": "uuid-here",
  "verifiedAt": "2024-06-20T12:00:00Z"
}
```

**Response shape** (HTTP 200, revoked certificate):
```json
{
  "valid": false,
  "status": "revoked",
  "revocationReason": "Incorrect Information",
  "revokedAt": "2024-03-01T10:00:00Z"
}
```

**Response shape** (HTTP 404, not found):
```json
{
  "valid": false,
  "status": "not_found"
}
```

**Cross-plan dependency**: The route handler calls `verifyCertificateService(code)` from Plan 5's service layer (the same service the GraphQL resolver uses — ensuring a single source of truth for verification logic). The service returns a `VerificationResult` that the route handler serializes to JSON. Note: `revocationReason` IS exposed via this REST endpoint (unlike the GraphQL public query per INTER_PLAN_CONTRACTS §6) because the public page needs to display it. This is a deliberate exception — the REST endpoint is the public face, and the GraphQL query is for admin/internal use where the constant-shape response matters more.

**Rate limiting**: 30 requests per minute per IP. Uses an in-memory rate limiter (or Upstash Redis if configured via env var `UPSTASH_REDIS_REST_URL`). Rate-limited requests return HTTP 429 with `Retry-After` header. Rate limiting happens BEFORE the service call (no DB lookup for rate-limited requests — prevents log flooding per §Analytics).

**No authentication required**: The route handler does not check any auth context, cookies, or session. It is explicitly excluded from any future auth middleware (FR-V1.7).

**Caching**: `Cache-Control: public, max-age=300` (5 minutes) — the result is cacheable by CDNs and browsers. For revoked/not-found, uses `Cache-Control: public, max-age=60` (shorter, as status can change). The `generateMetadata` path uses `verifyForMetadata` with `revalidate = 3600` (ISR — separate, longer cache).

**Implementation**:
```typescript
// app/api/certificates/verify/[certificateNumber]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifyCertificateService } from '@/backend/services/certificates/verification-service';
import { rateLimiter } from '@/backend/lib/rate-limiter';
import { logger } from '@/backend/lib/logger';

export async function GET(
  request: NextRequest,
  { params }: { params: { certificateNumber: string } }
) {
  const ip = request.headers.get('x-forwarded-for') ?? 'unknown';
  const { certificateNumber } = params;

  // Rate limit check
  const rateLimitResult = await rateLimiter.check(`verify:${ip}`, 30, 60);
  if (!rateLimitResult.allowed) {
    return NextResponse.json(
      { error: 'RATE_LIMITED', retryAfter: rateLimitResult.retryAfter },
      {
        status: 429,
        headers: { 'Retry-After': String(rateLimitResult.retryAfter) }
      }
    );
  }

  try {
    const result = await verifyCertificateService(certificateNumber);
    if (result.status === 'not_found') {
      return NextResponse.json(
        { valid: false, status: 'not_found' },
        { status: 404, headers: { 'Cache-Control': 'public, max-age=60' } }
      );
    }
    if (result.status === 'revoked') {
      return NextResponse.json(
        { valid: false, status: 'revoked', revocationReason: result.revocationReason, revokedAt: result.revokedAt },
        { status: 200, headers: { 'Cache-Control': 'public, max-age=60' } }
      );
    }
    // Valid
    return NextResponse.json(
      {
        valid: true,
        status: 'issued',
        certificate: result.certificate,
        verificationId: result.verificationId,
        verifiedAt: new Date().toISOString()
      },
      { status: 200, headers: { 'Cache-Control': 'public, max-age=300' } }
    );
  } catch (error) {
    logger.error('Verification API error', { error, certificateNumber });
    return NextResponse.json(
      { valid: false, status: 'error', error: 'Internal error' },
      { status: 500 }
    );
  }
}
```

**AGENTS.md files to read**: `AGENTS.md` (root — backend logging, rate limiting), `app/AGENTS.md` (route handlers).

---

### G. Zustand Verification Store

**File**: `frontend/stores/verificationStore.ts`

A Zustand store that manages the verification page state. This is a NEW store — it does not replace the existing `verificationViewModel.ts` (which is component-local state for the dashboard view). This store is used by `VerificationSearchPage` and `PublicVerificationPage` for the public-facing flow.

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface VerificationResult {
  valid: boolean;
  status: 'issued' | 'revoked' | 'expired' | 'not_found';
  certificate?: PublicCertificate;
  revocationReason?: string;
  revokedAt?: string;
  verificationId?: string;
  verifiedAt?: string;
}

interface VerificationState {
  // Data
  certificateNumber: string;
  result: VerificationResult | null;
  status: 'idle' | 'loading' | 'success' | 'valid' | 'invalid' | 'not_found' | 'error';
  error: string | null;

  // UI
  shareDialogOpen: boolean;
  scannerOpen: boolean;
  recentSearches: string[];

  // Actions
  setCertificateNumber: (number: string) => void;
  verify: (certificateNumber: string) => Promise<void>;
  reset: () => void;
  openShareDialog: () => void;
  closeShareDialog: () => void;
  openScanner: () => void;
  closeScanner: () => void;
  handleScanResult: (certificateNumber: string) => void;
  addRecentSearch: (certificateNumber: string) => void;
}

export const useVerificationStore = create<VerificationState>()(
  persist(
    (set, get) => ({
      certificateNumber: '',
      result: null,
      status: 'idle',
      error: null,
      shareDialogOpen: false,
      scannerOpen: false,
      recentSearches: [],

      setCertificateNumber: (number) => set({ certificateNumber: number }),
      verify: async (certificateNumber) => {
        set({ status: 'loading', error: null, certificateNumber });
        try {
          const response = await fetch(`/api/certificates/verify/${certificateNumber}`);
          const data = await response.json();
          if (response.status === 404) {
            set({ result: data, status: 'not_found' });
          } else if (data.valid) {
            set({ result: data, status: 'valid' });
          } else if (data.status === 'revoked') {
            set({ result: data, status: 'invalid' });
          } else {
            set({ result: data, status: 'error', error: 'Unexpected response' });
          }
        } catch (err) {
          set({ status: 'error', error: (err as Error).message });
        }
      },
      reset: () => set({ certificateNumber: '', result: null, status: 'idle', error: null }),
      openShareDialog: () => set({ shareDialogOpen: true }),
      closeShareDialog: () => set({ shareDialogOpen: false }),
      openScanner: () => set({ scannerOpen: true }),
      closeScanner: () => set({ scannerOpen: false }),
      handleScanResult: (certificateNumber) => {
        set({ scannerOpen: false, certificateNumber });
        // Redirect is handled by the component
      },
      addRecentSearch: (certificateNumber) => {
        const current = get().recentSearches;
        const updated = [certificateNumber, ...current.filter(c => c !== certificateNumber)].slice(0, 5);
        set({ recentSearches: updated });
      }
    }),
    {
      name: 'siraj-verification-store',
      partialize: (state) => ({ recentSearches: state.recentSearches }) // Only persist recentSearches
    }
  )
);
```

**Persist**: Uses `zustand/middleware` `persist` with `localStorage`. Only `recentSearches` is persisted (not transient UI state like `status` or `result`).

**AGENTS.md files to read**: `AGENTS.md` (root — Zustand stores), `frontend/stores/AGENTS.md` (store patterns).

---

### H. SEO & Social Meta Tags

**Server component**: `app/[locale]/verify/[certificateNumber]/page.tsx` generates dynamic metadata via `generateMetadata`.

**Dynamic metadata**:
- **Title**: `"Certificate Verification - [Academy Name]"` — uses the academy name from `verifyForMetadata(code)` response. For non-valid certificates, uses generic `"Certificate Verification - Siraj"` (no academy name leak for privacy).
- **Description**: `"Verify certificate #[number] issued by [academy]"` — interpolated. For non-valid: `"Verify certificate authenticity on Siraj"` (generic).
- **OpenGraph image**: Certificate preview thumbnail (1200×630). For valid certificates: attempts `getOgImageForCertificate(code)` (server-rendered PNG). For non-valid: static `/og/cert-verify-default.png`. Provides `og:image:width="1200"` and `og:image:height="630"`.
- **Twitter card**: `summary_large_image` — renders the OG image as a large card.
- **Canonical URL**: `https://${domain}/${locale}/verify/${certificateNumber}` — strips `?lang=` query param to dedup SEO across language variants.
- **Robots**: `noindex, follow` — per-certificate pages are not search destinations (prevents SERP pollution from indexing every certificate number).

**Structured data (JSON-LD)**: `EducationalOccupationalCertificate` schema embedded in the page:
```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "EducationalOccupationalCertificate",
  "name": "Certificate #[number]",
  "description": "Certificate issued by [academy name]",
  "datePublished": "[issueDate]",
  "creator": {
    "@type": "EducationalOrganization",
    "name": "[academyName]"
  }
}
</script>
```

**robots.txt**: 
- `Allow: /verify` (the search/landing page is indexable)
- `Disallow: /api/certificates/verify` (the API endpoint should not be indexed)
- The individual `/verify/[certificateNumber]` pages use `noindex` via the `<meta name="robots" content="noindex, follow">` tag in `generateMetadata` (not via robots.txt — robots.txt can't pattern-match certificate numbers).

**Implementation in `generateMetadata`**:
```typescript
export async function generateMetadata(
  { params }: { params: { certificateNumber: string; locale: string } }
): Promise<Metadata> {
  const { certificateNumber, locale } = params;
  const result = await verifyForMetadata(certificateNumber); // lightweight, cached

  if (result.valid) {
    return {
      title: `Certificate Verification - ${result.certificate.academyName}`,
      description: `Verify certificate #${certificateNumber} issued by ${result.certificate.academyName}`,
      openGraph: {
        images: [{ url: result.ogImageUrl ?? '/og/cert-verify-default.png', width: 1200, height: 630 }],
        title: `Certificate Verification - ${result.certificate.academyName}`,
        description: `Verify certificate #${certificateNumber}`,
        type: 'website'
      },
      twitter: { card: 'summary_large_image', images: [result.ogImageUrl ?? '/og/cert-verify-default.png'] },
      alternates: { canonical: `/${locale}/verify/${certificateNumber}` },
      robots: { index: false, follow: true }
    };
  }

  return {
    title: 'Certificate Verification - Siraj',
    description: 'Verify certificate authenticity on Siraj',
    openGraph: {
      images: [{ url: '/og/cert-verify-default.png', width: 1200, height: 630 }],
      title: 'Certificate Verification - Siraj',
      type: 'website'
    },
    twitter: { card: 'summary_large_image', images: ['/og/cert-verify-default.png'] },
    alternates: { canonical: `/${locale}/verify/${certificateNumber}` },
    robots: { index: false, follow: true }
  };
}
```

**JSON-LD injection**: The page component renders the JSON-LD script via a `<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString }} />` — where `jsonLdString` is built from the verification result (only for valid certificates; revoked/not-found pages omit JSON-LD to avoid leaking non-valid certificate metadata to search engines).

**AGENTS.md files to read**: `AGENTS.md` (root — i18n, metadata), `app/AGENTS.md` (server components, generateMetadata).

---

## Round 4 Enhancement — Production Hardening

### R4.1 Rate Limiting UI Feedback

The public verification page must provide clear, user-friendly feedback when the backend rate limiter (Plan 5 resolver / Task 17 REST route) rejects requests. The feedback goes beyond a simple error message — it includes a live countdown, exponential backoff visualization, and a CAPTCHA escalation path.

**Component**: `frontend/common/views/verify/components/rateLimitError.tsx` (enhanced from Task 5)

| Prop | Type | Description |
|------|------|-------------|
| `retryAfter` | `number` | seconds until the next allowed request (from `Retry-After` header or GraphQL `retryAfter` field) |
| `attemptCount` | `number` | current attempt count within the rate-limit window |
| `onRetry` | `() => void` | callback when countdown reaches zero and the user can retry |
| `labels` | `VerificationLabels` | i18n strings for rate-limit feedback |
| `onCaptchaRequired` | `() => void` | callback when CAPTCHA escalation threshold is reached |

**UI Elements** (MUI v9 — all via `sx` prop, no style props):

```tsx
<Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
  <Alert severity="warning" sx={{ width: '100%' }}>
    {labels.error.rateLimited.message}
  </Alert>
  <CircularProgressWithCountdown
    value={retryAfter}
    max={60}
    sx={{ color: 'warning.main' }}
  />
  <Typography sx={{ fontWeight: 500, color: 'text.secondary' }}>
    {labels.error.rateLimited.retryInSeconds(retryAfter)}
  </Typography>
  <LinearProgress
    variant="determinate"
    value={backoffProgress}
    sx={{ width: '100%', maxWidth: 300, height: 6, borderRadius: 3 }}
  />
  {showCaptchaTrigger && (
    <Button variant="outlined" onClick={onCaptchaRequired} sx={{ mt: 1 }}>
      {labels.error.rateLimited.verifyHuman}
    </Button>
  )}
</Box>
```

**Behavior**:

1. **Live countdown**: A `useEffect` interval decrements `retryAfter` every second. When it reaches 0, the `onRetry` callback becomes enabled — the user sees a "Retry now" button (MUI `Button` with `variant="contained"`).
2. **Exponential backoff display**: After each rate-limit hit, the displayed wait time doubles (1s → 2s → 4s → 8s → max 60s). A `LinearProgress` bar fills as the countdown progresses, giving visual feedback of "how long until I can retry."
3. **CAPTCHA challenge after N attempts**: After 3 rate-limited requests within the sliding window, the component shows a "Verify you're human" button that triggers the CAPTCHA flow (see R4.2). The `onCaptchaRequired` callback sets `requiresCaptcha: true` in the Zustand store.
4. **IP-based rate limiting transparency**: The error message never reveals the IP address. It only says "Too many requests from your location" — no PII leaked to the DOM.
5. **User-friendly "Please wait X seconds" message**: Uses the i18n pluralized key `error.rateLimited.retryInSeconds(count)` which renders as "Please wait 30 seconds" (en) or one of the Arabic plural forms.

**Zustand store additions** (`frontend/stores/verificationStore.ts`):

```typescript
interface RateLimitState {
  rateLimitRetryAfter: number | null;
  rateLimitAttemptCount: number;
  rateLimitBackoffMultiplier: number;
  requiresCaptcha: boolean;
  captchaToken: string | null;
  setRateLimited: (retryAfter: number) => void;
  decrementRetryCountdown: () => void;
  setCaptchaToken: (token: string | null) => void;
  resetRateLimit: () => void;
}
```

**Apollo error link integration**: The Apollo error link (`frontend/common/graphql/apollo-error-link.ts` or equivalent) catches GraphQL errors with `extensions.code === 'RATE_LIMITED'`, extracts `extensions.retryAfter`, and calls `store.setRateLimited(retryAfter)`. The container component reads `store.rateLimitRetryAfter` and renders `<RateLimitError />` instead of `<VerificationView />` when non-null.

**i18n keys** (add to `shared/locale/types/certificates/verification.ts`):

```typescript
interface RateLimitLabels {
  message: string;
  retryInSeconds: (count: number) => string;  // pluralized
  retryNow: string;
  verifyHuman: string;
  captchaRequired: string;
  backoffNote: string;
}
```

**AGENTS.md files to read**: `AGENTS.md` (root — rate limiting, Zustand), `frontend/stores/AGENTS.md` (store patterns), `frontend/AGENTS.md` (MUI v9 sx prop).

---

### R4.2 CAPTCHA Integration

**Library**: Google reCAPTCHA v3 (invisible, score-based). The script is loaded via `next/script` with `strategy="lazyOnload"` to avoid blocking LCP. The site key is stored in `NEXT_PUBLIC_RECAPTCHA_SITE_KEY`.

**Challenge trigger**: After the rate-limit threshold (3 attempts, per R4.1), the `RateLimitError` component shows a "Verify you're human" button. Clicking it:
1. Calls `grecaptcha.execute(siteKey, { action: 'certificate_verify' })` — returns a token.
2. The token is stored in the Zustand store via `setCaptchaToken(token)`.
3. The next verification request includes the token in the `verifyCertificate` GraphQL query as an optional `captchaToken` argument, or as a custom header `X-Captcha-Token` for the REST route.
4. The backend validates the token via Google's `siteverify` endpoint (server-side, via `backend/lib/captcha.ts`). If the score is ≥ 0.5, the rate limit is reset for this IP. If < 0.5, the challenge escalates to reCAPTCHA v2 checkbox (visible challenge).

**CAPTCHA bypass token via API**: A programmatic consumer (e.g., an academy's automated verification tool) can obtain a long-lived bypass token by authenticating via the dashboard and calling `POST /api/certificates/verify/bypass-token` (HMAC-signed, 1-hour expiry). This token is sent as `X-Bypass-Token` header and skips both rate limiting and CAPTCHA. This is an admin-only endpoint.

**Audio CAPTCHA fallback** (accessibility): If the user's reCAPTCHA v2 challenge fails 2x, or if the user has a screen-reader-detected preference (`prefers-reduced-motion` + `aria-live` context), the component offers an audio challenge. The audio challenge is a simple "type the numbers you hear" — implemented via the Web Audio API with randomly generated digits spoken via `SpeechSynthesis`. This avoids a third-party audio CAPTCHA dependency. The audio challenge renders a MUI `IconButton` with `AccessIconOutlined` and an `aria-label` of "Audio challenge."

**CAPTCHA refresh button**: A MUI `IconButton` with `RefreshOutlined` icon sits next to the challenge. Clicking it calls `grecaptcha.reset()` and re-executes. The button has `aria-label="Refresh CAPTCHA"`.

**Component**: `frontend/common/views/verify/components/captchaChallenge.tsx`

```tsx
interface CaptchaChallengeProps {
  siteKey: string;
  onVerify: (token: string) => void;
  onExpire: () => void;
  onError: (error: string) => void;
  labels: VerificationLabels;
}
```

**File to create**: `backend/lib/captcha.ts` — server-side token verification utility:

```typescript
export async function verifyCaptchaToken(
  token: string,
  remoteIp: string
): Promise<{ success: boolean; score: number; action: string }> {
  const secret = process.env.RECAPTCHA_SECRET_KEY;
  const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `secret=${secret}&response=${token}&remoteip=${remoteIp}`
  });
  return response.json();
}
```

**AGENTS.md files to read**: `AGENTS.md` (root — env vars, security), `backend/AGENTS.md` (lib patterns), `frontend/AGENTS.md` (next/script usage).

---

### R4.3 API Route Security Specs

The public verification REST route (`app/api/certificates/verify/[certificateNumber]/route.ts`) and the GraphQL `verifyCertificate` resolver must implement defense-in-depth security:

| Security Measure | Specification |
|------------------|---------------|
| **HMAC-signed verification tokens** | The page embeds a short-lived HMAC token (generated server-side in `generateMetadata` or the page server component) that is validated by the API route. Token = `HMAC-SHA256(certificateNumber + timestamp, SECRET)` with 5-minute validity. Sent as `X-Verify-Token` header. Prevents direct API access without visiting the page first. |
| **JWT with short expiry** | Alternative to HMAC: a JWT signed with `JWT_SECRET` containing `{ certNumber, exp: now + 300s }`. The API route validates the JWT and checks expiry. The token is embedded in the page via a `<meta name="verify-token" content="...">` tag, read by the client and sent as `Authorization: Bearer <jwt>`. |
| **CORS headers** | `Access-Control-Allow-Origin` is set to a specific allowlist (the Siraj domain + configured academy domains). NOT `*`. `Access-Control-Allow-Methods: GET, OPTIONS`. `Access-Control-Allow-Headers: Content-Type, X-Verify-Token, X-Captcha-Token`. Preflight `OPTIONS` returns 204 immediately. |
| **Request signing** | For programmatic consumers (bypass token flow), requests must include `X-Signature` = `HMAC-SHA256(body, sharedSecret)`. The API route validates the signature. This prevents replay attacks on the bypass endpoint. |
| **Payload size limit** | The API route enforces `Content-Length < 1024` bytes. Any request exceeding this is rejected with 413. The verification request body is tiny (just a certificate number), so 1KB is generous. |
| **SQL injection prevention** | The `certificateNumber` parameter is ALWAYS passed through Drizzle's parameterized query builder — never string-interpolated into SQL. The repository layer uses `$1` placeholder binding. Additionally, the route handler validates the format: `^[A-Z0-9-]{4,30}$` regex match before passing to the service. |
| **DDoS protection** | Rate limiting (30 req/min per IP) is the first layer. For multi-instance, Upstash Redis handles distributed rate limiting. Additionally, the route handler sets a hard timeout: if the service call takes > 3s, it returns 503. The route also supports a "circuit breaker" — if error rate > 50% in the last 100 requests, it returns 503 for 30s (cool-down). |

**File**: `app/api/certificates/verify/[certificateNumber]/route.ts` (enhanced from Task 17)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { verifyHmacToken } from '@/backend/lib/security';
import { validateCertificateNumberFormat } from '@/backend/lib/validation';

export async function GET(
  request: NextRequest,
  { params }: { params: { certificateNumber: string } }
) {
  const { certificateNumber } = params;

  // 1. Format validation (SQL injection prevention)
  if (!validateCertificateNumberFormat(certificateNumber)) {
    return NextResponse.json({ valid: false, status: 'invalid_format' }, { status: 400 });
  }

  // 2. HMAC token validation
  const verifyToken = request.headers.get('X-Verify-Token');
  if (!verifyToken || !verifyHmacToken(verifyToken, certificateNumber)) {
    return NextResponse.json({ valid: false, error: 'Invalid token' }, { status: 403 });
  }

  // 3. CORS check
  const origin = request.headers.get('origin');
  if (origin && !isAllowedOrigin(origin)) {
    return NextResponse.json({ error: 'Origin not allowed' }, { status: 403 });
  }

  // 4. Payload size check (for POST bodies, if applicable)
  const contentLength = parseInt(request.headers.get('content-length') ?? '0', 10);
  if (contentLength > 1024) {
    return NextResponse.json({ error: 'Payload too large' }, { status: 413 });
  }

  // 5. Rate limit (from Task 17 rate-limiter)
  // ... existing rate limit check ...

  // 6. Service call with timeout
  // ... existing service call ...
}
```

**File to create**: `backend/lib/security.ts` — HMAC token generation and verification:

```typescript
import { createHmac, timingSafeEqual } from 'crypto';

const SECRET = process.env.VERIFY_TOKEN_SECRET ?? 'fallback-dev-secret';

export function generateHmacToken(certificateNumber: string): { token: string; expiresAt: number } {
  const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes
  const payload = `${certificateNumber}:${expiresAt}`;
  const token = createHmac('sha256', SECRET).update(payload).digest('hex');
  return { token: `${payload}:${token}`, expiresAt };
}

export function verifyHmacToken(token: string, certificateNumber: string): boolean {
  const parts = token.split(':');
  if (parts.length !== 3) return false;
  const [cert, expiresStr, signature] = parts;
  const expires = parseInt(expiresStr, 10);
  if (Date.now() > expires) return false;
  if (cert !== certificateNumber) return false;
  const expected = createHmac('sha256', SECRET).update(`${cert}:${expiresStr}`).digest('hex');
  return timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}
```

**File to create**: `backend/lib/validation.ts` — input validation utilities:

```typescript
const CERT_NUMBER_REGEX = /^[A-Z0-9-]{4,30}$/;

export function validateCertificateNumberFormat(certNumber: string): boolean {
  return CERT_NUMBER_REGEX.test(certNumber);
}

export function isAllowedOrigin(origin: string): boolean {
  const allowed = (process.env.ALLOWED_ORIGINS ?? '').split(',').map(o => o.trim());
  return allowed.includes(origin);
}
```

**AGENTS.md files to read**: `AGENTS.md` (root — security, logging), `app/AGENTS.md` (route handlers), `backend/AGENTS.md` (lib patterns).

---

### R4.4 CDN Caching Headers

The verification API route and page must set CDN-friendly caching headers so that edge nodes (Vercel Edge, Cloudflare, etc.) can cache valid certificate responses and reduce origin load.

| Header | Value | Purpose |
|--------|-------|---------|
| `Cache-Control` | `public, max-age=3600, stale-while-revalidate=86400` | Valid certificate: 1h fresh, 24h stale-serve. Edge can serve cached copy for 24h while revalidating. |
| `Cache-Control` | `public, max-age=60` | Not-found/revoked: 1-minute cache. Shorter because these statuses can change (e.g., a new cert is issued, a revoked cert is reinstated). |
| `ETag` | `W/"<hash>"` | Weak ETag = `SHA256(certificateNumber + status + updatedAt)`. Enables conditional requests (304 Not Modified). |
| `Last-Modified` | RFC 1123 date | The certificate's `updatedAt` timestamp as `Last-Modified` header. |
| `Cache-Tag` | `cert-verify, cert-<id>` | Surrogate key for targeted cache invalidation (Vercel/Cloudflare). When a cert is revoked, the backend sends a purge request for `cert-<id>`. |

**Cache invalidation on revoke**: When a certificate is revoked (via the dashboard revoke action), the backend service calls the CDN purge API:

```typescript
// backend/services/certificateRevoke.service.ts (enhancement)
import { purgeCacheTag } from '@/backend/lib/cdn-purge';

export async function revokeCertificate(certificateId: string, tx: Transaction) {
  // ... existing revoke logic ...
  await purgeCacheTag(`cert-${certificateId}`);
}
```

**File to create**: `backend/lib/cdn-purge.ts` — CDN cache purge utility:

```typescript
export async function purgeCacheTag(tag: string): Promise<void> {
  const endpoint = process.env.CDN_PURGE_ENDPOINT;
  const token = process.env.CDN_PURGE_TOKEN;
  if (!endpoint || !token) return; // No-op in dev

  await fetch(endpoint, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ tags: [tag] })
  });
}
```

**Edge function spec for reuse**: The Vercel Edge function (or Cloudflare Worker) sits in front of the API route. On a cache miss, it forwards to the origin. On a cache hit, it serves directly. The edge function also handles:
- `If-None-Match` → compares against stored ETag → returns 304 if match
- `If-Modified-Since` → compares against `Last-Modified` → returns 304 if not modified
- Country-level geo-blocking (if configured) before forwarding

**Route handler cache headers** (enhanced from Task 17):

```typescript
// In app/api/certificates/verify/[certificateNumber]/route.ts
const headers = new Headers();
if (data.valid) {
  headers.set('Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400');
  headers.set('ETag', `W/"${data.etag}"`);
  headers.set('Last-Modified', new Date(data.certificate.updatedAt).toUTCString());
  headers.set('Cache-Tag', `cert-verify, cert-${data.certificate.id}`);
} else {
  headers.set('Cache-Control', 'public, max-age=60');
}
return NextResponse.json(data, { status: 200, headers });
```

**AGENTS.md files to read**: `AGENTS.md` (root — CDN, deployment), `app/AGENTS.md` (route headers).

---

### R4.5 Social Share Card Template

The verification page must generate a dynamic `og:image` (1200×630px) for social media sharing. This image is a visual preview of the certificate — not a screenshot, but a server-rendered template.

**Route**: `app/verify/[code]/opengraph-image.tsx` (Next.js 16 ImageResponse convention)

**Template layout** (1200×630):
- Background: certificate template background color (from `templatePreview.backgroundColor`)
- Centered: Academy logo (top-left, 80×80px if available)
- Title: Certificate title (centered, large font, 48px Inter Bold)
- Recipient: Recipient name (centered below title, 36px Inter Medium)
- Issue date: Formatted date (bottom center, 24px Inter Regular)
- Footer: "Verified by Siraj" watermark (bottom-right, 20px, semi-transparent)
- Verified badge: Green checkmark icon (top-right) for valid certificates

**File**: `app/verify/[code]/opengraph-image.tsx`

```tsx
import { ImageResponse } from 'next/og';
import { verifyForMetadata } from '@/backend/services/certificateVerificationService';

export const runtime = 'edge';
export const alt = 'Certificate Verification';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function OgImage({ params }: { params: { code: string } }) {
  const { code } = await params;
  const result = await verifyForMetadata(code);

  if (!result.valid) {
    // Default template for invalid certificates
    return new ImageResponse(
      <div style={{ display: 'flex', background: '#f5f5f5', width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center', fontSize: 48, color: '#666' }}>
        Certificate Verification
      </div>,
      size
    );
  }

  const { certificate } = result;
  return new ImageResponse(
    (
      <div style={{ display: 'flex', flexDirection: 'column', background: certificate.templatePreview?.backgroundColor ?? '#fff', width: '100%', height: '100%', padding: 60, justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          {certificate.academyLogoUrl && <img src={certificate.academyLogoUrl} width={80} height={80} alt="" />}
          <div style={{ display: 'flex', fontSize: 28, color: '#4caf50' }}>✓ Verified</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <div style={{ fontSize: 48, fontWeight: 700 }}>{certificate.certificateTitle}</div>
          <div style={{ fontSize: 36 }}>{certificate.recipientName}</div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', fontSize: 24, color: '#888' }}>
          Issued: {new Date(certificate.issueDate).toLocaleDateString()}
        </div>
      </div>
    ),
    size
  );
}
```

**Dynamic meta tags** (in `generateMetadata`):

| Tag | Value |
|-----|-------|
| `og:image` | `https://${domain}/verify/${code}/opengraph-image` (auto-resolved by Next.js) |
| `og:image:width` | `1200` |
| `og:image:height` | `630` |
| `og:title` | `Certificate Verification - ${recipientName}` (valid) or `Certificate Verification - Siraj` (invalid) |
| `og:description` | `${certificateTitle} issued by ${academyName}` (valid) or generic (invalid) |
| `twitter:card` | `summary_large_image` |
| `twitter:image` | same as `og:image` |
| `twitter:title` | same as `og:title` |
| `twitter:description` | same as `og:description` |

**LinkedIn meta tags**: LinkedIn uses `og:` tags — same as above. No additional tags needed, but the `og:image` must be ≥ 200×200px (ours is 1200×630, exceeds requirement).

**WhatsApp preview**: WhatsApp uses `og:image` and `og:title`. The image must be served with `Content-Type: image/png` and be publicly accessible (no auth). The `opengraph-image.tsx` route is a public Edge endpoint — no auth required.

**Share button component spec** (enhanced from Task 6 `ShareButtons`):

The `ShareButtons` component includes a "Preview" tooltip that shows a small thumbnail of the og:image. On hover (desktop) or tap (mobile), a MUI `Tooltip` with a `<img src="/verify/${code}/opengraph-image" />` renders at 300×157 (scaled 1200×630 to fit). This reassures the user what will appear on social media before they share.

```tsx
<Tooltip
  title={<img src={`/verify/${code}/opengraph-image`} width={300} height={158} alt={labels.share.previewAlt} />}
  sx={{ '& .MuiTooltip-tooltip': { maxWidth: 320, padding: 0 } }}
>
  <IconButton aria-label={labels.share.preview}>
    <PreviewIconOutlined />
  </IconButton>
</Tooltip>
```

**AGENTS.md files to read**: `AGENTS.md` (root — next/og, edge runtime), `app/AGENTS.md` (opengraph-image convention).

---

### R4.6 Multi-language Verification Page

The verification page must support both English and Arabic with full RTL layout.

**Locale detection** (priority order):
1. URL path: `/en/verify/[code]` or `/ar/verify/[code]` — explicit locale in URL (SEO-friendly, shareable)
2. `?lang=` query parameter: `/verify/[code]?lang=ar` — used by the language toggle (no full page reload)
3. `NEXT_LOCALE` cookie — set by the language toggle, persists user preference
4. `Accept-Language` browser header — fallback for first visit (server-side detection in `getLocale()`)

**URL structure**:

```
app/
├── [locale]/
│   └── verify/
│       ├── page.tsx              ← /en/verify, /ar/verify (manual entry)
│       └── [code]/
│           └── page.tsx          ← /en/verify/[code], /ar/verify/[code]
```

> **Note**: The existing plan (Tasks 1-11) uses `app/verify/[code]/page.tsx` without a `[locale]` segment, relying on cookie-based `getLocale()`. Round 4 adds the `[locale]` segment as an OPTIONAL enhancement for SEO and shareability. If the team chooses the cookie-based approach, the `Accept-Language` fallback still applies via `getLocale()`.

**Language switcher dropdown** (enhanced from `LanguageToggle` component — Task 8):

Instead of a toggle button, use a MUI `Select` dropdown:

```tsx
<Select
  value={currentLocale}
  onChange={(e) => onLocaleChange(e.target.value as AppLocale)}
  size="small"
  sx={{ minWidth: 120 }}
  inputProps={{ 'aria-label': labels.a11y.languageSelector }}
>
  <MenuItem value="en">English</MenuItem>
  <MenuItem value="ar">العربية</MenuItem>
</Select>
```

On change: `router.replace('/${newLocale}/verify/${code}')` — updates the URL with the new locale segment, the server component re-renders with the new translations.

**RTL layout for Arabic**: The root layout already handles `dir="rtl"` for Arabic locale via the `LocaleProvider`. All MUI components automatically mirror in RTL. The verification page's custom styling must:
- Use logical properties (`marginInlineStart` not `marginLeft`, `paddingInlineEnd` not `paddingRight`)
- Avoid hardcoded `left`/`right` in `sx` props — use `start`/`end` equivalents
- The certificate preview watermark text must read right-to-left in Arabic
- The share button order reverses in RTL (WhatsApp/Telegram on the right, copy on the left)

**Translation of all UI strings via shared/locale/**: All new Round 4 strings (rate limit, CAPTCHA, loading, error states, SEO) must be added to `shared/locale/types/certificates/verification.ts` and implemented in both `en/` and `ar/` locale files.

**Browser Accept-Language fallback**: In the server component:

```tsx
// app/[locale]/verify/[code]/page.tsx
import { getLocale, getTranslations } from '@/shared/locale/server';

export default async function Page({ params }: { params: { locale: string; code: string } }) {
  const { code } = await params;
  const locale = await getLocale(); // falls back to Accept-Language if no cookie/URL
  const t = await getTranslations(locale);
  // ...
}
```

**AGENTS.md files to read**: `AGENTS.md` (root — i18n), `shared/AGENTS.md` (locale API), `app/AGENTS.md` ([locale] routing), `frontend/AGENTS.md` (RTL, logical properties).

---

### R4.7 Accessibility Compliance

The verification page must meet WCAG 2.1 AA compliance.

**Screen reader test matrix**:

| Screen Reader | Browser | Test Items |
|---------------|---------|------------|
| NVDA | Firefox (Windows) | Page navigation, status announcement, share buttons, form labels |
| JAWS | Chrome (Windows) | Same as NVDA + landmark navigation |
| VoiceOver | Safari (macOS) | Same + rotor navigation for headings/landmarks |
| VoiceOver | Safari (iOS) | Touch navigation, swipe gestures, double-tap activation |
| TalkBack | Chrome (Android) | Touch navigation, earpod navigation |

**Keyboard-only verification flow** (tab order):

1. Language switcher (`Select`) — tab index 0, `aria-label="Language"`
2. Certificate status badge — focusable, `role="status"`, `aria-live="polite"`
3. Certificate metadata panel — first field row, tabbable through each detail
4. Share buttons — each social button in sequence, `aria-label` per platform
5. Download button (if available) — `aria-label="Download certificate PDF"`
6. Print button — `aria-label="Print certificate"`
7. Manual entry form (on `/verify` landing page) — input field, then submit button

All interactive elements have `:focus-visible` outlines (MUI default — `outline: 2px solid theme.palette.primary.main; outline-offset: 2px`). No `outline: none` overrides.

**Color contrast ratios** (minimum 4.5:1 for body text, 3:1 for large text ≥ 24px):

| Element | Foreground | Background | Ratio |
|---------|-----------|------------|-------|
| Body text | `text.primary` (#1a1a1a) | `background.default` (#fff) | 16:1 |
| Status badge (valid) | `success.contrastText` (#fff) | `success.main` (#2e7d32) | 5.1:1 |
| Status badge (revoked) | `error.contrastText` (#fff) | `error.main` (#c62828) | 5.9:1 |
| Status badge (expired) | `warning.contrastText` (#fff) | `warning.main` (#ed6c02) | 4.6:1 |
| Secondary text | `text.secondary` (#666) | `background.default` (#fff) | 5.7:1 |
| Link | `primary.main` (#1976d2) | `background.default` (#fff) | 4.5:1 |

**ARIA live regions**: The verification result container uses `aria-live="polite"` and `aria-busy="true"` during loading. When the query completes, `aria-busy` is set to `false` and the status is announced via `role="status"`:

```tsx
<Box aria-live="polite" aria-busy={isLoading}>
  {isLoading ? <VerificationLoading /> : <VerificationView result={data} />}
</Box>
```

The rate-limit countdown uses `aria-live="assertive"` so screen readers announce the countdown:

```tsx
<Typography aria-live="assertive" role="timer" aria-label={labels.a11y.rateLimitCountdown}>
  {labels.error.rateLimited.retryInSeconds(retryAfter)}
</Typography>
```

**Focus visible on all interactive elements**: MUI v9 provides `:focus-visible` by default. The verification page does NOT override `outline`. For custom-styled elements, explicitly add:

```tsx
sx={{
  '&:focus-visible': {
    outline: '2px solid',
    outlineColor: 'primary.main',
    outlineOffset: '2px'
  }
}}
```

**AGENTS.md files to read**: `AGENTS.md` (root — a11y), `frontend/AGENTS.md` (MUI a11y, ARIA).

---

### R4.8 Loading States

**Suspense boundary**: The verification page wraps the Apollo query in a React Suspense boundary:

```tsx
// frontend/common/views/verify/verificationContainer.tsx
<Suspense fallback={<VerificationSkeleton />}>
  <VerificationQuery code={code} />
</Suspense>
```

**Loading skeleton matching certificate card layout**: `VerificationLoading` (from Task 5) uses MUI `Skeleton` components that mirror the final card layout:

```tsx
function VerificationSkeleton() {
  return (
    <Card sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
        <Skeleton variant="circular" width={80} height={80} /> {/* academy logo */}
      </Box>
      <Skeleton variant="text" width="60%" height={48} sx={{ mx: 'auto' }} /> {/* certificate title */}
      <Skeleton variant="text" width="40%" height={32} sx={{ mx: 'auto', mb: 3 }} /> {/* recipient name */}
      <Skeleton variant="rectangular" width="100%" height={200} sx={{ mb: 2, borderRadius: 2 }} /> {/* preview */}
      {[...Array(5)].map((_, i) => (
        <Box key={i} sx={{ display: 'flex', gap: 2, mb: 1.5 }}>
          <Skeleton variant="text" width={120} height={24} />
          <Skeleton variant="text" width="100%" height={24} />
        </Box>
      ))}
    </Card>
  );
}
```

**Progressive image loading**: Academy logo and certificate preview images use a blur-up technique:
1. Initially render a low-res placeholder (10px wide, blurred via CSS `filter: blur(20px)`)
2. On full image load, crossfade from blurred to sharp (`opacity` transition, 300ms)
3. MUI `Box` with `component="img"` and `onLoad` handler:

```tsx
<Box
  component="img"
  src={logoUrl}
  alt={labels.a11y.logoAlt}
  sx={{
    width: 80, height: 80, borderRadius: '50%',
    filter: loaded ? 'none' : 'blur(20px)',
    opacity: loaded ? 1 : 0.5,
    transition: 'filter 300ms, opacity 300ms'
  }}
  onLoad={() => setLoaded(true)}
/>
```

**QR skeleton placeholder**: On the manual entry page (`/verify`), if a QR scanner is available, the scanner area shows a skeleton placeholder while camera permissions are being requested:

```tsx
{!cameraReady && (
  <Skeleton variant="rectangular" width="100%" height={300} sx={{ borderRadius: 2 }} />
)}
```

**AGENTS.md files to read**: `AGENTS.md` (root — React 19 Suspense), `frontend/AGENTS.md` (MUI Skeleton, progressive loading).

---

### R4.9 Error States

| Error State | Trigger | UI Component | Behavior |
|-------------|---------|--------------|----------|
| **Invalid certificate format** | Code doesn't match `^[A-Z0-9-]{4,30}$` | `notFoundState.tsx` (enhanced) or custom 404 page | Shows "Invalid certificate format" with the format explanation. Provides a manual entry form. Does NOT redirect to `/404` — stays on `/verify/[code]` with an inline error card. |
| **Revoked certificate** | `status === 'REVOKED'` from API | `revokedState.tsx` (from Task 4) | Shows status badge "REVOKED" (red), metadata panel with limited fields (no template preview), revocation date. Does NOT show revocation reason (PII stripping per INTER_PLAN_CONTRACTS §6). Shows a "Contact academy" link if `academyContactEmail` is available. |
| **Expired certificate** | `status === 'EXPIRED'` from API | `expiredState.tsx` (from Task 4) | Shows status badge "EXPIRED" (amber), metadata panel with expiration date, a note: "This certificate expired on [date]. It is no longer valid for verification purposes." Template preview shown with "EXPIRED" watermark. |
| **Network error** | Apollo `networkError` or fetch failure | `errorState.tsx` (enhanced from Task 5) | Shows "Network error" message with a "Retry" button. The retry button re-fires the Apollo query (`refetch()`). If 3 retries fail, shows "Please check your internet connection" + a link to the manual entry page. |
| **Maintenance mode** | `503` from API or a maintenance flag env var | `maintenanceMode.tsx` (new) | Shows a centralized maintenance page: "Siraj Verification is temporarily under maintenance. Please try again later." With a Siraj logo and estimated uptime (if configured). |

**File to create**: `frontend/common/views/verify/components/maintenanceMode.tsx`

```tsx
interface MaintenanceModeProps {
  labels: VerificationLabels;
  estimatedEndTime?: string;
}

export function MaintenanceMode({ labels, estimatedEndTime }: MaintenanceModeProps) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, py: 8 }}>
      <BuildCircleOutlined sx={{ fontSize: 64, color: 'text.secondary' }} />
      <Typography variant="h5" sx={{ fontWeight: 600 }}>{labels.maintenance.title}</Typography>
      <Typography sx={{ color: 'text.secondary', textAlign: 'center', maxWidth: 400 }}>
        {labels.maintenance.description}
      </Typography>
      {estimatedEndTime && (
        <Typography sx={{ color: 'text.secondary' }}>
          {labels.maintenance.estimatedEnd(estimatedEndTime)}
        </Typography>
      )}
    </Box>
  );
}
```

**Maintenance mode detection**: The page server component checks an environment variable `MAINTENANCE_MODE=true` and short-circuits to render `<MaintenanceMode />` without calling the API:

```tsx
// app/verify/[code]/page.tsx
export default async function Page({ params }: { params: { code: string } }) {
  if (process.env.MAINTENANCE_MODE === 'true') {
    return <MaintenanceMode labels={t} />;
  }
  // ... normal flow ...
}
```

**AGENTS.md files to read**: `AGENTS.md` (root — error handling), `frontend/AGENTS.md` (MUI error UI patterns).

---

### R4.10 SEO Optimization

**Canonical URL per certificate**: Each certificate page has a unique canonical URL to prevent duplicate content penalties:

```tsx
// In generateMetadata
alternates: {
  canonical: `https://${domain}/${locale}/verify/${certificateNumber}`
}
```

The canonical strips `?lang=` query parameters — language variants are handled via `hreflang` alternates:

```tsx
alternates: {
  canonical: `https://${domain}/verify/${certificateNumber}`,
  languages: {
    'en': `https://${domain}/en/verify/${certificateNumber}`,
    'ar': `https://${domain}/ar/verify/${certificateNumber}`
  }
}
```

**Structured data (JSON-LD for EducationalOccupationalCredential)**: The page embeds JSON-LD using the `EducationalOccupationalCredential` schema (more specific than `EducationalOccupationalCertificate`):

```json
{
  "@context": "https://schema.org",
  "@type": "EducationalOccupationalCredential",
  "name": "Certificate Title",
  "description": "Certificate issued by Academy Name",
  "dateCreated": "2024-01-15",
  "creator": {
    "@type": "EducationalOrganization",
    "name": "Academy Name",
    "url": "https://academy.com"
  },
  "credentialCategory": "educational",
  "identifier": "CERT-12345"
}
```

Only rendered for valid certificates. Revoked/expired/not-found pages omit JSON-LD to avoid leaking non-valid metadata.

**Meta description generation**: Dynamic, per-certificate:

```typescript
const description = result.valid
  ? `${result.certificate.certificateTitle} — Issued to ${result.certificate.recipientName} by ${result.certificate.academyName}. Verify authenticity on Siraj.`
  : 'Verify certificate authenticity on Siraj.';
```

**Page title with cert number**:

```typescript
const title = result.valid
  ? `${result.certificate.recipientName} — Certificate Verification`
  : 'Certificate Verification — Siraj';
```

The cert number is NOT in the title (PII concern — certificate numbers can be sequential/enumerable). The recipient name + "Certificate Verification" is more human-readable and SEO-friendly.

**Robots meta**:

| Page | `robots` meta | Rationale |
|------|---------------|-----------|
| `/verify` (landing) | `index, follow` | The search page is a legitimate search destination |
| `/verify/[code]` (valid) | `index, follow` | Valid certificates can be indexed (shows they're verifiable) |
| `/verify/[code]` (invalid) | `noindex, follow` | Invalid cert pages are not search destinations; `follow` preserves link equity |

**File to create**: `frontend/common/views/verify/lib/structured-data.ts` — JSON-LD generator:

```typescript
import type { VerificationCertificate } from '@/backend/types/certificate.types';

export function generateCertificateJsonLd(cert: VerificationCertificate): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'EducationalOccupationalCredential',
    name: cert.certificateTitle,
    description: `Certificate issued to ${cert.recipientName} by ${cert.issuingAcademyName}`,
    dateCreated: cert.issueDate,
    creator: {
      '@type': 'EducationalOrganization',
      name: cert.issuingAcademyName
    },
    credentialCategory: 'educational',
    identifier: cert.verificationCode
  };
}
```

**AGENTS.md files to read**: `AGENTS.md` (root — SEO, metadata), `app/AGENTS.md` (generateMetadata, JSON-LD).

---

### R4.11 Analytics

The verification page tracks privacy-preserving analytics. No PII is collected. No third-party tracking pixels (no Google Analytics, no Facebook Pixel). Analytics are self-hosted via a lightweight endpoint.

| Event | Trigger | Data Collected (NO PII) |
|-------|---------|--------------------------|
| Page view | Page mount | `page: 'verify-result'`, `locale: 'en'`, `status: 'valid'` (cert status, NOT code), `source: 'qr' \| 'manual' \| 'link'` |
| Verification success | API response `status: 'valid'` | `event: 'verify_success'`, `source` |
| Verification fail | API response `status: 'revoked' \| 'expired' \| 'not_found'` | `event: 'verify_fail'`, `certStatus: status`, `source` |
| Share button click | User clicks a share button | `event: 'share_click'`, `platform: 'whatsapp' \| 'twitter' \| ...` |
| QR scan source | Scan detected | `event: 'qr_scan'`, `source: 'camera' \| 'file_upload'` |
| Time on page | Page unload / route change | `event: 'time_on_page'`, `durationBucket: '<10s' \| '10-30s' \| '30-60s' \| '>60s'` (bucketed, not raw) |
| Bounce | User leaves without interacting | `event: 'bounce'` — detected via `beforeunload` + no interaction flag |

**Implementation**: A lightweight analytics module sends events to `POST /api/analytics/verify` (a new API route):

```typescript
// frontend/common/lib/analytics.ts
export function trackVerificationEvent(event: string, data: Record<string, string | number>): void {
  // Non-blocking — uses sendBeacon if available, falls back to fetch
  const payload = JSON.stringify({ event, ...data, ts: Date.now() });
  if (navigator.sendBeacon) {
    navigator.sendBeacon('/api/analytics/verify', payload);
  } else {
    fetch('/api/analytics/verify', { method: 'POST', body: payload, keepalive: true });
  }
}
```

**File to create**: `app/api/analytics/verify/route.ts` — collects events and stores them (log file or database):

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/backend/lib/logger';

export async function POST(request: NextRequest) {
  const body = await request.json();
  // Validate: only accept known events, no PII fields
  const allowedEvents = ['page_view', 'verify_success', 'verify_fail', 'share_click', 'qr_scan', 'time_on_page', 'bounce'];
  if (!allowedEvents.includes(body.event)) {
    return NextResponse.json({ error: 'Invalid event' }, { status: 400 });
  }
  // Strip any PII attempts (no cert codes, names, emails)
  const sanitized = sanitizeAnalyticsPayload(body);
  logger.info('verify_analytics', sanitized);
  return NextResponse.json({ ok: true }, { status: 204 });
}
```

**Privacy guarantees**:
- No certificate numbers, recipient names, or academy names are sent
- No IP addresses are stored (the API route strips `x-forwarded-for` before logging)
- No user IDs or session IDs (the page is public, no auth)
- Duration is bucketed, not raw seconds
- The analytics route sets `Cache-Control: no-store` to prevent any caching of analytics POST
- A privacy notice is shown in the footer: "We collect anonymous usage statistics to improve our service. No personal data is collected."

**AGENTS.md files to read**: `AGENTS.md` (root — privacy, logging), `app/AGENTS.md` (API routes), `frontend/AGENTS.md` (analytics hooks).

---

### R4.12 Performance Budgets

The public verification page is a lightweight, public-facing page. It must meet strict performance budgets for fast LCP and minimal bundle size.

| Metric | Budget | Measurement Method |
|--------|--------|--------------------|
| **LCP** (Largest Contentful Paint) | < 1.5s | Lighthouse mobile, field data via Web Vitals |
| **FID/INP** (First Input Delay / Interaction to Next Paint) | < 50ms | Lighthouse, `web-vitals` library |
| **CLS** (Cumulative Layout Shift) | < 0.1 | Lighthouse, `web-vitals` library |
| **TTI** (Time to Interactive) | < 3s | Lighthouse mobile |
| **API response** (verifyCertificate) | < 200ms (p95) | Server-side timing logs, APM |
| **Bundle size** (page JS, gzipped) | < 30KB | Next.js build output, `@next/bundle-analyzer` |

**Enforcement strategies**:

1. **Bundle < 30KB**: The verification page avoids heavy dependencies:
   - No Apollo Client full bundle — use a lightweight `fetch` wrapper for the single query (the page only makes ONE query, Apollo's caching/slicing is overkill). Alternative: use `@apollo/client/react` but with tree-shaking (only `useQuery` imported, not `useMutation` or `useLazyQuery`).
   - No charting libraries, no data grids, no rich text editors
   - `qr-code` library (for QR generation in share dialog) is ~3KB gzipped — acceptable
   - No `html5-qrcode` on the result page — only on the landing page (`/verify`), and loaded dynamically via `next/dynamic` with `ssr: false`
   - MUI components are tree-shakeable, but verify with bundle analyzer

2. **LCP < 1.5s**: The LCP element is the certificate preview card. Strategies:
   - Server-render the skeleton shell (blank card outline) in the RSC, then hydrate with Apollo data
   - Preload the academy logo image: `<link rel="preload" as="image" href={logoUrl} />` in the `<head>`
   - The Apollo query fires immediately on mount (no `skip` unless format is invalid) — no waterfall

3. **CLS < 0.1**: All skeleton placeholders must match the final content dimensions:
   - Skeleton card: fixed height matching the real card
   - Academy logo: fixed 80×80 with `aspect-ratio` CSS
   - Certificate preview: `aspect-ratio: 3/2` (or template ratio) before image loads
   - Status badge: fixed `min-height` to prevent layout shift when the badge appears

4. **FID < 50ms**: Minimal JavaScript on the critical path. The page does not block the main thread:
   - No long-running synchronous computations
   - `next/script` with `strategy="lazyOnload"` for reCAPTCHA script
   - `next/dynamic` for the QR scanner (only on landing page)

**Web Vitals monitoring** (client-side):

```tsx
// frontend/common/views/verify/verificationContainer.tsx
import { onLCP, onCLS, onINP } from 'web-vitals';

useEffect(() => {
  onLCP((metric) => trackVerificationEvent('web_vital', { name: 'LCP', value: Math.round(metric.value) }));
  onCLS((metric) => trackVerificationEvent('web_vital', { name: 'CLS', value: metric.value }));
  onINP((metric) => trackVerificationEvent('web_vital', { name: 'INP', value: Math.round(metric.value) }));
}, []);
```

The `web-vitals` library is 2KB gzipped — within the 30KB budget.

**Bundle analysis command**:

```bash
ANALYZE=true bun run build  # runs @next/bundle-analyzer
```

If the bundle exceeds 30KB, investigate with the analyzer and remove/replace the offending dependency.

**AGENTS.md files to read**: `AGENTS.md` (root — performance, build), `frontend/AGENTS.md` (bundle optimization, dynamic imports).
