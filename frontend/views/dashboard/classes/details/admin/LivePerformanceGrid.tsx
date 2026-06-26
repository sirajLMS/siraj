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

interface LivePerformanceGridProps {
  readonly metrics: readonly PerformanceMetric[];
  readonly labels: {
    readonly livePerformanceOverview: string;
    readonly last30Mins: string;
    readonly engagementScore: string;
    readonly assessmentProgress: string;
    readonly focusLevel: string;
    readonly sessionHealth: string;
  };
}

// Primary-colored headline used as the section title
const StyledSectionTitle = styled(Typography)(({ theme }) => ({
  color: theme.palette.primary.main,
}));

// Bordered paper-background chip that displays the time-range caption
const StyledTimeRangeChip = styled(Box)(({ theme }) => ({
  paddingInline: theme.spacing(2),
  paddingBlock: theme.spacing(0.75),
  border: 1,
  borderColor: theme.palette.border.light,
  borderRadius: 2,
  backgroundColor: theme.palette.background.paper,
}));

// Muted secondary-colored caption used inside the time-range chip
const StyledTimeRangeCaption = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.secondary,
}));

export function LivePerformanceGrid({ metrics, labels }: LivePerformanceGridProps) {
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
    <Box>
      <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <StyledSectionTitle variant="headlineMd">{labels.livePerformanceOverview}</StyledSectionTitle>
        <StyledTimeRangeChip>
          <StyledTimeRangeCaption variant="caption">{labels.last30Mins}</StyledTimeRangeCaption>
        </StyledTimeRangeChip>
      </Stack>

      <MetricCardGrid metrics={metricItems} size={{ md: 3, lg: "grow" }} />
    </Box>
  );
}
