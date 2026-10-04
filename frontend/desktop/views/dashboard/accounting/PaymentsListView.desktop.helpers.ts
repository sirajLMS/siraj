import type { MetricItem } from "@/frontend/common/types/shared.types";
import { buildPaymentsMetricItemsShared } from "@/frontend/common/views/dashboard/accounting/components/__shared__/paymentsMetricItemsShared";
import type { PaymentsListMetrics } from "@/frontend/common/views/dashboard/accounting/usePaymentsListViewModel.types";
import type { PaymentsLabels } from "@/shared/locale/types/dashboard/accounting/payments";

/** Summary metric cards shown above the payments list. */
export function buildPaymentsListMetricItems(
  t: PaymentsLabels,
  metrics: PaymentsListMetrics,
  metricsBasis: string | null
): MetricItem[] {
  return buildPaymentsMetricItemsShared(t, metrics, metricsBasis);
}
