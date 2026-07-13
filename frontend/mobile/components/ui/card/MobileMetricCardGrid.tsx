"use client";

import type { SxProps, Theme } from "@mui/material";
import { Grid } from "@mui/material";
import { MetricCardGrid } from "@/frontend/common/components/reports/MetricCardGrid";
import { MetricCard } from "@/frontend/common/components/ui/card/MetricCard";
import { useViewport } from "@/frontend/common/hooks/useViewport";
import type { MetricItem } from "@/frontend/views/dashboard/types/dashboard";

export interface MobileMetricCardGridProps {
  readonly metrics: readonly MetricItem[];
  readonly layout?: "grid" | "scroll";
  readonly onMetricClick?: (key: string) => void;
  readonly selectedKey?: string;
  readonly sx?: SxProps<Theme>;
}

export function MobileMetricCardGrid({
  metrics,
  layout = "grid",
  onMetricClick,
  selectedKey,
  sx,
}: MobileMetricCardGridProps) {
  const { isMobile } = useViewport();

  // On mobile: use 2-col grid with compact cards or horizontal scroll
  // On desktop: delegate to MetricCardGrid (which handles its own responsive)
  if (isMobile) {
    if (layout === "scroll") {
      return (
        <MetricCardGrid metrics={metrics} layout="scroll" onMetricClick={onMetricClick} selectedKey={selectedKey} />
      );
    }
    // Default: 2-col grid with compact cards
    return (
      <Grid container spacing={2} sx={sx}>
        {metrics.map(metric => (
          <Grid key={metric.key} size={6}>
            <MetricCard
              {...metric}
              label={metric.label ?? metric.labelKey}
              value={metric.count}
              variant={metric.variant ?? "compact"}
              size="compact"
              onClick={onMetricClick ? () => onMetricClick(metric.key) : undefined}
            />
          </Grid>
        ))}
      </Grid>
    );
  }

  // Desktop: delegate to MetricCardGrid
  return <MetricCardGrid metrics={metrics} layout={layout} onMetricClick={onMetricClick} selectedKey={selectedKey} />;
}
