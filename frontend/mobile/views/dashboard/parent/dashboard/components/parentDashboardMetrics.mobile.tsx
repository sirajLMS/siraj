"use client";

import { ChildCareOutlined, EventOutlined, PaymentsOutlined, TrendingUpOutlined } from "@mui/icons-material";
import { Grid } from "@mui/material";
import type { ParentDashboardMetrics } from "@/frontend/common/views/dashboard/parent/dashboard/types/parentDashboardTypes";
import { MobileMetricCard } from "@/frontend/mobile/components/ui";

export interface ParentDashboardMetricsRowMobileProps {
  readonly metrics: ParentDashboardMetrics;
  readonly labels: {
    readonly totalStudents: string;
    readonly todaysClasses: string;
    readonly pendingInvoices: string;
    readonly performanceAvg: string;
  };
}

function formatCount(value: number): string {
  return String(value).padStart(2, "0");
}

export function ParentDashboardMetricsRowMobile({ metrics, labels }: Readonly<ParentDashboardMetricsRowMobileProps>) {
  return (
    <Grid container spacing={2}>
      <Grid size={6}>
        <MobileMetricCard
          icon={ChildCareOutlined}
          label={labels.totalStudents}
          value={formatCount(metrics.totalStudents)}
          variant="compact"
        />
      </Grid>
      <Grid size={6}>
        <MobileMetricCard
          icon={EventOutlined}
          label={labels.todaysClasses}
          value={formatCount(metrics.todaysClasses)}
          variant="compact"
        />
      </Grid>
      <Grid size={6}>
        <MobileMetricCard
          icon={PaymentsOutlined}
          label={labels.pendingInvoices}
          value={metrics.pendingInvoicesAmount}
          variant="error"
        />
      </Grid>
      <Grid size={6}>
        <MobileMetricCard
          icon={TrendingUpOutlined}
          label={labels.performanceAvg}
          value={`${metrics.performanceAvgMobile}%`}
          variant="compact"
        />
      </Grid>
    </Grid>
  );
}
