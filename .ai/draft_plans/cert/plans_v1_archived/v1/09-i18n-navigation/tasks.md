# Plan 09 — i18n & Navigation: Implementation Tasks

> **Feature**: Certificate Generation & Verification (Siraj)
> **Plan**: 09 — i18n Translations & Navigation Integration
> **Depends on**: Plan 07 (Template Management UI), Plan 08 (Certificate Generation & Verification UI)
> **Reference specs**: `requirements.md`, `design.md` (same directory)
> **Estimated total effort**: ~20–25 hours (8 tasks × 2–4 hours each)

---

## Pre-Task Instructions (Read Before Starting Any Task)

Before writing any code, every task MUST:

1. **Read these instruction files:**
   - `shared/AGENTS.md` — Canonical i18n rules (compile-time system, namespace registration 7 steps, pluralization pattern, interpolation pattern, public import contract, view-layer label types)
   - Root `AGENTS.md` — Project-wide rules (path aliases, lint queue, quality gate, logging)
   - `frontend/AGENTS.md` — Frontend-wide rules (MUI v9, React 19, component patterns)

2. **Read these reference implementations:**
   - `shared/locale/types/dashboard/billing/main.ts` — `BillingLabels` interface (BEST pattern reference for nested objects, pluralization, interpolation, `Record<>` status maps)
   - `shared/locale/en/dashboard/billing/main.ts` — English implementation pattern (`dashboardBillingEn`)
   - `shared/locale/ar/dashboard/billing/main.ts` — Arabic implementation pattern (`dashboardBillingAr`)
   - `shared/locale/namespaces/dashboard/billing/main.namespace.ts` — `defineNamespace` pattern for client-side lazy loading
   - `shared/locale/namespaces/translation.ts` — `Translation.Dashboard` object (where to register new namespace)
   - `shared/locale/types/message.ts` — `DashboardTranslations` interface (where to add `certificates: CertificateLabels`)
   - `shared/locale/en/messages.ts` / `shared/locale/ar/messages.ts` — Messages assemblers (import + add to dashboard object)
   - `frontend/common/views/dashboard/config/navigationConfig.ts` — `SIDEBAR_NAV_GROUPS` + `SIDEBAR_NAV_ITEMS` structure
   - `frontend/common/views/dashboard/config/navIconKeys.ts` — `NavIconKey` union type
   - `frontend/common/views/dashboard/config/navIconRegistry.tsx` — `ICON_LOADERS` pattern
   - `frontend/common/types/page-permissions.types.ts` — `PAGE_PERMISSIONS` object

3. **Confirm dependencies exist:**
   - `AppPermission` enum has `CertificatesList`, `CertificatesManageTemplate`, `CertificatesView`, `CertificatesGenerate`, `CertificatesRevoke`, `CertificatesVerify` (added in Plan 02)
   - If Plan 02 is not yet merged, use placeholder constant values and add a TODO comment

4. **Per-file quality loop (after implementation, before marking task done):**
   ```bash
   # Start lint queue server if not already running
   ~/.bun/bin/bun run scripts/lint-queue-server.ts &

   # tsgo — type check (safe to run concurrently)
   ~/.bun/bin/bun run tsgo

   # biome — format + lint fix
   ~/.bun/bin/bun biome:check --write

   # lint via queue client (file-scoped, not full repo)
   export LINT_QUEUE_PORT=$(grep -oP 'LINT_QUEUE_PORT = \K\d+' scripts/lint-queue-config.ts)
   curl -s -X POST http://localhost:${LINT_QUEUE_PORT}/lint \
     -H "Content-Type: application/json" \
     -d '{"id":"verify-task-X","files":["<file-path>"]}'
   ```

5. **Instruction verification checklist (per file):**
   - [ ] All interface properties are `readonly` (shared/AGENTS.md)
   - [ ] Pluralization uses `(count: number) => string` function signature (NOT ICU strings)
   - [ ] Interpolation uses typed `(param: string) => string` template-literal functions
   - [ ] Status maps use `Record<string, string>` (NOT loose objects)
   - [ ] All imports use `@/shared/locale/...` path aliases (never relative paths from outside shared/locale/)
   - [ ] No `console.*` — use `logger` from `@/backend/lib` or `@/frontend/utils/logger`
   - [ ] No hardcoded user-facing strings — all flow through translation namespace
   - [ ] No `next-intl` imports — it has been fully removed
   - [ ] Arabic strings are natural Arabic, not machine-translated
   - [ ] Arabic pluralization follows all six forms (zero/one/two/few/many/other)

---

## Task 1: Create English Translations File

> **Estimated effort**: 3–4 hours
> **Requirements**: REQ-I18N-005, REQ-I18N-006, REQ-I18N-007, REQ-I18N-029 (partial), REQ-I18N-030 (partial)
> **File to create**: `shared/locale/en/dashboard/certificates/main.ts`
> **Pattern source**: `shared/locale/en/dashboard/billing/main.ts`

### Steps

1. **Read instruction files** (see Pre-Task Instructions above).

2. **Read the design doc** §3 (English Implementation) and §2.1 (`CertificateLabels` interface).

3. **Create** `shared/locale/en/dashboard/certificates/main.ts`.

4. **Import the `CertificateLabels` type:**
   ```typescript
   import type { CertificateLabels } from "@/shared/locale/types/dashboard/certificates/main";
   ```

5. **Export `dashboardCertificatesEn`** that fully implements `CertificateLabels`:
   ```typescript
   export const dashboardCertificatesEn: CertificateLabels = {
     // ... all properties from the interface ...
   };
   ```

6. **Implement English pluralization** (one/other):
   - `count(0)` → "No certificates" / "No templates" / "No categories"
   - `count(1)` → "1 certificate" / "1 template"
   - `count(n)` → "{n} certificates" (n ≥ 2)
   - Same pattern for `templates.count`, `categories.count`, `generate.success`, `knowledgeBase.guideCount`

7. **Implement English interpolation** using TypeScript template literals:
   - `errors.notFound(id)` → `` `Certificate with ID "${id}" was not found` ``
   - `verify.valid(recipientName, issueDate)` → `` `This is a valid certificate issued to "${recipientName}" on ${issueDate}.` ``
   - `revoke.success(recipientName)` → `` `Certificate for "${recipientName}" has been successfully revoked.` ``
   - `detail.issuedTo(recipientName)` → `` `Issued to ${recipientName}` ``
   - `templates.confirmDeleteBody(name)` → `` `This will permanently delete the template "${name}". This action cannot be undone.` ``
   - `templates.deleteSuccess(name)` → `` `Template "${name}" has been deleted successfully.` ``
   - `templates.duplicateSuccess(name)` → `` `Template "${name}" has been duplicated successfully.` ``
   - `categories.confirmDeleteBody(name)` → `` `This will permanently delete the category "${name}". Templates in this category will be uncategorized.` ``
   - `categories.deleteSuccess(name)` → `` `Category "${name}" has been deleted successfully.` ``
   - `verify.invalid(code)` → `` `Verification code "${code}" is not valid. Please check and try again.` ``
   - `verify.expiredBody(expiryDate)` → `` `This certificate expired on ${expiryDate} and is no longer valid.` ``
   - `list.showingResults(shown, total)` → `` `Showing ${shown} of ${total} results` ``

8. **Implement status maps** as `Record<string, string>`:
   - `status`: `{ DRAFT: "Draft", ISSUED: "Issued", EXPIRED: "Expired", REVOKED: "Revoked", ARCHIVED: "Archived" }`
   - `elementTypes`: `{ TEXT: "Text", IMAGE: "Image", QR_CODE: "QR Code", SIGNATURE: "Signature", SHAPE: "Shape" }`
   - `variableTypes`: `{ TEXT: "Text", DATE: "Date", NUMBER: "Number", IMAGE_URL: "Image URL", STUDENT_NAME: "Student Name", TEACHER_NAME: "Teacher Name", ISSUE_DATE: "Issue Date", EXPIRY_DATE: "Expiry Date", COURSE_NAME: "Course Name", GRADE: "Grade", CUSTOM: "Custom" }`

9. **Include Feature 6 keys**: `knowledgeBase.*` and `progress.*` sub-objects as specified in design doc §2.1.

### Quality Loop

```bash
~/.bun/bin/bun run tsgo
~/.bun/bin/bun biome:check --write
export LINT_QUEUE_PORT=$(grep -oP 'LINT_QUEUE_PORT = \K\d+' scripts/lint-queue-config.ts)
curl -s -X POST http://localhost:${LINT_QUEUE_PORT}/lint \
  -H "Content-Type: application/json" \
  -d '{"id":"verify-task-1","files":["shared/locale/en/dashboard/certificates/main.ts"]}'
```

### Instruction Verification (shared/AGENTS.md)

- [ ] All `readonly` properties on the interface are satisfied (TS will error if missing)
- [ ] Pluralization uses `(count: number) => string` (NOT ICU strings)
- [ ] Interpolation uses typed `(param: string) => string` template literals
- [ ] Export name is `dashboardCertificatesEn` (matching `dashboardBillingEn` pattern)
- [ ] Import uses `@/shared/locale/types/dashboard/certificates/main` path alias
- [ ] No `console.*` used
- [ ] No hardcoded strings outside the translation object
- [ ] No `next-intl` imports

### _Requirements_

- **REQ-I18N-005**: English translations file exists and fully implements `CertificateLabels`
- **REQ-I18N-006**: English pluralization (one/other) implemented correctly
- **REQ-I18N-007**: English interpolation uses TypeScript template literals
- **REQ-I18N-029**: Knowledge Base English translation keys included
- **REQ-I18N-030**: Progress tracking English translation keys included

---

## Task 2: Create Arabic Translations File

> **Estimated effort**: 3–4 hours
> **Requirements**: REQ-I18N-008, REQ-I18N-009, REQ-I18N-010, REQ-I18N-029 (partial), REQ-I18N-030 (partial)
> **File to create**: `shared/locale/ar/dashboard/certificates/main.ts`
> **Pattern source**: `shared/locale/ar/dashboard/billing/main.ts`

### Steps

1. **Read instruction files** (see Pre-Task Instructions above).

2. **Read the design doc** §4 (Arabic Implementation) and §2.1 (`CertificateLabels` interface).

3. **Create** `shared/locale/ar/dashboard/certificates/main.ts`.

4. **Import the `CertificateLabels` type:**
   ```typescript
   import type { CertificateLabels } from "@/shared/locale/types/dashboard/certificates/main";
   ```

5. **Export `dashboardCertificatesAr`** that fully implements `CertificateLabels`.

6. **Implement Arabic pluralization** — MUST follow all six forms:
   ```typescript
   // list.count
   count: (count: number) => {
     if (count === 0) return "لا توجد شهادات";
     if (count === 1) return "شهادة واحدة";
     if (count === 2) return "شهادتان";
     if (count >= 3 && count <= 10) return `${count} شهادات`;
     return `${count} شهادة";
   },
   ```
   - Same six-form pattern for `templates.count`, `categories.count`, `generate.success`, `knowledgeBase.guideCount`
   - Arabic words for templates: قالب/قالبان/قوالب
   - Arabic words for categories: تصنيف/تصنيفان/تصنيفات

7. **Implement Arabic interpolation** using Arabic phrasing:
   - `errors.notFound(id)` → `` `لم يتم العثور على الشهادة بالمعرف "${id}"` ``
   - `verify.valid(recipientName, issueDate)` → `` `هذه شهادة صالحة صادرة لـ "${recipientName}" بتاريخ ${issueDate}` ``
   - `revoke.success(recipientName)` → `` `تم إلغاء شهادة "${recipientName}" بنجاح` ``
   - `detail.issuedTo(recipientName)` → `` `صادرة لـ ${recipientName}` ``
   - `templates.confirmDeleteBody(name)` → `` `سيؤدي هذا إلى حذف القالب "${name}" نهائياً. لا يمكن التراجع عن هذا الإجراء.` ``
   - `templates.deleteSuccess(name)` → `` `تم حذف القالب "${name}" بنجاح` ``
   - `templates.duplicateSuccess(name)` → `` `تم نسخ القالب "${name}" بنجاح` ``
   - `categories.confirmDeleteBody(name)` → `` `سيؤدي هذا إلى حذف التصنيف "${name}" نهائياً. ستُصبح القوالب في هذا التصنيف غير مصنفة.` ``
   - `categories.deleteSuccess(name)` → `` `تم حذف التصنيف "${name}" بنجاح` ``
   - `verify.invalid(code)` → `` `رمز التحقق "${code}" غير صالح. يرجى التحقق والمحاولة مرة أخرى.` ``
   - `verify.expiredBody(expiryDate)` → `` `انتهت صلاحية هذه الشهادة بتاريخ ${expiryDate} ولم تعد صالحة.` ``
   - `list.showingResults(shown, total)` → `` `عرض ${shown} من ${total} نتائج` ``

8. **Implement Arabic status maps:**
   - `status`: `{ DRAFT: "مسودة", ISSUED: "صادر", EXPIRED: "منتهي الصلاحية", REVOKED: "ملغي", ARCHIVED: "مؤرشف" }`
   - `elementTypes`: `{ TEXT: "نص", IMAGE: "صورة", QR_CODE: "رمز QR", SIGNATURE: "توقيع", SHAPE: "شكل" }`
   - `variableTypes`: `{ TEXT: "نص", DATE: "تاريخ", NUMBER: "رقم", IMAGE_URL: "رابط صورة", STUDENT_NAME: "اسم الطالب", TEACHER_NAME: "اسم المعلم", ISSUE_DATE: "تاريخ الإصدار", EXPIRY_DATE: "تاريخ الانتهاء", COURSE_NAME: "اسم الدورة", GRADE: "الدرجة", CUSTOM: "مخصص" }`

9. **Include Feature 6 keys** in Arabic:
   - `knowledgeBase.title` → "قاعدة معرفة الشهادات"
   - `knowledgeBase.description` → "تصفح والبحث في قوالب وعناصر وأفضل ممارسات الشهادات"
   - `progress.title` → "تقدم الشهادات"
   - `progress.issued` → "تم الإصدار"
   - `progress.pending` → "قيد المعالجة"
   - etc. (see design doc §2.1 for all keys)

### Quality Loop

```bash
~/.bun/bin/bun run tsgo
~/.bun/bin/bun biome:check --write
export LINT_QUEUE_PORT=$(grep -oP 'LINT_QUEUE_PORT = \K\d+' scripts/lint-queue-config.ts)
curl -s -X POST http://localhost:${LINT_QUEUE_PORT}/lint \
  -H "Content-Type: application/json" \
  -d '{"id":"verify-task-2","files":["shared/locale/ar/dashboard/certificates/main.ts"]}'
```

### Instruction Verification (shared/AGENTS.md)

- [ ] All `readonly` properties on the interface are satisfied
- [ ] Arabic pluralization uses all SIX forms (zero/one/two/few/many/other) — NOT just one/other
- [ ] Interpolation uses Arabic phrasing, not literal translations
- [ ] Export name is `dashboardCertificatesAr` (matching `dashboardBillingAr` pattern)
- [ ] Import uses `@/shared/locale/types/dashboard/certificates/main` path alias
- [ ] No `console.*` used
- [ ] No `next-intl` imports
- [ ] Arabic strings are natural, not machine-translated

### _Requirements_

- **REQ-I18N-008**: Arabic translations file exists and fully implements `CertificateLabels`
- **REQ-I18N-009**: Arabic pluralization follows zero/one/two/few/many/other rules
- **REQ-I18N-010**: Arabic interpolation uses Arabic phrasing with TypeScript template literals
- **REQ-I18N-029**: Knowledge Base Arabic translation keys included
- **REQ-I18N-030**: Progress tracking Arabic translation keys included

---

## Task 3: Create Type Definition & Update Schema Registration

> **Estimated effort**: 3–4 hours
> **Requirements**: REQ-I18N-001, REQ-I18N-002, REQ-I18N-003, REQ-I18N-004, REQ-I18N-011, REQ-I18N-013
> **Files to create**: `shared/locale/types/dashboard/certificates/main.ts`
> **Files to update**: `shared/locale/types/message.ts`, `shared/locale/types/index.ts`

### Steps

1. **Read instruction files** (see Pre-Task Instructions above).

2. **Read the design doc** §2.1 (`CertificateLabels` interface) and §5 (Schema Registration).

3. **Create** `shared/locale/types/dashboard/certificates/main.ts`:

4. **Define the `CertificateLabels` interface** exactly as specified in design doc §2.1. Ensure:
   - All properties are `readonly`
   - All sub-objects are `readonly` (e.g., `readonly templates: { ... }`)
   - Pluralization functions have signature `(count: number) => string`
   - Interpolation functions have typed parameters
   - Status maps use `Record<string, string>`
   - The interface covers all 12 domains: templates, categories, list, generate, detail, revoke, verify, errors, permissions, status, elementTypes, variableTypes, knowledgeBase, progress

5. **Update `shared/locale/types/message.ts`**:
   - Add import at the top (in the import block):
     ```typescript
     import type { CertificateLabels } from "@/shared/locale/types/dashboard/certificates/main";
     ```
   - Add `certificates: CertificateLabels;` to the `DashboardTranslations` interface (in alphabetical position, after `billingSupportedCurrencies`)

6. **Update `shared/locale/types/index.ts`**:
   - Add re-export for the new certificates type:
     ```typescript
     export * from "./dashboard/certificates/main";
     ```
   - Verify the barrel re-exports the `CertificateLabels` type

### Quality Loop

```bash
~/.bun/bin/bun run tsgo
~/.bun/bin/bun biome:check --write
export LINT_QUEUE_PORT=$(grep -oP 'LINT_QUEUE_PORT = \K\d+' scripts/lint-queue-config.ts)
curl -s -X POST http://localhost:${LINT_QUEUE_PORT}/lint \
  -H "Content-Type: application/json" \
  -d '{"id":"verify-task-3","files":["shared/locale/types/dashboard/certificates/main.ts","shared/locale/types/message.ts","shared/locale/types/index.ts"]}'
```

### Instruction Verification (shared/AGENTS.md)

- [ ] Interface is in `shared/locale/types/dashboard/certificates/main.ts` (following `types/dashboard/billing/main.ts` pattern)
- [ ] All properties are `readonly`
- [ ] Pluralization uses `(count: number) => string` function signature
- [ ] Interpolation uses typed `(param: string | number, ...) => string` function signatures
- [ ] Status maps use `Record<string, string>` (NOT loose objects)
- [ ] Import path in `message.ts` uses `@/shared/locale/types/dashboard/certificates/main` alias
- [ ] `DashboardTranslations` has `certificates: CertificateLabels` added
- [ ] `types/index.ts` re-exports the new type module

### _Requirements_

- **REQ-I18N-001**: `CertificateLabels` interface created with all domains as nested readonly interfaces
- **REQ-I18N-002**: Pluralization signatures defined as `(count: number) => string`
- **REQ-I18N-003**: Interpolation signatures defined with typed parameters
- **REQ-I18N-004**: Status, elementTypes, variableTypes defined as `Record<string, string>`
- **REQ-I18N-011**: `DashboardTranslations` updated with `certificates: CertificateLabels`
- **REQ-I18N-013**: Type exported via barrel (`types/index.ts`)
- **NFR-01**: Compile-time type safety — TypeScript will error on missing keys

---

## Task 4: Update Messages Assemblers & Create Client Namespace

> **Estimated effort**: 2–3 hours
> **Requirements**: REQ-I18N-012, REQ-I18N-011 (partial), REQ-I18N-035–037 (infrastructure), NFR-04
> **Files to update**: `shared/locale/en/messages.ts`, `shared/locale/ar/messages.ts`, `shared/locale/namespaces/translation.ts`
> **File to create**: `shared/locale/namespaces/dashboard/certificates/main.namespace.ts`

### Steps

1. **Read instruction files** (see Pre-Task Instructions above).

2. **Read the design doc** §5.2–§5.5 (messages assemblers + namespace registration).

3. **Update `shared/locale/en/messages.ts`**:
   - Add import:
     ```typescript
     import { dashboardCertificatesEn } from "@/shared/locale/en/dashboard/certificates/main";
     ```
   - Add to the `dashboardTranslations` object:
     ```typescript
     certificates: dashboardCertificatesEn,
     ```

4. **Update `shared/locale/ar/messages.ts`**:
   - Add import:
     ```typescript
     import { dashboardCertificatesAr } from "@/shared/locale/ar/dashboard/certificates/main";
     ```
   - Add to the `dashboardTranslations` (or `dashboardMessagesAr`) object:
     ```typescript
     certificates: dashboardCertificatesAr,
     ```

5. **Create** `shared/locale/namespaces/dashboard/certificates/main.namespace.ts`:
   ```typescript
   import { defineNamespace } from "@/shared/locale/namespaces/define-namespace";
   import type { CertificateLabels } from "@/shared/locale/types/dashboard/certificates/main";

   export const DashboardCertificates = defineNamespace<CertificateLabels>(
     "dashboard.certificates.main",
     {
       load: {
         en: () =>
           import("@/shared/locale/en/dashboard/certificates/main").then(
             (module) => module.dashboardCertificatesEn,
           ),
         ar: () =>
           import("@/shared/locale/ar/dashboard/certificates/main").then(
             (module) => module.dashboardCertificatesAr,
           ),
       },
     },
   );
   ```

6. **Update `shared/locale/namespaces/translation.ts`**:
   - Add import at the top:
     ```typescript
     import { DashboardCertificates } from "@/shared/locale/namespaces/dashboard/certificates/main.namespace";
     ```
   - Add to `Translation.Dashboard` object (alphabetical order):
     ```typescript
     Certificates: DashboardCertificates,
     ```

### Quality Loop

```bash
~/.bun/bin/bun run tsgo
~/.bun/bin/bun biome:check --write
export LINT_QUEUE_PORT=$(grep -oP 'LINT_QUEUE_PORT = \K\d+' scripts/lint-queue-config.ts)
curl -s -X POST http://localhost:${LINT_QUEUE_PORT}/lint \
  -H "Content-Type: application/json" \
  -d '{"id":"verify-task-4","files":["shared/locale/en/messages.ts","shared/locale/ar/messages.ts","shared/locale/namespaces/dashboard/certificates/main.namespace.ts","shared/locale/namespaces/translation.ts"]}'
```

### Instruction Verification (shared/AGENTS.md)

- [ ] Messages assemblers import and add `certificates` namespace correctly
- [ ] Namespace ID `"dashboard.certificates.main"` is stable (shared/AGENTS.md §Browser Translation Cache)
- [ ] `defineNamespace` uses typed `CertificateLabels` generic
- [ ] `Translation.Dashboard.Certificates` registered in `translation.ts`
- [ ] Lazy-loaded `import()` in the namespace file (NOT static imports)
- [ ] All imports use `@/shared/locale/...` path aliases

### _Requirements_

- **REQ-I18N-012**: Messages assemblers updated for both en and ar
- **REQ-I18N-011**: Schema registration completed via messages + translation.ts
- **REQ-I18N-035**: Server-side `getTranslations(locale).dashboardTranslations.certificates.*` works
- **REQ-I18N-036**: Client-side `useAppTranslation(Translation.Dashboard.Certificates)` works
- **NFR-04**: Lazy-loading namespace pattern ensures minimal bundle size

---

## Task 5: Add Navigation Labels, Icons & Sidebar Config

> **Estimated effort**: 3–4 hours
> **Requirements**: REQ-I18N-014, REQ-I18N-015, REQ-I18N-016, REQ-I18N-017, REQ-I18N-031
> **Files to update**: `shared/locale/types/dashboard/core/nav.ts`, `shared/locale/en/dashboard/core/nav.ts`, `shared/locale/ar/dashboard/core/nav.ts`, `frontend/common/views/dashboard/config/navIconKeys.ts`, `frontend/common/views/dashboard/config/navIconRegistry.tsx`, `frontend/common/views/dashboard/config/navigationConfig.ts`

### Steps

1. **Read instruction files** (see Pre-Task Instructions above).

2. **Read the design doc** §6 (Navigation Integration) and §8.2 (Sidebar Placement).

3. **Update `shared/locale/types/dashboard/core/nav.ts`**:
   - Add 4 keys to `DashboardNavigationLabels`:
     ```typescript
     readonly certificates: string;
     readonly certificateTemplates: string;
     readonly certificateCategories: string;
     readonly navGroupCertificates: string;
     ```

4. **Update `shared/locale/en/dashboard/core/nav.ts`**:
   - Add English strings to `dashboardCoreNavEn`:
     ```typescript
     certificates: "Certificates",
     certificateTemplates: "Templates",
     certificateCategories: "Categories",
     navGroupCertificates: "Certificates",
     ```

5. **Update `shared/locale/ar/dashboard/core/nav.ts`**:
   - Add Arabic strings to `dashboardCoreNavAr`:
     ```typescript
     certificates: "الشهادات",
     certificateTemplates: "القوالب",
     certificateCategories: "التصنيفات",
     navGroupCertificates: "الشهادات",
     ```

6. **Update `frontend/common/views/dashboard/config/navIconKeys.ts`**:
   - Add to `NavIconKey` union:
     ```typescript
     | "assignment"
     | "verified"
     | "workspacePremium"
     ```
   - Note: `"category"` already exists in the union

7. **Update `frontend/common/views/dashboard/config/navIconRegistry.tsx`**:
   - Add to `ICON_LOADERS`:
     ```typescript
     assignment: () => import("@mui/icons-material/AssignmentOutlined"),
     verified: () => import("@mui/icons-material/VerifiedOutlined"),
     workspacePremium: () => import("@mui/icons-material/WorkspacePremiumOutlined"),
     ```

8. **Update `frontend/common/views/dashboard/config/navigationConfig.ts`**:
   - Add `grp_certificates` to `SIDEBAR_NAV_GROUPS` — placed after `grp_content` and before `grp_finance`:
     ```typescript
     {
       id: "grp_certificates",
       labelKey: "navGroupCertificates",
       iconKey: "workspacePremium",
       section: "main",
       permission: [
         AppPermission.CertificatesList,
         AppPermission.CertificatesManageTemplate,
       ],
       separator: true,
     },
     ```
   - Add 3 `NavItem` entries to `SIDEBAR_NAV_ITEMS`:
     ```typescript
     {
       key: "certificate-templates",
       labelKey: "certificateTemplates",
       iconKey: "assignment",
       href: "/dashboard/certificates/templates",
       section: "main",
       permission: PAGE_PERMISSIONS.certificateTemplates,
       groupId: "grp_certificates",
     },
     {
       key: "certificate-categories",
       labelKey: "certificateCategories",
       iconKey: "category",
       href: "/dashboard/certificates/categories",
       section: "main",
       permission: PAGE_PERMISSIONS.certificateCategories,
       groupId: "grp_certificates",
     },
     {
       key: "certificates",
       labelKey: "certificates",
       iconKey: "verified",
       href: "/dashboard/certificates",
       section: "main",
       permission: PAGE_PERMISSIONS.certificatesList,
       groupId: "grp_certificates",
     },
     ```
   - Note: `PAGE_PERMISSIONS.certificateTemplates`, `PAGE_PERMISSIONS.certificateCategories`, and `PAGE_PERMISSIONS.certificatesList` are added in Task 6.

### Quality Loop

```bash
~/.bun/bin/bun run tsgo
~/.bun/bin/bun biome:check --write
export LINT_QUEUE_PORT=$(grep -oP 'LINT_QUEUE_PORT = \K\d+' scripts/lint-queue-config.ts)
curl -s -X POST http://localhost:${LINT_QUEUE_PORT}/lint \
  -H "Content-Type: application/json" \
  -d '{"id":"verify-task-5","files":["shared/locale/types/dashboard/core/nav.ts","shared/locale/en/dashboard/core/nav.ts","shared/locale/ar/dashboard/core/nav.ts","frontend/common/views/dashboard/config/navIconKeys.ts","frontend/common/views/dashboard/config/navIconRegistry.tsx","frontend/common/views/dashboard/config/navigationConfig.ts"]}'
```

### Instruction Verification (shared/AGENTS.md + frontend/AGENTS.md)

- [ ] Nav label keys added to `DashboardNavigationLabels` interface (all `readonly`)
- [ ] English and Arabic nav labels provided (4 keys each)
- [ ] New icon keys added to `NavIconKey` union
- [ ] New icon loaders use `*Outlined` suffix (MUI v9 naming convention)
- [ ] `NavGroup` placed between `grp_content` and `grp_finance` (NFR-05: backward compatibility)
- [ ] All `NavItem` entries have `section: "main"`, correct `groupId`, correct `permission`
- [ ] No existing nav keys/groups renamed or removed
- [ ] `AppPermission` imported from `@/frontend/common/graphql/generated/gql/graphql-types`

### _Requirements_

- **REQ-I18N-014**: Navigation label keys added to type + English + Arabic
- **REQ-I18N-015**: Icon keys added to union + registry
- **REQ-I18N-016**: Certificates nav group added to `SIDEBAR_NAV_GROUPS`
- **REQ-I18N-017**: Certificate nav items added to `SIDEBAR_NAV_ITEMS`
- **REQ-I18N-031**: Optional "Knowledge Base" nav item can be added if feature is implemented
- **NFR-05**: No existing keys renamed or removed — only additions

---

## Task 6: Add Permission-Gated Visibility & PAGE_PERMISSIONS

> **Estimated effort**: 2–3 hours
> **Requirements**: REQ-I18N-024, REQ-I18N-025, REQ-I18N-026, REQ-I18N-027, REQ-I18N-028, REQ-I18N-018, REQ-I18N-019
> **File to update**: `frontend/common/types/page-permissions.types.ts`
> **Pattern source**: existing `PAGE_PERMISSIONS` object

### Steps

1. **Read instruction files** (see Pre-Task Instructions above).

2. **Read the design doc** §7 (Permission Matrix), §6.8 (Page Permissions).

3. **Update `frontend/common/types/page-permissions.types.ts`**:
   - Add these entries to `PAGE_PERMISSIONS`:
     ```typescript
     certificatesList: [AppPermission.CertificatesList] as PagePermissions,
     certificateTemplates: [AppPermission.CertificatesManageTemplate] as PagePermissions,
     certificateCategories: [AppPermission.CertificatesManageTemplate] as PagePermissions,
     certificateDetail: [AppPermission.CertificatesView] as PagePermissions,
     ```
   - These are consumed by `navigationConfig.ts` (Task 5) for nav item `permission` fields and by server-page `requirePermissionForPage()` calls.

4. **Verify the permission → nav visibility matrix** (from design doc §7.2):
   - Certificates group shows if user has `CertificatesList` OR `CertificatesManageTemplate`
   - Templates item shows only if user has `CertificatesManageTemplate`
   - Categories item shows only if user has `CertificatesManageTemplate`
   - Certificates item shows if user has `CertificatesList`
   - Super admin (`isSuperAdmin: true`) bypasses all checks — all items visible
   - Group is dropped entirely if no child items survive permission check (handled by existing `getNavItemsForPermissions`)

5. **Verify `permission` fields on the 3 `NavItem` entries** from Task 5:
   - `certificate-templates` → `PAGE_PERMISSIONS.certificateTemplates` → `[AppPermission.CertificatesManageTemplate]`
   - `certificate-categories` → `PAGE_PERMISSIONS.certificateCategories` → `[AppPermission.CertificatesManageTemplate]`
   - `certificates` → `PAGE_PERMISSIONS.certificatesList` → `[AppPermission.CertificatesList]`

6. **Verify group `permission` gate** on `grp_certificates`:
   - `[AppPermission.CertificatesList, AppPermission.CertificatesManageTemplate]` (OR-semantics)

### Quality Loop

```bash
~/.bun/bin/bun run tsgo
~/.bun/bin/bun biome:check --write
export LINT_QUEUE_PORT=$(grep -oP 'LINT_QUEUE_PORT = \K\d+' scripts/lint-queue-config.ts)
curl -s -X POST http://localhost:${LINT_QUEUE_PORT}/lint \
  -H "Content-Type: application/json" \
  -d '{"id":"verify-task-6","files":["frontend/common/types/page-permissions.types.ts"]}'
```

### Instruction Verification (shared/AGENTS.md + frontend/AGENTS.md)

- [ ] `PAGE_PERMISSIONS` entries use `AppPermission` from `@/frontend/common/graphql/generated/gql/graphql-types`
- [ ] Each entry is typed as `PagePermissions` (readonly `AppPermission[]`)
- [ ] Permission values match the matrix in design doc §7.1
- [ ] OR-semantics on group `permission` (any-of verification)
- [ ] No existing `PAGE_PERMISSIONS` entries renamed or removed
- [ ] If `AppPermission.CertificatesList` etc. don't exist yet (Plan 02 not merged), add a TODO comment and use placeholder values

### _Requirements_

- **REQ-I18N-024**: Route-permission mapping added to `PAGE_PERMISSIONS`
- **REQ-I18N-025**: Permission labels available in translation namespace (`certificates.permissions.*` — added in Tasks 1 and 2)
- **REQ-I18N-026**: Role-to-route accessibility matrix enforced (admin → templates/categories; all roles → certificates list)
- **REQ-I18N-027**: Server-side guard pattern documented (server page components use `requirePermissionForPage()`)
- **REQ-I18N-028**: Client-side defense-in-depth pattern documented (client views use `<RequirePermission>`)
- **REQ-I18N-018**: Permission-gated visibility works — group dropped if no child items survive
- **REQ-I18N-019**: Super admin bypasses all certificate navigation permission checks

---

## Task 7: Quality Loop — Full Verification

> **Estimated effort**: 2–3 hours
> **Requirements**: NFR-01, NFR-02, NFR-03, NFR-04, NFR-05, all prior requirements
> **Scope**: All files created and modified in Tasks 1–6

### Steps

1. **Run full type check across all modified files:**
   ```bash
   ~/.bun/bin/bun run tsgo
   ```
   - Fix any TypeScript errors (missing keys, type mismatches, import errors)
   - Common issues: missing `readonly` on interface, wrong pluralization return type, missing keys in implementation objects

2. **Run biome (format + lint) on all modified files:**
   ```bash
   ~/.bun/bin/bun biome:check --write
   ```

3. **Run ESLint via queue client on all modified files:**
   ```bash
   export LINT_QUEUE_PORT=$(grep -oP 'LINT_QUEUE_PORT = \K\d+' scripts/lint-queue-config.ts)
   curl -s -X POST http://localhost:${LINT_QUEUE_PORT}/lint \
     -H "Content-Type: application/json" \
     -d '{"id":"verify-task-7","files":["shared/locale/en/dashboard/certificates/main.ts","shared/locale/ar/dashboard/certificates/main.ts","shared/locale/types/dashboard/certificates/main.ts","shared/locale/en/messages.ts","shared/locale/ar/messages.ts","shared/locale/types/message.ts","shared/locale/types/index.ts","shared/locale/namespaces/dashboard/certificates/main.namespace.ts","shared/locale/namespaces/translation.ts","shared/locale/types/dashboard/core/nav.ts","shared/locale/en/dashboard/core/nav.ts","shared/locale/ar/dashboard/core/nav.ts","frontend/common/views/dashboard/config/navIconKeys.ts","frontend/common/views/dashboard/config/navIconRegistry.tsx","frontend/common/views/dashboard/config/navigationConfig.ts","frontend/common/types/page-permissions.types.ts"]}'
   ```

4. **Verify compile-time type safety (NFR-01):**
   - Create a temporary test file that accesses a non-existent key:
     ```typescript
     // Delete after verification
     const _fail = t.certificates.nonExistentKey;
     ```
   - Confirm TypeScript error is produced
   - Remove the temporary test file

5. **Verify no hardcoded strings (NFR-02):**
   - `grep -rn "console\." shared/locale/en/dashboard/certificates/ shared/locale/ar/dashboard/certificates/` — should be empty
   - No hardcoded English/Arabic strings in frontend components (verify by running existing pattern checks)

6. **Verify RTL compliance (NFR-03):**
   - Arabic strings use natural language (not machine translation)
   - No `dir` attribute overrides on certificate components
   - Root `<html dir="rtl">` is set by layout (existing behavior)

7. **Verify backward compatibility (NFR-05):**
   - No existing `PAGE_PERMISSIONS` entries renamed or removed
   - No existing `DashboardNavigationLabels` keys renamed or removed
   - No existing `NavIconKey` values renamed or removed
   - No existing `SIDEBAR_NAV_GROUPS` entries removed
   - No existing `SIDEBAR_NAV_ITEMS` entries removed

8. **Run full quality gate:**
   ```bash
   ~/.bun/bin/bun quality-gate
   ```
   - This runs tsgo → biome → lint → codescene → sonar sequentially
   - Fix any issues that arise from the new files

### Quality Loop

(Steps 3 and 8 above ARE the quality loop.)

### Instruction Verification (shared/AGENTS.md)

- [ ] `bun run tsgo` passes with zero errors
- [ ] `bun biome:check` passes with zero issues
- [ ] Lint queue client returns `success: true` for all files
- [ ] Compile-time type safety: accessing a non-existent key produces a TS error
- [ ] No `console.*` in any translation file
- [ ] No `next-intl` imports in any file
- [ ] No existing keys/groups/nav items renamed or removed
- [ ] `bun quality-gate` passes (or only has pre-existing issues unrelated to this plan)

### _Requirements_

- **NFR-01**: Compile-time type safety verified — missing keys produce TS errors
- **NFR-02**: No hardcoded strings — all flow through translation namespace; no `console.*`
- **NFR-03**: RTL compliance — Arabic strings are natural, no `dir` overrides
- **NFR-04**: Performance — lazy-loading namespace verified; minimal bundle
- **NFR-05**: Backward compatibility — only additions, no modifications to existing entries
- All prior requirements verified through full type/lint/build pass

---

## Task 8: Knowledge Propagation

> **Estimated effort**: 2–3 hours
> **Requirements**: Features 6 (Outcome Knowledge Base), REQ-I18N-029–031, design doc §10
> **Files to update**: `shared/AGENTS.md`, `frontend/AGENTS.md` (if applicable), project documentation

### Steps

1. **Read instruction files** (see Pre-Task Instructions above).

2. **Read the design doc** §10 (Outcome & Knowledge Transfer Protocol).

3. **Update `shared/AGENTS.md`**:
   - In the i18n section, add `certificates` to the list of dashboard namespaces:
     ```
     ### Dashboard namespaces
     - `dashboard.certificates.main` — Certificate translations (templates, categories, list, generate, detail, revoke, verify, errors, permissions, status, elementTypes, variableTypes, knowledgeBase, progress)
     ```
   - Add a note about the Arabic six-form pluralization pattern as a reference for future Arabic namespaces

4. **Update `frontend/AGENTS.md`** (if navigation reference exists):
   - Add `grp_certificates` to the list of sidebar groups if such a list is maintained
   - Reference the certificate nav group pattern for permission-gated navigation

5. **Verify the namespace ID is stable** (shared/AGENTS.md §Browser Translation Cache):
   - The `defineNamespace("dashboard.certificates.main", ...)` call uses a stable string ID
   - This ID is used for Service Worker cache and IndexedDB snapshot keying

6. **Cross-reference with Plans 07 and 08**:
   - Confirm that the `CertificateLabels` interface in `types/dashboard/certificates/main.ts` matches what Plans 07 and 08 expect to import
   - Confirm that the `Translation.Dashboard.Certificates` namespace handle is accessible for `useAppTranslation()` calls in client components from Plans 07 and 08
   - Confirm that `PAGE_PERMISSIONS.certificatesList`, `certificateTemplates`, `certificateCategories`, `certificateDetail` are accessible for server-page `requirePermissionForPage()` and client `<RequirePermission>` in Plans 07 and 08

7. **Verify public documentation** (if applicable):
   - If `docs/` has an i18n reference document, update it to mention the certificates namespace
   - If there is a navigation pattern reference document, update it to mention `grp_certificates`

### Quality Loop

```bash
~/.bun/bin/bun run tsgo
~/.bun/bin/bun biome:check --write
# Documentation files typically don't need lint, but check if there are lint rules for markdown
```

### Instruction Verification (shared/AGENTS.md)

- [ ] `shared/AGENTS.md` updated with the `certificates` namespace reference
- [ ] Namespace ID `"dashboard.certificates.main"` is documented (shared/AGENTS.md §Browser Translation Cache requirement)
- [ ] Arabic six-form pluralization pattern is referenced as a reusable pattern
- [ ] Cross-references with Plans 07 and 08 confirmed (interface + namespace handle + PAGE_PERMISSIONS)
- [ ] Frontend AGENTS.md updated if it maintains a nav group reference

### _Requirements_

- **Feature 6 (Outcome Knowledge Base)**: Translation keys and progress tracking keys propagate to Plans 07 and 08
- **REQ-I18N-029**: Knowledge Base translation keys documented and accessible
- **REQ-I18N-030**: Progress tracking translation keys documented and accessible
- **REQ-I18N-031**: Optional Knowledge Base nav item gated by `CERTIFICATES_LIST`
- Cross-plan dependencies satisfied: Plans 07 and 08 can import types, namespace handles, and page permissions

---

## Post-Task Verification (Run After All Tasks Complete)

After all 8 tasks are complete, run this final verification checklist:

### File Inventory Verification

- [ ] `shared/locale/types/dashboard/certificates/main.ts` — EXISTS, exports `CertificateLabels`
- [ ] `shared/locale/en/dashboard/certificates/main.ts` — EXISTS, exports `dashboardCertificatesEn`
- [ ] `shared/locale/ar/dashboard/certificates/main.ts` — EXISTS, exports `dashboardCertificatesAr`
- [ ] `shared/locale/namespaces/dashboard/certificates/main.namespace.ts` — EXISTS, exports `DashboardCertificates`
- [ ] `shared/locale/types/message.ts` — UPDATED, has `certificates: CertificateLabels` in `DashboardTranslations`
- [ ] `shared/locale/en/messages.ts` — UPDATED, has `certificates: dashboardCertificatesEn`
- [ ] `shared/locale/ar/messages.ts` — UPDATED, has `certificates: dashboardCertificatesAr`
- [ ] `shared/locale/namespaces/translation.ts` — UPDATED, has `Certificates: DashboardCertificates` in `Dashboard`
- [ ] `shared/locale/types/index.ts` — UPDATED, re-exports certificates type
- [ ] `shared/locale/types/dashboard/core/nav.ts` — UPDATED, has 4 new keys
- [ ] `shared/locale/en/dashboard/core/nav.ts` — UPDATED, has 4 English strings
- [ ] `shared/locale/ar/dashboard/core/nav.ts` — UPDATED, has 4 Arabic strings
- [ ] `frontend/common/views/dashboard/config/navIconKeys.ts` — UPDATED, has `"assignment"`, `"verified"`, `"workspacePremium"`
- [ ] `frontend/common/views/dashboard/config/navIconRegistry.tsx` — UPDATED, has 3 lazy loaders
- [ ] `frontend/common/views/dashboard/config/navigationConfig.ts` — UPDATED, has `grp_certificates` + 3 nav items
- [ ] `frontend/common/types/page-permissions.types.ts` — UPDATED, has 4 certificate permission entries

### Quality Gate Verification

- [ ] `bun run tsgo` — zero errors
- [ ] `bun biome:check` — zero issues
- [ ] `bun run lint` (or lint queue client) — zero errors
- [ ] `bun quality-gate` — passes (or only has pre-existing unrelated issues)

### Translation Verification

- [ ] English: `getTranslations("en").dashboardTranslations.certificates.list.pageTitle` returns "Certificates"
- [ ] Arabic: `getTranslations("ar").dashboardTranslations.certificates.list.pageTitle` returns "الشهادات"
- [ ] English `count(1)` returns "1 certificate"
- [ ] Arabic `count(1)` returns "شهادة واحدة"
- [ ] Arabic `count(0)` returns "لا توجد شهادات"
- [ ] Arabic `count(3)` returns "3 شهادات" (few)
- [ ] English `notFound("abc")` returns `Certificate with ID "abc" was not found`
- [ ] Arabic `notFound("abc")` returns `لم يتم العثور على الشهادة بالمعرف "abc"`

### Navigation Verification

- [ ] Sidebar shows "Certificates" group for academy_admin role
- [ ] Sidebar shows only "Certificates" item (not Templates/Categories) for teacher role
- [ ] Sidebar shows no "Certificates" group for roles without certificate permissions
- [ ] Sidebar shows all 3 items for super_admin role
