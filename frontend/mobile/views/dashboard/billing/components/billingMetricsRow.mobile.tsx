"use client";

import { Grid, Skeleton } from "@mui/material";
import type { BillingMetricsRowProps } from "@/frontend/common/views/dashboard/billing/types/billingMetrics.types";
import { MobileMetricCard } from "@/frontend/mobile/components/ui/card/MetricCard";

export type { BillingMetricItem } from "@/frontend/common/views/dashboard/billing/types/billingMetrics.types";

export function BillingMetricsRowMobile({
  metrics,
  compact = false,
  loading = false,
}: Readonly<BillingMetricsRowProps>) {
  if (loading) {
    const skeletonKeys =
      metrics.length > 0 ? metrics.map(metric => metric.key) : ["outstanding", "paid", "next-due", "active-students"];

    return (
      <Grid container spacing={compact ? 1.5 : 2}>
        {skeletonKeys.map(key => (
          <Grid key={`billing-metric-skeleton-${key}`} size={{ xs: 6, md: 3 }}>
            <Skeleton variant="rounded" height={compact ? 88 : 120} sx={{ borderRadius: 2 }} />
          </Grid>
        ))}
      </Grid>
    );
  }

  return (
    <Grid container spacing={compact ? 1.5 : 2}>
      {metrics.map(metric => (
        <Grid key={metric.key} size={{ xs: 6, md: 3 }}>
          <MobileMetricCard
            icon={metric.icon}
            label={metric.label}
            value={metric.value}
            subLabel={metric.subLabel}
            variant={metric.variant}
            sx={compact ? { "& .MuiTypography-headlineLg": { typography: "titleLg" } } : undefined}
          />
        </Grid>
      ))}
    </Grid>
  );
}
