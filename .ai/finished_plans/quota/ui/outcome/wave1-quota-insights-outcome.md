# Wave 1 — Task Group 6: Quota Insights — Aggregation + Filtering — Outcome

## Summary

Refactored the monolithic 614-line `QuotaInsightsContainer.tsx` into a proper tier-isolated architecture following the established `StudentQuotaContainer` pattern. Created a ViewModel hook (`useQuotaInsightsViewModel`) with GraphQL data fetching, filter state, and CSV export. Extracted chart logic into dedicated desktop and mobile chart component files. Converted the container into a 24-line thin switcher using `createLazyView` + `ResponsiveViewSwitch`.

Fixed the `pendingBacklogCount` bug — the original code aliased `backlogCount = activeCount` (line 561 of the original container), which reported total active quotas instead of actual pending backlog. The fix counts active quotas with `remaining > 0` that are past their `validUntil` date (overdue unredeemed credits).

## Files Created

| File | Purpose |
|------|---------|
| `frontend/common/views/dashboard/billing/quota/useQuotaInsightsViewModel.ts` | ViewModel hook — `useQuery(quotasQueryDocument)`, filter state, CSV export, typed `QuotaInsightsViewModel` interface |
| `frontend/common/views/dashboard/billing/quota/utils/quotaInsights.helpers.ts` | Pure chart data builder functions extracted from original container (`groupQuotasByMonth`, `buildPurchasesOverTime`, `buildRedemptionByType`, `buildDeliveryRate`, `buildExpiredSlippage`, `computeInsightsMetrics`, `buildQuotaInsightsCsv`) |
| `frontend/common/views/dashboard/billing/quota/utils/quotaInsightsChartShapes.tsx` | Shared chart shape helpers (`polarToCartesian`, `describeArc`, `makeDonutShape`, `makeBarShape`, `makeGaugeShape`, `PieShapeProps`, `BarShapeProps`, `ChartColors`) |
| `frontend/common/views/dashboard/billing/quota/utils/index.ts` | Barrel file for the utils directory |
| `frontend/desktop/views/dashboard/billing/quota/quotaInsights.desktop.tsx` | Desktop tier view — `DesktopPageContainer`, `DesktopPageHeader`, `DesktopMetricCardGrid`, filter bar, `DesktopSectionPanel` for charts |
| `frontend/desktop/views/dashboard/billing/quota/components/QuotaInsightsChartsDesktop.tsx` | Desktop chart components (purchases over time, redemption by type, delivery rate, pending backlog gauge, expired slippage) |
| `frontend/mobile/views/dashboard/billing/quota/quotaInsights.mobile.tsx` | Mobile tier view — `MobilePageContainer`, `MobilePageHeader`, `MobileMetricCardGrid`, collapsible filters, stacked charts |
| `frontend/mobile/views/dashboard/billing/quota/components/QuotaInsightsChartsMobile.tsx` | Mobile-optimized chart components (simpler, shorter heights, stacked layout) |

## Files Modified

| File | Change |
|------|--------|
| `frontend/common/views/dashboard/billing/quota/QuotaInsightsContainer.tsx` | Replaced 614-line monolith with 24-line thin switcher (`createLazyView` + `ResponsiveViewSwitch`) |
| `frontend/desktop/views/dashboard/billing/quota/index.ts` | Updated barrel: added `export * from "./components"`, `./quotaDetail.desktop`, `./quotaForm.desktop`, `./quotaInsights.desktop` |
| `frontend/desktop/views/dashboard/billing/quota/components/index.ts` | Updated barrel: added `QuotaDetailSummaryDesktop`, `QuotaInsightsChartsDesktop` |
| `frontend/mobile/views/dashboard/billing/quota/index.ts` | Updated barrel: added `./quotaDetail.mobile`, `./quotaForm.mobile`, `./quotaInsights.mobile` |
| `frontend/mobile/views/dashboard/billing/quota/components/index.ts` | Updated barrel: added `QuotaDetailSummaryMobile`, `QuotaFormSectionMobile`, `QuotaInsightsChartsMobile` |
| `.ai/plans/quota/ui/tasks.md` | Updated checkboxes 6.1–6.4 and sub-tasks to `[x]` |

## Files Deleted

None.

## Verification Results

All files passed `sub-loop.ts --lifecycle codescene` (tsgo → oxlint → biome → lint:type-aware → check:duplicates → codescene):

| File | Status |
|------|--------|
| `useQuotaInsightsViewModel.ts` | ✅ All checks passed |
| `quotaInsights.helpers.ts` | ✅ All checks passed |
| `quotaInsightsChartShapes.tsx` | ✅ All checks passed |
| `utils/index.ts` | ✅ All checks passed |
| `QuotaInsightsChartsDesktop.tsx` | ✅ All checks passed |
| `quotaInsights.desktop.tsx` | ✅ All checks passed |
| `QuotaInsightsChartsMobile.tsx` | ✅ All checks passed |
| `quotaInsights.mobile.tsx` | ✅ All checks passed |
| `QuotaInsightsContainer.tsx` | ✅ All checks passed |
| `desktop/views/.../quota/index.ts` | ✅ All checks passed |
| `desktop/views/.../quota/components/index.ts` | ✅ All checks passed |
| `mobile/views/.../quota/index.ts` | ✅ All checks passed |
| `mobile/views/.../quota/components/index.ts` | ✅ All checks passed |

Project-wide `bun run tsgo` passes clean with zero errors.

## Carry-Forward Knowledge

### `quotaBalanceQueryDocument` is Per-Student
`quotaBalanceQueryDocument` requires `studentId: ID!` — it's a per-student query, not suitable for global insights aggregation. Used `quotasQueryDocument` instead, which fetches all quotas for client-side aggregation (matching the original container's approach but with proper GraphQL data fetching).

### SvgIcon vs SvgIconComponent
`MetricItem.icon` expects `SvgIconComponent` (from `@mui/icons-material`), NOT `SvgIcon` (from `@mui/material`). MUI outlined icons (`*Outlined`) are already `SvgIconComponent`, so no `as unknown as SvgIcon` cast is needed — just assign directly: `icon: Inventory2Outlined`.

### Chart Axis Deduplication
recharts charts sharing the same axis configuration (`<CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="month" /><YAxis /><Tooltip /><Legend />`) trigger CodeScene "Code Duplication" warnings. Extract a `ChartAxisGrid` component to deduplicate.

### CodeScene Large Method Threshold
Functions > ~65-70 lines trigger "Large Method" warning. Extract chart rendering into separate sub-components at module scope. Both desktop and mobile chart files required this treatment.

### Desktop vs Mobile Button Names
- Desktop: `DesktopFilterButton`, `DesktopExportButton` (from `@/frontend/desktop/components/ui/button`)
- Mobile: `MobileFilterButton`, `MobileExportButton` (from `@/frontend/mobile/components/ui/button`)
- NOT `FilterButton`/`ExportButton` (those don't exist)

### Nested Ternary Lint Rule
`sonarjs/no-nested-conditional` flags nested ternaries in JSX. Extract into a `renderXxxContent()` function with early returns.

### React Import Deduplication
When importing both values and types from `react`, combine into one import: `import { type ReactElement, useState } from "react"`. Separate `import type { ReactElement } from "react"` and `import { useState } from "react"` triggers `import-x/no-duplicates`.

## Cross-File Dependencies Discovered

1. **`quotasQueryDocument`** — imported from `@/frontend/common/graphql/sharedDocuments/billing` for the insights ViewModel. This is the same query used by the list view; insights aggregates client-side from the returned quotas.

2. **`QuotaLabels` type** — from `@/shared/locale/types/dashboard/billing/quota`. The Wave 0 i18n keys (`insightsDateRangeLabel`, `insightsKindLabel`, `insightsStatusLabel`, `insightsStudentLabel`, `exportSuccess`, `emptyInsightsMessage`) are all present on this type.

3. **`QuotaItem` type** — from `@/backend/types/quota.types.ts`. Used for chart data builders and ViewModel.

4. **Chart shape helpers** — `makeDonutShape`, `makeBarShape`, `makeGaugeShape` are shared between desktop and mobile chart components via `@/frontend/common/views/dashboard/billing/quota/utils`.

5. **Barrel updates** — Desktop and mobile `quota/index.ts` and `components/index.ts` barrels needed updating to include the new files. Also added missing exports for `QuotaDetailSummaryDesktop`, `QuotaDetailSummaryMobile`, `QuotaFormSectionMobile`.

## pendingBacklog Bug Fix

**Original code** (line 561 of the original `QuotaInsightsContainer.tsx`):
```typescript
const backlogCount = activeCount; // BUG: just aliases active count
```

**Fixed code** (in `quotaInsights.helpers.ts` → `computeInsightsMetrics`):
```typescript
const pendingBacklogCount = quotas.filter(
  q => q.status === QuotaStatus.Active && q.remaining > 0 && q.validUntil && new Date(q.validUntil) < new Date()
).length;
```

This counts active quotas with remaining credits that are past their `validUntil` date — the actual pending backlog of overdue unredeemed credits.

## Semantic Review Checklist

- [x] No dead branches
- [x] No cross-layer imports
- [x] Only task-scoped files modified
- [x] `git diff --name-only` matches expected file list
- [x] pendingBacklogCount uses real data (not aliased to activeQuotasCount)
- [x] Chart colors come from theme palette (not hardcoded hex)
- [x] Insights container is a thin switcher (24 lines, not 614)
