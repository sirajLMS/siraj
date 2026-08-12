"use client";

import type { MetricItem } from "@/frontend/common/types/shared.types";
import {
  DashboardMetricsSectionShared,
  type DashboardMetricsSectionSharedOptions,
  type ResponsiveGridSize,
} from "@/frontend/common/views/dashboard/components/__shared__/dashboardMetricsSectionShared";
import { DesktopMetricCardGrid } from "@/frontend/desktop/components/ui/card/MetricCardGrid";
import { DesktopSectionPanel } from "@/frontend/desktop/components/ui/container";

const DESKTOP_OPTIONS: DashboardMetricsSectionSharedOptions = {
  SectionPanel: DesktopSectionPanel,
  renderMetricCardGrid: ({ metrics, onMetricClick, selectedKey, gridSize }) => (
    <DesktopMetricCardGrid metrics={metrics} onMetricClick={onMetricClick} selectedKey={selectedKey} size={gridSize} />
  ),
  contentBoxSx: { px: { xs: 0, md: 3 }, py: { xs: 2, md: 2.5 } },
};

export interface DashboardMetricsSectionDesktopProps {
  readonly title: string;
  readonly lastUpdated: string;
  readonly metrics: readonly MetricItem[];
  readonly onMetricClick?: (key: string) => void;
  readonly selectedMetricKey?: string;
  readonly withSectionMargin?: boolean;
  readonly gridSize?: ResponsiveGridSize;
}

export function DashboardMetricsSectionDesktop({
  title,
  lastUpdated,
  metrics,
  onMetricClick,
  selectedMetricKey,
  withSectionMargin = false,
  gridSize,
}: Readonly<DashboardMetricsSectionDesktopProps>) {
  return (
    <DashboardMetricsSectionShared
      title={title}
      lastUpdated={lastUpdated}
      metrics={metrics}
      onMetricClick={onMetricClick}
      selectedMetricKey={selectedMetricKey}
      withSectionMargin={withSectionMargin}
      gridSize={gridSize}
      options={DESKTOP_OPTIONS}
    />
  );
}
