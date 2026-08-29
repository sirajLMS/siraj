"use client";

import { Box, Skeleton, type SxProps, type Theme } from "@mui/material";
import { useMetricLabelSources } from "@/frontend/common/components/reports/metricCardLabelSources";
import { resolveMetricLabel } from "@/frontend/common/components/reports/metricCardLabelUtils";
import type { MetricItem } from "@/frontend/common/types/shared.types";
import { MobileMetricCard } from "@/frontend/mobile/components/ui/card/MetricCard/MobileMetricCard";
import { MobileHorizontalScrollRow } from "@/frontend/mobile/components/ui/container/MobileHorizontalScrollRow";

/** Fixed cell geometry shared by metric cards and their loading skeletons. */
const METRIC_CELL_SX = { flex: "0 0 148px", minWidth: 148, scrollSnapAlign: "start" } as const satisfies SxProps<Theme>;

const DEFAULT_LOADING_COUNT = 3;
const DEFAULT_LOADING_CARD_HEIGHT = 120;

export interface MobileMetricCardGridProps {
  readonly metrics: readonly MetricItem[];
  readonly onMetricClick?: (key: string) => void;
  readonly selectedKey?: string;
  /** Renders skeleton placeholders (sharing the card geometry) instead of metric cards. */
  readonly loading?: boolean;
  /** Number of skeleton cards rendered while `loading` is active. */
  readonly loadingCount?: number;
  /** Skeleton card height in px; match the card density of the surrounding layout. */
  readonly loadingCardHeight?: number;
  readonly sx?: SxProps<Theme>;
}

export function MobileMetricCardGrid({
  metrics,
  onMetricClick,
  selectedKey,
  loading = false,
  loadingCount = DEFAULT_LOADING_COUNT,
  loadingCardHeight = DEFAULT_LOADING_CARD_HEIGHT,
  sx,
}: MobileMetricCardGridProps) {
  const labelSources = useMetricLabelSources();

  if (loading) {
    const skeletonKeys = Array.from({ length: loadingCount }, (_, index) => `metric-skeleton-${index}`);
    return (
      <MobileHorizontalScrollRow sx={sx}>
        {skeletonKeys.map(skeletonKey => (
          <Box key={skeletonKey} sx={METRIC_CELL_SX}>
            <Skeleton variant="rounded" height={loadingCardHeight} sx={{ borderRadius: 2 }} />
          </Box>
        ))}
      </MobileHorizontalScrollRow>
    );
  }

  return (
    <MobileHorizontalScrollRow sx={sx}>
      {metrics.map((metric, index) => {
        const label = metric.label ?? resolveMetricLabel(metric.labelKey, labelSources);
        return (
          <Box key={metric.key} sx={METRIC_CELL_SX}>
            <MobileMetricCard
              icon={metric.icon}
              label={label}
              value={metric.count}
              subLabel={metric.subLabel}
              variant={selectedKey === metric.key ? "highlight" : (metric.variant ?? "default")}
              animationIndex={index}
              onClick={onMetricClick ? () => onMetricClick(metric.key) : undefined}
            />
          </Box>
        );
      })}
    </MobileHorizontalScrollRow>
  );
}
