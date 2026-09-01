"use client";

import { useMemo } from "react";
import type { MetricItem } from "@/frontend/common/types/shared.types";
import type { BillingMetricsRowProps } from "@/frontend/common/views/dashboard/billing/types/billingMetrics.types";
import { MobileMetricCardGrid } from "@/frontend/mobile/components/ui";

const FALLBACK_LOADING_COUNT = 4;
const COMPACT_CARD_HEIGHT = 88;
const REGULAR_CARD_HEIGHT = 120;

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

  const loadingCount = metricItems.length > 0 ? metricItems.length : FALLBACK_LOADING_COUNT;
  const loadingCardHeight = compact ? COMPACT_CARD_HEIGHT : REGULAR_CARD_HEIGHT;

  return (
    <MobileMetricCardGrid
      metrics={metricItems}
      loading={loading}
      loadingCount={loadingCount}
      loadingCardHeight={loadingCardHeight}
    />
  );
}
