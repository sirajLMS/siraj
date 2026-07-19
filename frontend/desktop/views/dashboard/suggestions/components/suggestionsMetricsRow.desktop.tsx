"use client";

import { CheckCircleOutlined, ContentCopyOutlined, VisibilityOutlined } from "@mui/icons-material";
import { Box } from "@mui/material";
import type { MetricItem } from "@/frontend/common/views/dashboard/types/dashboard";
import { AdminQueueEfficiencyBanner } from "@/frontend/common/views/dashboard/shared/AdminQueueEfficiencyBanner";
import type { SuggestionsMetricsRowProps } from "@/frontend/common/views/dashboard/suggestions/types/suggestionsView.types";
import { DesktopMetricCardGrid } from "@/frontend/desktop/components/ui/card/MetricCardGrid";

export function SuggestionsMetricsRowDesktop({
  summary,
  labels,
}: Readonly<Omit<SuggestionsMetricsRowProps, "compact">>) {
  const metricItems: MetricItem[] = [
    {
      key: "pending",
      count: summary.pending,
      labelKey: "pending",
      label: labels.metrics.pending,
      icon: VisibilityOutlined,
    },
    {
      key: "reviewed",
      count: summary.reviewed,
      labelKey: "reviewed",
      label: labels.metrics.reviewed,
      icon: CheckCircleOutlined,
    },
    {
      key: "duplicate",
      count: summary.duplicateCount,
      labelKey: "duplicate",
      label: labels.metrics.duplicate,
      icon: ContentCopyOutlined,
    },
  ];

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <DesktopMetricCardGrid metrics={metricItems} />
      <AdminQueueEfficiencyBanner
        avgLabel={labels.metrics.avgResponse}
        avgValue={summary.avgResponseHours}
        efficiencyNote={labels.metrics.efficiencyNote}
      />
    </Box>
  );
}
