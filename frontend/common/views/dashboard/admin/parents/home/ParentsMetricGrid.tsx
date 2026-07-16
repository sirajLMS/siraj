"use client";

import { Grid } from "@mui/material";
import { MetricCard } from "@/frontend/common/components/ui/card/MetricCard";
import type { MetricItem } from "@/frontend/common/views/dashboard/types/dashboard";
import { useAppTranslation } from "@/shared/locale";

interface ParentsMetricGridProps {
  readonly metrics: readonly MetricItem[];
}

export function ParentsMetricGrid({ metrics }: Readonly<ParentsMetricGridProps>) {
  const t = useAppTranslation().dashboardTranslations.parentsDirectory;
  const parents = t;

  return (
    <Grid container spacing={2} sx={{ mb: 4 }}>
      {metrics.map(metric => {
        const label = parents.metrics[metric.labelKey as keyof typeof parents.metrics] ?? metric.labelKey;
        return (
          <Grid key={metric.key} size={{ xs: 6, md: 3 }}>
            <MetricCard icon={metric.icon} label={label} value={metric.count} variant="default" />
          </Grid>
        );
      })}
    </Grid>
  );
}
