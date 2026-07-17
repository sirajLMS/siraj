"use client";

import { ChildCareOutlined, EventOutlined, PaymentsOutlined, TrendingUpOutlined } from "@mui/icons-material";
import { Grid } from "@mui/material";
import { MetricCard } from "@/frontend/common/components/ui/card/MetricCard";
import type { ParentDashboardMetrics } from "@/frontend/common/views/dashboard/parent/dashboard/types/parentDashboardTypes";

export interface ParentDashboardMetricsRowDesktopProps {
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

function formatPerformanceAvgDesktop(metrics: ParentDashboardMetrics): string {
  return `${metrics.performanceAvg}%`;
}

function formatPendingInvoicesDesktop(metrics: ParentDashboardMetrics): string {
  return String(metrics.pendingInvoicesCount).padStart(2, "0");
}

export function ParentDashboardMetricsRowDesktop({ metrics, labels }: Readonly<ParentDashboardMetricsRowDesktopProps>) {
  return (
    <Grid container spacing={3}>
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <MetricCard icon={ChildCareOutlined} label={labels.totalStudents} value={formatCount(metrics.totalStudents)} />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <MetricCard icon={EventOutlined} label={labels.todaysClasses} value={formatCount(metrics.todaysClasses)} />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <MetricCard
          icon={PaymentsOutlined}
          label={labels.pendingInvoices}
          value={formatPendingInvoicesDesktop(metrics)}
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <MetricCard
          icon={TrendingUpOutlined}
          label={labels.performanceAvg}
          value={formatPerformanceAvgDesktop(metrics)}
        />
      </Grid>
    </Grid>
  );
}
