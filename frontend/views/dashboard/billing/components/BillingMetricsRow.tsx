"use client";

import type { SvgIconComponent } from "@mui/icons-material";
import { Grid, Skeleton } from "@mui/material";
import { MetricCard, type MetricCardVariant } from "@/frontend/components/ui/card/MetricCard";

export interface BillingMetricItem {
  readonly key: string;
  readonly label: string;
  readonly value: string | number;
  readonly icon: SvgIconComponent;
  readonly variant?: MetricCardVariant;
  readonly subLabel?: string;
}

interface BillingMetricsRowProps {
  readonly metrics: readonly BillingMetricItem[];
  readonly compact?: boolean;
  readonly loading?: boolean;
}

export function BillingMetricsRow({ metrics, compact = false, loading = false }: Readonly<BillingMetricsRowProps>) {
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
          <MetricCard
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
