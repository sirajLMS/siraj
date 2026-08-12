"use client";

import type { Breakpoint } from "@mui/material";
import { Box } from "@mui/material";
import Grid, { type GridSize } from "@mui/material/Grid";
import { useMetricLabelSources } from "@/frontend/common/components/reports/metricCardLabelSources";
import type { MetricLabelSources } from "@/frontend/common/components/reports/metricCardLabelUtils";
import { resolveMetricLabel } from "@/frontend/common/components/reports/metricCardLabelUtils";
import type { MetricCardDensity } from "@/frontend/common/components/ui/card/MetricCard/utils";
import type { MetricItem } from "@/frontend/common/types/shared.types";
import { DesktopMetricCard } from "@/frontend/desktop/components/ui/card/MetricCard/DesktopMetricCard";
import { DesktopHorizontalScrollRow } from "@/frontend/desktop/components/ui/container/DesktopHorizontalScrollRow";

type ResponsiveStyleValue<T> = T | Array<T | null> | { [key in Breakpoint]?: T | null };

type MetricCardGridLayout = "grid" | "scroll";

export interface DesktopMetricCardGridProps {
  readonly metrics: readonly MetricItem[];
  readonly onMetricClick?: (key: string) => void;
  readonly selectedKey?: string;
  readonly size?: ResponsiveStyleValue<GridSize>;
  readonly layout?: MetricCardGridLayout;
  readonly density?: MetricCardDensity;
}

const defaultSize = { xs: 6, sm: 4, md: 3, lg: 2 };

function renderMetricCard({
  metric,
  index,
  selectedKey,
  onMetricClick,
  labelSources,
  density,
}: {
  metric: MetricItem;
  index: number;
  selectedKey?: string;
  onMetricClick?: (key: string) => void;
  labelSources: MetricLabelSources;
  density?: MetricCardDensity;
}) {
  const label = metric.label || resolveMetricLabel(metric.labelKey, labelSources);
  return (
    <DesktopMetricCard
      icon={metric.icon}
      label={label}
      value={metric.count}
      subLabel={metric.subLabel}
      variant={selectedKey === metric.key ? "highlight" : metric.variant}
      animationIndex={index}
      density={density}
      sx={{ width: "100%" }}
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

export function DesktopMetricCardGrid({
  metrics,
  onMetricClick,
  selectedKey,
  size,
  layout = "grid",
  density = "default",
}: DesktopMetricCardGridProps) {
  const labelSources = useMetricLabelSources();

  if (layout === "scroll") {
    return (
      <DesktopHorizontalScrollRow>
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
            {renderMetricCard({ metric, index, selectedKey, onMetricClick, labelSources, density })}
          </Box>
        ))}
      </DesktopHorizontalScrollRow>
    );
  }

  return (
    <Grid container spacing={2} sx={{ alignItems: "stretch" }}>
      {metrics.map((metric, index) => (
        <Grid key={metric.key} size={size ?? defaultSize} sx={{ minWidth: 0, display: "flex" }}>
          <Box sx={{ display: "flex", width: "100%" }}>
            {renderMetricCard({ metric, index, selectedKey, onMetricClick, labelSources, density })}
          </Box>
        </Grid>
      ))}
    </Grid>
  );
}
