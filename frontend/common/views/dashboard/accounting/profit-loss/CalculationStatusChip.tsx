"use client";

import { StatusBadge } from "@/frontend/common/components/ui/badge/StatusBadge";
import { CalculationStatus } from "@/frontend/common/graphql/generated/gql/graphql";
import { useAppTranslation } from "@/shared/locale/client";
import { DashboardBillingPayroll } from "@/shared/locale/namespaces";
import type { PayrollLabels } from "@/shared/locale/types/dashboard/billing/payroll";

/**
 * Bridges the payroll locale's literal-key status map onto the generated
 * `CalculationStatus` enum so the badge needs no per-view status mapping.
 */
function buildCalculationStatusLabels(payrollStatus: PayrollLabels["status"]): Record<CalculationStatus, string> {
  return {
    [CalculationStatus.NotCalculated]: payrollStatus.NOT_CALCULATED,
    [CalculationStatus.Calculated]: payrollStatus.CALCULATED,
    [CalculationStatus.Partially]: payrollStatus.PARTIALLY,
    [CalculationStatus.Refund]: payrollStatus.REFUND,
    [CalculationStatus.WaitingPaid]: payrollStatus.WAITING_PAID,
    [CalculationStatus.Paid]: payrollStatus.PAID,
  };
}

export interface CalculationStatusChipProps {
  /** Payroll calculation status of the session row; drives badge color and label. */
  readonly status: CalculationStatus;
}

/**
 * Small badge for a completed session's payroll calculation status on the P&L
 * Payments tab. Reuses the shared `StatusBadge` with the payroll-calculation
 * palette mapping, so colors resolve through `theme.palette` in both
 * light and dark modes.
 */
export function CalculationStatusChip({ status }: Readonly<CalculationStatusChipProps>) {
  const payrollLabels = useAppTranslation(DashboardBillingPayroll);
  const statusLabels = buildCalculationStatusLabels(payrollLabels.status);
  const label = statusLabels[status];

  return <StatusBadge category="payrollCalculation" status={status} label={label} />;
}
