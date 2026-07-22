"use client";

import { ChildCareOutlined, EventOutlined, PaymentsOutlined, TrendingUpOutlined } from "@mui/icons-material";
import { useMemo } from "react";
import type { MetricItem } from "@/frontend/common/types/shared.types";
import type { ParentDashboardMetricsRowProps } from "@/frontend/common/views/dashboard/parent/dashboard/types/parentDashboardComponents.types";
import { MobileMetricCardGrid } from "@/frontend/mobile/components/ui";

function formatCount(value: number): string {
  return String(value).padStart(2, "0");
}

export function ParentDashboardMetricsRowMobile({ metrics, labels }: Readonly<ParentDashboardMetricsRowProps>) {
  const metricItems: readonly MetricItem[] = useMemo(
    () => [
      {
        key: "totalStudents",
        label: labels.totalStudents,
        count: formatCount(metrics.totalStudents),
        icon: ChildCareOutlined,
        labelKey: "totalStudents",
      },
      {
        key: "todaysClasses",
        label: labels.todaysClasses,
        count: formatCount(metrics.todaysClasses),
        icon: EventOutlined,
        labelKey: "todaysClasses",
      },
      {
        key: "pendingInvoices",
        label: labels.pendingInvoices,
        count: metrics.pendingInvoicesAmount,
        icon: PaymentsOutlined,
        labelKey: "pendingInvoices",
        variant: "error",
      },
      {
        key: "performanceAvg",
        label: labels.performanceAvg,
        count: `${metrics.performanceAvgMobile}%`,
        icon: TrendingUpOutlined,
        labelKey: "performanceAvg",
      },
    ],
    [labels, metrics]
  );

  return <MobileMetricCardGrid metrics={metricItems} />;
}
