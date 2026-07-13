"use client";

import { DashboardMetricsSection } from "@/frontend/common/views/dashboard/components/DashboardMetricsSection";
import type { MetricItem } from "@/frontend/common/views/dashboard/types/dashboard";

interface TodayClassesSectionProps {
  readonly title: string;
  readonly lastUpdated: string;
  readonly metrics: readonly MetricItem[];
  readonly onMetricClick?: (key: string) => void;
  readonly selectedMetricKey?: string;
}

export function TodayClassesSection(props: TodayClassesSectionProps) {
  return <DashboardMetricsSection {...props} withSectionMargin />;
}
