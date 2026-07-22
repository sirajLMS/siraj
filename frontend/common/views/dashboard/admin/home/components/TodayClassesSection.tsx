"use client";

import type { MetricItem } from "@/frontend/common/types/shared.types";
import { DashboardMetricsSection } from "@/frontend/common/views/dashboard/components/DashboardMetricsSection";

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
