"use client";

import { School, Timer, TrendingUp, VerifiedUser } from "@mui/icons-material";
import type { MetricItem } from "@/frontend/common/types/shared.types";
import type { StudentHistoryMetrics } from "@/frontend/common/views/dashboard/students/history/types";
import { useStudentHistoryLabels } from "@/frontend/common/views/dashboard/students/history/useStudentHistoryLabels";
import { MobileMetricCardGrid } from "@/frontend/mobile/components/ui";

export function HistoryMobileMetricsGrid({ metrics }: Readonly<{ metrics: StudentHistoryMetrics }>) {
  const t = useStudentHistoryLabels();
  const items: MetricItem[] = [
    {
      key: "totalClasses",
      count: metrics.totalClasses,
      labelKey: "totalClasses",
      label: t.metrics.totalClasses(metrics.totalClasses),
      icon: School,
    },
    {
      key: "attendanceRate",
      count: t.percentValue(metrics.attendanceRate),
      labelKey: "attendanceRate",
      label: t.metrics.attendanceRate(metrics.attendanceRate),
      icon: VerifiedUser,
    },
    {
      key: "hoursStudied",
      count: t.hoursShort(metrics.hoursStudied),
      labelKey: "hoursStudied",
      label: t.metrics.hoursStudied(metrics.hoursStudied),
      icon: Timer,
    },
    {
      key: "performance",
      count: t.percentValue(metrics.performance),
      labelKey: "performance",
      label: t.metrics.performance(metrics.performance),
      icon: TrendingUp,
      variant: "error",
    },
  ];

  return <MobileMetricCardGrid metrics={items} stretchCells sx={{ mb: 3 }} />;
}
