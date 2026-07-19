"use client";

import { CheckCircleOutlined, ContentCopyOutlined, VisibilityOutlined } from "@mui/icons-material";
import { Box } from "@mui/material";
import { useMemo } from "react";
import type { MetricItem } from "@/frontend/common/views/dashboard/types/dashboard";
import { AdminQueueEfficiencyBanner } from "@/frontend/common/views/dashboard/shared/AdminQueueEfficiencyBanner";
import type { SuggestionsMetricsRowProps } from "@/frontend/common/views/dashboard/suggestions/types/suggestionsView.types";
import { MobileMetricCardGrid } from "@/frontend/mobile/components/ui";

export function SuggestionsMetricsRowMobile({
  summary,
  labels,
}: Readonly<Omit<SuggestionsMetricsRowProps, "compact">>) {
  const metrics: readonly MetricItem[] = useMemo(
    () => [
      {
        key: "pending",
        label: labels.metrics.pending,
        count: summary.pending,
        icon: VisibilityOutlined,
        labelKey: "pending",
      },
      {
        key: "reviewed",
        label: labels.metrics.reviewed,
        count: summary.reviewed,
        icon: CheckCircleOutlined,
        labelKey: "reviewed",
      },
      {
        key: "duplicate",
        label: labels.metrics.duplicate,
        count: summary.duplicateCount,
        icon: ContentCopyOutlined,
        labelKey: "duplicate",
      },
    ],
    [labels.metrics, summary]
  );

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <MobileMetricCardGrid metrics={metrics} />
      <AdminQueueEfficiencyBanner
        avgLabel={labels.metrics.avgResponse}
        avgValue={summary.avgResponseHours}
        efficiencyNote={labels.metrics.efficiencyNote}
      />
    </Box>
  );
}
