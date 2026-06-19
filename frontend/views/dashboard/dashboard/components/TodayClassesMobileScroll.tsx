"use client";

import { Grid, styled, Typography } from "@mui/material";
import { useTranslations } from "next-intl";
import type { MetricItem } from "@/frontend/views/dashboard/types/dashboard";

interface TodayClassesMobileScrollProps {
  readonly metrics: readonly MetricItem[];
  readonly onMetricClick?: (key: string) => void;
  readonly selectedKey?: string;
}

const StyledScrollGrid = styled(Grid)(({ theme }) => ({
  overflowX: "auto",
  scrollbarWidth: "none",
  "&::-webkit-scrollbar": { display: "none" },
  border: `1px solid ${theme.palette.primary.main}`,
  borderRadius: 16,
}));

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
  bgcolor: isSelected ? theme.palette.primaryContainer : theme.palette.background.paper,
  display: "flex",
  alignItems: "center",
  boxShadow: theme.palette.shadow.card,
  cursor: "pointer",
  transition: "all 0.2s ease-in-out",
  flex: "0 0 auto",
}));

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

const StyledTextContainer = styled(Grid)(() => ({
  display: "flex",
  flexDirection: "column",
  gap: 8
}));

const MetricCount = styled(Typography)(({ theme }) => ({
  fontFamily: theme.typography.h3.fontFamily,
  fontWeight: 700,
  color: theme.palette.primary.main,
  lineHeight: 1,
}));

const MetricLabel = styled(Typography)(({ theme }) => ({
  fontFamily: theme.typography.caption.fontFamily,
  color: theme.palette.text.secondary,
}));

export function TodayClassesMobileScroll({ metrics, onMetricClick, selectedKey }: TodayClassesMobileScrollProps) {
  const t = useTranslations();
  return (
    <StyledScrollGrid container columnSpacing={2}>
      {metrics.map(metric => {
        const MetricIcon = metric.icon;
        const isError = metric.key === "cancelled" || metric.key === "noShow" || metric.key === "needCover";
        const isSelected = selectedKey === metric.key;

        return (
          <StyledMetricCard
            key={metric.key}
            size={6}
            isSelected={isSelected}
            onClick={() => onMetricClick?.(metric.key)}
          >
            <StyledIconWrapper size={16} isError={isError}>
              <MetricIcon sx={{ fontSize: 20 }} />
            </StyledIconWrapper>
            <StyledTextContainer size="auto">
              <MetricCount>
                {typeof metric.count === "number" ? metric.count.toLocaleString() : metric.count}
              </MetricCount>
              <MetricLabel
                variant="labelUppercase"
              >{metric.label ?? t(metric.labelKey)}</MetricLabel>
            </StyledTextContainer>
          </StyledMetricCard>
        );
      })}
    </StyledScrollGrid>
  );
}
