# Plan 09 — i18n & Navigation: Technical Design

> **Feature**: Certificate Generation & Verification (Siraj)
> **Plan**: 09 — i18n Translations & Navigation Integration
> **Depends on**: Plan 07 (Template Management UI), Plan 08 (Certificate Generation & Verification UI)
> **Stack**: Siraj custom compile-time TypeScript i18n system in `shared/locale/`; Next.js 16 App Router
> **Source patterns**: `siraj_analysis/06-i18n-system.md`, `siraj_analysis/08-app-router-navigation.md`, `cgvs_analysis/08-i18n-theme-infra.md`, `siraj_analysis/09-auth-permissions.md`

---

## 1. Architecture Overview

### 1.1 Siraj i18n System

Siraj uses a **custom compile-time TypeScript i18n system** — not `next-intl` (fully removed), not ICU messages. Key properties:

- **Compile-time safety**: `t.certificates.templates.pageTitle` style property access. TypeScript errors on missing keys.
- **Native TS pluralization**: `(count: number) => string` functions — NOT ICU `{count, plural, ...}` strings.
- **Native TS interpolation**: `(param: string) => string` template-literal functions — NOT ICU `{param}` placeholders.
- **Two locales only**: `ar` (Arabic, default) and `en` (English).
- **Locale from cookie**: `NEXT_LOCALE` cookie, NOT `[locale]` URL segment under `(dashboard)`.
- **RTL**: root `<html dir="rtl">` is set by the layout when locale is `ar`.

### 1.2 Namespace Registration Pattern (7 Steps)

Each new namespace requires registration across 7 files. The certificate namespace follows the established pattern:

| Step | File | Action |
|---|---|---|
| 1 | `shared/locale/types/dashboard/certificates/main.ts` | Create `CertificateLabels` interface |
| 2 | `shared/locale/en/dashboard/certificates/main.ts` | Create English implementation (`dashboardCertificatesEn`) |
| 3 | `shared/locale/ar/dashboard/certificates/main.ts` | Create Arabic implementation (`dashboardCertificatesAr`) |
| 4 | `shared/locale/types/message.ts` | Import `CertificateLabels` + add `certificates: CertificateLabels` to `DashboardTranslations` |
| 5 | `shared/locale/en/messages.ts` | Import `dashboardCertificatesEn` + add `certificates: dashboardCertificatesEn` |
| 6 | `shared/locale/ar/messages.ts` | Import `dashboardCertificatesAr` + add `certificates: dashboardCertificatesAr` |
| 7 | `shared/locale/namespaces/dashboard/certificates/main.namespace.ts` | Create client-side lazy-loading namespace via `defineNamespace` + register in `translation.ts` |

### 1.3 Navigation Registration Pattern (5 Files)

| Step | File | Action |
|---|---|---|
| 1 | `shared/locale/types/dashboard/core/nav.ts` | Add `certificates`, `certificateTemplates`, `certificateCategories`, `navGroupCertificates` to `DashboardNavigationLabels` |
| 2 | `shared/locale/en/dashboard/core/nav.ts` | Add English strings for new keys |
| 3 | `shared/locale/ar/dashboard/core/nav.ts` | Add Arabic strings for new keys |
| 4 | `frontend/common/views/dashboard/config/navIconKeys.ts` | Add `"workspacePremium" \| "assignment" \| "verified"` to `NavIconKey` union |
| 5 | `frontend/common/views/dashboard/config/navIconRegistry.tsx` | Add lazy MUI icon loaders for new icon keys |

### 1.4 Navigation Config Pattern (1 File)

| File | Action |
|---|---|
| `frontend/common/views/dashboard/config/navigationConfig.ts` | Add `grp_certificates` to `SIDEBAR_NAV_GROUPS` + 3 `NavItem` entries to `SIDEBAR_NAV_ITEMS` |
| `frontend/common/types/page-permissions.types.ts` | Add `certificatesList`, `certificateTemplates`, `certificateCategories`, `certificateDetail` entries to `PAGE_PERMISSIONS` |

### 1.5 Layer Position

```
Server Component (page.tsx)
    └─ getTranslations(locale).dashboardTranslations.certificates.*
        └─ pass translated strings as props to Client Container

Client Container (ViewModel)
    └─ useAppTranslation(Translation.Dashboard.Certificates)
        └─ receive labels, pass to tier views

GraphQL Resolver
    └─ ctx.t().dashboardTranslations.certificates.*
        └─ use certificates.errors.* for localized GraphQLError messages
```

### 1.6 Pattern Compliance Matrix

| Pattern | Source | Application |
|---|---|---|
| `*Labels` interface in `types/` | `BillingLabels` in `types/dashboard/billing/main.ts` | `CertificateLabels` in `types/dashboard/certificates/main.ts` |
| `readonly` on all properties | All `*Labels` interfaces | All `CertificateLabels` properties |
| Pluralization `(count: number) => string` | `BillingLabels.adminMetrics.negativeBalance` | `CertificateLabels.list.count`, `CertificateLabels.generate.success` |
| Interpolation `(param: string) => string` | `BillingLabels.deleteInvoiceDialog.body` | `CertificateLabels.errors.notFound`, `CertificateLabels.verify.valid` |
| `Record<Enum, string>` for status maps | `BillingLabels.invoiceStatus` | `CertificateLabels.status`, `CertificateLabels.elementTypes`, `CertificateLabels.variableTypes` |
| `defineNamespace` for client lazy-loading | `DashboardBilling` in `billing/main.namespace.ts` | `DashboardCertificates` in `certificates/main.namespace.ts` |
| NavGroup + NavItem with `groupId` | `grp_content`, `grp_finance` | `grp_certificates` |
| NavItem `permission` (OR-semantics) | Each `SIDEBAR_NAV_ITEMS` entry | Each certificate `NavItem` |
| `PAGE_PERMISSIONS` entry | `billingAdmin: [AppPermission.BillingViewHistory]` | `certificatesList: [AppPermission.CertificatesList]` |

---

## 2. Translation Type Definition

### 2.1 CertificateLabels Interface

**File**: `shared/locale/types/dashboard/certificates/main.ts` (NEW)

```typescript
/**
 * CertificateLabels — type schema for the dashboard.certificates namespace.
 *
 * Covers all certificate-related domains: template management, category
 * management, certificate list, generation, detail, revocation, public
 * verification, errors, permissions, and Feature 6 (Knowledge Base).
 */
export interface CertificateLabels {
  // ── Page titles ──────────────────────────────────────────────
  readonly pageTitle: string;
  readonly pageSubtitle: string;

  // ── Status labels (Record maps) ──────────────────────────────
  readonly status: Record<string, string>;
  readonly elementTypes: Record<string, string>;
  readonly variableTypes: Record<string, string>;

  // ── Templates sub-domain ─────────────────────────────────────
  readonly templates: {
    readonly pageTitle: string;
    readonly pageSubtitle: string;
    readonly count: (count: number) => string;
    readonly newTemplate: string;
    readonly editTemplate: string;
    readonly duplicateTemplate: string;
    readonly deleteTemplate: string;
    readonly templateName: string;
    readonly templateCategory: string;
    readonly templateDescription: string;
    readonly templateStatus: string;
    readonly templateVersion: string;
    readonly elements: string;
    readonly variables: string;
    readonly preview: string;
    readonly noTemplates: string;
    readonly noTemplatesHint: string;
    readonly searchPlaceholder: string;
    readonly filterByCategory: string;
    readonly filterByStatus: string;
    readonly allCategories: string;
    readonly allStatuses: string;
    readonly lastModified: string;
    readonly createdBy: string;
    readonly actions: string;
    readonly confirmDelete: string;
    readonly confirmDeleteBody: (name: string) => string;
    readonly deleteSuccess: (name: string) => string;
    readonly duplicateSuccess: (name: string) => string;
    readonly saveSuccess: string;
    readonly saveError: string;
    // Element editor
    readonly elementEditor: {
      readonly title: string;
      readonly addElement: string;
      readonly elementType: string;
      readonly elementLabel: string;
      readonly elementContent: string;
      readonly elementPosition: string;
      readonly elementWidth: string;
      readonly elementHeight: string;
      readonly elementFontSize: string;
      readonly elementColor: string;
      readonly elementFontFamily: string;
      readonly elementAlignment: string;
      readonly elementZIndex: string;
      readonly deleteElement: string;
      readonly duplicateElement: string;
      readonly moveUp: string;
      readonly moveDown: string;
      readonly alignLeft: string;
      readonly alignCenter: string;
      readonly alignRight: string;
    };
    // Variable management
    readonly variableEditor: {
      readonly title: string;
      readonly addVariable: string;
      readonly variableName: string;
      readonly variableType: string;
      readonly variableDefaultValue: string;
      readonly variableDescription: string;
      readonly variableRequired: string;
      readonly deleteVariable: string;
      readonly noVariables: string;
      readonly noVariablesHint: string;
    };
  };

  // ── Categories sub-domain ────────────────────────────────────
  readonly categories: {
    readonly pageTitle: string;
    readonly pageSubtitle: string;
    readonly count: (count: number) => string;
    readonly newCategory: string;
    readonly editCategory: string;
    readonly categoryName: string;
    readonly categoryDescription: string;
    readonly categoryParent: string;
    readonly noParent: string;
    readonly categoryTemplates: string;
    readonly noCategories: string;
    readonly noCategoriesHint: string;
    readonly confirmDelete: string;
    readonly confirmDeleteBody: (name: string) => string;
    readonly deleteSuccess: (name: string) => string;
    readonly saveSuccess: string;
    readonly saveError: string;
  };

  // ── Certificate list sub-domain ──────────────────────────────
  readonly list: {
    readonly pageTitle: string;
    readonly pageSubtitle: string;
    readonly count: (count: number) => string;
    readonly newCertificate: string;
    readonly generateCertificates: string;
    readonly certificateId: string;
    readonly recipientName: string;
    readonly templateName: string;
    readonly issueDate: string;
    readonly expiryDate: string;
    readonly status: string;
    readonly actions: string;
    readonly viewDetails: string;
    readonly downloadPdf: string;
    readonly revokeCertificate: string;
    readonly searchPlaceholder: string;
    readonly filterByStatus: string;
    readonly filterByTemplate: string;
    readonly allStatuses: string;
    readonly allTemplates: string;
    readonly noCertificates: string;
    readonly noCertificatesHint: string;
    readonly sortByDate: string;
    readonly sortByName: string;
    readonly sortByStatus: string;
    readonly showingResults: (shown: number, total: number) => string;
    readonly loadMore: string;
    readonly loading: string;
  };

  // ── Generation sub-domain ────────────────────────────────────
  readonly generate: {
    readonly dialogTitle: string;
    readonly dialogSubtitle: string;
    readonly selectTemplate: string;
    readonly selectTemplateHint: string;
    readonly selectRecipients: string;
    readonly selectRecipientsHint: string;
    readonly recipientCount: (count: number) => string;
    readonly issueDate: string;
    readonly expiryDate: string;
    readonly expiryDateOptional: string;
    readonly generateButton: string;
    readonly generating: string;
    readonly success: (count: number) => string;
    readonly error: string;
    readonly noTemplateSelected: string;
    readonly noRecipientsSelected: string;
    readonly summary: string;
    readonly summaryTemplate: string;
    readonly summaryRecipients: string;
    readonly summaryIssueDate: string;
    readonly summaryExpiryDate: string;
    readonly cancel: string;
    readonly close: string;
    readonly previewRecipients: string;
    readonly selectAll: string;
    readonly deselectAll: string;
    readonly searchRecipients: string;
    readonly filterByGrade: string;
    readonly filterByClass: string;
  };

  // ── Detail sub-domain ────────────────────────────────────────
  readonly detail: {
    readonly pageTitle: string;
    readonly certificateTitle: string;
    readonly issuedTo: (recipientName: string) => string;
    readonly templateUsed: string;
    readonly issueDate: string;
    readonly expiryDate: string;
    readonly verificationCode: string;
    readonly verificationUrl: string;
    readonly status: string;
    readonly downloadPdf: string;
    readonly verifyOnline: string;
    readonly revokeButton: string;
    readonly revokeReason: string;
    readonly revokeReasonPlaceholder: string;
    readonly revokeSuccess: string;
    readonly revokedAt: string;
    readonly revokedBy: string;
    readonly createdAt: string;
    readonly updatedAt: string;
    readonly qrCode: string;
    readonly scanToVerify: string;
    readonly certificateId: string;
    readonly recipientDetails: string;
    readonly issuerDetails: string;
  };

  // ── Revoke sub-domain ────────────────────────────────────────
  readonly revoke: {
    readonly dialogTitle: string;
    readonly dialogSubtitle: string;
    readonly reasonLabel: string;
    readonly reasonPlaceholder: string;
    readonly reasonRequired: string;
    readonly confirmButton: string;
    readonly cancelButton: string;
    readonly revoking: string;
    readonly success: (recipientName: string) => string;
    readonly error: string;
    readonly warning: string;
    readonly warningBody: string;
    readonly alreadyRevoked: string;
  };

  // ── Public verification sub-domain ───────────────────────────
  readonly verify: {
    readonly pageTitle: string;
    readonly pageSubtitle: string;
    readonly valid: (recipientName: string, issueDate: string) => string;
    readonly invalid: (code: string) => string;
    readonly revoked: string;
    readonly revokedBody: string;
    readonly expired: string;
    readonly expiredBody: (expiryDate: string) => string;
    readonly notFound: string;
    readonly notFoundBody: string;
    readonly certificateTitle: string;
    readonly issuedTo: string;
    readonly issueDate: string;
    readonly expiryDate: string;
    readonly issuer: string;
    readonly verificationCode: string;
    readonly verifying: string;
    readonly poweredBy: string;
    readonly downloadPdf: string;
    readonly shareCertificate: string;
    readonly scanQrCode: string;
    readonly backToHome: string;
  };

  // ── Error messages ───────────────────────────────────────────
  readonly errors: {
    readonly notFound: (id: string) => string;
    readonly alreadyExists: (title: string) => string;
    readonly validationFailed: string;
    readonly permissionDenied: string;
    readonly templateRequired: string;
    readonly recipientsRequired: string;
    readonly invalidDateRange: string;
    readonly generationFailed: string;
    readonly revocationFailed: string;
    readonly pdfGenerationFailed: string;
    readonly verificationFailed: string;
    readonly networkError: string;
    readonly retry: string;
    readonly unknown: string;
  };

  // ── Permission labels ─────────────────────────────────────────
  readonly permissions: {
    readonly templatesList: string;
    readonly templatesManage: string;
    readonly categoriesManage: string;
    readonly list: string;
    readonly view: string;
    readonly generate: string;
    readonly revoke: string;
    readonly verify: string;
  };

  // ── Knowledge Base (Feature 6) ───────────────────────────────
  readonly knowledgeBase: {
    readonly title: string;
    readonly description: string;
    readonly search: string;
    readonly searchPlaceholder: string;
    readonly noResults: string;
    readonly noResultsHint: string;
    readonly categories: string;
    readonly templates: string;
    readonly guideCount: (count: number) => string;
    readonly popularTemplates: string;
    readonly recentTemplates: string;
    readonly browseAll: string;
    readonly tags: string;
    readonly related: string;
  };

  // ── Progress tracking (Feature 6) ──────────────────────────────
  readonly progress: {
    readonly title: string;
    readonly subtitle: string;
    readonly issued: string;
    readonly pending: string;
    readonly revoked: string;
    readonly expired: string;
    readonly total: string;
    readonly completionRate: string;
    readonly thisMonth: string;
    readonly thisYear: string;
    readonly byCategory: string;
    readonly byMonth: string;
  };
}
```

### 2.2 Key Structure Summary

| Domain | Interface property | Keys count | Pluralization | Interpolation |
|---|---|---|---|---|
| Templates | `templates.*` | ~30 flat + ~20 elementEditor + ~12 variableEditor | `templates.count`, `templates.confirmDeleteBody`, `templates.deleteSuccess`, `templates.duplicateSuccess` | `confirmDeleteBody(name)`, `deleteSuccess(name)`, `duplicateSuccess(name)` |
| Categories | `categories.*` | ~15 | `categories.count`, `categories.confirmDeleteBody` | `confirmDeleteBody(name)`, `deleteSuccess(name)` |
| Certificate list | `list.*` | ~20 | `list.count`, `list.showingResults` | `showingResults(shown, total)` |
| Generation | `generate.*` | ~25 | `generate.success`, `generate.recipientCount` | `success(count)`, `recipientCount(count)` |
| Detail | `detail.*` | ~20 | — | `detail.issuedTo(recipientName)` |
| Revoke | `revoke.*` | ~12 | — | `revoke.success(recipientName)` |
| Verify (public) | `verify.*` | ~20 | — | `verify.valid(recipientName, issueDate)`, `verify.invalid(code)`, `verify.expiredBody(expiryDate)` |
| Errors | `errors.*` | ~15 | — | `errors.notFound(id)`, `errors.alreadyExists(title)` |
| Permissions | `permissions.*` | 8 | — | — |
| Status maps | `status`, `elementTypes`, `variableTypes` | 5 + 5 + 11 | — | — |
| Knowledge Base | `knowledgeBase.*` | ~12 | `knowledgeBase.guideCount` | `guideCount(count)` |
| Progress | `progress.*` | ~12 | — | — |

---

## 3. English Implementation

### 3.1 File: `shared/locale/en/dashboard/certificates/main.ts` (NEW)

**Export**: `dashboardCertificatesEn: CertificateLabels`

### 3.2 English Pluralization Rules

English uses two forms: **one** (count === 1) and **other** (count !== 1):

```typescript
// list.count
count: (count: number) => {
  if (count === 0) return "No certificates";
  if (count === 1) return "1 certificate";
  return `${count} certificates`;
},

// generate.success
success: (count: number) => {
  if (count === 1) return "1 certificate generated successfully";
  return `${count} certificates generated successfully`;
},

// templates.count
count: (count: number) => {
  if (count === 0) return "No templates";
  if (count === 1) return "1 template";
  return `${count} templates`;
},

// categories.count
count: (count: number) => {
  if (count === 0) return "No categories";
  if (count === 1) return "1 category";
  return `${count} categories`;
},
```

### 3.3 English Interpolation

```typescript
// errors.notFound
notFound: (id: string) => `Certificate with ID "${id}" was not found`,

// errors.alreadyExists
alreadyExists: (title: string) => `A certificate with title "${title}" already exists`,

// verify.valid
valid: (recipientName: string, issueDate: string) =>
  `This is a valid certificate issued to "${recipientName}" on ${issueDate}.`,

// verify.invalid
invalid: (code: string) =>
  `Verification code "${code}" is not valid. Please check and try again.`,

// verify.expiredBody
expiredBody: (expiryDate: string) =>
  `This certificate expired on ${expiryDate} and is no longer valid.`,

// detail.issuedTo
issuedTo: (recipientName: string) => `Issued to ${recipientName}`,

// revoke.success
success: (recipientName: string) =>
  `Certificate for "${recipientName}" has been successfully revoked.`,

// templates.confirmDeleteBody
confirmDeleteBody: (name: string) =>
  `This will permanently delete the template "${name}". This action cannot be undone.`,

// templates.deleteSuccess
deleteSuccess: (name: string) => `Template "${name}" has been deleted successfully.`,

// categories.confirmDeleteBody
confirmDeleteBody: (name: string) =>
  `This will permanently delete the category "${name}". Templates in this category will be uncategorized.`,
```

### 3.4 English Status Maps

```typescript
status: {
  DRAFT: "Draft",
  ISSUED: "Issued",
  EXPIRED: "Expired",
  REVOKED: "Revoked",
  ARCHIVED: "Archived",
},

elementTypes: {
  TEXT: "Text",
  IMAGE: "Image",
  QR_CODE: "QR Code",
  SIGNATURE: "Signature",
  SHAPE: "Shape",
},

variableTypes: {
  TEXT: "Text",
  DATE: "Date",
  NUMBER: "Number",
  IMAGE_URL: "Image URL",
  STUDENT_NAME: "Student Name",
  TEACHER_NAME: "Teacher Name",
  ISSUE_DATE: "Issue Date",
  EXPIRY_DATE: "Expiry Date",
  COURSE_NAME: "Course Name",
  GRADE: "Grade",
  CUSTOM: "Custom",
},
```

---

## 4. Arabic Implementation

### 4.1 File: `shared/locale/ar/dashboard/certificates/main.ts` (NEW)

**Export**: `dashboardCertificatesAr: CertificateLabels`

### 4.2 Arabic Pluralization Rules

Arabic uses six forms: **zero** (0), **one** (1), **two** (2), **few** (3–10), **many** (11–99), **other** (100+):

```typescript
// list.count — Arabic pluralization
count: (count: number) => {
  if (count === 0) return "لا توجد شهادات";                    // zero
  if (count === 1) return "شهادة واحدة";                        // one
  if (count === 2) return "شهادتان";                            // two
  if (count >= 3 && count <= 10) return `${count} شهادات`;      // few
  return `${count} شهادة`;                                      // many + other (11+)
},

// generate.success — Arabic pluralization
success: (count: number) => {
  if (count === 0) return "لم يتم إنشاء أي شهادات";
  if (count === 1) return "تم إنشاء شهادة واحدة بنجاح";
  if (count === 2) return "تم إنشاء شهادتين بنجاح";
  if (count >= 3 && count <= 10) return `تم إنشاء ${count} شهادات بنجاح`;
  return `تم إنشاء ${count} شهادة بنجاح`;
},

// templates.count — Arabic pluralization
count: (count: number) => {
  if (count === 0) return "لا توجد قوالب";
  if (count === 1) return "قالب واحد";
  if (count === 2) return "قالبان";
  if (count >= 3 && count <= 10) return `${count} قوالب`;
  return `${count} قالب`;
},

// categories.count — Arabic pluralization
count: (count: number) => {
  if (count === 0) return "لا توجد تصنيفات";
  if (count === 1) return "تصنيف واحد";
  if (count === 2) return "تصنيفان";
  if (count >= 3 && count <= 10) return `${count} تصنيفات`;
  return `${count} تصنيف`;
},

// knowledgeBase.guideCount — Arabic pluralization
guideCount: (count: number) => {
  if (count === 0) return "لا توجد أدلة";
  if (count === 1) return "دليل واحد";
  if (count === 2) return "دليلان";
  if (count >= 3 && count <= 10) return `${count} أدلة`;
  return `${count} دليل`;
},
```

### 4.3 Arabic Interpolation

```typescript
// errors.notFound
notFound: (id: string) => `لم يتم العثور على الشهادة بالمعرف "${id}"`,
```

### 4.4 Arabic Status Maps

```typescript
status: {
  DRAFT: "مسودة",
  ISSUED: "صادر",
  EXPIRED: "منتهي الصلاحية",
  REVOKED: "ملغي",
  ARCHIVED: "مؤرشف",
},

elementTypes: {
  TEXT: "نص",
  IMAGE: "صورة",
  QR_CODE: "رمز QR",
  SIGNATURE: "توقيع",
  SHAPE: "شكل",
},

variableTypes: {
  TEXT: "نص",
  DATE: "تاريخ",
  NUMBER: "رقم",
  IMAGE_URL: "رابط صورة",
  STUDENT_NAME: "اسم الطالب",
  TEACHER_NAME: "اسم المعلم",
  ISSUE_DATE: "تاريخ الإصدار",
  EXPIRY_DATE: "تاريخ الانتهاء",
  COURSE_NAME: "اسم الدورة",
  GRADE: "الدرجة",
  CUSTOM: "مخصص",
},
```

---

## 5. Schema Registration

### 5.1 Update `shared/locale/types/message.ts`

**Add import** (in the existing import block):
```typescript
import type { CertificateLabels } from "@/shared/locale/types/dashboard/certificates/main";
```

**Add to `DashboardTranslations` interface** (alphabetical order, after `certificates` if present, else after `billingSupportedCurrencies`):
```typescript
export interface DashboardTranslations {
  // ... existing entries ...
  billingSupportedCurrencies: SupportedCurrenciesLabels;
  certificates: CertificateLabels;           // ← NEW
  classesMain: ClassesMainLabels;
  // ... rest ...
}
```

### 5.2 Update `shared/locale/en/messages.ts`

**Add import**:
```typescript
import { dashboardCertificatesEn } from "@/shared/locale/en/dashboard/certificates/main";
```

**Add to `dashboardTranslations` object**:
```typescript
export const dashboardMessagesEn = {
  // ... existing entries ...
  certificates: dashboardCertificatesEn,     // ← NEW
  // ... rest ...
};
```

### 5.3 Update `shared/locale/ar/messages.ts`

**Add import**:
```typescript
import { dashboardCertificatesAr } from "@/shared/locale/ar/dashboard/certificates/main";
```

**Add to `dashboardTranslations` object**:
```typescript
export const dashboardMessagesAr = {
  // ... existing entries ...
  certificates: dashboardCertificatesAr,     // ← NEW
  // ... rest ...
};
```

### 5.4 Create `shared/locale/namespaces/dashboard/certificates/main.namespace.ts` (NEW)

```typescript
import { defineNamespace } from "@/shared/locale/namespaces/define-namespace";
import type { CertificateLabels } from "@/shared/locale/types/dashboard/certificates/main";

export const DashboardCertificates = defineNamespace<CertificateLabels>("dashboard.certificates.main", {
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
});
```

### 5.5 Update `shared/locale/namespaces/translation.ts`

**Add import**:
```typescript
import { DashboardCertificates } from "@/shared/locale/namespaces/dashboard/certificates/main.namespace";
```

**Add to `Translation.Dashboard` object** (alphabetical order):
```typescript
export const Translation = {
  // ...
  Dashboard: {
    // ...
    Certificates: DashboardCertificates,    // ← NEW
    // ...
  },
  // ...
} as const;
```

### 5.6 Update `shared/locale/index.ts`

The barrel exports `* from "./types"` and `* from "./types/index"`. The `CertificateLabels` type export will flow through the `types/` barrel. Verify that `shared/locale/types/index.ts` re-exports the type, or add explicit export:

```typescript
// In shared/locale/types/index.ts, add:
export * from "./dashboard/certificates/main";
```

---

## 6. Navigation Integration

### 6.1 Navigation Label Keys

**File**: `shared/locale/types/dashboard/core/nav.ts`

Add to `DashboardNavigationLabels` interface:
```typescript
export interface DashboardNavigationLabels {
  // ... existing keys ...
  readonly certificates: string;
  readonly certificateTemplates: string;
  readonly certificateCategories: string;
  readonly navGroupCertificates: string;
  // ... rest ...
}
```

### 6.2 English Nav Labels

**File**: `shared/locale/en/dashboard/core/nav.ts`

Add to `dashboardCoreNavEn` object:
```typescript
certificates: "Certificates",
certificateTemplates: "Templates",
certificateCategories: "Categories",
navGroupCertificates: "Certificates",
```

### 6.3 Arabic Nav Labels

**File**: `shared/locale/ar/dashboard/core/nav.ts`

Add to `dashboardCoreNavAr` object:
```typescript
certificates: "الشهادات",
certificateTemplates: "القوالب",
certificateCategories: "التصنيفات",
navGroupCertificates: "الشهادات",
```

### 6.4 Icon Keys

**File**: `frontend/common/views/dashboard/config/navIconKeys.ts`

Add to `NavIconKey` union:
```typescript
export type NavIconKey =
  | "accountBalanceWallet"
  // ... existing ...
  | "verified"              // ← NEW — for "Certificates" item
  | "workspacePremium"     // ← NEW — for "Certificates" group header
  | "assignment";           // ← NEW — for "Templates" item
  // Note: "category" already exists in the union
```

### 6.5 Icon Registry

**File**: `frontend/common/views/dashboard/config/navIconRegistry.tsx`

Add to `ICON_LOADERS` object:
```typescript
const ICON_LOADERS: Record<NavIconKey, () => Promise<IconModule>> = {
  // ... existing ...
  assignment: () => import("@mui/icons-material/AssignmentOutlined"),
  category: () => import("@mui/icons-material/CategoryOutlined"),    // already exists
  verified: () => import("@mui/icons-material/VerifiedOutlined"),
  workspacePremium: () => import("@mui/icons-material/WorkspacePremiumOutlined"),
};
```

### 6.6 Sidebar Navigation Group

**File**: `frontend/common/views/dashboard/config/navigationConfig.ts`

Add `grp_certificates` to `SIDEBAR_NAV_GROUPS` — placed after `grp_content` and before `grp_finance`:

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

> **Placement**: The group is inserted between `grp_content` and `grp_finance`. This keeps certificate-related features adjacent to other content management features.

### 6.7 Sidebar Navigation Items

Add three `NavItem` entries to `SIDEBAR_NAV_ITEMS` in `navigationConfig.ts`:

```typescript
// Certificate Templates — admin/academy_admin only
{
  key: "certificate-templates",
  labelKey: "certificateTemplates",
  iconKey: "assignment",
  href: "/dashboard/certificates/templates",
  section: "main",
  permission: PAGE_PERMISSIONS.certificateTemplates,
  groupId: "grp_certificates",
},

// Certificate Categories — admin/academy_admin only
{
  key: "certificate-categories",
  labelKey: "certificateCategories",
  iconKey: "category",
  href: "/dashboard/certificates/categories",
  section: "main",
  permission: PAGE_PERMISSIONS.certificateCategories,
  groupId: "grp_certificates",
},

// Certificates List — all authenticated roles (scope filtered by service layer)
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

### 6.8 Page Permissions

**File**: `frontend/common/types/page-permissions.types.ts`

Add to `PAGE_PERMISSIONS` object:

```typescript
export const PAGE_PERMISSIONS = {
  // ... existing entries ...
  certificatesList: [AppPermission.CertificatesList] as PagePermissions,
  certificateTemplates: [AppPermission.CertificatesManageTemplate] as PagePermissions,
  certificateCategories: [AppPermission.CertificatesManageTemplate] as PagePermissions,
  certificateDetail: [AppPermission.CertificatesView] as PagePermissions,
  // ... rest ...
} as const;
```

---

## 7. Permission Matrix

### 7.1 Route × Role Matrix

| Route | Required Permission | super_admin | academy_admin | teacher | student | parent | supervisor |
|---|---|---|---|---|---|---|---|
| `/dashboard/certificates` | `CERTIFICATES_LIST` | ✅ Full | ✅ Full | ✅ Own students | ✅ Own | ✅ Own children | ✅ View |
| `/dashboard/certificates/templates` | `CERTIFICATES_MANAGE_TEMPLATE` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| `/dashboard/certificates/categories` | `CERTIFICATES_MANAGE_TEMPLATE` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| `/dashboard/certificates/[id]` | `CERTIFICATES_VIEW` | ✅ Full | ✅ Full | ✅ Own students | ✅ Own | ✅ Own children | ✅ View |
| `/verify/[code]` | (public — no permission) | ✅ Public | ✅ Public | ✅ Public | ✅ Public | ✅ Public | ✅ Public |

> **Full** = all certificates in the academy. **Own students** = only certificates for students assigned to this teacher. **Own** = student's own certificates. **Own children** = parent's children certificates. Data-level filtering is enforced by the service layer (Plan 04); UI-level visibility is governed by `AppPermission` checks.

### 7.2 Permission → Nav Item Visibility

| Nav Item | Permission Gate | super_admin | academy_admin | teacher | student | parent | supervisor |
|---|---|---|---|---|---|---|---|
| Certificates group | `CERTIFICATES_LIST` OR `CERTIFICATES_MANAGE_TEMPLATE` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Templates item | `CERTIFICATES_MANAGE_TEMPLATE` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Categories item | `CERTIFICATES_MANAGE_TEMPLATE` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Certificates item | `CERTIFICATES_LIST` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

> **Super admin bypass**: `isSuperAdmin: true` bypasses all `AppPermission` checks — all items visible regardless.
> **Group survival**: `getNavItemsForPermissions` drops the group if none of its child items survive the permission check.

### 7.3 Permission Labels (Translation Keys)

| Permission enum value | Translation key | English | Arabic |
|---|---|---|---|
| `CERTIFICATES_LIST` | `permissions.list` | "View Certificates List" | "عرض قائمة الشهادات" |
| `CERTIFICATES_MANAGE_TEMPLATE` | `permissions.templatesManage` | "Manage Templates" | "إدارة القوالب" |
| `CERTIFICATES_VIEW` | `permissions.view` | "View Certificate Details" | "عرض تفاصيل الشهادة" |
| `CERTIFICATES_GENERATE` | `permissions.generate` | "Generate Certificates" | "إنشاء الشهادات" |
| `CERTIFICATES_REVOKE` | `permissions.revoke` | "Revoke Certificates" | "إلغاء الشهادات" |
| `CERTIFICATES_VERIFY` | `permissions.verify` | "Verify Certificates" | "التحقق من الشهادات" |

---

## 8. UX / Navigation Specification

### 8.1 Full Route Table

| Route | Layout | Auth | Permission | Server Guard | Translation Namespace |
|---|---|---|---|---|---|
| `/dashboard/certificates` | `(dashboard)` layout | Required | `CERTIFICATES_LIST` | `requirePermissionForPage(userId, [CertificatesList], locale, "certificates")` | `certificates.list.*` |
| `/dashboard/certificates/templates` | `(dashboard)` layout | Required | `CERTIFICATES_MANAGE_TEMPLATE` | `requirePermissionForPage(userId, [CertificatesManageTemplate], locale, "certificate-templates")` | `certificates.templates.*` |
| `/dashboard/certificates/categories` | `(dashboard)` layout | Required | `CERTIFICATES_MANAGE_TEMPLATE` | `requirePermissionForPage(userId, [CertificatesManageTemplate], locale, "certificate-categories")` | `certificates.categories.*` |
| `/dashboard/certificates/[id]` | `(dashboard)` layout | Required | `CERTIFICATES_VIEW` | `requirePermissionForPage(userId, [CertificatesView], locale, "certificate-detail")` | `certificates.detail.*` |
| `/verify/[code]` | Standalone (no layout) | Public (no auth) | None | None | `certificates.verify.*` |

### 8.2 Sidebar Placement

```
┌─────────────────────────────────────────────┐
│  Sidebar                                     │
│                                              │
│  [grp_home]   Home / Schedule / Tracking      │
│  [grp_content] Resources / Subjects           │
│  ──────────── separator ─────────────────     │
│  [grp_certificates]  ← NEW                    │
│    ├ Certificate Templates  (admin only)      │
│    ├ Certificate Categories  (admin only)      │
│    └ Certificates           (all roles)        │
│  ──────────── separator ─────────────────     │
│  [grp_finance]  Billing / Payments             │
│  [grp_reports]  Reports / Monthly              │
│  [grp_feedback] Complaints / Suggestions       │
│  [grp_admin]    Permissions / Settings         │
│                                              │
│  [footer_account]  Your Profile / Logout      │
└─────────────────────────────────────────────┘
```

### 8.3 Mobile Navigation

| Platform | Pattern | Certificate Items | Notes |
|---|---|---|---|
| Mobile bottom nav | Limited slots (~5) | "Certificates" item only | Prioritized over sub-items; templates/categories available via hamburger |
| Mobile hamburger menu | Full sidebar tree | All 3 items under "Certificates" group header | Same permission gates; collapsible group |

**Mobile Bottom Nav Changes**:
- Add `certificates` key to bottom nav item list
- Gate with `PAGE_PERMISSIONS.certificatesList`
- Use same `labelKey: "certificates"` and `iconKey: "verified"`
- 5th slot priority: `dashboard` → `schedule` → `certificates` → `billing` → `settings` (or similar)

### 8.4 Server-Side Translation Access Pattern

```typescript
// Server Page Component (app/(dashboard)/certificates/page.tsx)
import { getTranslations } from "@/shared/locale/server";

export async function generateMetadata({ params }) {
  const locale = await getLocale();  // from NEXT_LOCALE cookie
  const t = getTranslations(locale);
  return {
    title: t.dashboardTranslations.certificates.list.pageTitle,
  };
}

export default async function CertificatesPage() {
  const { userId, locale } = await getServerUserContext();
  await requirePermissionForPage(userId, PAGE_PERMISSIONS.certificatesList, locale, "certificates");

  const t = getTranslations(locale);
  const labels = t.dashboardTranslations.certificates;  // ← pass to client container

  return <CertificatesContainer labels={labels} />;
}
```

### 8.5 Client-Side Translation Access Pattern

```typescript
// Client Container / ViewModel
import { useAppTranslation, Translation } from "@/shared/locale";

function CertificatesContainer({ labels: serverLabels }: { labels: CertificateLabels }) {
  // Prefer server-passed labels for SSR; fallback to client hook for client-side navigation
  const { t } = useAppTranslation(Translation.Dashboard.Certificates);
  const labels = serverLabels ?? t;

  // Pass labels to tier views via props (labels pass-down pattern)
  return <CertificatesListView labels={labels.list} />;
}
```

### 8.6 GraphQL Resolver Access Pattern

```typescript
// In a Pothos resolver
builder.mutationField("generateCertificates", (t) =>
  t.field({
    type: GenerateCertificatesResult,
    args: { input: GenerateCertificatesInputArg },
    resolve: async (root, { input }, ctx) => {
      // ... business logic ...

      if (!template) {
        throw new GraphQLError(ctx.t().dashboardTranslations.certificates.errors.notFound(input.templateId));
      }

      return {
        success: true,
        message: ctx.t().dashboardTranslations.certificates.generate.success(resultCount),
      };
    },
  }),
);
```

---

## 9. Public Verification Route

### 9.1 Route Registration

`app/verify/[code]/page.tsx` — **outside** the `(dashboard)` route group:

```
app/
├── (dashboard)/
│   ├── dashboard/page.tsx
│   ├── certificates/
│   │   ├── page.tsx              ← list
│   │   ├── templates/page.tsx    ← template management
│   │   ├── categories/page.tsx   ← category management
│   │   └── [id]/page.tsx          ← certificate detail
│   └── ...
└── verify/
    └── [code]/
        └── page.tsx               ← PUBLIC verification page (no auth, no dashboard layout)
```

### 9.2 Verification Page Design

- **No auth**: Renders without `getServerUserContext()` or `requirePermissionForPage()`.
- **Locale**: Read from `NEXT_LOCALE` cookie (same as all other routes).
- **Metadata**: `generateMetadata()` uses `certificates.verify.pageTitle`.
- **Layout**: Standalone — no sidebar, no bottom nav, no account footer.
- **Content**: Certificate details (title, recipient, issue date, issuer) or an error card for invalid/expired/revoked codes.
- **Translation access**: `getTranslations(locale).dashboardTranslations.certificates.verify.*`
- **Directions**: Follows `dir="rtl"` from root `<html>` (Arabic) or LTR (English).

---

## 10. Outcome & Knowledge Transfer Protocol

### 10.1 Knowledge Captured by This Plan

| Knowledge Area | Artifact | Location |
|---|---|---|
| i18n namespace registration pattern (7 steps) | This design doc §1.2 | `design.md` |
| Translation interface structure for certificates | `CertificateLabels` interface | `types/dashboard/certificates/main.ts` |
| English pluralization rules (one/other) | This design doc §3.2 | `design.md` |
| Arabic pluralization rules (zero/one/two/few/many/other) | This design doc §4.2 | `design.md` |
| Interpolation patterns (typed functions) | This design doc §3.3, §4.3 | `design.md` |
| Navigation group + item registration pattern | This design doc §6.6, §6.7 | `design.md` |
| Permission → nav visibility mapping | This design doc §7.2 | `design.md` |
| Server vs client vs GraphQL translation access | This design doc §8.4–§8.6 | `design.md` |
| Public route (outside dashboard layout) pattern | This design doc §9 | `design.md` |

### 10.2 Knowledge Propagation Targets

After implementation, update these files to register the new certificate namespace and navigation patterns:

| Target | Update Required |
|---|---|
| `shared/AGENTS.md` | Add `certificates` to the list of dashboard namespaces in the i18n section |
| `shared/locale/types/index.ts` | Add `export * from "./dashboard/certificates/main"` |
| `shared/locale/namespaces/translation.ts` | Add `Certificates: DashboardCertificates` to `Translation.Dashboard` |
| Any existing i18n documentation | Add certificate namespace reference |

### 10.3 Pattern Reuse for Future Features

The patterns documented here serve as a template for any future dashboard feature requiring:
1. **New i18n namespace**: Follow the 7-step registration in §1.2, the `*Labels` interface pattern in §2.1, and the namespace definition in §5.4.
2. **New navigation group**: Follow the `NavGroup` + `NavItem` registration in §6.6 and §6.7.
3. **New public-facing route**: Follow the standalone route pattern in §9 (outside `(dashboard)` group).
4. **Permission-gated navigation**: Follow the `PAGE_PERMISSIONS` + nav item `permission` pattern in §6.8 and §7.2.

### 10.4 Cross-Plan Knowledge Dependencies

| Dependency | Consumed From | Consumed By |
|---|---|---|
| `CertificateLabels` type | This plan (Plan 09) → `types/dashboard/certificates/main.ts` | Plans 07 (Template UI), 08 (Certificate UI) — import for component props |
| `dashboardCertificatesEn`/`Ar` | This plan → `en/ar/dashboard/certificates/main.ts` | Plans 07, 08 — use as default label source for Storybook mock stores |
| `PAGE_PERMISSIONS.certificates*` | This plan → `page-permissions.types.ts` | Plans 07, 08 — use for server-side `requirePermissionForPage()` + client `<RequirePermission>` |
| Nav group `grp_certificates` | This plan → `navigationConfig.ts` | Sidebar component (existing) — auto-consumed |
| `Translation.Dashboard.Certificates` | This plan → `namespaces/translation.ts` | Plans 07, 08 — use for `useAppTranslation()` client-side hook |

---

## 11. Constraints & Gotchas

### 11.1 i18n Constraints

1. **No `next-intl`**: The legacy `next-intl` package has been fully removed. Do NOT import from it.
2. **No `shared/messages/`**: The directory no longer exists. All translations live in `shared/locale/`.
3. **All `readonly`**: Every property in `CertificateLabels` must be `readonly`.
4. **No hardcoded strings**: All user-facing strings must flow through the translation namespace.
5. **No `console.*`**: Use `logger` from `@/backend/lib` (backend) or `@/frontend/utils/logger` (frontend).
6. **Path aliases**: All imports MUST use `@/shared/locale/...` (never relative paths from outside `shared/locale/`).

### 11.2 Navigation Constraints

1. **No `[locale]` URL segment**: Certificate routes live at `/dashboard/certificates` (no locale prefix). Locale is read from the `NEXT_LOCALE` cookie.
2. **`AppPermission` import**: Frontend code MUST use `AppPermission` from `@/frontend/common/graphql/generated/gql/graphql-types` (not from `@/backend/enum`).
3. **OR-semantics**: Nav item `permission` field uses OR-semantics — user needs ANY of the listed permissions.
4. **Group survival**: A group survives in the sidebar only if at least one child item's permission check passes.
5. **Super admin bypass**: `isSuperAdmin: true` bypasses all permission checks — all items visible.
6. **No existing keys renamed**: Only add new keys. Never modify/rename existing nav labels or permission entries.

### 11.3 Arabic RTL Constraints

1. **Root `dir`**: Set by `<html>` — do NOT override on certificate components.
2. **Natural Arabic**: Strings should be natural Arabic, not machine-translated.
3. **Bidirectional text**: Interpolated values (e.g., recipient names in English) will render LTR within RTL Arabic text — this is expected and handled by the browser's bidi algorithm.
4. **Pluralization accuracy**: Arabic pluralization MUST follow the six-form rules (zero/one/two/few/many/other) — do NOT use English-style `count === 1 ? "one" : "many"` for Arabic.

---

## 12. File Inventory

### 12.1 Files to Create (NEW)

| # | File | Purpose |
|---|---|---|
| 1 | `shared/locale/types/dashboard/certificates/main.ts` | `CertificateLabels` interface |
| 2 | `shared/locale/en/dashboard/certificates/main.ts` | English translations (`dashboardCertificatesEn`) |
| 3 | `shared/locale/ar/dashboard/certificates/main.ts` | Arabic translations (`dashboardCertificatesAr`) |
| 4 | `shared/locale/namespaces/dashboard/certificates/main.namespace.ts` | Client-side lazy-loading namespace (`DashboardCertificates`) |

### 12.2 Files to Update (MODIFY)

| # | File | Changes |
|---|---|---|
| 1 | `shared/locale/types/message.ts` | Import `CertificateLabels` + add to `DashboardTranslations` |
| 2 | `shared/locale/en/messages.ts` | Import `dashboardCertificatesEn` + add to dashboard object |
| 3 | `shared/locale/ar/messages.ts` | Import `dashboardCertificatesAr` + add to dashboard object |
| 4 | `shared/locale/namespaces/translation.ts` | Import + register `DashboardCertificates` in `Translation.Dashboard` |
| 5 | `shared/locale/types/index.ts` | Re-export `./dashboard/certificates/main` |
| 6 | `shared/locale/types/dashboard/core/nav.ts` | Add 4 nav label keys to `DashboardNavigationLabels` |
| 7 | `shared/locale/en/dashboard/core/nav.ts` | Add 4 English strings |
| 8 | `shared/locale/ar/dashboard/core/nav.ts` | Add 4 Arabic strings |
| 9 | `frontend/common/views/dashboard/config/navIconKeys.ts` | Add `"assignment"`, `"verified"`, `"workspacePremium"` |
| 10 | `frontend/common/views/dashboard/config/navIconRegistry.tsx` | Add 3 lazy icon loaders |
| 11 | `frontend/common/views/dashboard/config/navigationConfig.ts` | Add `grp_certificates` group + 3 nav items |
| 12 | `frontend/common/types/page-permissions.types.ts` | Add `certificatesList`, `certificateTemplates`, `certificateCategories`, `certificateDetail` |

### 12.3 Files Updated for Knowledge Propagation

| # | File | Changes |
|---|---|---|
| 1 | `shared/AGENTS.md` | Add `certificates` to the listed dashboard namespaces |
| 2 | `frontend/AGENTS.md` | (If listed) Add certificate nav group to navigation reference |

---

## 13. Traceability

| Requirement IDs | Design Section |
|---|---|
| REQ-I18N-001–004 | §2.1 — CertificateLabels interface |
| REQ-I18N-005–007 | §3 — English implementation |
| REQ-I18N-008–010 | §4 — Arabic implementation |
| REQ-I18N-011–013 | §5 — Schema registration |
| REQ-I18N-014–015 | §6.1–6.5 — Navigation labels + icons |
| REQ-I18N-016–019 | §6.6–6.8 — Sidebar nav config + permissions |
| REQ-I18N-020–021 | §8.3 — Mobile navigation |
| REQ-I18N-022–023 | §9 — Public verification route |
| REQ-I18N-024–028 | §7, §6.8 — Permission matrix + PAGE_PERMISSIONS |
| REQ-I18N-029–031 | §2.1 (knowledgeBase, progress) — Feature 6 |
| REQ-I18N-032–034 | §8.1, §9 — Route registration + metadata |
| REQ-I18N-035–037 | §8.4–8.6 — Server/client/GraphQL access |
| NFR-01 | Compile-time safety — inherent in TypeScript interface |
| NFR-02 | No hardcoded strings — §11.1 constraint #4 |
| NFR-03 | RTL compliance — §11.3 constraints |
| NFR-04 | Performance — lazy-loading namespace pattern |
| NFR-05 | Backward compatibility — §11.2 constraint #6 |
