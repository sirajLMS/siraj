"use client";

import type { GridColDef } from "@mui/x-data-grid";
import type { CurrencyCode } from "@/frontend/common/graphql/generated/gql/graphql";
import { formatLockedAmount } from "@/frontend/common/lib/currency";
import {
  dateCell,
  formatAccountingDate,
  numericCell,
  textCell,
} from "@/frontend/common/views/dashboard/accounting/accountingFormatters";
import { CalculationStatusChip } from "@/frontend/common/views/dashboard/accounting/profit-loss/CalculationStatusChip";
import type { ProfitLossPaymentRow } from "@/frontend/common/views/dashboard/accounting/profit-loss/useProfitLossViewModel";
import type { ProfitLossLabels } from "@/shared/locale/types/dashboard/accounting/profit-loss";

/** Placeholder used when a row's linked value is absent. */
const MISSING_VALUE = "—";

interface PaymentColumnArgs {
  readonly labels: ProfitLossLabels;
  readonly locale: string;
  /** Report target currency the converted-amount column is expressed in. */
  readonly currency: CurrencyCode;
}

/**
 * Earned-revenue columns per the report contract: the session's scheduled
 * start, the people and subject involved, the calculated duration, the
 * student-paid amount in its original currency, the FX-converted amount the
 * footer total sums, the manual subtract credits, and the payroll calculation
 * badge.
 */
export function buildPaymentColumns({
  labels,
  locale,
  currency,
}: PaymentColumnArgs): GridColDef<ProfitLossPaymentRow>[] {
  return [
    {
      field: "scheduledStartAt",
      headerName: labels.column.scheduledStart,
      width: 150,
      valueFormatter: value => formatAccountingDate(dateCell(value), locale),
    },
    {
      field: "teacherName",
      headerName: labels.column.teacher,
      flex: 1,
      minWidth: 140,
      valueFormatter: value => textCell(value),
    },
    {
      field: "studentName",
      headerName: labels.column.student,
      flex: 1,
      minWidth: 140,
      valueFormatter: value => textCell(value),
    },
    {
      field: "subjectName",
      headerName: labels.column.subject,
      flex: 1,
      minWidth: 120,
      valueFormatter: value => textCell(value),
    },
    {
      field: "durationMinutes",
      headerName: labels.column.duration,
      width: 110,
      align: "right",
      headerAlign: "right",
      valueFormatter: value => numericCell(value),
    },
    {
      field: "studentPaidAmount",
      headerName: labels.column.studentPaidAmount,
      width: 150,
      align: "right",
      headerAlign: "right",
      valueGetter: (_value, row) =>
        row.studentPaidAmount && row.studentPaidCurrency
          ? formatLockedAmount(row.studentPaidAmount, row.studentPaidCurrency, locale)
          : MISSING_VALUE,
    },
    {
      field: "convertedAmount",
      headerName: labels.column.value,
      width: 150,
      align: "right",
      headerAlign: "right",
      valueGetter: (_value, row) =>
        row.convertedAmount ? formatLockedAmount(row.convertedAmount, currency, locale) : MISSING_VALUE,
    },
    {
      field: "manualSubtractCredits",
      headerName: labels.column.manualSubtractCredits,
      width: 150,
      align: "right",
      headerAlign: "right",
      valueGetter: (_value, row) =>
        row.manualSubtractCredits && row.manualSubtractCreditsCurrency
          ? formatLockedAmount(row.manualSubtractCredits, row.manualSubtractCreditsCurrency, locale)
          : MISSING_VALUE,
    },
    {
      field: "calculationStatus",
      headerName: labels.column.calculationStatus,
      width: 130,
      sortable: false,
      filterable: false,
      renderCell: ({ row }) =>
        row.calculationStatus === null ? null : <CalculationStatusChip status={row.calculationStatus} />,
    },
  ];
}
