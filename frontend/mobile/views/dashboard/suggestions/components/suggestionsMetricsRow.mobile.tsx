"use client";

import { CheckCircleOutlined, ContentCopyOutlined, VisibilityOutlined } from "@mui/icons-material";
import { Box } from "@mui/material";
import { MetricCard } from "@/frontend/common/components/ui/card/MetricCard";
import { AdminQueueEfficiencyBanner } from "@/frontend/common/views/dashboard/shared/AdminQueueEfficiencyBanner";
import type { SuggestionsMetricsRowProps } from "@/frontend/common/views/dashboard/suggestions/types/suggestionsView.types";

export function SuggestionsMetricsRowMobile({
  summary,
  labels,
}: Readonly<Omit<SuggestionsMetricsRowProps, "compact">>) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
        <MetricCard
          label={labels.metrics.pending}
          value={summary.pending}
          icon={VisibilityOutlined}
          variant="compact"
        />
        <MetricCard
          label={labels.metrics.reviewed}
          value={summary.reviewed}
          icon={CheckCircleOutlined}
          variant="compact"
        />
        <MetricCard
          label={labels.metrics.duplicate}
          value={summary.duplicateCount}
          icon={ContentCopyOutlined}
          variant="compact"
        />
      </Box>
      <AdminQueueEfficiencyBanner
        avgLabel={labels.metrics.avgResponse}
        avgValue={summary.avgResponseHours}
        efficiencyNote={labels.metrics.efficiencyNote}
      />
    </Box>
  );
}
