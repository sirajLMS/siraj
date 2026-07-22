"use client";

import { AnalyticsOutlined, ErrorOutlined, HistoryOutlined, VerifiedOutlined } from "@mui/icons-material";
import { useMemo } from "react";
import type { MetricItem } from "@/frontend/common/types/shared.types";
import type { DstMigrationMetrics } from "@/frontend/common/views/dashboard/tools/dst-migration/dst-migration.types";
import { MobileMetricCardGrid } from "@/frontend/mobile/components/ui";
import { useAppTranslation } from "@/shared/locale";

interface Props {
  readonly metrics: DstMigrationMetrics;
}

export function DstMigrationMetricsRowMobile({ metrics }: Readonly<Props>) {
  const t = useAppTranslation().dashboardTranslations.dstMigration.metrics;

  const metricItems: readonly MetricItem[] = useMemo(
    () => [
      {
        key: "totalAudited",
        label: t.totalAudited,
        count: metrics.totalAudited,
        icon: AnalyticsOutlined,
        labelKey: "totalAudited",
      },
      {
        key: "successful",
        label: t.successful,
        count: metrics.successful,
        icon: VerifiedOutlined,
        labelKey: "successful",
        variant: "highlight",
      },
      {
        key: "conflicts",
        label: t.conflicts,
        count: metrics.conflicts,
        icon: ErrorOutlined,
        labelKey: "conflicts",
        variant: "error",
      },
      {
        key: "unchanged",
        label: t.unchanged,
        count: metrics.unchanged,
        icon: HistoryOutlined,
        labelKey: "unchanged",
      },
    ],
    [metrics, t]
  );

  return <MobileMetricCardGrid metrics={metricItems} sx={{ width: "100%" }} />;
}
