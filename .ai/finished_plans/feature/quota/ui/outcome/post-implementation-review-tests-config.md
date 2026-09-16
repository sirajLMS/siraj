# Post-Implementation Review — Tests & Config

**Scope**: Test files, app router files, config files, Storybook files
**Reviewer**: Copilot CLI (autopilot)
**Date**: 2025-07-18
**Baseline**: `.ai/plans/quota/ui/outcome/phase0-baseline-outcome.md`

## Summary

The Quota UI test and config files are **production-ready**. The implementation follows existing conventions well: E2E tests use `waitFor({ state: "attached" })` instead of `waitForTimeout`/`networkidle`, component tests use `TestWrapper` with Apollo `MockedProvider`, `mockNextNavigation` helper is reused across all component tests, and the shared `mockQuotaLabels.ts` reduces duplication for billing quota tests. App router files correctly use `getTranslations` for server components and `useAppTranslation` for the client error boundary. All i18n keys exist in both `en` and `ar` locale files. Navigation config uses `labelKey` (no hardcoded labels) and correct `PAGE_PERMISSIONS` entries.

**No ERROR-level issues found.**

A few INFO-level observations and one WARN (duplication) are documented below.

---

## Findings

### Test Files

#### `test/ui/e2e/quota.test.ts`

- **[INFO]** quota.test.ts:288,345 — Two `test.skip()` tests both have clear comments explaining why and when to re-enable. ✅
- **[PASS]** No `waitForTimeout` or `networkidle` anywhere in the file. Uses `waitFor({ state: "attached" })` pattern consistently.
- **[PASS]** Bilingual assertions use `/English|العربية/i` regex patterns (e.g. `/Quota|الحصة/i`, `/Quotas|الحصص/i`).
- **[PASS]** Uses `setupBrowserLifecycle()` at module scope and `describe.serial` — follows existing E2E conventions.
- **[PASS]** Uses `loginAsDemoUser` and `DEMO_USERS` from shared helpers.
- **[PASS]** No `console.*` calls.

#### `test/ui/components/quota/mockQuotaLabels.ts`

- **[PASS]** Shared factory `createMockQuotaLabels()` correctly used by 6 of 10 component test files (QuotaInsightsContainer, QuotaFormContainer, QuotaDetailContainer, QuotaContainer.desktop, QuotaContainer.mobile, QuotaContainer.base if exists). Good duplication elimination pattern.

#### `test/ui/components/quota/SupervisorQuotaView.test.tsx`

- **[WARN]** SupervisorQuotaView.test.tsx:120,126 — Uses string literals `"PACKAGE"` and `"ACTIVE"` for `kind` and `status` fields instead of enum values (`QuotaKind.Package`, `QuotaStatus.Active`). Other test files in the codebase typically use enum imports for type safety. This is a consistency issue, not a functional bug — the mock object is untyped so strings work at runtime.
- **[INFO]** SupervisorQuotaView.test.tsx:12-113 — Duplicates the full `StudentQuotaLabels` object inline (~100 lines) instead of importing from a shared helper. This same object is duplicated across all 4 audience test files (Supervisor, Teacher, Parent, Student). Consider extracting a `createMockStudentQuotaLabels()` helper similar to `mockQuotaLabels.ts` to reduce duplication.

#### `test/ui/components/quota/QuotaInsightsContainer.test.tsx`

- **[PASS]** Line 163: `test.skip("renders filter buttons...")` has clear comment explaining the skip reason.
- **[PASS]** Uses `mock.module()` for ViewModel, logger, and `next/link` mocking.
- **[PASS]** Uses `mockNextNavigation` from shared helpers.
- **[PASS]** Uses `createMockQuotaLabels()` shared helper.

#### `test/ui/components/quota/QuotaFormContainer.test.tsx`

- **[PASS]** Uses shared `createMockQuotaLabels()` helper.
- **[PASS]** Properly mocks `react-hook-form` and desktop form section component.
- **[PASS]** Uses `mockNextNavigation` from shared helpers.

#### `test/ui/components/quota/QuotaDetailContainer.test.tsx`

- **[PASS]** Uses shared `createMockQuotaLabels()` helper.
- **[PASS]** Properly mocks ViewModel and logger.
- **[PASS]** Uses `mockNextNavigation` from shared helpers.

#### `test/ui/components/quota/QuotaContainer.desktop.test.tsx` & `QuotaContainer.mobile.test.tsx`

- **[PASS]** Both use shared `createMockQuotaLabels()` helper.
- **[PASS]** Both use `mockNextNavigation` and `mock.module()` for ViewModel/logger.
- **[PASS]** Desktop test mocks the desktop view component; mobile test mocks the mobile view component via `useViewport`.

#### `test/ui/components/quota/TeacherQuotaView.test.tsx`

- **[INFO]** TeacherQuotaView.test.tsx — Duplicates `StudentQuotaLabels` inline instead of using shared helper (same as SupervisorQuotaView).

#### `test/ui/components/quota/ParentQuotaView.test.tsx`

- **[PASS]** Line 215: `test.skip("renders child tabs...")` has clear comment explaining the skip reason (parentAssociatedStudents query timing).
- **[INFO]** ParentQuotaView.test.tsx — Duplicates `StudentQuotaLabels` inline.

#### `test/ui/components/quota/StudentQuotaView.test.tsx`

- **[PASS]** Line 229: `test.skip("renders ledger entries section")` has clear comment explaining skip reason (meQuery resolution timing).
- **[INFO]** StudentQuotaView.test.tsx — Duplicates `StudentQuotaLabels` inline.

#### `test/ui/components/UserBillingProfileView.test.tsx`

- **[PASS]** Line 162: `quotasLink: "Quotas"` mock added to `BillingLabels` — correctly resolves the label key that the component uses for the quotas navigation link. Minimal, targeted change.

---

### App Router Files

#### `app/(dashboard)/quotas/loading.tsx`

- **[PASS]** Server Component (no `"use client"`). No client-side hooks. Uses `Skeleton` for loading state. Clean implementation.

#### `app/(dashboard)/quotas/error.tsx`

- **[PASS]** Has `"use client"` directive (line 1).
- **[PASS]** Has retry button calling `reset` (line 32).
- **[PASS]** Uses `useAppTranslation` from `@/shared/locale` for i18n (correct for client components).
- **[PASS]** Uses `logger.error` (not `console.*`) in the `useEffect` error handler.
- **[PASS]** i18n keys `errorGenericTitle`, `errorGeneric`, `retry` exist in both `en` and `ar` locale files.

#### `app/(dashboard)/quotas/[id]/not-found.tsx`

- **[PASS]** Server Component (async function, no `"use client"`).
- **[PASS]** Uses `getLocale()` from `@/shared/locale/server-cookies` and `getTranslations(locale)` from `@/shared/locale`.
- **[PASS]** Localized message via `t.notFoundTitle`, `t.notFoundMessage`.
- **[PASS]** Back button via `Button component={Link} href="/quotas"`.
- **[PASS]** i18n keys `notFoundTitle`, `notFoundMessage`, `notFoundBackButton` exist in both locales.

#### `app/(dashboard)/students/[id]/quotas/page.tsx`

- **[PASS]** `generateMetadata` returns locale-aware title using `getLocale()` + `getTranslations(locale).dashboardTranslations.studentQuota.pageTitle`.
- **[PASS]** Doesn't throw on missing locale — `getLocale()` has a fallback default.
- **[PASS]** Uses `withPageAuth` with `AppPermission.QUOTAS_VIEW` permission.
- **[PASS]** Redirects to `/students/{id}/profile?tab=quota` — consistent with tab-based profile architecture.

---

### Config Files

#### `frontend/common/views/dashboard/config/navigationConfig.ts`

- **[PASS]** Quota nav entries (desktop lines 478-505, mobile lines 674-696) use `labelKey` not hardcoded labels.
- **[PASS]** Desktop entries use `groupId: "grp_finance"` — consistent with other finance entries.
- **[PASS]** Mobile entries omit `groupId` — consistent with all other mobile entries.
- **[PASS]** Permission fields correctly set:
  - `quotas` → `PAGE_PERMISSIONS.quotas` → `[AppPermission.QuotasView]`
  - `quotasCreate` → `PAGE_PERMISSIONS.quotasCreate` → `[AppPermission.QuotasManage]`
  - `quotasInsights` → `PAGE_PERMISSIONS.quotasInsights` → `[AppPermission.QuotasView]`
- **[PASS]** Icon keys are valid Material icon names.

---

### Storybook Files

#### `frontend/common/views/dashboard/billing/quota/QuotaContainer.stories.tsx`

- **[PASS]** Uses `MockedProvider` from `@apollo/client/testing/react`.
- **[PASS]** Story names: `Default`, `Loading`, `Empty`, `ErrorState` — no `Error` shadowing.
- **[PASS]** Coverage: Default, Loading, Empty, ErrorState — all major states covered.

#### `frontend/common/views/dashboard/billing/quota/QuotaInsightsContainer.stories.tsx`

- **[PASS]** Uses `MockedProvider`.
- **[PASS]** Coverage: Default, Loading, Empty, ErrorState — all states covered.

#### `frontend/common/views/dashboard/billing/quota/QuotaFormContainer.stories.tsx`

- **[PASS]** Uses `MockedProvider`.
- **[INFO]** Coverage: Default, Edit, ValidationErrors — no explicit Loading or ErrorState stories. Form containers typically don't need a loading skeleton story (loading is handled by the parent container), so this is acceptable.

#### `frontend/common/views/dashboard/billing/quota/QuotaDetailContainer.stories.tsx`

- **[PASS]** Uses `MockedProvider`.
- **[PASS]** Coverage: Default, Loading, NotFound, ErrorState — comprehensive coverage including NotFound edge case.

#### `frontend/common/views/dashboard/students/quota/audience/SupervisorQuotaView.stories.tsx`

- **[PASS]** Uses `MockedProvider`.
- **[PASS]** `setSupervisorUser()` correctly sets `permissions: [AppPermission.QuotasManage]` and `hasPermission` function — required because `SupervisorQuotaView` component uses `useUserStore(s => s.hasPermission)`.
- **[PASS]** Coverage: Default, Loading, Empty, ErrorState — all states covered.

#### `frontend/common/views/dashboard/students/quota/audience/TeacherQuotaView.stories.tsx`

- **[PASS]** Uses `MockedProvider`.
- **[PASS]** `setTeacherUser()` sets `permissions: []` — acceptable because `TeacherQuotaView` doesn't use `hasPermission`.
- **[INFO]** Coverage: Default, Empty only — no Loading or ErrorState stories. `TeacherQuotaView` does have `QuotaLoadingSkeleton` and `QuotaEmptyState` components, so Loading and Error stories would improve coverage.

#### `frontend/common/views/dashboard/students/quota/audience/ParentQuotaView.stories.tsx`

- **[PASS]** Uses `MockedProvider`.
- **[PASS]** `setParentUser()` doesn't set permissions — acceptable, `ParentQuotaView` uses `useUserStore(s => s.user)` but not `hasPermission`.
- **[INFO]** Coverage: Default, Loading, Empty — no ErrorState story. Minor gap; the component does have error handling (`QuotaEmptyState` variants).

#### `frontend/common/views/dashboard/students/quota/audience/StudentQuotaView.stories.tsx`

- **[PASS]** Uses `MockedProvider`.
- **[PASS]** Coverage: Default, Loading, Empty, ErrorState, Exhausted — most comprehensive of the audience stories.
- **[INFO]** `StudentQuotaLabels` object duplicated inline (~100 lines) instead of importing from a shared helper. Same duplication as in test files.

---

## Baseline Comparison

Per `phase0-baseline-outcome.md`, the baseline had 1 oxlint warning. This review does not re-run oxlint (that's the code-review scope). All findings above are from manual code review only.

## Recommendations

1. **[WARN → action]** Extract `createMockStudentQuotaLabels()` helper for audience test and story files — the ~100 line `StudentQuotaLabels` object is duplicated across 4 test files and 4 story files (8 total copies). This is the same pattern already established by `mockQuotaLabels.ts` for billing quota tests.
2. **[INFO]** Consider adding Loading and ErrorState stories to `TeacherQuotaView.stories.tsx` and an ErrorState story to `ParentQuotaView.stories.tsx` for parity with other audience stories.
3. **[INFO]** Consider using enum values (`QuotaKind.Package`, `QuotaStatus.Active`) in `SupervisorQuotaView.test.tsx` mock data instead of string literals for type safety consistency.
