# Wave 2 — Task Group 16: Role-Based Access Matrix (R16) — Outcome

## Summary

Implemented permission-based field gating and role-based visibility for the quota UI. Three sub-tasks completed:

- **16.1**: Billing-specific `QuotaFormAccessProvider` context system for permission-based form field gating
- **16.2**: Permission-gated "New Quota" CTA and edit/delete actions in supervisor audience view
- **16.3**: Navigation config permission fields verified (already correct)

## Files Created

### Task 16.1 — QuotaFormAccessProvider System

| File | Purpose |
|------|---------|
| `frontend/common/views/dashboard/billing/quota/quotaFormAccessContext.types.ts` | `QuotaFormFieldAccess` (per-field disabled/helperText) and `QuotaFormAccessContextValue` interfaces |
| `frontend/common/views/dashboard/billing/quota/quotaFormAccessContext.constants.ts` | Default unrestricted field values and empty labels fallback |
| `frontend/common/views/dashboard/billing/quota/quotaFormAccessContext.ts` | React context creation + `useQuotaFormAccess()` hook with null guard |
| `frontend/common/views/dashboard/billing/quota/QuotaFormAccessProvider.tsx` | Provider reading `useUserStore().hasPermission(AppPermission.QuotasManage/QuotasView)`, builds field access map with `useMemo` |

## Files Modified

### Task 16.1 — Form Field Gating

| File | Change |
|------|--------|
| `shared/locale/types/dashboard/billing/quota.ts` | Added `restrictedAccessHelperText: string` to `QuotaLabels` |
| `shared/locale/en/dashboard/billing/quota.ts` | Added English `restrictedAccessHelperText` |
| `shared/locale/ar/dashboard/billing/quota.ts` | Added Arabic `restrictedAccessHelperText` |
| `frontend/common/views/dashboard/billing/quota/QuotaFormContainer.tsx` | Wrapped `ResponsiveViewSwitch` with `QuotaFormAccessProvider` |
| `frontend/desktop/views/dashboard/billing/quota/components/QuotaFormSectionDesktop.tsx` | Added `useQuotaFormAccess()`, applied field-level `disabled`/`helperText` to managed fields |
| `frontend/mobile/views/dashboard/billing/quota/components/QuotaFormSectionMobile.tsx` | Same field-level gating as desktop |
| `frontend/desktop/views/dashboard/billing/quota/quotaForm.desktop.tsx` | Conditional submit button rendering when `canManage` |
| `frontend/mobile/views/dashboard/billing/quota/quotaForm.mobile.tsx` | Same conditional submit button as desktop |

### Task 16.2 — Audience View Permission Visibility

| File | Change |
|------|--------|
| `shared/locale/types/dashboard/students/quota.ts` | Added `newQuota`, `editQuota`, `deleteQuota` labels to audience section |
| `shared/locale/en/dashboard/students/quota.ts` | Added English translations |
| `shared/locale/ar/dashboard/students/quota.ts` | Added Arabic translations |
| `frontend/common/views/dashboard/students/quota/audience/SupervisorQuotaView.tsx` | Added `useUserStore` permission check for `QuotasManage`; "New Quota" CTA visible only when `canManage`; edit/delete actions column in data grid only when `canManage`; fixed `no-unsafe-enum-comparison` warnings with `String()` wrapping |

### Task 16.3 — Navigation Config

| File | Change |
|------|--------|
| `frontend/common/views/dashboard/config/navigationConfig.ts` | Verified — already has correct `permission` fields for `/quotas`, `/quotas/new`, `/quotas/insights` |

## Architecture Decisions

### Permission System

Used `useUserStore(s => s.hasPermission)` with `AppPermission` enum constants from `@/frontend/common/graphql/generated/gql/graphql-types`. This is the existing 3-tier permission model:
- `AppPermission.QuotasManage` — full CRUD access
- `AppPermission.QuotasView` — read-only access

No hardcoded permission strings — all checks use the `AppPermission` enum.

### QuotaFormAccessProvider (Billing-Scoped)

Created a **billing-specific** provider separate from the existing student `QuotaFormAccessProvider` at `frontend/common/views/dashboard/students/quota/`. The existing student provider uses a field-group ACL model (`useStudentFieldAccess`), while the billing provider uses the `AppPermission` enum model. This keeps the two permission systems decoupled.

### Audience View Visibility

- **Student/Parent/Teacher views**: Inherently read-only — these roles don't have `QUOTAS_MANAGE` permission, so no action hiding needed. They display quota information using role-specific GraphQL queries.
- **Supervisor view**: Added permission-gated "New Quota" CTA and edit/delete action column. Users with `QuotasManage` see the CTA and actions; users with only `QuotasView` see a read-only data grid.

## Verification Results

All files passed `sub-loop --lifecycle codescene` (tsgo → oxlint → biome → lint:type-aware → duplicates → codescene):

| File | Status |
|------|--------|
| `frontend/common/views/dashboard/billing/quota/quotaFormAccessContext.types.ts` | ✅ Pass |
| `frontend/common/views/dashboard/billing/quota/quotaFormAccessContext.constants.ts` | ✅ Pass |
| `frontend/common/views/dashboard/billing/quota/quotaFormAccessContext.ts` | ✅ Pass |
| `frontend/common/views/dashboard/billing/quota/QuotaFormAccessProvider.tsx` | ✅ Pass |
| `frontend/common/views/dashboard/billing/quota/QuotaFormContainer.tsx` | ✅ Pass |
| `frontend/desktop/views/dashboard/billing/quota/components/QuotaFormSectionDesktop.tsx` | ✅ Pass |
| `frontend/mobile/views/dashboard/billing/quota/components/QuotaFormSectionMobile.tsx` | ✅ Pass |
| `frontend/desktop/views/dashboard/billing/quota/quotaForm.desktop.tsx` | ✅ Pass |
| `frontend/mobile/views/dashboard/billing/quota/quotaForm.mobile.tsx` | ✅ Pass |
| `shared/locale/types/dashboard/billing/quota.ts` | ✅ Pass |
| `shared/locale/en/dashboard/billing/quota.ts` | ✅ Pass |
| `shared/locale/ar/dashboard/billing/quota.ts` | ✅ Pass |
| `frontend/common/views/dashboard/students/quota/audience/SupervisorQuotaView.tsx` | ✅ Pass |
| `shared/locale/types/dashboard/students/quota.ts` | ✅ Pass |
| `shared/locale/en/dashboard/students/quota.ts` | ✅ Pass |
| `shared/locale/ar/dashboard/students/quota.ts` | ✅ Pass |
| `frontend/common/views/dashboard/students/quota/audience/StudentQuotaView.tsx` | ✅ Pass |
| `frontend/common/views/dashboard/students/quota/audience/ParentQuotaView.tsx` | ✅ Pass |
| `frontend/common/views/dashboard/students/quota/audience/TeacherQuotaView.tsx` | ✅ Pass |
| `frontend/common/views/dashboard/config/navigationConfig.ts` | ✅ Pass |

## Semantic Review Checklist

- [x] No dead branches
- [x] No cross-layer imports (all imports from `@/frontend/`, `@/shared/`, `@/backend/` — no reverse)
- [x] All permission checks use `AppPermission` enum constants (not hardcoded strings)
- [x] `git diff --name-only` matches expected file list
- [x] No `console.*` — all logging via `@/frontend/common/utils/logger`
- [x] MUI v9 `sx` prop used for styling (no style props)
- [x] No hardcoded colors — theme palette only
- [x] No `oxlint-disable` comments

## Deferred Items

None. All three sub-tasks (16.1, 16.2, 16.3) were completed successfully.

## Carry-Forward Knowledge

1. **Two distinct QuotaFormAccessProvider systems exist**: The student-profile provider (`frontend/common/views/dashboard/students/quota/QuotaFormAccessProvider.tsx`) uses field-group ACL (`useStudentFieldAccess`). The billing provider (`frontend/common/views/dashboard/billing/quota/QuotaFormAccessProvider.tsx`) uses `AppPermission` enum. Do not merge these — they serve different access models.

2. **Permission check pattern**: `const hasPermission = useUserStore(s => s.hasPermission); const canManage = hasPermission(AppPermission.QuotasManage);`

3. **`no-unsafe-enum-comparison` fix**: When comparing GraphQL enum fields to string literals (e.g., `q.status === "ACTIVE"`), wrap with `String()`: `String(q.status) === "ACTIVE"`.

4. **Audience views already had real GraphQL data fetching** (from wave2-audience agent): `studentQuotasQueryDocument`, `parentAssociatedStudentsQueryDocument`, `teacherAssignedStudentsQueryDocument`, `quotasQueryDocument`. R16 added the permission-gated action layer on top.
