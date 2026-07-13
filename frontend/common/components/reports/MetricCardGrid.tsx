"use client";

import type { Breakpoint } from "@mui/material";
import { Box } from "@mui/material";
import Grid, { type GridSize } from "@mui/material/Grid";
import { useTranslations } from "next-intl";
import { MetricCard } from "@/frontend/common/components/ui/card/MetricCard";
import { HorizontalScrollRow } from "@/frontend/common/components/ui/container/HorizontalScrollRow";
import type { MetricItem } from "@/frontend/common/views/dashboard/types/dashboard";

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
  isScroll,
  t,
}: {
  metric: MetricItem;
  index: number;
  selectedKey?: string;
  onMetricClick?: (key: string) => void;
  isScroll: boolean;
  t: ReturnType<typeof useTranslations>;
}) {
  return (
    <MetricCard
      icon={metric.icon}
      label={metric.label ?? t(metric.labelKey)}
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

export function MetricCardGrid({ metrics, onMetricClick, selectedKey, size, layout = "grid" }: MetricCardGridProps) {
  const t = useTranslations();
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
