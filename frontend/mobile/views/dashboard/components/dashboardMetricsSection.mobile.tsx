"use client";

import type { MetricItem } from "@/frontend/common/types/shared.types";
import {
  DashboardMetricsSectionShared,
  type DashboardMetricsSectionSharedOptions,
} from "@/frontend/common/views/dashboard/components/__shared__/dashboardMetricsSectionShared";
import { MobileMetricCardGrid } from "@/frontend/mobile/components/ui/card";
import { MobileSectionPanel } from "@/frontend/mobile/components/ui/container";

const MOBILE_OPTIONS: DashboardMetricsSectionSharedOptions = {
  SectionPanel: MobileSectionPanel,
  renderMetricCardGrid: ({ metrics, onMetricClick, selectedKey }) => (
    <MobileMetricCardGrid metrics={metrics} onMetricClick={onMetricClick} selectedKey={selectedKey} />
  ),
  contentBoxSx: { px: 0, py: 2 },
};

export interface DashboardMetricsSectionMobileProps {
  readonly title: string;
  readonly lastUpdated: string;
  readonly metrics: readonly MetricItem[];
  readonly onMetricClick?: (key: string) => void;
  readonly selectedMetricKey?: string;
  readonly withSectionMargin?: boolean;
}

export function DashboardMetricsSectionMobile({
  title,
  lastUpdated,
  metrics,
  onMetricClick,
  selectedMetricKey,
  withSectionMargin = false,
}: Readonly<DashboardMetricsSectionMobileProps>) {
  return (
    <DashboardMetricsSectionShared
      title={title}
      lastUpdated={lastUpdated}
      metrics={metrics}
      onMetricClick={onMetricClick}
      selectedMetricKey={selectedMetricKey}
      withSectionMargin={withSectionMargin}
      options={MOBILE_OPTIONS}
    />
  );
}
