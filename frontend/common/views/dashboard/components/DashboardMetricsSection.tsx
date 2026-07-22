"use client";

import type { GridSize } from "@mui/material/Grid";
import { createLazyView } from "@/frontend/common/components/ui/container/createLazyView";
import { ResponsiveViewSwitch } from "@/frontend/common/components/ui/container/ResponsiveViewSwitch";
import type { MetricItem } from "@/frontend/common/types/shared.types";

type ResponsiveStyleValue<T> = T | Array<T | null> | { [key in import("@mui/material").Breakpoint]?: T | null };

export type DashboardMetricsSectionGridSize = ResponsiveStyleValue<GridSize>;

const DEFAULT_GRID_SIZE: ResponsiveStyleValue<GridSize> = { sm: 4, md: 4, lg: 2 };

export interface DashboardMetricsSectionProps {
  readonly title: string;
  readonly lastUpdated: string;
  readonly metrics: readonly MetricItem[];
  readonly onMetricClick?: (key: string) => void;
  readonly selectedMetricKey?: string;
  readonly gridSize?: ResponsiveStyleValue<GridSize>;
  readonly withSectionMargin?: boolean;
}

interface DashboardMetricsSectionViewModel extends DashboardMetricsSectionProps {
  readonly gridSize: ResponsiveStyleValue<GridSize>;
}

function useDashboardMetricsSectionViewModel(
  props: Readonly<DashboardMetricsSectionProps>
): DashboardMetricsSectionViewModel {
  return {
    ...props,
    gridSize: props.gridSize ?? DEFAULT_GRID_SIZE,
  };
}

const lazyViews = createLazyView<DashboardMetricsSectionViewModel>(
  () =>
    import("@/frontend/mobile/views/dashboard/components/dashboardMetricsSection.mobile").then(m => ({
      default: m.DashboardMetricsSectionMobile,
    })),
  () =>
    import("@/frontend/desktop/views/dashboard/components/dashboardMetricsSection.desktop").then(m => ({
      default: m.DashboardMetricsSectionDesktop,
    }))
);

export function DashboardMetricsSection(props: Readonly<DashboardMetricsSectionProps>) {
  const viewModel = useDashboardMetricsSectionViewModel(props);
  return <ResponsiveViewSwitch mobile={lazyViews.mobile} desktop={lazyViews.desktop} props={viewModel} />;
}
