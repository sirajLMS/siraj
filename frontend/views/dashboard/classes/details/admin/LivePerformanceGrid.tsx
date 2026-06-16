"use client";

import type { SvgIconComponent } from "@mui/icons-material";
import ChecklistIcon from "@mui/icons-material/Checklist";
import FavoriteIcon from "@mui/icons-material/Favorite";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { Box, Stack, Typography } from "@mui/material";
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
        <Typography variant="headlineMd" sx={theme => ({ color: theme.palette.primary.main })}>
          {labels.livePerformanceOverview}
        </Typography>
        <Box
          sx={theme => ({
            px: 2,
            py: 0.75,
            border: 1,
            borderColor: theme.palette.border.light,
            borderRadius: 2,
            bgcolor: theme.palette.background.paper,
          })}
        >
          <Typography variant="caption" sx={theme => ({ color: theme.palette.text.secondary })}>
            {labels.last30Mins}
          </Typography>
        </Box>
      </Stack>

      <MetricCardGrid metrics={metricItems} size={{ md: 3, lg: "grow" }} />
    </Box>
  );
}
