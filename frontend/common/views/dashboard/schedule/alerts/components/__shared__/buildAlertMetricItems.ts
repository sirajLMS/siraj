import type { MetricItem } from "@/frontend/common/types/shared.types";
import type { AlertsMetric } from "@/frontend/common/views/dashboard/schedule/alerts/types";

export function buildAlertMetricItems(
  metrics: readonly AlertsMetric[],
  metricLabels: Record<string, { label: string; subLabel: string }>
): MetricItem[] {
  return metrics.map(metric => {
    const metricLabel = metricLabels[metric.key];
    return {
      key: metric.key,
      count: metric.value,
      labelKey: metric.labelKey,
      label: metricLabel.label,
      icon: metric.icon,
      subLabel: metricLabel.subLabel,
    };
  });
}
