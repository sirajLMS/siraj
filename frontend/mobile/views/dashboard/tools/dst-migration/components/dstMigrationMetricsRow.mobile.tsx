"use client";

import { AnalyticsOutlined, ErrorOutlined, HistoryOutlined, VerifiedOutlined } from "@mui/icons-material";
import { useMemo } from "react";
import type { MetricItem } from "@/frontend/common/types/shared.types";
import type { DstMigrationMetrics } from "@/frontend/common/views/dashboard/tools/dst-migration/dst-migration.types";
import { MobileMetricCardGrid } from "@/frontend/mobile/components/ui";
import type { DstMigrationLabels } from "@/shared/locale/types/dashboard/admin/dstMigration";

interface Props {
  readonly labels: DstMigrationLabels;
  readonly metrics: DstMigrationMetrics;
}

export function DstMigrationMetricsRowMobile({ labels, metrics }: Readonly<Props>) {
  const metricLabels = labels.metrics;

  const metricItems: readonly MetricItem[] = useMemo(
    () => [
      {
        key: "totalAudited",
        label: metricLabels.totalAudited,
        count: metrics.totalAudited,
        icon: AnalyticsOutlined,
        labelKey: "totalAudited",
      },
      {
        key: "successful",
        label: metricLabels.successful,
        count: metrics.successful,
        icon: VerifiedOutlined,
        labelKey: "successful",
        variant: "highlight",
      },
      {
        key: "conflicts",
        label: metricLabels.conflicts,
        count: metrics.conflicts,
        icon: ErrorOutlined,
        labelKey: "conflicts",
        variant: "error",
      },
      {
        key: "unchanged",
        label: metricLabels.unchanged,
        count: metrics.unchanged,
        icon: HistoryOutlined,
        labelKey: "unchanged",
      },
    ],
    [metrics, metricLabels]
  );

  return <MobileMetricCardGrid metrics={metricItems} sx={{ width: "100%" }} />;
}
