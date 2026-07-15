"use client";

import type { Breakpoint } from "@mui/material";
import { Box } from "@mui/material";
import Grid, { type GridSize } from "@mui/material/Grid";
import { MetricCard } from "@/frontend/common/components/ui/card/MetricCard";
import { HorizontalScrollRow } from "@/frontend/common/components/ui/container/HorizontalScrollRow";
import type { MetricItem } from "@/frontend/common/views/dashboard/types/dashboard";
import { useAppTranslation } from "@/shared/locale/client";

type ResponsiveStyleValue<T> = T | Array<T | null> | { [key in Breakpoint]?: T | null };

type MetricCardGridLayout = "grid" | "scroll";

interface MetricCardGridProps {
  readonly metrics: readonly MetricItem[];
  readonly onMetricClick?: (key: string) => void;
  readonly selectedKey?: string;
  readonly size?: ResponsiveStyleValue<GridSize>;
  readonly layout?: MetricCardGridLayout;
  /** Optional namespace for translations. If provided, uses useAppTranslation(namespace).
   * If not provided, expects metrics to have pre-resolved labels in `metric.label`. */
  readonly translationNamespace?: string;
}

const defaultSize = { xs: 6, sm: 4, md: 3, lg: 2 };

function renderMetricCard({
  metric,
  index,
  selectedKey,
  onMetricClick,
  isScroll,
  t,
}: {
  metric: MetricItem;
  index: number;
  selectedKey?: string;
  onMetricClick?: (key: string) => void;
  isScroll: boolean;
  t: ReturnType<typeof useAppTranslation> | ((key: string) => string);
}) {
  const label = metric.label ?? t(metric.labelKey);
  return (
    <MetricCard
      icon={metric.icon}
      label={label}
      value={metric.count}
      subLabel={metric.subLabel}
      variant={selectedKey === metric.key ? "highlight" : metric.variant}
      size={isScroll ? "compact" : "default"}
      animationIndex={index}
      onClick={
        onMetricClick
          ? () => {
              onMetricClick(metric.key);
            }
          : undefined
      }
    />
  );
}

export function MetricCardGrid({
  metrics,
  onMetricClick,
  selectedKey,
  size,
  layout = "grid",
  translationNamespace,
}: MetricCardGridProps) {
  const t = translationNamespace ? useAppTranslation(translationNamespace) : (key: string) => key;
  const isScroll = layout === "scroll";

  if (isScroll) {
    return (
      <HorizontalScrollRow>
        {metrics.map((metric, index) => (
          <Box
            key={metric.key}
            sx={{
              flex: "0 0 148px",
              minWidth: 148,
              scrollSnapAlign: "start",
              borderRadius: 0,
            }}
          >
            {renderMetricCard({ metric, index, selectedKey, onMetricClick, isScroll, t })}
          </Box>
        ))}
      </HorizontalScrollRow>
    );
  }

  return (
    <Grid container spacing={2}>
      {metrics.map((metric, index) => (
        <Grid key={metric.key} size={size ?? defaultSize} sx={{ minWidth: 0 }}>
          {renderMetricCard({ metric, index, selectedKey, onMetricClick, isScroll, t })}
        </Grid>
      ))}
    </Grid>
  );
}
