"use client";

import type { MetricItem, ScheduleOverviewData } from "@/frontend/common/views/dashboard/types/dashboard";

/**
 * Props accepted by {@link DashboardView} (and the contract Plan F's
 * `admin/__shared__/adminDashboardView.tsx` consumes via `renderAdminDashboardView`).
 *
 * The container is responsible for assembling these values (labels + rows +
 * handlers) and passes them down. The hook is intentionally a pass-through:
 * admin dashboard has no per-tier store-backed state at this layer — all
 * business logic lives in Plan F's `useAdminDashboard`/`AdminDashboardContainer`.
 */
export interface UseDashboardViewModelProps extends ScheduleOverviewData {
  readonly todayClassesTitle: string;
  readonly lastUpdated: string;
  readonly metrics: readonly MetricItem[];
  readonly onMetricClick?: (key: string) => void;
  readonly selectedMetricKey?: string;
  readonly scheduleTitle: string;
}

/**
 * Flat view model consumed by both the mobile and desktop Dashboard views.
 * Identical shape to {@link UseDashboardViewModelProps} — the hook is a
 * pass-through so the admin dashboard Container remains the single source
 * of truth for data/handlers while still allowing tier-specific styling.
 */
export type DashboardViewModel = UseDashboardViewModelProps;

/**
 * View model hook for the admin DashboardView switcher.
 *
 * Returns the props unchanged. Keeping this indirection lets the switcher
 * pattern match the rest of the codebase (`useXxViewModel(props)` then
 * `<ResponsiveViewSwitch props={viewModel} />`) and gives Plan F a stable
 * hook to import from `@/frontend/common/views/dashboard/dashboard`.
 */
export function useDashboardViewModel(props: Readonly<UseDashboardViewModelProps>): DashboardViewModel {
  return props;
}
