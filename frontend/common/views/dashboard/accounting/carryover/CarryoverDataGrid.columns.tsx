"use client";

import type { GridColDef } from "@mui/x-data-grid";
import {
  dateCell,
  formatAccountingDate,
  numericCell,
  textCell,
} from "@/frontend/common/views/dashboard/accounting/accountingFormatters";
import {
  CarryoverMoneyCell,
  CarryoverPaidCell,
  CarryoverPeriodCell,
  CarryoverStudentsTextCell,
  CarryoverTeacherCell,
  CarryoverValueCell,
} from "@/frontend/common/views/dashboard/accounting/carryover/CarryoverDataGrid.cells";
import { CarryoverRowActionsMenu } from "@/frontend/common/views/dashboard/accounting/carryover/CarryoverDataGrid.rowActions";
import type { CarryoverColumnArgs } from "@/frontend/common/views/dashboard/accounting/carryover/CarryoverDataGrid.types";
import type { CarryoverRow } from "@/frontend/common/views/dashboard/accounting/carryover/useCarryoverViewModel";

/** Builds the carryover grid column definitions from labels, locale, and callbacks. */
export function buildCarryoverColumns(args: CarryoverColumnArgs): GridColDef<CarryoverRow>[] {
  const { labels, locale, canManageCarryover } = args;
  const columns: GridColDef<CarryoverRow>[] = [
    {
      field: "teacherName",
      headerName: labels.column.teacher,
      flex: 1,
      minWidth: 180,
      renderCell: ({ row }) => <CarryoverTeacherCell row={row} disabledTeacherLabel={labels.chip.disabledTeacher} />,
    },
    {
      field: "studentsCount",
      headerName: labels.column.studentsCount,
      width: 100,
      align: "right",
      headerAlign: "right",
      renderCell: ({ value }) => (
        <CarryoverValueCell empty={value === null || value === undefined} text={String(numericCell(value))} />
      ),
    },
    {
      field: "studentsText",
      headerName: labels.column.studentsText,
      flex: 1,
      minWidth: 150,
      sortable: false,
      renderCell: ({ row }) => <CarryoverStudentsTextCell value={row.studentsText} />,
    },
    {
      field: "totalDuration",
      headerName: labels.column.totalDuration,
      width: 110,
      align: "right",
      headerAlign: "right",
      renderCell: ({ value }) => (
        <CarryoverValueCell empty={value === null || value === undefined} text={textCell(value)} />
      ),
    },
    {
      field: "payable",
      headerName: labels.column.payable,
      width: 140,
      align: "right",
      headerAlign: "right",
      renderCell: ({ row }) => <CarryoverMoneyCell amount={row.payable} currency={row.teacherCurrency} />,
    },
    {
      field: "paid",
      headerName: labels.column.paid,
      width: 140,
      renderCell: ({ row }) => (
        <CarryoverPaidCell row={row} paidLabel={labels.chip.paid} unpaidLabel={labels.chip.unpaid} />
      ),
    },
    {
      field: "paymentDate",
      headerName: labels.column.paymentDate,
      width: 120,
      renderCell: ({ value }) => (
        <CarryoverValueCell empty={dateCell(value) === null} text={formatAccountingDate(dateCell(value), locale)} />
      ),
    },
    {
      field: "fromDate",
      headerName: `${labels.column.fromDate} – ${labels.column.toDate}`,
      width: 130,
      sortable: false,
      renderCell: ({ row }) => <CarryoverPeriodCell row={row} locale={locale} />,
    },
    {
      field: "createdAt",
      headerName: args.createdAtColumnLabel,
      width: 110,
      renderCell: ({ value }) => (
        <CarryoverValueCell empty={dateCell(value) === null} text={formatAccountingDate(dateCell(value), locale)} />
      ),
    },
  ];
  columns.push({
    field: "actions",
    headerName: args.actionsColumnLabel,
    width: 80,
    sortable: false,
    align: "center",
    headerAlign: "center",
    renderCell: ({ row }) => (
      <CarryoverRowActionsMenu
        row={row}
        labels={labels}
        actionsColumnLabel={args.actionsColumnLabel}
        canManageCarryover={canManageCarryover}
        onOpenForm={args.onOpenForm}
        onOpenDelete={args.onOpenDelete}
        onOpenUnpay={args.onOpenUnpay}
        onOpenDrawer={args.onOpenDrawer}
      />
    ),
  });
  return columns;
}
