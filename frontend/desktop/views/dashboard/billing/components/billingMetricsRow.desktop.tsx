"use client";

import { Grid, Skeleton } from "@mui/material";
import type { MetricItem } from "@/frontend/common/views/dashboard/types/dashboard";
import type { BillingMetricsRowProps } from "@/frontend/common/views/dashboard/billing/types/billingMetrics.types";
import { DesktopMetricCardGrid } from "@/frontend/desktop/components/ui/card/MetricCardGrid";

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

  const metricItems: MetricItem[] = metrics.map(metric => ({
    key: metric.key,
    count: metric.value,
    labelKey: metric.key,
    label: metric.label,
    icon: metric.icon,
    subLabel: metric.subLabel,
    variant: metric.variant,
  }));

  return <DesktopMetricCardGrid metrics={metricItems} size={{ xs: 6, md: 3 }} />;
}
