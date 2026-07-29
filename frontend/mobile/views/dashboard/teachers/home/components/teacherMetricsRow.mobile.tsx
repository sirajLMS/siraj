"use client";

import { CancelOutlined, CheckCircleOutlined } from "@mui/icons-material";
import { useMemo } from "react";
import type { MetricItem } from "@/frontend/common/types/shared.types";
import { MobileMetricCardGrid } from "@/frontend/mobile/components/ui";
import type { TeachersDirectoryLabels } from "@/shared/locale/types/dashboard/teachers/directory";

interface TeacherMetricsRowProps {
  readonly metrics:
    | {
        readonly activated?: number | null;
        readonly deactivated?: number | null;
      }
    | null
    | undefined;
  readonly labels: TeachersDirectoryLabels["metrics"];
}

export function TeacherMetricsRow({ metrics, labels }: Readonly<TeacherMetricsRowProps>) {
  const metricItems: readonly MetricItem[] = useMemo(
    () => [
      {
        key: "activated",
        label: labels.activated,
        count: metrics?.activated ?? 0,
        icon: CheckCircleOutlined,
        labelKey: "activated",
        variant: "default",
      },
      {
        key: "deactivated",
        label: labels.deactivated,
        count: metrics?.deactivated ?? 0,
        icon: CancelOutlined,
        labelKey: "deactivated",
        variant: "default",
      },
    ],
    [labels.activated, labels.deactivated, metrics?.activated, metrics?.deactivated]
  );

  return <MobileMetricCardGrid metrics={metricItems} />;
}
