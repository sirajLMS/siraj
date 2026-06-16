"use client";

import { CheckCircleOutlined, VisibilityOutlined } from "@mui/icons-material";
import { Box } from "@mui/material";
import type { ComplaintsAdminLabels } from "@/frontend/messages/types/dashboard/complaints/main";
import type { AdminComplaintsSummary } from "@/frontend/stores/adminComplaintsStore";
import { BillingMetricsRow } from "@/frontend/views/dashboard/billing/components/BillingMetricsRow";
import { AdminQueueEfficiencyBanner } from "@/frontend/views/dashboard/shared/AdminQueueEfficiencyBanner";

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
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <BillingMetricsRow metrics={metrics} compact={compact} />
      <AdminQueueEfficiencyBanner
        avgLabel={labels.metrics.avgResolution}
        avgValue={summary.avgResolutionHours}
        efficiencyNote={labels.metrics.efficiencyNote}
      />
    </Box>
  );
}
