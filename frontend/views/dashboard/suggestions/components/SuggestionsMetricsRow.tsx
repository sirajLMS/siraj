"use client";

import { CheckCircleOutlined, VisibilityOutlined } from "@mui/icons-material";
import { Box } from "@mui/material";
import type { AdminSuggestionsSummary } from "@/frontend/stores/mockAdminSuggestionsStore";
import { BillingMetricsRow } from "@/frontend/views/dashboard/billing/components/BillingMetricsRow";
import { AdminQueueEfficiencyBanner } from "@/frontend/views/dashboard/shared/AdminQueueEfficiencyBanner";
import type { SuggestionsAdminLabels } from "@/shared/messages/types/dashboard/suggestions/main";

interface SuggestionsMetricsRowProps {
  readonly summary: AdminSuggestionsSummary;
  readonly labels: SuggestionsAdminLabels;
  readonly compact?: boolean;
}

export function SuggestionsMetricsRow({ summary, labels, compact = false }: Readonly<SuggestionsMetricsRowProps>) {
  const metrics = [
    {
      key: "pending",
      label: labels.metrics.pending,
      value: summary.pending,
      icon: VisibilityOutlined,
      variant: "default" as const,
    },
    {
      key: "reviewed",
      label: labels.metrics.reviewed,
      value: summary.reviewed,
      icon: CheckCircleOutlined,
      variant: "default" as const,
    },
  ];

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <BillingMetricsRow metrics={metrics} compact={compact} />
      <AdminQueueEfficiencyBanner
        avgLabel={labels.metrics.avgResponse}
        avgValue={summary.avgResponseHours}
        efficiencyNote={labels.metrics.efficiencyNote}
      />
    </Box>
  );
}
