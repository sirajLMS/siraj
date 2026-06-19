# Mobile Metrics Horizontal Scroll

## Goal
Replace the 2-column `MetricCardGrid` on mobile with a compact, impressive horizontal scrollable strip of metrics (similar to existing `StudentMobileMetricsScroll` pattern). Must not exceed 40vh on any mobile device.

## Design
- Single-row horizontal scroll with hidden scrollbar
- Compact pill-shaped cards (~72px tall, ~140px wide each)
- Icon (circle border) + value + label inline horizontally
- Tap to filter (same `onMetricClick` functionality)
- Active/selected state when a metric is filtered
- Smooth scroll, modern mobile feel
- Height: ~72px + padding = ~96px total. On iPhone SE (667px vh), 40vh = 267px. Well within constraint.

## Changes

### 1. Create `TodayClassesMobileScroll.tsx`
**Path:** `frontend/views/dashboard/dashboard/components/TodayClassesMobileScroll.tsx`

New component inspired by `StudentMobileMetricsScroll` with:
- Props: `metrics`, `onMetricClick`, `selectedKey?` (for active filter state)
- Horizontal scroll container with `overflowX: "auto"`, hidden scrollbar
- Compact pill cards with:
  - Circular icon with border (primary color, error for error variants)
  - Value (bold, primary color)
  - Label (tiny uppercase, secondary text)
- Active state: highlighted border/background when `metric.key === selectedKey`
- `onClick` handler per card
- Framer-motion optional for entrance animation
- Theme colors from palette (no hardcoded values)
- `flexShrink: 0`, `minWidth: 140` per card
- `scrollbarWidth: "none"`, `&::-webkit-scrollbar: { display: "none" }`

### 2. Update `TodayClassesSection.tsx`
- Import `useMediaQuery` and `useTheme` from MUI
- Import `TodayClassesMobileScroll`
- Conditionally render:
  - Mobile (`< md`): `TodayClassesMobileScroll` with `metrics`, `onMetricClick`, and derive `selectedKey` from props (need to pass it)
  - Desktop (`>= md`): existing `MetricCardGrid`

### 3. Update `TodayClassesSection` props
- Add `selectedMetricKey?: string` to interface
- Pass through to mobile scroll component

### 4. Update `DashboardView.tsx`
- Pass `selectedMetricKey` from filters to `TodayClassesSection`
- Import `useDashboardStore` or pass as prop from container

### 5. Update `AdminDashboardContainer.tsx`
- Pass `selectedMetricKey={filters.selectedStatus}` to `DashboardView`

### 6. Update `AdminDashboardContainer.stories.tsx`
- Add `selectedMetricKey` prop to story

## Reference
Existing pattern: `frontend/views/dashboard/students/home/components/StudentMobileMetricsScroll.tsx`

## Implementation Order
1. Create `TodayClassesMobileScroll.tsx`
2. Update `TodayClassesSection.tsx` (add breakpoint logic)
3. Update `DashboardView.tsx` (add selectedMetricKey prop)
4. Update `AdminDashboardContainer.tsx` (pass selectedStatus)
5. Update `AdminDashboardContainer.stories.tsx`
