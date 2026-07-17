"use client";

import { CheckCircleOutlined, VisibilityOutlined } from "@mui/icons-material";
import { Box } from "@mui/material";
import { styled } from "@mui/material/styles";
import type { MetricItem } from "@/frontend/common/types/shared.types";
import type { AdminComplaintsSummary } from "@/frontend/common/views/dashboard/complaints/types/complaints.types";
import { AdminQueueEfficiencyBanner } from "@/frontend/common/views/dashboard/shared/AdminQueueEfficiencyBanner";
import { MobileMetricCardGrid } from "@/frontend/mobile/components/ui";
import type { ComplaintsAdminLabels } from "@/shared/locale";

const StyledMetricsContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(2),
}));

interface ComplaintsMetricsRowMobileProps {
  readonly summary: AdminComplaintsSummary;
  readonly labels: ComplaintsAdminLabels;
  readonly compact?: boolean;
}

export function ComplaintsMetricsRowMobile({
  summary,
  labels,
  compact = false,
}: Readonly<ComplaintsMetricsRowMobileProps>) {
  const metrics: readonly MetricItem[] = [
    {
      key: "unanswered",
      label: labels.metrics.unanswered,
      count: summary.unanswered,
      icon: VisibilityOutlined,
      labelKey: "unanswered",
      variant: compact ? "compact" : "default",
    },
    {
      key: "answered",
      label: labels.metrics.answered,
      count: summary.answered,
      icon: CheckCircleOutlined,
      labelKey: "answered",
      variant: compact ? "compact" : "default",
    },
  ];

  return (
    <StyledMetricsContainer>
      <MobileMetricCardGrid metrics={metrics} layout="grid" />
      <AdminQueueEfficiencyBanner
        avgLabel={labels.metrics.avgResolution}
        avgValue={summary.avgResolutionHours}
        efficiencyNote={labels.metrics.efficiencyNote}
      />
    </StyledMetricsContainer>
  );
}
