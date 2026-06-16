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
import type { BillingLabels } from "@/frontend/messages/types/dashboard/billing";
import type { AdminBillingSummary } from "@/frontend/stores/adminBillingStore";
import type { ParentBillingSummary } from "@/frontend/stores/parentBillingStore";
import type { BillingMetricItem } from "../components/BillingMetricsRow";

export function buildAdminMetrics(summary: AdminBillingSummary, labels: BillingLabels): BillingMetricItem[] {
  return [
    {
      key: "total-outstanding",
      label: labels.adminMetrics.totalOutstanding,
      value: summary.totalOutstanding,
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
      label: labels.adminMetrics.negativeBalance,
      value: summary.negativeBalanceCount,
      icon: WarningAmberOutlined,
      variant: "error",
    },
    {
      key: "mtd-revenue",
      label: labels.adminMetrics.mtdRevenue,
      value: summary.mtdRevenue,
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
      icon: AccountBalanceWalletOutlined,
    },
    {
      key: "paid-this-term",
      label: labels.parentMetrics.paidThisTerm,
      value: summary.paidThisTerm,
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
