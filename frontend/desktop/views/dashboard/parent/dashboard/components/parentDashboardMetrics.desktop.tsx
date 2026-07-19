"use client";

import { ChildCareOutlined, EventOutlined, PaymentsOutlined, TrendingUpOutlined } from "@mui/icons-material";
import type { ParentDashboardMetricsRowProps } from "@/frontend/common/views/dashboard/parent/dashboard/types/parentDashboardComponents.types";
import type { ParentDashboardMetrics } from "@/frontend/common/views/dashboard/parent/dashboard/types/parentDashboardTypes";
import type { MetricItem } from "@/frontend/common/views/dashboard/types/dashboard";
import { DesktopMetricCardGrid } from "@/frontend/desktop/components/ui/card/MetricCardGrid";

function formatCount(value: number): string {
  return String(value).padStart(2, "0");
}

function formatPerformanceAvgDesktop(metrics: ParentDashboardMetrics): string {
  return `${metrics.performanceAvg}%`;
}

function formatPendingInvoicesDesktop(metrics: ParentDashboardMetrics): string {
  return String(metrics.pendingInvoicesCount).padStart(2, "0");
}

export function ParentDashboardMetricsRowDesktop({ metrics, labels }: Readonly<ParentDashboardMetricsRowProps>) {
  const metricItems: MetricItem[] = [
    {
      key: "total-students",
      count: formatCount(metrics.totalStudents),
      labelKey: "total-students",
      label: labels.totalStudents,
      icon: ChildCareOutlined,
    },
    {
      key: "todays-classes",
      count: formatCount(metrics.todaysClasses),
      labelKey: "todays-classes",
      label: labels.todaysClasses,
      icon: EventOutlined,
    },
    {
      key: "pending-invoices",
      count: formatPendingInvoicesDesktop(metrics),
      labelKey: "pending-invoices",
      label: labels.pendingInvoices,
      icon: PaymentsOutlined,
    },
    {
      key: "performance-avg",
      count: formatPerformanceAvgDesktop(metrics),
      labelKey: "performance-avg",
      label: labels.performanceAvg,
      icon: TrendingUpOutlined,
    },
  ];

  return <DesktopMetricCardGrid metrics={metricItems} size={{ xs: 12, sm: 6, md: 3 }} />;
}
