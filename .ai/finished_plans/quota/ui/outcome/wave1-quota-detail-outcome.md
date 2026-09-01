# Wave 1 — Task Group 5: Billing Quota Detail — Tier Isolation + Delete Confirmation

## Summary

Implemented tier isolation for the billing quota detail view by splitting the previously co-located `QuotaDetailContainer` into desktop and mobile tier views connected via the `createLazyView` + `ResponsiveViewSwitch` switcher pattern. Added delete confirmation dialog with Apollo cache eviction, not-found state with localized messages, and FormErrorSnackbar for delete failure handling.

## Files Created

| File | Purpose |
|------|---------|
| `frontend/desktop/views/dashboard/billing/quota/quotaDetail.desktop.tsx` | Desktop tier view — DesktopPageContainer, DesktopPageHeader, DesktopSectionPanel, DesktopAppDataGrid, BaseDeleteDialog |
| `frontend/desktop/views/dashboard/billing/quota/components/QuotaDetailSummaryDesktop.tsx` | Summary Grid component with quota metadata + DesktopStatusBadge |
| `frontend/mobile/views/dashboard/billing/quota/quotaDetail.mobile.tsx` | Mobile tier view — MobilePageContainer, MobilePageHeader, MobileContentStack, MobileSectionPanel, MobileCardList, MobileFab, BaseDeleteDialog |
| `frontend/mobile/views/dashboard/billing/quota/components/QuotaDetailSummaryMobile.tsx` | Mobile summary card component with MobileCardListItem per field |

## Files Modified

| File | Changes |
|------|---------|
| `frontend/common/views/dashboard/billing/quota/QuotaDetailContainer.tsx` | Replaced all inline rendering (DetailField, QuotaDetailHeader, QuotaDetailFields, QuotaLedgerSection, getDeltaColor) with `createLazyView` + `ResponsiveViewSwitch`. Added loading skeleton with `aria-busy`, not-found state with i18n keys. |
| `frontend/common/views/dashboard/billing/quota/useQuotaDetailViewModel.ts` | Added `useQuotaDelete` custom hook for delete dialog state + mutation + cache eviction. Added `notFound` boolean state. Added `deleteErrorOpen` for FormErrorSnackbar. Changed `quota` type to `QuotaItem \| null`. Extracted `updateQuotasCache` to module level to avoid `sonarjs/no-nested-functions`. |
| `frontend/common/components/ui/badge/types/statusBadgeShared.types.ts` | Added `"quotaStatus"` to `StatusBadgeCategory` union |
| `frontend/common/components/ui/badge/statusBadgeShared.utils.ts` | Added `quotaStatus` case to `resolveStatusPaletteKey` |
| `frontend/common/views/dashboard/billing/quota/utils/quotaFormatters.ts` | Added `formatQuotaPeriodType` function |

## Verification Results (sub-loop.ts --lifecycle codescene)

All 8 files passed the full progressive verification chain (tsgo → oxlint → biome → lint:type-aware → check:duplicates → codescene):

| File | Status |
|------|--------|
| `frontend/desktop/views/dashboard/billing/quota/quotaDetail.desktop.tsx` | ✅ All checks passed |
| `frontend/desktop/views/dashboard/billing/quota/components/QuotaDetailSummaryDesktop.tsx` | ✅ All checks passed |
| `frontend/mobile/views/dashboard/billing/quota/quotaDetail.mobile.tsx` | ✅ All checks passed |
| `frontend/mobile/views/dashboard/billing/quota/components/QuotaDetailSummaryMobile.tsx` | ✅ All checks passed |
| `frontend/common/views/dashboard/billing/quota/QuotaDetailContainer.tsx` | ✅ All checks passed |
| `frontend/common/views/dashboard/billing/quota/useQuotaDetailViewModel.ts` | ✅ All checks passed |
| `frontend/common/components/ui/badge/types/statusBadgeShared.types.ts` | ✅ All checks passed |
| `frontend/common/components/ui/badge/statusBadgeShared.utils.ts` | ✅ All checks passed |
| `frontend/common/views/dashboard/billing/quota/utils/quotaFormatters.ts` | ✅ All checks passed |

## Carry-Forward Knowledge

### SX Array with Theme Callbacks (MUI v9 Gotcha)
SX arrays containing theme callbacks — `(theme) => [{ fontWeight: 700 }, { color: ... }]` — cause TS2769. Must merge into a single object: `(theme) => ({ fontWeight: 700, ...getDeltaColor(value, theme) })`. Use spread for conditional styles within the same object.

### ViewModel Null Handling Pattern
The ViewModel returns `quota: QuotaItem | null` but tier views expect non-null quota. The container guards with `if (viewModel.notFound || !viewModel.quota)` and renders the not-found UI. Tier views double-guard with `if (!quota) return null` after the loading check. The `quotaName` computation must occur AFTER the null guard, not before.

### Import Deduplication
Mixing `import type { X } from "..."` and `import { Y } from "..."` from the same module triggers `import-x/no-duplicates`. Fix: `import { type X, Y } from "..."` — combined single import.

### CodeScene Large Method Fix
CodeScene flags methods exceeding ~65 LoC with "Large Method" warning. Fix: extract sub-logic into a separate custom hook (e.g., `useQuotaDelete`) at module level, then spread the returned handlers in the main hook's return. This also resolves `sonarjs/no-nested-functions` which limits nesting to 4 levels (useCallback → mutation → update → updateQuery → filter was depth 4, over the limit).

### Extracted Cache Update Function
The `updateQuotasCache(quotaId)` function returns a `(data) => ...` callback for `cache.updateQuery`. It must be at module level (not inside the hook) to satisfy `sonarjs/no-nested-functions`. Requires importing the `QuotasQuery` type from `@/frontend/common/graphql/generated/gql/graphql`.

### Component APIs Used

- **DesktopStatusBadge**: `category: StatusBadgeCategory`, `status: string`, `label: string`, optional `size`. From `@/frontend/desktop/components/ui/badge`
- **MobileStatusBadge**: Same props + `typographyVariant`. From `@/frontend/mobile/components/ui/badge`
- **BaseDeleteDialog**: `open`, `onClose`, `onConfirm`, `isLoading`, `title`, `body`, `cancelLabel`, `confirmLabel`, optional `fullScreen` (mobile). From `@/frontend/common/components/ui/dialog`
- **FormErrorSnackbar**: `open`, `message`, `onClose`. From `@/frontend/common/components/ui/form/snackbar/FormErrorSnackbar`
- **DesktopSectionPanel**: `title`, `children`, `contentPadding` (false for data grids). From `@/frontend/desktop/components/ui/container/DesktopSectionPanel`
- **MobileSectionPanel**: `title`, `children`, `contentInset` (false for edge-to-edge). From `@/frontend/mobile/components/ui/container/MobileSectionPanel`
- **DesktopAppDataGrid<R>**: `rows`, `columns`, `loading`, `paginationOptions`, `emptyMessage?`, `ariaLabel?`. Server pagination: `{ mode: "server", page (1-based), pageSize, totalCount, onPageChange }`
- **MobileCardList<T>**: `rows`, `renderItem`, `getKey`, `loading?`, `emptyMessage?`, `renderSkeleton?`, `paginationOptions`, `layout?`
- **MobileCardListItem**: `children`, `variant?`, `interactive?`
- **MobileContentStack**: `children`, `gap?`, `paddingBottom?`
- **MobileFab**: `icon`, `label`, `onClick`, `disabled?`

## Cross-File Dependencies Discovered

1. **StatusBadgeCategory type** — The quota detail views use `DesktopStatusBadge`/`MobileStatusBadge` with `category: "quotaStatus"`. This required adding `"quotaStatus"` to the `StatusBadgeCategory` union type in `statusBadgeShared.types.ts` and adding a `quotaStatus` case to `resolveStatusPaletteKey` in `statusBadgeShared.utils.ts`. These changes were made in the prior session and verified in this session.

2. **formatQuotaPeriodType** — Added to `quotaFormatters.ts` to format the `periodType` enum value for display in the summary grid. Used by both desktop and mobile summary components.

3. **QuotasQuery type** — The `updateQuotasCache` function needs the `QuotasQuery` type from `@/frontend/common/graphql/generated/gql/graphql` to properly type the cache update callback.

4. **GraphQL field name** — `QuotaLedgerItem.reasonNote` (not `reasonNotes`) and `delta` is possibly null — both required null-safe rendering in tier views.

5. **i18n keys** — No `fields.createdAt` or `fields.updatedAt` keys exist in the billing quota locale. These metadata fields were omitted from the summary display to avoid hardcoding strings.
