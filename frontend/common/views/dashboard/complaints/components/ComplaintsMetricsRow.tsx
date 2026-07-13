"use client";

import { CheckCircleOutlined, VisibilityOutlined } from "@mui/icons-material";
import { Box } from "@mui/material";
import { styled } from "@mui/material/styles";
import { BillingMetricsRow } from "@/frontend/common/views/dashboard/billing/components/BillingMetricsRow";
import type { AdminComplaintsSummary } from "@/frontend/common/views/dashboard/complaints/types/complaints.types";
import { AdminQueueEfficiencyBanner } from "@/frontend/common/views/dashboard/shared/AdminQueueEfficiencyBanner";
import type { ComplaintsAdminLabels } from "@/shared/messages/types/dashboard/complaints/main";

const StyledMetricsContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(2),
}));

interface ComplaintsMetricsRowProps {
  readonly summary: AdminComplaintsSummary;
  readonly labels: ComplaintsAdminLabels;
  readonly compact?: boolean;
}

export function ComplaintsMetricsRow({ summary, labels, compact = false }: Readonly<ComplaintsMetricsRowProps>) {
  const metrics = [
    {
      key: "unanswered",
      label: labels.metrics.unanswered,
      value: summary.unanswered,
      icon: VisibilityOutlined,
      variant: "default" as const,
    },
    {
      key: "answered",
      label: labels.metrics.answered,
      value: summary.answered,
      icon: CheckCircleOutlined,
      variant: "default" as const,
    },
  ];

  return (
    <StyledMetricsContainer>
      <BillingMetricsRow metrics={metrics} compact={compact} />
      <AdminQueueEfficiencyBanner
        avgLabel={labels.metrics.avgResolution}
        avgValue={summary.avgResolutionHours}
        efficiencyNote={labels.metrics.efficiencyNote}
      />
    </StyledMetricsContainer>
  );
}
