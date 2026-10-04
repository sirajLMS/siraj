"use client";

import { Typography } from "@mui/material";
import type { MetricItem } from "@/frontend/common/types/shared.types";
import type { MetricsOutputProps } from "@/frontend/common/views/dashboard/supervisor/monthly-reports/types/monthlyReportsTypes";
import { DesktopMetricCardGrid } from "@/frontend/desktop/components/ui/card/MetricCardGrid";

export function MetricsOutput({ loading, metrics, labels }: MetricsOutputProps) {
  if (loading) {
    return (
      <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.text.secondary })}>
        {labels.loadingMessage}
      </Typography>
    );
  }
  if (metrics.length === 0) {
    return (
      <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
        {labels.noDataAvailable}
      </Typography>
    );
  }
  return (
    <DesktopMetricCardGrid
      metrics={
        metrics.map((metric, index) => ({
          key: `${metric.label}-${index}`,
          count: metric.value,
          labelKey: metric.label,
          label: metric.label,
          icon: metric.icon,
        })) satisfies MetricItem[]
      }
      size={{ xs: 12, sm: 6, md: 3 }}
    />
  );
}
