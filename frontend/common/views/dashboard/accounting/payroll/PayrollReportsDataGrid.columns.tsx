"use client";

import type { GridColDef } from "@mui/x-data-grid";
import type { CalculationStatus } from "@/frontend/common/graphql/generated/gql/graphql";
import {
  dateCell,
  formatAccountingDate,
  numericCell,
  textCell,
} from "@/frontend/common/views/dashboard/accounting/accountingFormatters";
import {
  actualDurationMinutes,
  buildOverrideActionColumn,
  renderCalculationStatusCell,
  renderNoteCell,
  renderPaidAmountCell,
} from "@/frontend/common/views/dashboard/accounting/payroll/PayrollReportsDataGrid.cells";
import type { PayrollReportRow } from "@/frontend/common/views/dashboard/accounting/payroll/usePayrollReportsViewModel";
import type { PayrollLabels } from "@/shared/locale/types/dashboard/billing/payroll";

interface PayrollReportColumnArgs {
  readonly labels: PayrollLabels;
  readonly statusLabels: Record<CalculationStatus, string>;
  readonly locale: string;
  readonly canManagePayroll: boolean;
  readonly onOverride: (row: PayrollReportRow) => void;
}

export function buildPayrollReportColumns({
  labels,
  statusLabels,
  locale,
  canManagePayroll,
  onOverride,
}: PayrollReportColumnArgs): GridColDef<PayrollReportRow>[] {
  const columns: GridColDef<PayrollReportRow>[] = [
    {
      field: "scheduledStartAt",
      headerName: labels.column.scheduledStart,
      width: 150,
      valueFormatter: value => formatAccountingDate(dateCell(value), locale),
    },
    {
      field: "teacherName",
      headerName: labels.filters.teacher,
      flex: 1,
      minWidth: 150,
      valueFormatter: value => textCell(value),
    },
    {
      field: "studentName",
      headerName: labels.filters.student,
      flex: 1,
      minWidth: 150,
      valueFormatter: value => textCell(value),
    },
    {
      field: "subjectName",
      headerName: labels.column.subject,
      flex: 1,
      minWidth: 130,
      valueFormatter: value => textCell(value),
    },
    {
      field: "scheduledDurationMinutes",
      headerName: labels.column.scheduledDuration,
      width: 140,
      align: "right",
      headerAlign: "right",
      valueFormatter: value => (value == null ? "—" : String(numericCell(value))),
    },
    {
      field: "actualDuration",
      headerName: labels.column.actualDuration,
      width: 140,
      align: "right",
      headerAlign: "right",
      valueGetter: (_value, row) => actualDurationMinutes(row),
      valueFormatter: value => (value == null ? "—" : String(value)),
    },
    {
      field: "calculatedDuration",
      headerName: labels.column.calculatedDuration,
      width: 150,
      align: "right",
      headerAlign: "right",
      valueFormatter: value => (value == null ? "—" : String(numericCell(value))),
    },
    {
      field: "teacherPaidAmount",
      headerName: labels.column.paidAmount,
      width: 150,
      align: "right",
      headerAlign: "right",
      renderCell: renderPaidAmountCell,
    },
    {
      field: "calculationStatus",
      headerName: labels.column.status,
      width: 140,
      renderCell: params => renderCalculationStatusCell(params, statusLabels),
    },
    {
      field: "isPartialPercentage",
      headerName: labels.column.partialPercentage,
      width: 110,
      align: "right",
      headerAlign: "right",
      valueFormatter: value => (value == null ? "—" : `${numericCell(value)}%`),
    },
    {
      field: "payrollNote",
      headerName: labels.column.note,
      flex: 1,
      minWidth: 160,
      sortable: false,
      renderCell: ({ row }) => renderNoteCell(row.payrollNote),
    },
  ];
  if (canManagePayroll) {
    columns.push(buildOverrideActionColumn(labels, onOverride));
  }
  return columns;
}
