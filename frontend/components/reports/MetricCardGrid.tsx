import type { Breakpoint } from "@mui/material";
import Grid, { type GridSize } from "@mui/material/Grid";
import { useTranslations } from "next-intl";
import { MetricCard } from "@/frontend/components/ui";
import type { MetricItem } from "@/frontend/views/dashboard/types/dashboard";

type ResponsiveStyleValue<T> = T | Array<T | null> | { [key in Breakpoint]?: T | null };

interface MetricCardGridProps {
  readonly metrics: readonly MetricItem[];
  readonly onMetricClick?: (key: string) => void;
  readonly selectedKey?: string;
  readonly size?: ResponsiveStyleValue<GridSize>;
}
const defaultSize = { xs: 6, sm: 4, md: 3, lg: 2 };

export function MetricCardGrid({ metrics, onMetricClick, selectedKey, size }: MetricCardGridProps) {
  const t = useTranslations();

  return (
    <Grid container spacing={2}>
      {metrics.map((metric, index) => (
        <Grid key={metric.key} size={size ?? defaultSize}>
          <MetricCard
            icon={metric.icon}
            label={metric.label ?? t(metric.labelKey)}
            value={metric.count}
            subLabel={metric.subLabel}
            variant={selectedKey === metric.key ? "highlight" : metric.variant}
            animated
            animationIndex={index}
            onClick={
              onMetricClick
                ? () => {
                    onMetricClick(metric.key);
                  }
                : undefined
            }
          />
        </Grid>
      ))}
    </Grid>
  );
}
