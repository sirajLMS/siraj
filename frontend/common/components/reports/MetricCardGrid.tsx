"use client";

import type { Breakpoint } from "@mui/material";
import { Box } from "@mui/material";
import Grid, { type GridSize } from "@mui/material/Grid";
import { MetricCard } from "@/frontend/common/components/ui/card/MetricCard";
import { HorizontalScrollRow } from "@/frontend/common/components/ui/container/HorizontalScrollRow";
import type { MetricItem } from "@/frontend/common/views/dashboard/types/dashboard";
import { useAppTranslation } from "@/shared/locale";

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

function resolveDashboardTranslation(
  path: string,
  translations: ReturnType<typeof useAppTranslation>
): string | undefined {
  const parts = path.split(".");
  let ns = parts[1];
  if (ns === "statusTracking") {
    ns = "coreStatusTracking";
  }
  const section = translations.dashboardTranslations[ns as keyof typeof translations.dashboardTranslations];
  if (!section) {
    return undefined;
  }
  let curr: unknown = section;
  for (let i = 2; i < parts.length; i++) {
    if (curr && typeof curr === "object") {
      curr = (curr as Record<string, unknown>)[parts[i]];
    } else {
      return undefined;
    }
  }
  return typeof curr === "string" ? curr : undefined;
}

export function resolveMetricLabel(path: string, translations: ReturnType<typeof useAppTranslation>): string {
  if (path.startsWith("dashboard.")) {
    const val = resolveDashboardTranslation(path, translations);
    if (val !== undefined) {
      return val;
    }
  } else if (path.startsWith("metrics.")) {
    const parts = path.split(".");
    const resolved =
      translations.dashboardTranslations.coreStatusTracking.metrics[
        parts[1] as keyof typeof translations.dashboardTranslations.coreStatusTracking.metrics
      ];
    if (typeof resolved === "string") {
      return resolved;
    }
  }

  const commonT = translations.commonTranslations as unknown as Record<string, unknown>;
  if (path in commonT && typeof commonT[path] === "string") {
    return commonT[path] as string;
  }

  return path;
}

function renderMetricCard({
  metric,
  index,
  selectedKey,
  onMetricClick,
  isScroll,
  translations,
}: {
  metric: MetricItem;
  index: number;
  selectedKey?: string;
  onMetricClick?: (key: string) => void;
  isScroll: boolean;
  translations: ReturnType<typeof useAppTranslation>;
}) {
  const label = metric.label || resolveMetricLabel(metric.labelKey, translations);
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

export function MetricCardGrid({ metrics, onMetricClick, selectedKey, size, layout = "grid" }: MetricCardGridProps) {
  const translations = useAppTranslation();
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
            {renderMetricCard({ metric, index, selectedKey, onMetricClick, isScroll, translations })}
          </Box>
        ))}
      </HorizontalScrollRow>
    );
  }

  return (
    <Grid container spacing={2}>
      {metrics.map((metric, index) => (
        <Grid key={metric.key} size={size ?? defaultSize} sx={{ minWidth: 0 }}>
          {renderMetricCard({ metric, index, selectedKey, onMetricClick, isScroll, translations })}
        </Grid>
      ))}
    </Grid>
  );
}
