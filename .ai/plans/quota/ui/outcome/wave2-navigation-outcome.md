# Wave 2 — Task Group 7: Navigation, Breadcrumbs, Cross-Linking — Outcome

## Summary

All 5 tasks (7.1–7.5) completed successfully. Breadcrumbs added to quota pages missing them, orphaned navigation config entries removed, mobile bottom nav entries added, cross-links from billing dashboard to quotas page, `generateMetadata` added to student quota page, and route-level loading/error/not-found boundaries created.

## Task 7.1: Add breadcrumbs to all quota pages

### Findings
- Wave 1 agents had already added breadcrumbs to most quota tier views:
  - `quotaForm.desktop.tsx` / `quotaForm.mobile.tsx` — had breadcrumbs ✅
  - `quotaDetail.desktop.tsx` / `quotaDetail.mobile.tsx` — had breadcrumbs ✅
  - `quotaInsights.desktop.tsx` / `quotaInsights.mobile.tsx` — had breadcrumbs ✅
- Three files were missing breadcrumbs:
  - `frontend/desktop/views/dashboard/billing/quota/quotaList.desktop.tsx` — **added** `breadcrumbs` prop to `DesktopPageHeader`
  - `frontend/mobile/views/dashboard/billing/quota/quotaList.mobile.tsx` — **added** `breadcrumbs` prop to `MobilePageHeader`
  - `frontend/mobile/views/dashboard/students/quota/studentQuota.mobile.tsx` — **added** `MobilePageHeader` with breadcrumbs above `MobileProfileHeader`

### Files Modified
- `frontend/desktop/views/dashboard/billing/quota/quotaList.desktop.tsx`
- `frontend/mobile/views/dashboard/billing/quota/quotaList.mobile.tsx`
- `frontend/mobile/views/dashboard/students/quota/studentQuota.mobile.tsx`

### Quality
- All 3 files passed `sub-loop.ts --lifecycle biome` (tsgo → oxlint → biome)

## Task 7.2: Fix orphaned navigationConfig entries

### Actions
- **Removed orphaned `PAGE_PERMISSIONS` entries**: `quotasView` and `quotasEdit` were never referenced anywhere in the codebase. Removed from `page-permissions.types.ts`.
- **Removed orphaned nav locale labels**: `quotasView` and `quotasEdit` keys removed from locale type (`nav.ts`), English (`nav.ts`), and Arabic (`nav.ts`).
- **Added mobile bottom nav entries**: Added `quotas-create` (iconKey: `noteAdd`) and `quotas-insights` (iconKey: `analytics`) to `BOTTOM_NAV_ITEMS` in `navigationConfig.ts`.

### Files Modified
- `frontend/common/types/page-permissions.types.ts` — removed `quotasView`, `quotasEdit`
- `frontend/common/views/dashboard/config/navigationConfig.ts` — added `quotas-create`, `quotas-insights` to `BOTTOM_NAV_ITEMS`
- `shared/locale/types/dashboard/core/nav.ts` — removed `quotasView`, `quotasEdit` keys
- `shared/locale/en/dashboard/core/nav.ts` — removed `quotasView`, `quotasEdit` translations
- `shared/locale/ar/dashboard/core/nav.ts` — removed `quotasView`, `quotasEdit` translations

### Quality
- All 5 files passed `sub-loop.ts --lifecycle biome`

## Task 7.3: Add cross-links from billing/teacher/parent dashboards to quota pages

### Actions
- **Billing dashboard**: Added "Quotas & Allocations" link button to both desktop and mobile billing overview views, linking to `/quotas`. Used `AccountBalanceWalletOutlined` icon.
  - Added `quotasLink` label to `BillingLabels` interface, English (`"Quotas & Allocations"`), and Arabic (`"الحصص والمحفظات"`) locale files.
  - Added `quotasLink: t.quotasLink` to `buildBillingLabels.ts`.
- **Teacher student view**: Already had cross-link — student profile has a "Quota" tab that navigates to `/students/[id]?tab=quota`. No changes needed.
- **Parent portal**: Already had cross-link — parent student cards link to student profile which has the Quota tab. No changes needed.
- **Notifications**: Already had correct routing — `notificationDeepLinks.ts` handles `StudentQuotaOverridden` by routing to `studentProfileTabHref(entityId, "quota")` where `entityId` is a student ID (entityKind="student"), making this the correct deep-link target.

### Files Modified
- `frontend/desktop/views/dashboard/admin/billing/adminBilling.desktop.tsx` — added quotas link button
- `frontend/mobile/views/dashboard/admin/billing/adminBilling.mobile.tsx` — added quotas link button
- `shared/locale/types/dashboard/billing/main.ts` — added `quotasLink` to `BillingLabels`
- `shared/locale/en/dashboard/billing/main.ts` — added `quotasLink` translation
- `shared/locale/ar/dashboard/billing/main.ts` — added `quotasLink` translation
- `frontend/common/views/dashboard/billing/utils/__shared__/buildBillingLabels.ts` — added `quotasLink` to `buildPageLabels`

### Quality
- All modified files passed `sub-loop.ts --lifecycle biome`

## Task 7.4: Add generateMetadata to students/[id]/quotas page

### Actions
- Added `generateMetadata` export to `app/(dashboard)/students/[id]/quotas/page.tsx` using `getTranslations(locale).dashboardTranslations.studentQuota.pageTitle`.
- Pattern matches existing `app/(dashboard)/quotas/page.tsx` which uses `buildTranslatedMetadata`.

### File Modified
- `app/(dashboard)/students/[id]/quotas/page.tsx`

### Quality
- Passed `sub-loop.ts --lifecycle biome`

## Task 7.5: Add route-level loading and error boundaries under /quotas

### Actions
- Created `app/(dashboard)/quotas/loading.tsx` — Skeleton-based loading skeleton (server component, no i18n needed). Pattern from `settings/whatsapp/loading.tsx`.
- Created `app/(dashboard)/quotas/error.tsx` — Client component with `useAppTranslation(Translation.Dashboard.BillingQuota)`, `logger.error`, retry button. Uses new i18n keys: `errorGenericTitle`, `errorGeneric`, `retry`.
- Created `app/(dashboard)/quotas/[id]/not-found.tsx` — Server component with `getTranslations(locale).dashboardTranslations.billingQuota`. Uses Wave 0 keys: `notFoundTitle`, `notFoundMessage`, `notFoundBackButton`. Renders `SearchOffOutlined` icon + localized title/message + "Back to Quotas" button linking to `/quotas`.
- Added 3 new i18n keys to quota locale type and en/ar implementations: `errorGenericTitle`, `errorGeneric`, `retry`.

### Files Created
- `app/(dashboard)/quotas/loading.tsx`
- `app/(dashboard)/quotas/error.tsx`
- `app/(dashboard)/quotas/[id]/not-found.tsx`

### Files Modified
- `shared/locale/types/dashboard/billing/quota.ts` — added `errorGenericTitle`, `errorGeneric`, `retry` to `QuotaLabels`
- `shared/locale/en/dashboard/billing/quota.ts` — added English translations
- `shared/locale/ar/dashboard/billing/quota.ts` — added Arabic translations

### Quality
- All 6 files passed `sub-loop.ts --lifecycle biome`

## All Files Modified (Group 7 only)

| File | Task |
|------|------|
| `frontend/desktop/views/dashboard/billing/quota/quotaList.desktop.tsx` | 7.1 |
| `frontend/mobile/views/dashboard/billing/quota/quotaList.mobile.tsx` | 7.1 |
| `frontend/mobile/views/dashboard/students/quota/studentQuota.mobile.tsx` | 7.1 |
| `frontend/common/types/page-permissions.types.ts` | 7.2 |
| `frontend/common/views/dashboard/config/navigationConfig.ts` | 7.2 |
| `shared/locale/types/dashboard/core/nav.ts` | 7.2 |
| `shared/locale/en/dashboard/core/nav.ts` | 7.2 |
| `shared/locale/ar/dashboard/core/nav.ts` | 7.2 |
| `frontend/desktop/views/dashboard/admin/billing/adminBilling.desktop.tsx` | 7.3 |
| `frontend/mobile/views/dashboard/admin/billing/adminBilling.mobile.tsx` | 7.3 |
| `shared/locale/types/dashboard/billing/main.ts` | 7.3 |
| `shared/locale/en/dashboard/billing/main.ts` | 7.3 |
| `shared/locale/ar/dashboard/billing/main.ts` | 7.3 |
| `frontend/common/views/dashboard/billing/utils/__shared__/buildBillingLabels.ts` | 7.3 |
| `app/(dashboard)/students/[id]/quotas/page.tsx` | 7.4 |
| `app/(dashboard)/quotas/loading.tsx` | 7.5 (new) |
| `app/(dashboard)/quotas/error.tsx` | 7.5 (new) |
| `app/(dashboard)/quotas/[id]/not-found.tsx` | 7.5 (new) |
| `shared/locale/types/dashboard/billing/quota.ts` | 7.5 |
| `shared/locale/en/dashboard/billing/quota.ts` | 7.5 |
| `shared/locale/ar/dashboard/billing/quota.ts` | 7.5 |
| `.ai/plans/quota/ui/tasks.md` | 7.6 |

## Semantic Review Checklist

- [x] No dead branches — all code paths lead to rendered output
- [x] No cross-layer imports — shared layer never imports from frontend/backend
- [x] Only task-scoped files modified — no files from other waves modified
- [x] All i18n strings use typed translation functions (no hardcoded strings)
- [x] All labels use compile-time translation system from `shared/locale/`
- [x] MUI v9 conventions: `sx` prop used, `*Outlined` icon naming, theme palette colors
- [x] All files pass `sub-loop.ts --lifecycle biome` (tsgo → oxlint → biome)

## Deferred Items

None — all 5 tasks fully completed.
