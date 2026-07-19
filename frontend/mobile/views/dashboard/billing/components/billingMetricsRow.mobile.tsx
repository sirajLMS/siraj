"use client";

import { Box, Skeleton } from "@mui/material";
import { useMemo } from "react";
import type { MetricItem } from "@/frontend/common/views/dashboard/types/dashboard";
import type { BillingMetricsRowProps } from "@/frontend/common/views/dashboard/billing/types/billingMetrics.types";
import { MobileHorizontalScrollRow, MobileMetricCardGrid } from "@/frontend/mobile/components/ui";

export type { BillingMetricItem } from "@/frontend/common/views/dashboard/billing/types/billingMetrics.types";

export function BillingMetricsRowMobile({
  metrics,
  compact = false,
  loading = false,
}: Readonly<BillingMetricsRowProps>) {
  const metricItems: readonly MetricItem[] = useMemo(
    () =>
      metrics.map(metric => ({
        key: metric.key,
        label: metric.label,
        count: metric.value,
        icon: metric.icon,
        labelKey: metric.key,
        subLabel: metric.subLabel,
        variant: metric.variant,
      })),
    [metrics]
  );

  if (loading) {
    const skeletonKeys =
      metrics.length > 0 ? metrics.map(metric => metric.key) : ["outstanding", "paid", "next-due", "active-students"];

    return (
      <MobileHorizontalScrollRow>
        {skeletonKeys.map(key => (
          <Box
            key={`billing-metric-skeleton-${key}`}
            sx={{
              flex: "0 0 148px",
              minWidth: 148,
              scrollSnapAlign: "start",
            }}
          >
            <Skeleton variant="rounded" height={compact ? 88 : 120} sx={{ borderRadius: 2 }} />
          </Box>
        ))}
      </MobileHorizontalScrollRow>
    );
  }

  return <MobileMetricCardGrid metrics={metricItems} />;
}
