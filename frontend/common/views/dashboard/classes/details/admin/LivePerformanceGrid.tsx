"use client";

import { Box, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import { SectionPanel } from "@/frontend/common/components/ui/container";
import {
  buildLivePerformanceMetricItems,
  type LivePerformanceLabels,
} from "@/frontend/common/views/dashboard/classes/details/admin/livePerformanceMetrics";
import { classDetailsContentPaddingSx } from "@/frontend/common/views/dashboard/classes/details/classDetailsMobileLayout";
import type { ClassDetailsMetricGridSlot } from "@/frontend/common/views/dashboard/classes/details/types";
import type { PerformanceMetric } from "@/frontend/common/views/dashboard/types/dashboard";

interface LivePerformanceGridProps {
  readonly metrics: readonly PerformanceMetric[];
  readonly hasData: boolean;
  readonly labels: LivePerformanceLabels;
  readonly MetricGrid: ClassDetailsMetricGridSlot;
}

const StyledSectionTitle = styled(Typography)(() => ({}));

const StyledTimeRangeChip = styled(Box)(() => ({}));

const StyledTimeRangeCaption = styled(Typography)(() => ({}));

export function LivePerformanceGrid({ metrics, hasData, labels, MetricGrid }: LivePerformanceGridProps) {
  const metricItems = buildLivePerformanceMetricItems(metrics, labels);

  return (
    <Box sx={classDetailsContentPaddingSx}>
      <SectionPanel
        title={
          <StyledSectionTitle variant="headlineMd" sx={theme => ({ color: theme.palette.primary.main })}>
            {labels.livePerformanceOverview}
          </StyledSectionTitle>
        }
        actions={
          hasData ? (
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
          ) : null
        }
      >
        {hasData ? (
          <MetricGrid metrics={metricItems} />
        ) : (
          <Typography
            variant="body2"
            sx={theme => ({ color: theme.palette.onSurfaceVariant, py: 4, textAlign: "center" })}
          >
            {labels.noData}
          </Typography>
        )}
      </SectionPanel>
    </Box>
  );
}
