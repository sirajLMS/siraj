import {
  AccountBalanceOutlined,
  AccountBalanceWalletOutlined,
  CheckCircleOutlined,
  EventOutlined,
  GroupOutlined,
  PendingActionsOutlined,
  TrendingUpOutlined,
  WarningAmberOutlined,
} from "@mui/icons-material";
import type { BillingMetricItem } from "@/frontend/common/views/dashboard/billing/components/BillingMetricsRow";
import type { AdminBillingSummary } from "@/frontend/common/views/dashboard/billing/types/billingViewTypes";
import type { ParentBillingSummary } from "@/frontend/common/views/dashboard/billing/types/parentBillingTypes";
import type { BillingLabels } from "@/shared/locale";

export function buildAdminMetrics(summary: AdminBillingSummary, labels: BillingLabels): BillingMetricItem[] {
  return [
    {
      key: "total-outstanding",
      label: labels.adminMetrics.totalOutstanding,
      value: summary.totalOutstanding,
      subLabel: summary.totalOutstandingSubLabel,
      icon: AccountBalanceOutlined,
    },
    {
      key: "pending-invoices",
      label: labels.adminMetrics.pendingInvoices,
      value: summary.pendingInvoices,
      icon: PendingActionsOutlined,
    },
    {
      key: "negative-balance",
      label: labels.adminMetrics.negativeBalance(Number(summary.negativeBalanceCount)),
      value: summary.negativeBalanceCount,
      icon: WarningAmberOutlined,
      variant: "error",
    },
    {
      key: "mtd-revenue",
      label: labels.adminMetrics.mtdRevenue,
      value: summary.mtdRevenue,
      subLabel: summary.mtdRevenueSubLabel,
      icon: TrendingUpOutlined,
    },
  ];
}

export function buildParentMetrics(summary: ParentBillingSummary, labels: BillingLabels): BillingMetricItem[] {
  return [
    {
      key: "outstanding-balance",
      label: labels.parentMetrics.outstandingBalance,
      value: summary.outstandingBalance,
      subLabel: summary.outstandingBalanceSubLabel,
      icon: AccountBalanceWalletOutlined,
    },
    {
      key: "paid-this-term",
      label: labels.parentMetrics.paidThisTerm,
      value: summary.paidThisTerm,
      subLabel: summary.paidThisTermSubLabel,
      icon: CheckCircleOutlined,
      variant: "highlight",
    },
    {
      key: "next-due-date",
      label: labels.parentMetrics.nextDueDate,
      value: summary.nextDueDate,
      icon: EventOutlined,
    },
    {
      key: "active-students",
      label: labels.parentMetrics.activeStudents,
      value: summary.activeStudents,
      icon: GroupOutlined,
    },
  ];
}
