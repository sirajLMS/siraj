import { EventBusyOutlined, Inventory2Outlined, NumbersOutlined } from "@mui/icons-material";
import type { MetricItem } from "@/frontend/common/types/shared.types";
import type { QuotaInsightsViewModel } from "@/frontend/common/views/dashboard/billing/quota/useQuotaInsightsViewModel";

export function buildQuotaInsightsMetrics(vm: Readonly<QuotaInsightsViewModel>): readonly MetricItem[] {
  const { metrics, labels } = vm;
  return [
    {
      key: "activeQuotas",
      count: metrics.activeQuotasCount,
      labelKey: "quota.activeQuotas",
      label: labels.activeQuotasCount(metrics.activeQuotasCount),
      icon: Inventory2Outlined,
      variant: "default",
    },
    {
      key: "totalRemaining",
      count: metrics.totalClassesRemaining,
      labelKey: "quota.remaining",
      label: labels.totalClassesRemaining(metrics.totalClassesRemaining),
      icon: NumbersOutlined,
      variant: "highlight",
    },
    {
      key: "totalReserved",
      count: metrics.totalReserved,
      labelKey: "quota.reserved",
      label: labels.fields.reservedClasses,
      icon: Inventory2Outlined,
      variant: "default",
    },
    {
      key: "pendingBacklog",
      count: metrics.pendingBacklogCount,
      labelKey: "quota.pendingBacklog",
      label: labels.charts.pendingCredits,
      icon: EventBusyOutlined,
      variant: metrics.pendingBacklogCount > 0 ? "danger" : "default",
    },
  ];
}
