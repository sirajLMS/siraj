"use client";

import { Grid } from "@mui/material";
import { MetricCard } from "@/frontend/common/components/ui/card/MetricCard";
import type { MetricItem } from "@/frontend/common/types/shared.types";
import { Translation, useAppTranslation } from "@/shared/locale";

interface ParentsMetricGridProps {
  readonly metrics: readonly MetricItem[];
}

function isStringKeyOf<T extends Record<string, unknown>>(
  value: string | undefined,
  obj: T
): value is keyof T & string {
  return value !== undefined && value in obj;
}

export function ParentsMetricGrid({ metrics }: Readonly<ParentsMetricGridProps>) {
  const t = useAppTranslation(Translation.Dashboard.ParentsDirectory);
  const parents = t;

  return (
    <Grid container spacing={2} sx={{ mb: 4 }}>
      {metrics.map(metric => {
        const parts = metric.labelKey.split(".");
        const key = parts.at(-1);
        const label = isStringKeyOf(key, parents.metrics) ? parents.metrics[key] : metric.labelKey;
        return (
          <Grid key={metric.key} size={{ xs: 6, md: 3 }}>
            <MetricCard icon={metric.icon} label={label} value={metric.count} variant="default" />
          </Grid>
        );
      })}
    </Grid>
  );
}
