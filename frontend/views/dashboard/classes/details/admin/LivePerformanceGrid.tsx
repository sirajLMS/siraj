"use client";

import type { SvgIconComponent } from "@mui/icons-material";
import ChecklistIcon from "@mui/icons-material/Checklist";
import FavoriteIcon from "@mui/icons-material/Favorite";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { Box, Stack, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import { MetricCardGrid } from "@/frontend/components/reports/MetricCardGrid";
import type { PerformanceMetric } from "@/frontend/views/dashboard/types/dashboard";

const METRIC_ICONS: Record<string, SvgIconComponent> = {
  engagement: TrendingUpIcon,
  assessment: ChecklistIcon,
  focus: VisibilityIcon,
  health: FavoriteIcon,
};

import { classDetailsContentPaddingSx } from "../classDetailsMobileLayout";

interface LivePerformanceGridProps {
  readonly metrics: readonly PerformanceMetric[];
  readonly hasData: boolean;
  readonly labels: {
    readonly livePerformanceOverview: string;
    readonly last30Mins: string;
    readonly engagementScore: string;
    readonly assessmentProgress: string;
    readonly focusLevel: string;
    readonly sessionHealth: string;
    readonly noData: string;
  };
}

const StyledSectionTitle = styled(Typography)(() => ({}));

const StyledTimeRangeChip = styled(Box)(() => ({}));

const StyledTimeRangeCaption = styled(Typography)(() => ({}));

export function LivePerformanceGrid({ metrics, hasData, labels }: LivePerformanceGridProps) {
  const labelMap: Record<string, string> = {
    engagementScore: labels.engagementScore,
    assessmentProgress: labels.assessmentProgress,
    focusLevel: labels.focusLevel,
    sessionHealth: labels.sessionHealth,
  };

  const metricItems = metrics.map(m => ({
    key: m.key,
    count: m.value,
    labelKey: m.key,
    label: labelMap[m.labelKey] ?? m.labelKey,
    icon: METRIC_ICONS[m.key] ?? TrendingUpIcon,
    variant: "highlight" as const,
  }));

  return (
    <Box sx={classDetailsContentPaddingSx}>
      <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <StyledSectionTitle variant="headlineMd" sx={theme => ({ color: theme.palette.primary.main })}>
          {labels.livePerformanceOverview}
        </StyledSectionTitle>
        {hasData ? (
          <StyledTimeRangeChip
            sx={theme => ({
              paddingInline: theme.spacing(2),
              paddingBlock: theme.spacing(0.75),
              border: 1,
              borderColor: theme.palette.border.light,
              borderRadius: 2,
              backgroundColor: theme.palette.background.paper,
            })}
          >
            <StyledTimeRangeCaption variant="caption" sx={theme => ({ color: theme.palette.text.secondary })}>
              {labels.last30Mins}
            </StyledTimeRangeCaption>
          </StyledTimeRangeChip>
        ) : null}
      </Stack>

      {hasData ? (
        <MetricCardGrid metrics={metricItems} size={{ md: 3, lg: "grow" }} />
      ) : (
        <Typography
          variant="body2"
          sx={theme => ({ color: theme.palette.onSurfaceVariant, py: 4, textAlign: "center" })}
        >
          {labels.noData}
        </Typography>
      )}
    </Box>
  );
}
