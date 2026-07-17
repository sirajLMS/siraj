"use client";

import { Grid, Skeleton } from "@mui/material";
import { MetricCard } from "@/frontend/common/components/ui/card/MetricCard";
import type { BillingMetricsRowProps } from "@/frontend/common/views/dashboard/billing/types/billingMetrics.types";

export type { BillingMetricItem } from "@/frontend/common/views/dashboard/billing/types/billingMetrics.types";

export function BillingMetricsRowDesktop({ metrics, loading = false }: Readonly<BillingMetricsRowProps>) {
  if (loading) {
    const skeletonKeys =
      metrics.length > 0 ? metrics.map(metric => metric.key) : ["outstanding", "paid", "next-due", "active-students"];

    return (
      <Grid container spacing={2}>
        {skeletonKeys.map(key => (
          <Grid key={`billing-metric-skeleton-${key}`} size={{ xs: 6, md: 3 }}>
            <Skeleton variant="rounded" height={120} sx={{ borderRadius: 2 }} />
          </Grid>
        ))}
      </Grid>
    );
  }

  return (
    <Grid container spacing={2}>
      {metrics.map(metric => (
        <Grid key={metric.key} size={{ xs: 6, md: 3 }}>
          <MetricCard
            icon={metric.icon}
            label={metric.label}
            value={metric.value}
            subLabel={metric.subLabel}
            variant={metric.variant}
          />
        </Grid>
      ))}
    </Grid>
  );
}
