"use client";

import { Box } from "@mui/material";
import { useTranslations } from "next-intl";
import { MetricCard } from "@/frontend/components/ui";
import type { MetricCardVariant } from "@/frontend/components/ui/MetricCard";
import type { MetricItem } from "@/frontend/views/dashboard/types/dashboard";

interface TodayClassesMobileScrollProps {
  readonly metrics: readonly MetricItem[];
  readonly onMetricClick?: (key: string) => void;
  readonly selectedKey?: string;
}

function toMetricVariant(key: string, isSelected: boolean): MetricCardVariant {
  if (isSelected) return "highlight";
  if (key === "suspended" || key === "absent" || key === "leave") return "error";
  return "compact";
}

// Mobile scrollable list of metric cards for the Today's Classes section
// Each card displays a metric icon, count, and label, and supports click filtering
export function TodayClassesMobileScroll({ metrics, onMetricClick, selectedKey }: TodayClassesMobileScrollProps) {
  const t = useTranslations();
  return (
    <Box
      sx={{
        display: "flex",
        gap: 1.5,
        overflowX: "auto",
        overflowY: "hidden",
        scrollSnapType: "x proximity",
        pb: 0.5,
        scrollbarWidth: "none",
        "&::-webkit-scrollbar": { display: "none" },
        pr: 0.25,
      }}
    >
      {metrics.map(metric => {
        const MetricIcon = metric.icon;
        const isSelected = selectedKey === metric.key;
        const variant = toMetricVariant(metric.key, isSelected);

        return (
          <Box
            key={metric.key}
            sx={{
              flex: "0 0 calc((100% - 12px) / 2)",
              minWidth: "calc((100% - 12px) / 2)",
              scrollSnapAlign: "start",
            }}
          >
            <MetricCard
              icon={MetricIcon}
              label={metric.label ?? t(metric.labelKey)}
              value={typeof metric.count === "number" ? String(metric.count) : metric.count}
              variant={variant}
              onClick={onMetricClick ? () => onMetricClick(metric.key) : undefined}
              sx={{ cursor: "pointer" }}
            />
          </Box>
        );
      })}
    </Box>
  );
}
