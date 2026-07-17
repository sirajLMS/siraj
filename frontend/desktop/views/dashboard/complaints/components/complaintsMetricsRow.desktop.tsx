"use client";

import { CheckCircleOutlined, VisibilityOutlined } from "@mui/icons-material";
import { Box } from "@mui/material";
import { styled } from "@mui/material/styles";
import type { AdminComplaintsSummary } from "@/frontend/common/views/dashboard/complaints/types/complaints.types";
import { AdminQueueEfficiencyBanner } from "@/frontend/common/views/dashboard/shared/AdminQueueEfficiencyBanner";
import { BillingMetricsRowDesktop } from "@/frontend/desktop/views/dashboard/billing/components/billingMetricsRow.desktop";
import type { ComplaintsAdminLabels } from "@/shared/locale";

const StyledMetricsContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(2),
}));

interface ComplaintsMetricsRowDesktopProps {
  readonly summary: AdminComplaintsSummary;
  readonly labels: ComplaintsAdminLabels;
}

export function ComplaintsMetricsRowDesktop({ summary, labels }: Readonly<ComplaintsMetricsRowDesktopProps>) {
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
      <BillingMetricsRowDesktop metrics={metrics} />
      <AdminQueueEfficiencyBanner
        avgLabel={labels.metrics.avgResolution}
        avgValue={summary.avgResolutionHours}
        efficiencyNote={labels.metrics.efficiencyNote}
      />
    </StyledMetricsContainer>
  );
}
