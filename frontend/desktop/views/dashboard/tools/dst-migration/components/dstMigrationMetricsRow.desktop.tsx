"use client";

import { AnalyticsOutlined, ErrorOutlined, HistoryOutlined, VerifiedOutlined } from "@mui/icons-material";
import { Box } from "@mui/material";
import type { MetricItem } from "@/frontend/common/types/shared.types";
import type { DstMigrationMetrics } from "@/frontend/common/views/dashboard/tools/dst-migration/dst-migration.types";
import { DesktopMetricCardGrid } from "@/frontend/desktop/components/ui/card/MetricCardGrid";
import { useAppTranslation } from "@/shared/locale";

interface Props {
  readonly metrics: DstMigrationMetrics;
}

export function DstMigrationMetricsRowDesktop({ metrics }: Readonly<Props>) {
  const t = useAppTranslation().dashboardTranslations.dstMigration.metrics;

  const metricItems: MetricItem[] = [
    {
      key: "total-audited",
      count: metrics.totalAudited,
      labelKey: "total-audited",
      label: t.totalAudited,
      icon: AnalyticsOutlined,
    },
    {
      key: "successful",
      count: metrics.successful,
      labelKey: "successful",
      label: t.successful,
      icon: VerifiedOutlined,
      variant: "highlight",
    },
    {
      key: "conflicts",
      count: metrics.conflicts,
      labelKey: "conflicts",
      label: t.conflicts,
      icon: ErrorOutlined,
      variant: "error",
    },
    {
      key: "unchanged",
      count: metrics.unchanged,
      labelKey: "unchanged",
      label: t.unchanged,
      icon: HistoryOutlined,
    },
  ];

  return (
    <Box sx={{ mt: 4 }}>
      <DesktopMetricCardGrid metrics={metricItems} size={{ xs: 12, sm: 6, md: 3 }} />
    </Box>
  );
}
