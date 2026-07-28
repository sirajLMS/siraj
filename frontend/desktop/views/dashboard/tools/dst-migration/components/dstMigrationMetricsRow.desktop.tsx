"use client";

import { AnalyticsOutlined, ErrorOutlined, HistoryOutlined, VerifiedOutlined } from "@mui/icons-material";
import { Box } from "@mui/material";
import type { MetricItem } from "@/frontend/common/types/shared.types";
import type { DstMigrationMetrics } from "@/frontend/common/views/dashboard/tools/dst-migration/dst-migration.types";
import { DesktopMetricCardGrid } from "@/frontend/desktop/components/ui/card/MetricCardGrid";
import type { DstMigrationLabels } from "@/shared/locale/types/dashboard/admin/dstMigration";

interface Props {
  readonly labels: DstMigrationLabels;
  readonly metrics: DstMigrationMetrics;
}

export function DstMigrationMetricsRowDesktop({ labels, metrics }: Readonly<Props>) {
  const metricLabels = labels.metrics;

  const metricItems: MetricItem[] = [
    {
      key: "total-audited",
      count: metrics.totalAudited,
      labelKey: "total-audited",
      label: metricLabels.totalAudited,
      icon: AnalyticsOutlined,
    },
    {
      key: "successful",
      count: metrics.successful,
      labelKey: "successful",
      label: metricLabels.successful,
      icon: VerifiedOutlined,
      variant: "highlight",
    },
    {
      key: "conflicts",
      count: metrics.conflicts,
      labelKey: "conflicts",
      label: metricLabels.conflicts,
      icon: ErrorOutlined,
      variant: "error",
    },
    {
      key: "unchanged",
      count: metrics.unchanged,
      labelKey: "unchanged",
      label: metricLabels.unchanged,
      icon: HistoryOutlined,
    },
  ];

  return (
    <Box sx={{ mt: 4 }}>
      <DesktopMetricCardGrid metrics={metricItems} size={{ xs: 12, sm: 6, md: 3 }} />
    </Box>
  );
}
