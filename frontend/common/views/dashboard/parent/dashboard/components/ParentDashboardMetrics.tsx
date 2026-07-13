"use client";

import { ChildCareOutlined, EventOutlined, PaymentsOutlined, TrendingUpOutlined } from "@mui/icons-material";
import { Grid } from "@mui/material";
import { MetricCard } from "@/frontend/common/components/ui/card/MetricCard";
import type { ParentDashboardMetrics } from "@/frontend/common/views/dashboard/parent/dashboard/types/parentDashboardTypes";

interface ParentDashboardMetricsRowProps {
  readonly metrics: ParentDashboardMetrics;
  readonly labels: {
    readonly totalStudents: string;
    readonly todaysClasses: string;
    readonly pendingInvoices: string;
    readonly performanceAvg: string;
  };
  readonly isMobile: boolean;
}

function formatPendingInvoices(metrics: ParentDashboardMetrics, isMobile: boolean): string {
  if (isMobile) {
    return metrics.pendingInvoicesAmount;
  }
  return String(metrics.pendingInvoicesCount).padStart(2, "0");
}

function formatPerformanceAvg(metrics: ParentDashboardMetrics, isMobile: boolean): string {
  const value = isMobile ? metrics.performanceAvgMobile : metrics.performanceAvg;
  return `${value}%`;
}

function formatCount(value: number): string {
  return String(value).padStart(2, "0");
}

export function ParentDashboardMetricsRow({ metrics, labels, isMobile }: Readonly<ParentDashboardMetricsRowProps>) {
  const pendingVariant = isMobile ? "error" : "default";

  if (isMobile) {
    return (
      <Grid container spacing={2}>
        <Grid size={6}>
          <MetricCard
            icon={ChildCareOutlined}
            label={labels.totalStudents}
            value={formatCount(metrics.totalStudents)}
            variant="compact"
          />
        </Grid>
        <Grid size={6}>
          <MetricCard
            icon={EventOutlined}
            label={labels.todaysClasses}
            value={formatCount(metrics.todaysClasses)}
            variant="compact"
          />
        </Grid>
        <Grid size={6}>
          <MetricCard
            icon={PaymentsOutlined}
            label={labels.pendingInvoices}
            value={formatPendingInvoices(metrics, true)}
            variant={pendingVariant}
          />
        </Grid>
        <Grid size={6}>
          <MetricCard
            icon={TrendingUpOutlined}
            label={labels.performanceAvg}
            value={formatPerformanceAvg(metrics, true)}
            variant="compact"
          />
        </Grid>
      </Grid>
    );
  }

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
          value={formatPendingInvoices(metrics, false)}
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <MetricCard
          icon={TrendingUpOutlined}
          label={labels.performanceAvg}
          value={formatPerformanceAvg(metrics, false)}
        />
      </Grid>
    </Grid>
  );
}
