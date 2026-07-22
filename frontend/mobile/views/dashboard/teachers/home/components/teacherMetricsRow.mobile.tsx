"use client";

import { CancelOutlined, CheckCircleOutlined } from "@mui/icons-material";
import { useMemo } from "react";
import type { MetricItem } from "@/frontend/common/types/shared.types";
import { MobileMetricCardGrid } from "@/frontend/mobile/components/ui";
import { useAppTranslation } from "@/shared/locale";

interface TeacherMetricsRowProps {
  readonly metrics:
    | {
        readonly activated?: number | null;
        readonly deactivated?: number | null;
      }
    | null
    | undefined;
}

export function TeacherMetricsRow({ metrics }: Readonly<TeacherMetricsRowProps>) {
  const t = useAppTranslation().dashboardTranslations.teachersDirectory.metrics;

  const metricItems: readonly MetricItem[] = useMemo(
    () => [
      {
        key: "activated",
        label: t.activated,
        count: metrics?.activated ?? 0,
        icon: CheckCircleOutlined,
        labelKey: "activated",
        variant: "default",
      },
      {
        key: "deactivated",
        label: t.deactivated,
        count: metrics?.deactivated ?? 0,
        icon: CancelOutlined,
        labelKey: "deactivated",
        variant: "default",
      },
    ],
    [metrics?.activated, metrics?.deactivated, t.activated, t.deactivated]
  );

  return <MobileMetricCardGrid metrics={metricItems} />;
}
