"use client";

import type { GridColDef } from "@mui/x-data-grid";
import { formatDate } from "@/frontend/common/components/intl/dateFormat";
import { formatLockedAmount } from "@/frontend/common/lib/currency";
import { PaymentMethodChip } from "@/frontend/common/views/dashboard/accounting/profit-loss/PaymentMethodChip";
import type { ProfitLossIncomeRow } from "@/frontend/common/views/dashboard/accounting/profit-loss/useProfitLossViewModel";
import type { ProfitLossLabels } from "@/shared/locale/types/dashboard/accounting/profit-loss";

/** Placeholder used when a row's linked value is absent (free-form payment, no invoice). */
const MISSING_VALUE = "—";

/** Builds the tab's columns; chip cells render via the shared chip, absent values show a dash. */
export function buildIncomeColumns(labels: ProfitLossLabels, locale: string): GridColDef<ProfitLossIncomeRow>[] {
  return [
    {
      field: "paymentDate",
      headerName: labels.column.paymentDate,
      flex: 1,
      valueGetter: (_value, row) => (row.paymentDate ? formatDate(row.paymentDate, locale) : MISSING_VALUE),
    },
    {
      field: "invoiceId",
      headerName: labels.column.invoiceId,
      flex: 1,
      valueGetter: (_value, row) => row.invoiceId ?? MISSING_VALUE,
    },
    { field: "studentName", headerName: labels.column.student, flex: 1 },
    {
      field: "parentName",
      headerName: labels.column.parentName,
      flex: 1,
      valueGetter: (_value, row) => row.parentName ?? MISSING_VALUE,
    },
    {
      field: "packageName",
      headerName: labels.column.packageName,
      flex: 1,
      valueGetter: (_value, row) => row.packageName ?? MISSING_VALUE,
    },
    {
      field: "paymentMethodType",
      headerName: labels.column.paymentMethod,
      flex: 1,
      sortable: false,
      filterable: false,
      renderCell: params =>
        params.row.paymentMethodType ? (
          <PaymentMethodChip paymentMethodType={params.row.paymentMethodType} />
        ) : (
          MISSING_VALUE
        ),
    },
    {
      field: "amount",
      headerName: labels.column.value,
      flex: 1,
      valueGetter: (_value, row) =>
        row.amount && row.currency ? formatLockedAmount(row.amount, row.currency, locale) : MISSING_VALUE,
    },
  ];
}
