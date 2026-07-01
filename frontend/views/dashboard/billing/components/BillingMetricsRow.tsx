"use client";

import type { SvgIconComponent } from "@mui/icons-material";
import { Grid } from "@mui/material";
import { MetricCard, type MetricCardVariant } from "@/frontend/components/ui";

export interface BillingMetricItem {
  readonly key: string;
  readonly label: string;
  readonly value: string | number;
  readonly icon: SvgIconComponent;
  readonly variant?: MetricCardVariant;
}

interface BillingMetricsRowProps {
  readonly metrics: readonly BillingMetricItem[];
  readonly compact?: boolean;
}

export function BillingMetricsRow({ metrics, compact = false }: Readonly<BillingMetricsRowProps>) {
  return (
    <Grid container spacing={compact ? 1.5 : 2}>
      {metrics.map(metric => (
        <Grid key={metric.key} size={{ xs: 6, md: 3 }}>
          <MetricCard
            icon={metric.icon}
            label={metric.label}
            value={metric.value}
            variant={metric.variant}
            sx={compact ? { "& .MuiTypography-headlineLg": { typography: "titleLg" } } : undefined}
          />
        </Grid>
      ))}
    </Grid>
  );
}
