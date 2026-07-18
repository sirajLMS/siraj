"use client";

import type { Breakpoint, SxProps, Theme } from "@mui/material";
import Grid, { type GridSize } from "@mui/material/Grid";
import { resolveMetricLabel } from "@/frontend/common/components/reports/MetricCardGrid";
import type { MetricItem } from "@/frontend/common/views/dashboard/types/dashboard";
import { MobileMetricCard } from "@/frontend/mobile/components/ui/card/MobileMetricCard";
import { useAppTranslation } from "@/shared/locale";

type ResponsiveStyleValue<T> = T | Array<T | null> | { [key in Breakpoint]?: T | null };

const defaultSize = { xs: 6, sm: 6, md: 6 };

export interface MobileMetricCardGridProps {
  readonly metrics: readonly MetricItem[];
  readonly onMetricClick?: (key: string) => void;
  readonly selectedKey?: string;
  readonly size?: ResponsiveStyleValue<GridSize>;
  readonly layout?: "grid" | "scroll";
  readonly sx?: SxProps<Theme>;
}

export function MobileMetricCardGrid({
  metrics,
  onMetricClick,
  selectedKey,
  size,
  layout = "grid",
  sx,
}: MobileMetricCardGridProps) {
  const translations = useAppTranslation();

  const renderCard = (metric: MetricItem, index: number) => {
    const label = metric.label || resolveMetricLabel(metric.labelKey, translations);
    return (
      <MobileMetricCard
        {...metric}
        label={label}
        value={metric.count}
        variant={selectedKey === metric.key ? "highlight" : (metric.variant ?? "compact")}
        size="compact"
        animationIndex={index}
        onClick={onMetricClick ? () => onMetricClick(metric.key) : undefined}
      />
    );
  };

  // Mobile: horizontal scroll layout
  if (layout === "scroll") {
    return (
      <Grid container spacing={2} sx={sx}>
        {metrics.map((metric, index) => (
          <Grid key={metric.key} size={size ?? defaultSize}>
            {renderCard(metric, index)}
          </Grid>
        ))}
      </Grid>
    );
  }

  // Default: 2-col grid with compact cards
  return (
    <Grid container spacing={2} sx={sx}>
      {metrics.map((metric, index) => (
        <Grid key={metric.key} size={size ?? defaultSize}>
          {renderCard(metric, index)}
        </Grid>
      ))}
    </Grid>
  );
}
