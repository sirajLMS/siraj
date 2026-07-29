"use client";

import type { Breakpoint } from "@mui/material";
import { Box } from "@mui/material";
import Grid, { type GridSize } from "@mui/material/Grid";
import { useMetricLabelSources } from "@/frontend/common/components/reports/metricCardLabelSources";
import type { MetricLabelSources } from "@/frontend/common/components/reports/metricCardLabelUtils";
import { resolveMetricLabel } from "@/frontend/common/components/reports/metricCardLabelUtils";
import { MetricCard } from "@/frontend/common/components/ui/card/MetricCard";
import { HorizontalScrollRow } from "@/frontend/common/components/ui/container/HorizontalScrollRow";
import type { MetricItem } from "@/frontend/common/types/shared.types";

type ResponsiveStyleValue<T> = T | Array<T | null> | { [key in Breakpoint]?: T | null };

type MetricCardGridLayout = "grid" | "scroll";

interface MetricCardGridProps {
  readonly metrics: readonly MetricItem[];
  readonly onMetricClick?: (key: string) => void;
  readonly selectedKey?: string;
  readonly size?: ResponsiveStyleValue<GridSize>;
  readonly layout?: MetricCardGridLayout;
}

const defaultSize = { xs: 6, sm: 4, md: 3, lg: 2 };

function renderMetricCard({
  metric,
  index,
  selectedKey,
  onMetricClick,
  labelSources,
}: {
  metric: MetricItem;
  index: number;
  selectedKey?: string;
  onMetricClick?: (key: string) => void;
  labelSources: MetricLabelSources;
}) {
  const label = metric.label || resolveMetricLabel(metric.labelKey, labelSources);
  return (
    <MetricCard
      icon={metric.icon}
      label={label}
      value={metric.count}
      subLabel={metric.subLabel}
      variant={selectedKey === metric.key ? "highlight" : metric.variant}
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

export function MetricCardGrid({ metrics, onMetricClick, selectedKey, size, layout = "grid" }: MetricCardGridProps) {
  const labelSources = useMetricLabelSources();
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
            {renderMetricCard({ metric, index, selectedKey, onMetricClick, labelSources })}
          </Box>
        ))}
      </HorizontalScrollRow>
    );
  }

  return (
    <Grid container spacing={2}>
      {metrics.map((metric, index) => (
        <Grid key={metric.key} size={size ?? defaultSize} sx={{ minWidth: 0 }}>
          {renderMetricCard({ metric, index, selectedKey, onMetricClick, labelSources })}
        </Grid>
      ))}
    </Grid>
  );
}
