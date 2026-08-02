# Plan 09 — i18n & Navigation: Requirements Specification

> **Feature**: Certificate Generation & Verification (Siraj)
> **Plan**: 09 — i18n Translations & Navigation Integration
> **Depends on**: Plan 07 (Template Management UI), Plan 08 (Certificate Generation & Verification UI)
> **Stack**: Siraj custom compile-time TypeScript i18n system in `shared/locale/`; Next.js 16 App Router
> **Source patterns**: `siraj_analysis/06-i18n-system.md`, `siraj_analysis/08-app-router-navigation.md`, `cgvs_analysis/08-i18n-theme-infra.md`, `siraj_analysis/09-auth-permissions.md`

---

## 1. Overview

This specification covers the internationalization (i18n) and navigation integration for the certificate feature. It defines:

1. A new `certificates` translation namespace with complete Arabic (ar) and English (en) translations covering all certificate domains: template management, certificate management, public verification, error messages, and permission labels.
2. Sidebar navigation integration: a new "Certificates" group with sub-items (Templates, Categories, Certificates) permission-gated per role.
3. Mobile navigation: bottom nav or hamburger menu adaptations.
4. Route registration: all certificate routes in the Next.js App Router.
5. Permission matrix: mapping certificate permissions to routes and UI elements.
6. Outcome Knowledge Base & Progress Tracking (Feature 6) integration.

### Scope

| Area | In Scope | Out of Scope |
|---|---|---|
| Translation namespace creation | ✅ `shared/locale/types/dashboard/certificates/`, `shared/locale/{en,ar}/dashboard/certificates/` | Non-dashboard translations |
| Pluralization (Arabic zero/one/two/few/many/other; English one/other) | ✅ Certificate count, generation count | |
| Interpolation | ✅ Recipient name, certificate title, verification date, template name | |
| Sidebar navigation | ✅ New "Certificates" group + items | Restructuring existing nav groups |
| Mobile navigation | ✅ Bottom nav items + hamburger menu | New mobile shell components |
| Route registration | ✅ `/dashboard/certificates`, `/dashboard/certificates/templates`, `/dashboard/certificates/categories`, `/verify/[code]` | App Router page components (Plans 07, 08) |
| Permission labels | ✅ All `CERTIFICATES_*` permissions | Backend permission enforcement (Plan 02) |
| Feature 6: Outcome Knowledge Base | ✅ Translation keys, nav items, route labels | Knowledge base backend (separate plan) |

---

## 2. Functional Requirements (EARS Format)

> EARS = Easy Approach to Requirements Syntax. Keywords: **WHEN** / **WHILE** / **IF** / **WHERE** / **THE SYSTEM SHALL**.

### 2.1 Translation Namespace: Type Definitions

#### REQ-I18N-001: Create Certificate Labels Interface

**WHEN** the certificate feature is in development, **THE SYSTEM SHALL** define a `CertificateLabels` interface in `shared/locale/types/dashboard/certificates/main.ts` that contains all static strings, nested objects, pluralization functions, and interpolation functions for the certificate domain. **THE SYSTEM SHALL** organize keys by sub-domain using nested readonly interfaces (`templates`, `categories`, `list`, `generate`, `detail`, `revoke`, `verify`, `errors`, `permissions`, `status`, `elementTypes`, `variableTypes`).

#### REQ-I18N-002: Pluralization Signatures

**THE SYSTEM SHALL** define pluralization functions with the signature `(count: number) => string` for:
- `certificates.list.count` — certificate count in the list view header
- `certificates.generate.success` — generated certificate count in the success toast
- `certificates.templates.count` — template count in the template list header
- `certificates.categories.count` — category count in the category list header

**WHERE** the locale is Arabic (ar), **THE SYSTEM SHALL** implement full Arabic pluralization rules: zero (0), one (1), two (2), few (3–10), many (11–99), other (100+). **WHERE** the locale is English (en), **THE SYSTEM SHALL** implement English pluralization rules: one (1), other (0, 2+).

#### REQ-I18N-003: Interpolation Signatures

**THE SYSTEM SHALL** define interpolation functions with typed parameters for:
- `certificates.errors.notFound` — `(id: string) => string` — "Certificate with ID {id} was not found"
- `certificates.errors.alreadyExists` — `(title: string) => string` — "A certificate with title '{title}' already exists"
- `certificates.verify.valid` — `(recipientName: string, issueDate: string) => string` — "This certificate belongs to {recipientName}, issued on {issueDate}"
- `certificates.verify.invalid` — `(code: string) => string` — "Verification code '{code}' is not valid"
- `certificates.revoke.success` — `(recipientName: string) => string` — "Certificate for {recipientName} has been revoked"
- `certificates.generate.success` — `(count: number) => string` — "Generated {count} certificates"
- `certificates.detail.issuedTo` — `(recipientName: string) => string` — "Issued to {recipientName}"

#### REQ-I18N-004: Status Labels as Record

**THE SYSTEM SHALL** define `certificates.status` as a `Record<string, string>` mapping each `CertificateStatus` enum value (`DRAFT`, `ISSUED`, `EXPIRED`, `REVOKED`, `ARCHIVED`) to a localized display label. **The SYSTEM SHALL** define `certificates.elementTypes` as a `Record<string, string>` mapping each element type (`TEXT`, `IMAGE`, `QR_CODE`, `SIGNATURE`, `SHAPE`) to a localized label. **THE SYSTEM SHALL** define `certificates.variableTypes` as a `Record<string, string>` mapping each variable type (`TEXT`, `DATE`, `NUMBER`, `IMAGE_URL`, `STUDENT_NAME`, `TEACHER_NAME`, `ISSUE_DATE`, `EXPIRY_DATE`, `COURSE_NAME`, `GRADE`, `CUSTOM`) to a localized label.

### 2.2 Translation Namespace: English Implementation

#### REQ-I18N-005: English Translations File

**WHEN** the English locale (`en`) is active, **THE SYSTEM SHALL** provide a complete implementation of `CertificateLabels` in `shared/locale/en/dashboard/certificates/main.ts` exported as `dashboardCertificatesEn`. **THE SYSTEM SHALL** include all static strings, nested objects, pluralization functions (one/other), and interpolation functions as defined in the interface.

#### REQ-I18N-006: English Pluralization

**WHERE** the locale is English, **THE SYSTEM SHALL** implement pluralization as:
- `count(0)` → "No certificates" (other) 
- `count(1)` → "1 certificate" (one)
- `count(n)` → "{n} certificates" (other, for n ≥ 2)

#### REQ-I18N-007: English Interpolation

**THE SYSTEM SHALL** implement interpolation using TypeScript template literals:
- `notFound(id)` → `Certificate with ID "${id}" was not found`
- `verify.valid(recipientName, issueDate)` → `This is a valid certificate issued to "${recipientName}" on ${issueDate}.`
- `revoke.success(recipientName)` → `Certificate for "${recipientName}" has been successfully revoked.`

### 2.3 Translation Namespace: Arabic Implementation

#### REQ-I18N-008: Arabic Translations File

**WHEN** the Arabic locale (`ar`) is active, **THE SYSTEM SHALL** provide a complete implementation of `CertificateLabels` in `shared/locale/ar/dashboard/certificates/main.ts` exported as `dashboardCertificatesAr`. **THE SYSTEM SHALL** include all static strings, nested objects, pluralization functions (zero/one/two/few/many/other), and interpolation functions as defined in the interface. **THE SYSTEM SHALL** ensure all strings are RTL-appropriate and use Arabic linguistic conventions.

#### REQ-I18N-009: Arabic Pluralization

**WHERE** the locale is Arabic, **THE SYSTEM SHALL** implement full Arabic pluralization rules:
- `count(0)` → "لا توجد شهادات" (zero — "No certificates")
- `count(1)` → "شهادة واحدة" (one — "One certificate")
- `count(2)` → "شهادتان" (two — "Two certificates")
- `count(3–10)` → "{n} شهادات" (few — "{n} certificates")
- `count(11–99)` → "{n} شهادة" (many — "{n} certificates")
- `count(100+)` → "{n} شهادة" (other — "{n} certificates")

**THE SYSTEM SHALL** implement `generate.success(count)` with the same Arabic pluralization rules, producing appropriate strings like "تم إنشاء شهادة واحدة" (one) or "تم إنشاء {n} شهادات" (few).

#### REQ-I18N-010: Arabic Interpolation

**THE SYSTEM SHALL** implement interpolation using Arabic phrasing with TypeScript template literals:
- `notFound(id)` → `لم يتم العثور على الشهادة بالمعرف "${id}"`
- `verify.valid(recipientName, issueDate)` → `هذه شهادة صالحة صادرة لـ "${recipientName}" بتاريخ ${issueDate}`
- `revoke.success(recipientName)` → `تم إلغاء شهادة "${recipientName}" بنجاح`

### 2.4 Translation Namespace: Schema Registration

#### REQ-I18N-011: Update DashboardTranslations

**WHEN** the certificate namespace is created, **THE SYSTEM SHALL** update `shared/locale/types/message.ts` to:
1. Import `CertificateLabels` from `@/shared/locale/types/dashboard/certificates/main.ts`
2. Add `certificates: CertificateLabels;` to the `DashboardTranslations` interface

#### REQ-I18N-012: Update Messages Assemblers

**THE SYSTEM SHALL** update `shared/locale/en/messages.ts` to:
1. Import `dashboardCertificatesEn` from `@/shared/locale/en/dashboard/certificates/main.ts`
2. Add `certificates: dashboardCertificatesEn` to the `dashboardTranslations` object

**THE SYSTEM SHALL** update `shared/locale/ar/messages.ts` to:
1. Import `dashboardCertificatesAr` from `@/shared/locale/ar/dashboard/certificates/main.ts`
2. Add `certificates: dashboardCertificatesAr` to the `dashboardTranslations` object

#### REQ-I18N-013: Update index.ts Barrel

**THE SYSTEM SHALL** update `shared/locale/index.ts` to export `CertificateLabels` from `@/shared/locale/types/dashboard/certificates/main.ts` so it is available via the public barrel.

### 2.5 Navigation Labels

#### REQ-I18N-014: Add Navigation Label Keys

**WHEN** certificate navigation items are added to the sidebar, **THE SYSTEM SHALL** add the following static string keys to the `DashboardNavigationLabels` interface in `shared/locale/types/dashboard/core/nav.ts`:
- `certificates` — "Certificates" / "الشهادات"
- `certificateTemplates` — "Templates" / "القوالب"
- `certificateCategories` — "Categories" / "التصنيفات"
- `navGroupCertificates` — "Certificates" (group label) / "الشهادات" (group label)

**THE SYSTEM SHALL** add corresponding English and Arabic translations in `shared/locale/en/dashboard/core/nav.ts` and `shared/locale/ar/dashboard/core/nav.ts` respectively.

#### REQ-I18N-015: Add Nav Icon Keys

**THE SYSTEM SHALL** add new icon keys to the `NavIconKey` union in `frontend/common/views/dashboard/config/navIconKeys.ts`:
- `"workspacePremium"` — for the "Certificates" group header
- `"assignment"` — for the "Templates" item
- `"category"` — for the "Categories" item (already exists, reuse)
- `"verified"` — for the "Certificates" item

**THE SYSTEM SHALL** add corresponding lazy-loaded MUI icon components in `frontend/common/views/dashboard/config/navIconRegistry.tsx`.

### 2.6 Sidebar Navigation

#### REQ-I18N-016: Add Certificates Nav Group

**WHEN** the sidebar is rendered for a user with certificate-related permissions, **THE SYSTEM SHALL** display a new "Certificates" navigation group (`grp_certificates`) in the `SIDEBAR_NAV_GROUPS` array in `frontend/common/views/dashboard/config/navigationConfig.ts`. **THE SYSTEM SHALL** place this group after `grp_content` and before `grp_finance`. **THE SYSTEM SHALL** set the group's `permission` gate to `[AppPermission.CertificatesList, AppPermission.CertificatesManageTemplate]` (OR-semantics — group shows if any child item's permission passes).

#### REQ-I18N-017: Add Certificates Nav Items

**THE SYSTEM SHALL** add the following `NavItem` entries to `SIDEBAR_NAV_ITEMS` in `navigationConfig.ts`:

| Key | Label Key | Icon Key | Route | Permission | Group |
|---|---|---|---|---|---|
| `certificate-templates` | `certificateTemplates` | `assignment` | `/dashboard/certificates/templates` | `CERTIFICATES_MANAGE_TEMPLATE` | `grp_certificates` |
| `certificate-categories` | `certificateCategories` | `category` | `/dashboard/certificates/categories` | `CERTIFICATES_MANAGE_TEMPLATE` | `grp_certificates` |
| `certificates` | `certificates` | `verified` | `/dashboard/certificates` | `CERTIFICATES_LIST` | `grp_certificates` |

**THE SYSTEM SHALL** set `section: "main"` on all certificate nav items.

#### REQ-I18N-018: Permission-Gated Visibility

**WHEN** a user does not have `CERTIFICATES_LIST` or `CERTIFICATES_MANAGE_TEMPLATE` permissions, **THE SYSTEM SHALL** hide the entire "Certificates" navigation group (group survives only if at least one child item's permission check passes — `getNavItemsForPermissions` drops empty groups). **WHEN** the user has `CERTIFICATES_LIST` but not `CERTIFICATES_MANAGE_TEMPLATE`, **THE SYSTEM SHALL** show only the "Certificates" item and hide the "Templates" and "Categories" items.

#### REQ-I18N-019: Super Admin Visibility

**WHEN** the user is a super admin (`isSuperAdmin: true`), **THE SYSTEM SHALL** show all certificate navigation items regardless of `AppPermission` checks (the `isSuperAdmin` bypasses all permission gates).

### 2.7 Mobile Navigation

#### REQ-I18N-020: Mobile Bottom Nav

**WHEN** the viewport is mobile (mobile tier), **THE SYSTEM SHALL** include certificate-related items in the bottom navigation if the user has `CERTIFICATES_LIST` permission. **WHERE** the mobile bottom nav has limited slots, **THE SYSTEM SHALL** prioritize the "Certificates" list item over the sub-items (templates, categories). **THE SYSTEM SHALL** ensure mobile nav items use the same `labelKey` and `permission` as their desktop counterparts.

#### REQ-I18N-021: Mobile Hamburger Menu

**WHEN** the mobile hamburger menu is expanded, **THE SYSTEM SHALL** render all certificate navigation items (including templates and categories) using the same permission gates as the desktop sidebar. **THE SYSTEM SHALL** group them under a collapsible "Certificates" header.

### 2.8 Public Verification Route

#### REQ-I18N-022: Standalone Verification Page

**THE SYSTEM SHALL** register a public verification route at `/verify/[code]` that renders without the dashboard sidebar, bottom nav, or any authenticated shell. **THE SYSTEM SHALL** not require authentication or any `AppPermission` for this route. **THE SYSTEM SHALL** use `certificates.verify.*` translation keys for the verification page UI. **THE SYSTEM SHALL** detect the locale from the `NEXT_LOCALE` cookie (same as all other routes) and render in the appropriate language.

#### REQ-I18N-023: Verification Page Metadata

**THE SYSTEM SHALL** set the page metadata (title) for `/verify/[code]` using `certificates.verify.pageTitle` from the translation namespace, resolved server-side via `getTranslations(locale).dashboardTranslations.certificates.verify.pageTitle`.

### 2.9 Permission Matrix

#### REQ-I18N-024: Route-Permission Mapping

**THE SYSTEM SHALL** map certificate routes to `AppPermission` values in `frontend/common/types/page-permissions.types.ts` (`PAGE_PERMISSIONS` object):

| Route | Required Permissions (OR) |
|---|---|
| `/dashboard/certificates` | `CERTIFICATES_LIST` |
| `/dashboard/certificates/templates` | `CERTIFICATES_MANAGE_TEMPLATE` |
| `/dashboard/certificates/categories` | `CERTIFICATES_MANAGE_TEMPLATE` |
| `/dashboard/certificates/[id]` | `CERTIFICATES_VIEW` |
| `/verify/[code]` | (public — no permission required) |

#### REQ-I18N-025: Permission Labels

**THE SYSTEM SHALL** provide translatable labels for all `CERTIFICATES_*` permissions in the `certificates.permissions` section of the translation namespace:
- `certificates.templates.list` — "Templates Management"
- `certificates.templates.manage` — "Manage Templates"
- `certificates.categories.manage` — "Manage Categories"
- `certificates.list` — "View Certificates List"
- `certificates.view` — "View Certificate Details"
- `certificates.generate` — "Generate Certificates"
- `certificates.revoke` — "Revoke Certificates"
- `certificates.verify` — "Verify Certificates"

#### REQ-I18N-026: Role-Permission Matrix

**THE SYSTEM SHALL** enforce the following role-to-route accessibility matrix:

| Route | super_admin | academy_admin | teacher | student | parent |
|---|---|---|---|---|---|
| `/dashboard/certificates` | ✅ Full | ✅ Full | ✅ (own students) | ✅ (own) | ✅ (own children) |
| `/dashboard/certificates/templates` | ✅ | ✅ | ❌ | ❌ | ❌ |
| `/dashboard/certificates/categories` | ✅ | ✅ | ❌ | ❌ | ❌ |
| `/dashboard/certificates/[id]` | ✅ Full | ✅ Full | ✅ (own students) | ✅ (own) | ✅ (own children) |
| `/verify/[code]` | ✅ Public | ✅ Public | ✅ Public | ✅ Public | ✅ Public |

> "Full" = all certificates; "own students" = only certificates for students assigned to this teacher; "own" = student's own certificates; "own children" = parent's children certificates. Data-level filtering is enforced by the service layer (Plan 04); UI-level visibility is governed by `AppPermission` checks.

#### REQ-I18N-027: Server-Side Permission Guard

**WHEN** a user navigates to a certificate dashboard route, **THE SYSTEM SHALL** call `requirePermissionForPage(userId, permissions, locale, context)` in the server page component to enforce route-level access. **IF** the user lacks permission, **THE SYSTEM SHALL** redirect to `/dashboard` (or `forbidden()` on prefetch requests).

#### REQ-I18N-028: Client-Side Defense-in-Depth

**THE SYSTEM SHALL** wrap all certificate dashboard views in `<RequirePermission permissions={PAGE_PERMISSIONS.certificatesXx} fallback={null}>` for defense-in-depth access control, matching the pattern used by Settings and other dashboard pages.

### 2.10 Feature 6: Outcome Knowledge Base & Progress Tracking

#### REQ-I18N-029: Knowledge Base Translation Keys

**THE SYSTEM SHALL** include translation keys for the Outcome Knowledge Base & Progress Tracking feature within the `certificates` namespace:
- `certificates.knowledgeBase.title` — "Certificate Knowledge Base" / "قاعدة معرفة الشهادات"
- `certificates.knowledgeBase.description` — "Browse and search certificate templates, elements, and best practices" / "تصفح والبحث في قوالب وعناصر وأفضل ممارسات الشهادات"
- `certificates.knowledgeBase.search` — "Search knowledge base..." / "البحث في قاعدة المعرفة..."
- `certificates.knowledgeBase.noResults` — "No results found" / "لا توجد نتائج"
- `certificates.knowledgeBase.categories` — "Categories" / "التصنيفات"
- `certificates.knowledgeBase.templates` — "Templates" / "القوالب"
- `certificates.knowledgeBase.guideCount` — Pluralization: `(count: number) => string`

#### REQ-I18N-030: Progress Tracking Translation Keys

**THE SYSTEM SHALL** include translation keys for certificate progress tracking:
- `certificates.progress.title` — "Certificate Progress" / "تقدم الشهادات"
- `certificates.progress.issued` — "Issued" / "تم الإصدار"
- `certificates.progress.pending` — "Pending" / "قيد المعالجة"
- `certificates.progress.revoked` — "Revoked" / "ملغاة"
- `certificates.progress.expired` — "Expired" / "منتهية الصلاحية"
- `certificates.progress.total` — "Total" / "الإجمالي"
- `certificates.progress.completionRate` — "Completion Rate" / "نسبة الإكمال"

#### REQ-I18N-031: Knowledge Base Navigation

**THE SYSTEM SHALL** optionally add a "Knowledge Base" nav item under the "Certificates" group if the knowledge base feature is implemented, gated by `CERTIFICATES_LIST` permission, linking to `/dashboard/certificates/knowledge-base`.

### 2.11 Route Registration

#### REQ-I18N-032: Dashboard Certificate Routes

**THE SYSTEM SHALL** register the following routes in the App Router under `app/(dashboard)/`:
- `app/(dashboard)/certificates/page.tsx` — certificate list dashboard page
- `app/(dashboard)/certificates/templates/page.tsx` — template management page
- `app/(dashboard)/certificates/categories/page.tsx` — category management page
- `app/(dashboard)/certificates/[id]/page.tsx` — certificate detail page

**THE SYSTEM SHALL** follow the established pattern: server page component calls `getServerUserContext()`, `requirePermissionForPage()`, and renders a Client Container component.

#### REQ-I18N-033: Public Verification Route

**THE SYSTEM SHALL** register the public verification route at `app/verify/[code]/page.tsx` outside the `(dashboard)` route group, rendering without authentication or dashboard layout. **THE SYSTEM SHALL** resolve the locale from the `NEXT_LOCALE` cookie and render verified certificate details or an invalid-code message.

#### REQ-I18N-034: Route Metadata

**THE SYSTEM SHALL** use `generateMetadata()` in each certificate route page to set localized page titles using the `certificates` translation namespace. **THE SYSTEM SHALL** use `React.cache()` wrappers for any repeated title-resolution service helpers.

### 2.12 Server vs Client Translation Access

#### REQ-I18N-035: Server-Side Access

**WHEN** certificate translation strings are needed in Server Components (page.tsx, layout.tsx), **THE SYSTEM SHALL** access them via `getTranslations(locale).dashboardTranslations.certificates.*` (the synchronous server surface). **THE SYSTEM SHALL** pass already-translated strings as props to client components.

#### REQ-I18N-036: Client-Side Access

**WHEN** certificate translation strings are needed in Client Components (ViewModels, tier views), **THE SYSTEM SHALL** access them via `useAppTranslation(Translation.Dashboard.Certificates)` (the client hook with lazy-loaded namespace). **THE SYSTEM SHALL** ensure tier views receive labels via props from the ViewModel (per the labels pass-down pattern) and never call `useAppTranslation` directly.

#### REQ-I18N-037: GraphQL Resolver Access

**WHEN** certificate translation strings are needed in GraphQL resolvers, **THE SYSTEM SHALL** access them via `ctx.t().dashboardTranslations.certificates.*` (the context-bound translation function). **THE SYSTEM SHALL** use the `certificates.errors.*` keys for throwing localized `GraphQLError` messages.

---

## 3. Non-Functional Requirements

### NFR-01: Compile-Time Type Safety

**THE SYSTEM SHALL** ensure that all translation keys are compile-time type-safe. Accessing a non-existent key (e.g., `t.certificates.nonExistent`) SHALL produce a TypeScript compiler error. Pluralization and interpolation functions SHALL enforce their parameter types at compile time.

### NFR-02: No Hardcoded Strings

**THE SYSTEM SHALL NOT** hardcode any user-facing string in certificate-related components, pages, or resolvers. All strings MUST flow through the translation namespace. **THE SYSTEM SHALL** use the logger utility (not `console.*`) for any debug output.

### NFR-03: RTL Compliance

**WHERE** the locale is Arabic (ar), **THE SYSTEM SHALL** ensure all certificate UI renders right-to-left. The root `<html dir="rtl">` is already set by the layout. **THE SYSTEM SHALL** not override `dir` on certificate components. **THE SYSTEM SHALL** ensure Arabic strings read naturally (not literal translations that sound machine-generated).

### NFR-04: Performance

**THE SYSTEM SHALL** ensure the certificate translation namespace adds minimal bundle size. The server-side `messages.ts` statically imports all leaf modules (no lazy loading for SSR). The client-side namespace system lazy-loads via `defineNamespace` only when the namespace is first accessed.

### NFR-05: Backward Compatibility

**THE SYSTEM SHALL NOT** modify, rename, or remove any existing translation keys or navigation items. **THE SYSTEM SHALL** only add new keys, new nav items, and new nav groups. The "Certificates" group SHALL be inserted between existing groups without displacing them.

---

## 4. Constraints

1. **Locale system**: Use the Siraj custom compile-time TypeScript i18n system (`shared/locale/`). Do NOT use `next-intl` (removed) or any external i18n library.
2. **Path aliases**: All imports MUST use `@/shared/locale/...` path aliases (never relative paths).
3. **Readonly interfaces**: All translation interface properties MUST be `readonly`.
4. **Enum imports**: Frontend code MUST use `AppPermission` from `@/frontend/common/graphql/generated/gql/graphql-types` (not from `@/backend/enum`).
5. **No `[locale]` URL segment**: Certificate routes live at `/dashboard/certificates` (no locale prefix). The locale is read from the `NEXT_LOCALE` cookie.
6. **Two locales only**: Support Arabic (ar) and English (en) — these are the only locales in the system.

---

## 5. Assumptions

1. The `AppPermission` enum already has or will have `CERTIFICATES_LIST`, `CERTIFICATES_MANAGE_TEMPLATE`, `CERTIFICATES_VIEW`, `CERTIFICATES_GENERATE`, `CERTIFICATES_REVOKE`, and `CERTIFICATES_VERIFY` values (added in Plan 02).
2. The certificate route page components, ViewModel hooks, and tier views are implemented in Plans 07 and 08. This plan only covers the i18n translations and navigation integration.
3. The sidebar component (`frontend/common/components/layout/Sidebar.tsx` or equivalent) already renders from `SIDEBAR_NAV_GROUPS` + `SIDEBAR_NAV_ITEMS` and supports grouping via `groupId`.
4. The `getNavItemsForPermissions` function already handles group filtering (dropping empty groups).
5. The mobile bottom nav (`BOTTOM_NAV_ITEMS` or equivalent) already supports permission-based filtering.

---

## 6. Dependencies

| Dependency | Source | Status |
|---|---|---|
| Plan 07 — Template Management UI | Provides view components that consume translation keys | Required |
| Plan 08 — Certificate Generation & Verification UI | Provides view components that consume translation keys | Required |
| Plan 02 — Types & Permissions | Defines `CERTIFICATES_*` permissions in `AppPermission` enum | Required |
| Plan 01 — DB Schema | Defines `CertificateStatus`, `TemplateElementType`, `TemplateVariableType` enums used in `Record<>` status maps | Required |

---

## 7. Traceability

| Requirement ID | Feature Area | Consumed By |
|---|---|---|
| REQ-I18N-001–004 | Type definitions | Tasks 1–3 |
| REQ-I18N-005–007 | English translations | Task 1 |
| REQ-I18N-008–010 | Arabic translations | Task 2 |
| REQ-I18N-011–013 | Schema registration | Task 3, 4 |
| REQ-I18N-014–015 | Navigation labels & icons | Task 5 |
| REQ-I18N-016–019 | Sidebar nav config | Task 5 |
| REQ-I18N-020–021 | Mobile nav | Task 5 |
| REQ-I18N-022–023 | Public verification route | Task 7 |
| REQ-I18N-024–028 | Permission matrix | Task 6 |
| REQ-I18N-029–031 | Feature 6 (Knowledge Base) | Task 1, 2 |
| REQ-I18N-032–034 | Route registration | Task 7 |
| REQ-I18N-035–037 | Server/client translation access | Tasks 1–4 |
| NFR-01–05 | Non-functional | All tasks |
