# Wave 1 — Task Group 3: Billing Quota List — Tier Isolation — Outcome

## Summary

Refactored the billing quota list from co-located components in `frontend/common/views/dashboard/billing/quota/components/` into proper tier-isolated desktop and mobile views. The co-located `QuotaListDesktop.tsx` and `QuotaListMobile.tsx` were deleted, and the `QuotaContainer.tsx` switcher now lazy-loads from `frontend/desktop/` and `frontend/mobile/` tier directories. Pagination state (`page`, `pageSize`) was moved from local `useState` to the Zustand `quotaStore`. The `StatusBadge` component already had the `quotaStatus` category mapping (added in Wave 0).

## Files Created

| File | Purpose |
|------|---------|
| `frontend/desktop/views/dashboard/billing/quota/quotaList.desktop.tsx` | Desktop tier view with DesktopPageContainer, DesktopPageHeader, DesktopMetricCardGrid (3 metrics), DesktopSectionPanel, FilterControls, AppDataGrid with server pagination, ErrorState |
| `frontend/desktop/views/dashboard/billing/quota/components/QuotaListDesktopActions.tsx` | Desktop actions component (Insights button + New Quota button) |
| `frontend/desktop/views/dashboard/billing/quota/index.ts` | Barrel file for desktop quota directory |
| `frontend/desktop/views/dashboard/billing/quota/components/index.ts` | Barrel file for desktop quota components |
| `frontend/mobile/views/dashboard/billing/quota/quotaList.mobile.tsx` | Mobile tier view with MobilePageContainer, MobilePageHeader, MobileMetricCardGrid, MobileContentStack, MobileSectionPanel with filter controls, MobileCardList with server pagination, MobileFab |
| `frontend/mobile/views/dashboard/billing/quota/components/QuotaListItemMobile.tsx` | Mobile card list item rendering quota name, status/kind StatusBadges, remaining/total classes, valid date |
| `frontend/mobile/views/dashboard/billing/quota/index.ts` | Barrel file for mobile quota directory |
| `frontend/mobile/views/dashboard/billing/quota/components/index.ts` | Barrel file for mobile quota components |

## Files Modified

| File | Change |
|------|--------|
| `frontend/common/stores/quotaStore.ts` | Added `page: number` (init 0), `pageSize: number` (init 10), `setPage`, `setPageSize` to store interface and implementation |
| `frontend/common/views/dashboard/billing/quota/useQuotaViewModel.ts` | Moved `page`/`pageSize` from `useState` to Zustand store; exported `QuotaListViewModel` readonly interface with `t: QuotaLabels` |
| `frontend/common/views/dashboard/billing/quota/utils/buildQuotaColumns.tsx` | Replaced inline `Chip` components with `StatusBadge` for both `kind` and `status` columns |
| `frontend/common/views/dashboard/billing/quota/QuotaContainer.tsx` | Changed lazy imports from co-located `components/QuotaListDesktop` and `components/QuotaListMobile` to `@/frontend/desktop/views/dashboard/billing/quota/quotaList.desktop` and `@/frontend/mobile/views/dashboard/billing/quota/quotaList.mobile` |

## Files Deleted

| File | Reason |
|------|--------|
| `frontend/common/views/dashboard/billing/quota/components/QuotaListDesktop.tsx` | Replaced by `frontend/desktop/views/dashboard/billing/quota/quotaList.desktop.tsx` |
| `frontend/common/views/dashboard/billing/quota/components/QuotaListMobile.tsx` | Replaced by `frontend/mobile/views/dashboard/billing/quota/quotaList.mobile.tsx` |

## Verification Results (sub-loop.ts --lifecycle codescene)

All files passed the full progressive verification loop (tsgo → oxlint → biome → lint:type-aware → check:duplicates → codescene):

| File | tsgo | oxlint | biome | lint | duplicates | codescene |
|------|------|--------|-------|------|------------|-----------|
| `frontend/common/stores/quotaStore.ts` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `frontend/common/views/dashboard/billing/quota/useQuotaViewModel.ts` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `frontend/common/views/dashboard/billing/quota/utils/buildQuotaColumns.tsx` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `frontend/desktop/views/dashboard/billing/quota/quotaList.desktop.tsx` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `frontend/desktop/views/dashboard/billing/quota/components/QuotaListDesktopActions.tsx` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `frontend/desktop/views/dashboard/billing/quota/index.ts` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `frontend/desktop/views/dashboard/billing/quota/components/index.ts` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `frontend/mobile/views/dashboard/billing/quota/quotaList.mobile.tsx` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `frontend/mobile/views/dashboard/billing/quota/components/QuotaListItemMobile.tsx` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `frontend/mobile/views/dashboard/billing/quota/index.ts` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `frontend/mobile/views/dashboard/billing/quota/components/index.ts` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `frontend/common/views/dashboard/billing/quota/QuotaContainer.tsx` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

## Task 3.5: StatusBadgeCategory — Already Done in Wave 0

The `quotaStatus` category was already added to the `StatusBadgeCategory` union in `frontend/common/components/ui/badge/types/statusBadgeShared.types.ts` (line 17) during Wave 0. The `resolveStatusPaletteKey` function in `frontend/common/components/ui/badge/statusBadgeShared.utils.ts` (lines 110-118) already maps:
- ACTIVE → "active"
- EXPIRED → "completed"
- ARCHIVED → "blocked"
- PENDING → "pending"

No changes were needed for Task 3.5.

## Carry-Forward Knowledge for Future Subtasks

### tsgo and ReturnType<typeof useAppTranslation>
**CRITICAL**: `ReturnType<typeof useAppTranslation>` resolves to `unknown` in tsgo. When typing ViewModel interfaces that include translation functions, always use the concrete label type (e.g., `QuotaLabels` from `@/shared/locale/types/dashboard/billing/quota`) instead of `ReturnType<typeof useAppTranslation>`.

### MetricItem.icon is SvgIconComponent
The `MetricItem` type in `frontend/common/types/shared.types.ts` requires `icon: SvgIconComponent` — NOT `() => null` or `null`. Always import and use real MUI icons (e.g., `ConfirmationNumberOutlined`, `CheckCircleOutlined`, `ScheduleOutlined`).

### MUI v9 Typography Variants
Available custom variants in this project's theme: `headlineMd`, `bodyMd`, `labelMd`, `labelUppercase`. There is NO `titleMd` or `bodySm` — these will cause tsgo errors.

### StatusBadge for Quota Kind
The `quotaStatus` category only maps ACTIVE/EXPIRED/ARCHIVED/PENDING to palette keys. For quota kind values (PACKAGE/PERIODIC), `resolveStatusPaletteKey` falls back to the `"pending"` palette color. This is consistent across both desktop columns and mobile card items.

### Mobile View Pattern
- Use `MobilePageContainer` → `MobilePageHeader` → `MobileContentStack` (with `gap` and `paddingBottom`)
- Wrap content in `MobileContentStack` for proper spacing
- Use `MobileCardList<T>` with `buildServerPaginationOptions` for server-side pagination
- `MobileFab` uses `useViewport` internally — it self-gates on `isMobile`, safe to use in mobile tier
- Use `useRouter` from `next/navigation` for navigation, not `window.location.href`
- Import `Link` from `next/link` for link components

### Desktop View Pattern
- Use `DesktopPageContainer` → `DesktopPageHeader` (with `actions` prop)
- `DesktopSectionPanel` has `contentPadding` (default true) — set to `false` when wrapping a DataGrid
- `DesktopMetricCardGrid` accepts `size` as `ResponsiveStyleValue<GridSize>` — use inline `{ md: 4, lg: 4 }` (NOT a typed const, which causes tsgo errors)
- Use `AppDataGrid` with `paginationOptions={{ mode: "server", page: page + 1, ... }}` (1-based for MUI DataGrid)

### Zustand Store Pagination
The `quotaStore` now manages: `filterStatus`, `filterKind`, `searchQuery`, `page` (init 0), `pageSize` (init 10), and their setters. The ViewModel hook reads all state from the store and returns a readonly `QuotaListViewModel` interface.

## Cross-File Dependencies Discovered

1. **`buildQuotaColumns.tsx`** — Shared between desktop tier (DataGrid columns) and potentially other views. Updated to use `StatusBadge` instead of inline `Chip`.
2. **`quotaFormatters.ts`** — Used by both desktop and mobile tiers for consistent formatting (`formatQuotaStatus`, `formatQuotaKind`, `formatQuotaDate`).
3. **`quotaStore.ts`** — Zustand store is the single source of truth for all list state (filters + pagination). Both desktop and mobile tier views read from it via the ViewModel hook.
4. **`QuotaContainer.tsx`** — Switcher pattern using `createLazyView` + `ResponsiveViewSwitch` — no changes to the pattern itself, only the import paths.
