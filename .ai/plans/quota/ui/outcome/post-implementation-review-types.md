# Post-Implementation Review — Types & i18n Files

**Date**: 2026-08-17
**Scope**: Type definitions and i18n implementation files introduced/modified by the Quota UI Production-Readiness Plan.
**Baseline**: `phase0-baseline-outcome.md` (tsgo: 0 errors, oxlint: 1 pre-existing warning, clean working tree)

## Review Methodology

For each file in scope:
1. Read the type file and corresponding EN/AR implementation files.
2. Extracted all keys from type definitions and compared against EN/AR implementations programmatically.
3. Checked Arabic CLDR plural rules (0→1→2→3-10→else pattern).
4. Verified import path consistency (`@/` aliases, shared layer isolation).
5. Checked for duplicate type definitions across files.
6. Ran `bun tsgo` (type check) and file-scoped `lint-service.ts` on all 18 files.

## Verification Results

| Check | Result |
|-------|--------|
| `bun tsgo` (full repo) | ✅ 0 errors |
| `lint-service.ts` (all 18 scoped files) | ✅ 0 errors |
| Type↔EN↔AR key alignment (QuotaLabels) | ✅ All keys present in both locales |
| Type↔EN↔AR key alignment (StudentQuotaLabels) | ✅ All keys present in both locales |
| Type↔EN↔AR key alignment (TeacherCreateRecurringClassLabels) | ✅ All 5 new keys present in both locales |
| Type↔EN↔AR key alignment (DashboardNavigationLabels) | ✅ Removed keys (quotasView/quotasEdit) gone from all 3 |
| Type↔EN↔AR key alignment (BillingLabels) | ✅ New `quotasLink` present in all 3 |
| Arabic CLDR plurals | ✅ All new AR plural functions follow 0→1→2→3-10→else pattern |
| Shared layer isolation | ✅ No `@/frontend`, `@/backend`, or `@/app` imports in shared files |
| Enum value imports used in runtime | ✅ `quotaForm.types.ts` imports `QuotaKind`/`QuotaPeriodType` as value imports (used in `Object.values()` and runtime comparisons) |

## Detailed Findings

### 1. Type Consistency — PASS

**QuotaLabels (`shared/locale/types/dashboard/billing/quota.ts`)**:
- 22 new keys added to the type interface (validFrom, periodDays, periodDaysHelperText, periodDaysRequired, validUntilAfterValidFrom, studentPickerPlaceholder, studentPickerNoOptions, studentPickerLoading, PENDING status, view/filter/addQuota actions, deleteConfirm block, deleteFailed, quotaCount, ledgerCount, deleteSuccess, notFound*, errorGeneric*, retry, restrictedAccessHelperText, emptyList*, insights*, exportSuccess, emptyInsightsMessage).
- All 22 new keys have implementations in both `quotaEn` and `quotaAr`.
- No missing or extra keys in either locale.

**StudentQuotaLabels (`shared/locale/types/dashboard/students/quota.ts`)**:
- 44 new keys added to the `audience` sub-interface (noQuotaAssigned through ledgerReasons) plus top-level `quotaCount`.
- All new keys have implementations in both `dashboardStudentQuotaEn` and `dashboardStudentQuotaAr`.
- No missing or extra keys in either locale.

**TeacherCreateRecurringClassLabels (`shared/locale/types/dashboard/teachers/createRecurringClass.ts`)**:
- 5 new scheduling keys added (quotaSelect, quotaPlaceholder, noOpenQuotas, noOpenQuotasCta, quotaOptionLabel).
- All 5 present in both EN and AR implementations.

**BillingLabels (`shared/locale/types/dashboard/billing/main.ts`)**:
- 1 new key: `quotasLink`. Present in all 3 (type, EN, AR).

**DashboardNavigationLabels (`shared/locale/types/dashboard/core/nav.ts`)**:
- 2 keys removed: `quotasView`, `quotasEdit`. Cleanly removed from type, EN, and AR.
- No new keys added — remaining keys unchanged.

### 2. Arabic CLDR Plurals — PASS

**`shared/locale/ar/dashboard/billing/quota.ts`**:
- 5 new plural functions: `activeQuotasCount`, `totalClassesRemaining`, `expiringThisWeekCount`, `quotaCount`, `ledgerCount`.
- All follow correct CLDR pattern: `0 → 1 → 2 → 3-10 → else`.
- Pre-existing AR plurals (`activeQuotasCount`, `totalClassesRemaining`, `expiringThisWeekCount`) were **upgraded** from simple ternary (`count === 1 ? ... : ...`) to full CLDR 5-branch — an improvement.

**`shared/locale/ar/dashboard/students/quota.ts`**:
- `quotaCount`: correct CLDR 0→1→2→3-10→else.
- `audience.expiryWarning`: correct CLDR 0→1→2→3-10→else (dual form "يومين" for days===2).

**English plural functions** (`quotaCount`, `ledgerCount`, etc.):
- Use simple `count === 1 ? "1 X" : "${count} Xs"` pattern — correct for English (only "one"/"other" plural forms).

### 3. Canonical Naming — PASS (N/A for locale types)

The locale type files (`*Labels`) follow the project's established naming convention for i18n label interfaces. The `{Entity}SelectType`/`{Entity}InsertType` pattern applies to `backend/types/` entity types, not to locale label interfaces — no issues here.

### 4. No Duplicate Type Definitions — PASS

- `StudentQuotaLabels.audience.statuses` has keys `{ACTIVE, EXPIRED, ARCHIVED}` (3 statuses — no `PENDING`).
- `QuotaLabels.statuses` has keys `{ACTIVE, EXPIRED, ARCHIVED, PENDING}` (4 statuses).
- This is an intentional difference: the student-facing audience view doesn't expose the `PENDING` status, while the admin-facing quota management does. Not a duplication issue.

- `quotaCount` is defined in both `QuotaLabels` and `StudentQuotaLabels` independently. These are separate interfaces for separate namespaces — each defining its own `quotaCount` is expected, not a duplication.

### 5. Import Path Consistency — PASS

All imports use `@/` path aliases:
- Shared type files import only from `@/shared/...` (e.g., `@/shared/locale/types/...`, `@/shared/types/billing-view`).
- Frontend type files import from `@/shared/...`, `@/backend/...`, and `@/frontend/...` — all within allowed layers for frontend code.
- `quotaFormAccessContext.types.ts` imports `QuotaLabels` from `@/shared/locale/types/dashboard/billing/quota` — correct.

### 6. Enum Value vs Type Imports — PASS

`frontend/common/views/dashboard/billing/quota/types/quotaForm.types.ts`:
- `import { QuotaKind as BackendQuotaKind, QuotaPeriodType as BackendQuotaPeriodType } from "@/backend/enum"` — **value import** (correct: used in `Object.values()` runtime expressions and type guard `isBackendQuotaKindValue`).
- `import type { QuotaReturnType, QuotaSubmitInput } from "@/backend/types"` — **type-only import** (correct: only used in type annotations).
- `import { QuotaKind, QuotaPeriodType } from "@/frontend/common/graphql/generated/gql/graphql-types"` — **value import** (correct: used in `Object.values()` and `QuotaKind.Package` runtime expression).

`frontend/common/types/page-permissions.types.ts`:
- `import { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql-types"` — **value import** (correct: `AppPermission.DashboardView` etc. are runtime values in the `PAGE_PERMISSIONS` object).

### 7. Shared Layer Isolation — PASS

Checked all 5 shared locale type files and all shared locale implementation files:
- **Type files** (`shared/locale/types/...`): Only import from `@/shared/...` — no violations.
- **EN/AR implementation files** (`shared/locale/en/...`, `shared/locale/ar/...`): Only import type labels from `@/shared/locale/types/...` — no `@/frontend`, `@/backend`, or `@/app` imports.

### 8. No Hardcoded Strings — PASS

All new Arabic entries use Arabic text (no hardcoded English strings). All new English entries use English text. No locale file contains untranslated strings from the other locale.

### 9. Frontend Type Files — PASS

**`page-permissions.types.ts`**: 2 removed entries (`quotasView`, `quotasEdit`) — cleanly removed, remaining entries intact. No new entries added.

**`quotaFormAccessContext.types.ts`** (new file): Defines `QuotaFormFieldAccess` and `QuotaFormAccessContextValue` interfaces. Imports `QuotaLabels` type-only from shared. Clean.

**`quotaForm.types.ts`** (new file): Defines `BillingQuotaFormState`, `BillingQuotaFormProps`, type guards, and mapping functions. Uses value imports for enums (needed for `Object.values()` runtime checks) and type imports for service types. Clean.

## Pre-Existing Issues (Filtered Out)

| Issue | Location | Status |
|-------|----------|--------|
| `timeOverride.label` in AR ignores `day` parameter (`_day => "وقت مخصص"`) | `ar/dashboard/teachers/createRecurringClass.ts` | Pre-existing, not in diff. Filtered out. |
| oxlint warning count = 1 | (per baseline) | Pre-existing. Filtered out. |

## Summary

**0 issues found** in the types and i18n files introduced/modified by the Quota UI Production-Readiness Plan.

All 18 files pass:
- Type check (`bun tsgo`): 0 errors
- Lint (file-scoped `lint-service.ts`): 0 errors
- Type↔EN↔AR key alignment: complete
- Arabic CLDR plurals: correct 5-branch pattern
- Import path aliases: `@/` throughout
- Enum imports: value imports for runtime, type imports for annotations
- Shared layer isolation: no violations
- No hardcoded strings or duplicate type definitions
