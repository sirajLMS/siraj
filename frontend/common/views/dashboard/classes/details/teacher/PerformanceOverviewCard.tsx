"use client";

import { Typography } from "@mui/material";
import { BaseCard } from "@/frontend/common/components/ui";
import {
  buildPerformanceOverviewMetrics,
  type PerformanceOverviewLabels,
} from "@/frontend/common/views/dashboard/classes/details/teacher/performanceOverviewMetrics";
import type { ClassDetailsMetricGridSlot } from "@/frontend/common/views/dashboard/classes/details/types";

interface PerformanceOverviewCardProps {
  readonly attendanceRate: number;
  readonly avgGrade: string;
  readonly lastClassDaysAgo: number;
  readonly hasData: boolean;
  readonly labels: PerformanceOverviewLabels;
  readonly MetricGrid: ClassDetailsMetricGridSlot;
}

export function PerformanceOverviewCard({
  attendanceRate,
  avgGrade,
  lastClassDaysAgo,
  hasData,
  labels,
  MetricGrid,
}: PerformanceOverviewCardProps) {
  const metricItems = buildPerformanceOverviewMetrics({ attendanceRate, avgGrade, lastClassDaysAgo, labels });

  return (
    <BaseCard edgeToEdge>
      <Typography variant="titleLg" sx={theme => ({ mb: 2.5, color: theme.palette.text.primary })}>
        {labels.previousPerformanceOverview}
      </Typography>
      {hasData ? (
        <MetricGrid metrics={metricItems} />
      ) : (
        <Typography variant="body2" sx={{ textAlign: "center", py: 2 }}>
          {labels.noData}
        </Typography>
      )}
    </BaseCard>
  );
}
