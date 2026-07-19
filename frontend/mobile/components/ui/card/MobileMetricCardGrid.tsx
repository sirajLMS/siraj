"use client";

import { Box, type SxProps, type Theme } from "@mui/material";
import { resolveMetricLabel } from "@/frontend/common/components/reports/MetricCardGrid";
import type { MetricItem } from "@/frontend/common/views/dashboard/types/dashboard";
import { MobileMetricCard } from "@/frontend/mobile/components/ui/card/MobileMetricCard";
import { MobileHorizontalScrollRow } from "@/frontend/mobile/components/ui/container/MobileHorizontalScrollRow";
import { useAppTranslation } from "@/shared/locale";

export interface MobileMetricCardGridProps {
  readonly metrics: readonly MetricItem[];
  readonly onMetricClick?: (key: string) => void;
  readonly selectedKey?: string;
  readonly sx?: SxProps<Theme>;
}

export function MobileMetricCardGrid({ metrics, onMetricClick, selectedKey, sx }: MobileMetricCardGridProps) {
  const translations = useAppTranslation();

  return (
    <MobileHorizontalScrollRow sx={sx}>
      {metrics.map((metric, index) => {
        const label = metric.label || resolveMetricLabel(metric.labelKey, translations);
        return (
          <Box
            key={metric.key}
            sx={{
              flex: "0 0 148px",
              minWidth: 148,
              scrollSnapAlign: "start",
            }}
          >
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
