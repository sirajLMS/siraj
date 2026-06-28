"use client";

import { CheckCircleOutlined, ContentCopyOutlined, VisibilityOutlined } from "@mui/icons-material";
import { Box } from "@mui/material";
import { MetricCard } from "@/frontend/components/ui";
import type { MetricCardVariant } from "@/frontend/components/ui/MetricCard";
import { AdminQueueEfficiencyBanner } from "@/frontend/views/dashboard/shared/AdminQueueEfficiencyBanner";
import type { SuggestionsMetricsRowProps } from "../types/suggestionsViewTypes";

export function SuggestionsMetricsRow({ summary, labels, compact = false }: Readonly<SuggestionsMetricsRowProps>) {
  const variant: MetricCardVariant = compact ? "compact" : "default";

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
        <MetricCard
          label={labels.metrics.pending}
          value={summary.pending}
          icon={VisibilityOutlined}
          variant={variant}
        />
        <MetricCard
          label={labels.metrics.reviewed}
          value={summary.reviewed}
          icon={CheckCircleOutlined}
          variant={variant}
        />
        <MetricCard
          label={labels.metrics.duplicate}
          value={summary.duplicateCount}
          icon={ContentCopyOutlined}
          variant={variant}
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
