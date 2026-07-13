"use client";

import type { Breakpoint } from "@mui/material";
import type { GridSize } from "@mui/material/Grid";
import { useViewport } from "@/frontend/common/hooks/useViewport";
import { DashboardMetricsSectionMobile } from "@/frontend/mobile/views/dashboard/components/dashboardMetricsSection.mobile";
import { DashboardMetricsSectionDesktop } from "@/frontend/views/dashboard/components/dashboardMetricsSection.desktop";
import type { MetricItem } from "@/frontend/views/dashboard/types/dashboard";

type ResponsiveStyleValue<T> = T | Array<T | null> | { [key in Breakpoint]?: T | null };

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

export function DashboardMetricsSection({
  title,
  lastUpdated,
  metrics,
  onMetricClick,
  selectedMetricKey,
  gridSize = DEFAULT_GRID_SIZE,
  withSectionMargin = false,
}: Readonly<DashboardMetricsSectionProps>) {
  const { isMobile } = useViewport();

  if (isMobile) {
    return (
      <DashboardMetricsSectionMobile
        title={title}
        lastUpdated={lastUpdated}
        metrics={metrics}
        onMetricClick={onMetricClick}
        selectedMetricKey={selectedMetricKey}
        gridSize={gridSize}
        withSectionMargin={withSectionMargin}
      />
    );
  }

  return (
    <DashboardMetricsSectionDesktop
      title={title}
      lastUpdated={lastUpdated}
      metrics={metrics}
      onMetricClick={onMetricClick}
      selectedMetricKey={selectedMetricKey}
      gridSize={gridSize}
      withSectionMargin={withSectionMargin}
    />
  );
}
