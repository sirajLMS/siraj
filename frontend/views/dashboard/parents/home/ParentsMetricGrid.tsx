"use client";

import { Grid } from "@mui/material";
import { useTranslations } from "next-intl";
import { MetricCard } from "@/frontend/components/ui/MetricCard";
import type { MetricItem } from "@/frontend/views/dashboard/types/dashboard";

interface ParentsMetricGridProps {
  readonly metrics: readonly MetricItem[];
}

export function ParentsMetricGrid({ metrics }: Readonly<ParentsMetricGridProps>) {
  const t = useTranslations();

  return (
    <Grid container spacing={2} sx={{ mb: 4 }}>
      {metrics.map(metric => (
        <Grid key={metric.key} size={{ xs: 6, md: 4, lg: 2 }}>
          <MetricCard
            icon={metric.icon}
            label={t(metric.labelKey)}
            value={metric.count}
            variant={metric.key === "deactivated" ? "error" : "default"}
          />
        </Grid>
      ))}
    </Grid>
  );
}
