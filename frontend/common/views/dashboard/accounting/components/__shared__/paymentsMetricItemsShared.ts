import {
  CreditScoreOutlined,
  HourglassTopOutlined,
  PaymentsOutlined,
  PendingActionsOutlined,
} from "@mui/icons-material";
import type { MetricItem } from "@/frontend/common/types/shared.types";
import type { PaymentsListMetrics } from "@/frontend/common/views/dashboard/accounting/usePaymentsListViewModel.types";
import type { PaymentsLabels } from "@/shared/locale/types/dashboard/accounting/payments";

/** Summary metric entries for the payments list: total, paid, unpaid, and credit hours. */
export function buildPaymentsMetricItemsShared(
  t: PaymentsLabels,
  metrics: PaymentsListMetrics,
  metricsBasis: string | null
): MetricItem[] {
  return [
    {
      key: "payments-total",
      count: metrics.total,
      label: t.pageTitle,
      labelKey: "dashboard.accounting.payments.pageTitle",
      icon: PaymentsOutlined,
      subLabel: metricsBasis ?? undefined,
    },
    {
      key: "payments-paid",
      count: metrics.paid,
      label: t.status.paid,
      labelKey: "dashboard.accounting.payments.status.paid",
      icon: CreditScoreOutlined,
    },
    {
      key: "payments-unpaid",
      count: metrics.unpaid,
      label: t.status.unpaid,
      labelKey: "dashboard.accounting.payments.status.unpaid",
      icon: PendingActionsOutlined,
      variant: metrics.unpaid > 0 ? "danger" : "default",
    },
    {
      key: "payments-hours",
      count: `${metrics.creditHours.toFixed(2)} h`,
      label: t.columns.credit,
      labelKey: "dashboard.accounting.payments.columns.credit",
      icon: HourglassTopOutlined,
      variant: "highlight",
    },
  ];
}
