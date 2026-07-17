"use client";

import type { SxProps, Theme } from "@mui/material";
import { Grid } from "@mui/material";
import { resolveMetricLabel } from "@/frontend/common/components/reports/MetricCardGrid";
import type { MetricItem } from "@/frontend/common/views/dashboard/types/dashboard";
import { MobileMetricCard } from "@/frontend/mobile/components/ui/card/MobileMetricCard";
import { useAppTranslation } from "@/shared/locale";

export interface MobileMetricCardGridProps {
  readonly metrics: readonly MetricItem[];
  readonly layout?: "grid" | "scroll";
  readonly onMetricClick?: (key: string) => void;
  readonly sx?: SxProps<Theme>;
}

export function MobileMetricCardGrid({ metrics, layout = "grid", onMetricClick, sx }: MobileMetricCardGridProps) {
  const translations = useAppTranslation();

  // Mobile: use 2-col grid with compact cards or horizontal scroll
  if (layout === "scroll") {
    return (
      <Grid container spacing={2} sx={sx}>
        {metrics.map(metric => {
          const label = metric.label || resolveMetricLabel(metric.labelKey, translations);
          return (
            <Grid key={metric.key} size={6}>
              <MobileMetricCard
                {...metric}
                label={label}
                value={metric.count}
                variant={metric.variant ?? "compact"}
                size="compact"
                onClick={onMetricClick ? () => onMetricClick(metric.key) : undefined}
              />
            </Grid>
          );
        })}
      </Grid>
    );
  }

  // Default: 2-col grid with compact cards
  return (
    <Grid container spacing={2} sx={sx}>
      {metrics.map(metric => {
        const label = metric.label || resolveMetricLabel(metric.labelKey, translations);
        return (
          <Grid key={metric.key} size={6}>
            <MobileMetricCard
              {...metric}
              label={label}
              value={metric.count}
              variant={metric.variant ?? "compact"}
              size="compact"
              onClick={onMetricClick ? () => onMetricClick(metric.key) : undefined}
            />
          </Grid>
        );
      })}
    </Grid>
  );
}
