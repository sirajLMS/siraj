"use client";

import {
  BlockOutlined,
  CheckCircleOutlineOutlined,
  EventAvailableOutlined,
  PendingActionsOutlined,
} from "@mui/icons-material";
import { useMemo } from "react";
import {
  computeSessionStatus,
  type MetricCounts,
  type RawMetric,
  SessionStatus,
  type StatusTrackingRow,
} from "@/frontend/common/views/dashboard/classes/status/tracking/types";
import { useAppTranslation } from "@/shared/locale/client";

const METRIC_DEFINITIONS: readonly (Omit<RawMetric, "count"> & { readonly key: keyof MetricCounts })[] = [
  { key: "regular", labelKey: "metrics.regular", icon: CheckCircleOutlineOutlined },
  { key: "pending", labelKey: "metrics.pending", icon: PendingActionsOutlined },
  {
    key: "suspended",
    labelKey: "metrics.suspended",
    icon: BlockOutlined,
    variant: "error",
  },
  { key: "on_leave", labelKey: "metrics.onLeave", icon: EventAvailableOutlined },
];

function computeMetricCounts(rows: readonly StatusTrackingRow[]): MetricCounts {
  const counts = { regular: 0, pending: 0, suspended: 0, on_leave: 0 };
  for (const row of rows) {
    const status = computeSessionStatus(row.studentStatus, row.isFrozen, row.executionState);
    if (status === SessionStatus.REGULAR) counts.regular += 1;
    else if (status === SessionStatus.PENDING_VERIFICATION) counts.pending += 1;
    else if (status === SessionStatus.SUSPENDED_PENDING) counts.suspended += 1;
    else if (status === SessionStatus.ON_LEAVE) counts.on_leave += 1;
  }
  return counts;
}

function buildMetrics(counts: MetricCounts, subLabelMap: Record<string, string>): readonly RawMetric[] {
  return METRIC_DEFINITIONS.map(def => ({
    ...def,
    count: counts[def.key],
    subLabel: subLabelMap[def.key],
  }));
}

export function useStatusTrackingMetrics(rows: readonly StatusTrackingRow[]) {
  const t = useAppTranslation("dashboard.core.statusTracking");

  const suspendedCount = useMemo(
    () =>
      rows.filter(
        r => computeSessionStatus(r.studentStatus, r.isFrozen, r.executionState) === SessionStatus.SUSPENDED_PENDING
      ).length,
    [rows]
  );

  const metricCounts = useMemo(() => computeMetricCounts(rows), [rows]);

  const metrics = useMemo(() => {
    const subLabelMap: Record<string, string> = {
      regular: t.subLabels.regular,
      pending: t.subLabels.pending,
      suspended: t.subLabels.suspended,
      on_leave: t.subLabels.onLeave,
    };
    return buildMetrics(metricCounts, subLabelMap);
  }, [metricCounts, t]);

  return { metrics, suspendedCount };
}
