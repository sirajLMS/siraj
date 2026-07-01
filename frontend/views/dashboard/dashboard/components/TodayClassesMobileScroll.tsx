"use client";

import { Grid, styled } from "@mui/material";
import { useTranslations } from "next-intl";
import { MetricCard } from "@/frontend/components/ui";
import type { MetricCardVariant } from "@/frontend/components/ui/MetricCard";
import type { MetricItem } from "@/frontend/views/dashboard/types/dashboard";

interface TodayClassesMobileScrollProps {
  readonly metrics: readonly MetricItem[];
  readonly onMetricClick?: (key: string) => void;
  readonly selectedKey?: string;
}

// Horizontally scrollable container for metric cards on mobile viewport
const StyledScrollGrid = styled(Grid)(({ theme }) => ({
  overflowX: "auto",
  scrollbarWidth: "none",
  "&::-webkit-scrollbar": { display: "none" },
  border: `1px solid ${theme.palette.primary.main}`,
  borderRadius: 16,
}));

function toMetricVariant(key: string, isSelected: boolean): MetricCardVariant {
  if (isSelected) return "highlight";
  if (key === "suspended" || key === "absent" || key === "leave") return "error";
  return "default";
}

// Mobile scrollable list of metric cards for the Today's Classes section
// Each card displays a metric icon, count, and label, and supports click filtering
export function TodayClassesMobileScroll({ metrics, onMetricClick, selectedKey }: TodayClassesMobileScrollProps) {
  const t = useTranslations();
  return (
    <StyledScrollGrid container columnSpacing={2}>
      {metrics.map(metric => {
        const MetricIcon = metric.icon;
        const isSelected = selectedKey === metric.key;
        const variant = toMetricVariant(metric.key, isSelected);

        return (
          <Grid key={metric.key} size={6} sx={{ flex: "0 0 auto" }}>
            <MetricCard
              icon={MetricIcon}
              label={metric.label ?? t(metric.labelKey)}
              value={typeof metric.count === "number" ? String(metric.count) : metric.count}
              variant={variant}
              onClick={onMetricClick ? () => onMetricClick(metric.key) : undefined}
              sx={{ cursor: "pointer" }}
            />
          </Grid>
        );
      })}
    </StyledScrollGrid>
  );
}
