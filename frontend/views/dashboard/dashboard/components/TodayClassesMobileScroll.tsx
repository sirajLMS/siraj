"use client";

import { Grid, styled, Typography } from "@mui/material";
import { useTranslations } from "next-intl";
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

// Individual metric card in horizontal scroll - handles selection state and tap feedback
const StyledMetricCard = styled(Grid, {
  shouldForwardProp: prop => prop !== "isSelected",
})<{ isSelected: boolean }>(({ theme, isSelected }) => ({
  paddingBlock: 8,
  paddingInlineStart: 16,
  gap: 16,
  flexShrink: 0,
  maxHeight: 64,
  // borderRadius: 16,
  // border: isSelected ? `1px solid ${theme.palette.primary.main}` : `1px solid ${theme.palette.border.light}`,
  backgroundColor: isSelected ? theme.palette.primaryContainer : theme.palette.background.paper,
  display: "flex",
  alignItems: "center",
  boxShadow: theme.palette.shadow.card,
  cursor: "pointer",
  transition: "all 0.2s ease-in-out",
  flex: "0 0 auto",
}));

// Circular icon wrapper - changes border color based on error/warning metric types
const StyledIconWrapper = styled(Grid, {
  shouldForwardProp: prop => prop !== "isError",
})<{ isError: boolean }>(({ theme, isError }) => ({
  width: 40,
  height: 40,
  borderRadius: "50%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  border: `1px solid ${isError ? theme.palette.error.main : theme.palette.header}`,
  color: isError ? theme.palette.error.main : theme.palette.header,
}));

// Vertical container for metric count and label text
const StyledTextContainer = styled(Grid)(() => ({
  display: "flex",
  flexDirection: "column",
  gap: 8,
}));

// Numeric count displayed in large bold primary color
const MetricCount = styled(Typography)(({ theme }) => ({
  fontFamily: theme.typography.h3.fontFamily,
  fontWeight: 700,
  color: theme.palette.primary.main,
  lineHeight: 1,
}));

// Metric name label in secondary text color with uppercase variant
const MetricLabel = styled(Typography)(({ theme }) => ({
  fontFamily: theme.typography.caption.fontFamily,
  color: theme.palette.text.secondary,
}));

// Mobile scrollable list of metric cards for the Today's Classes section
// Each card displays a metric icon, count, and label, and supports click filtering
export function TodayClassesMobileScroll({ metrics, onMetricClick, selectedKey }: TodayClassesMobileScrollProps) {
  const t = useTranslations();
  return (
    <StyledScrollGrid container columnSpacing={2}>
      {metrics.map(metric => {
        const MetricIcon = metric.icon;
        const isError = metric.key === "suspended" || metric.key === "absent" || metric.key === "leave";
        const isSelected = selectedKey === metric.key;

        return (
          <StyledMetricCard
            key={metric.key}
            size={6}
            isSelected={isSelected}
            onClick={() => onMetricClick?.(metric.key)}
          >
            {/* Metric icon in circular wrapper with error-aware border color */}
            <StyledIconWrapper size={16} isError={isError}>
              <MetricIcon sx={{ fontSize: 20 }} />
            </StyledIconWrapper>
            {/* Metric count and label text */}
            <StyledTextContainer size="auto">
              <MetricCount>
                {typeof metric.count === "number" ? metric.count.toLocaleString() : metric.count}
              </MetricCount>
              <MetricLabel variant="labelUppercase">{metric.label ?? t(metric.labelKey)}</MetricLabel>
            </StyledTextContainer>
          </StyledMetricCard>
        );
      })}
    </StyledScrollGrid>
  );
}
