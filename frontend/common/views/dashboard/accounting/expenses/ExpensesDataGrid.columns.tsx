"use client";

import type { GridColDef } from "@mui/x-data-grid";
import { useMemo } from "react";
import { StatusBadge } from "@/frontend/common/components/ui";
import {
  dateCell,
  formatAccountingDate,
  formatAccountingMonth,
} from "@/frontend/common/views/dashboard/accounting/accountingFormatters";
import {
  ExpenseMoneyCell,
  ExpenseNoteCell,
  ExpenseSourceBadgeCell,
  ExpenseTeacherCell,
  ExpenseTitleCell,
  ExpenseValueCell,
} from "@/frontend/common/views/dashboard/accounting/expenses/ExpensesDataGrid.cells";
import {
  type ExpensesDialogCallbacks,
  expenseTypeLabel,
} from "@/frontend/common/views/dashboard/accounting/expenses/ExpensesDataGrid.helpers";
import { ExpenseRowActionsMenu } from "@/frontend/common/views/dashboard/accounting/expenses/ExpensesDataGrid.rowActions";
import type { ExpenseRow } from "@/frontend/common/views/dashboard/accounting/expenses/useExpensesViewModel";
import type { ExpensesLabels } from "@/shared/locale/types/dashboard/accounting/expenses";

interface ExpensesColumnArgs extends ExpensesDialogCallbacks {
  readonly labels: ExpensesLabels;
  readonly locale: string;
  readonly canManageExpenses: boolean;
}

function buildExpensesColumns(args: ExpensesColumnArgs): GridColDef<ExpenseRow>[] {
  const { labels, locale, canManageExpenses } = args;
  return [
    {
      field: "title",
      headerName: labels.column.title,
      flex: 1,
      minWidth: 180,
      renderCell: ({ row }) => <ExpenseTitleCell row={row} labels={labels} />,
    },
    {
      field: "type",
      headerName: labels.column.type,
      width: 130,
      renderCell: ({ row }) =>
        row.type === null ? (
          <ExpenseValueCell text="—" empty />
        ) : (
          <StatusBadge category="expenseType" status={row.type} label={expenseTypeLabel(labels, row.type)} />
        ),
    },
    {
      field: "teacherName",
      headerName: labels.column.teacher,
      flex: 1,
      minWidth: 150,
      sortable: false,
      renderCell: ({ row }) => <ExpenseTeacherCell row={row} />,
    },
    {
      field: "expenseValue",
      headerName: labels.column.value,
      width: 140,
      align: "right",
      headerAlign: "right",
      renderCell: ({ row }) => <ExpenseMoneyCell amount={row.expenseValue} currency={row.expenseCurrency} />,
    },
    {
      field: "paymentDate",
      headerName: labels.column.paymentDate,
      width: 130,
      renderCell: ({ value }) => (
        <ExpenseValueCell empty={dateCell(value) === null} text={formatAccountingDate(dateCell(value), locale)} />
      ),
    },
    {
      field: "expenseDate",
      headerName: labels.column.expenseDate,
      width: 110,
      renderCell: ({ value }) => (
        <ExpenseValueCell empty={dateCell(value) === null} text={formatAccountingMonth(dateCell(value), locale)} />
      ),
    },
    {
      field: "sourceEntity",
      headerName: labels.column.source,
      width: 150,
      sortable: false,
      renderCell: ({ row }) => (
        <ExpenseSourceBadgeCell sourceEntity={row.sourceEntity} sourceEntityId={row.sourceEntityId} labels={labels} />
      ),
    },
    {
      field: "note",
      headerName: labels.column.note,
      flex: 1,
      minWidth: 140,
      sortable: false,
      renderCell: ({ row }) => <ExpenseNoteCell value={row.note} />,
    },
    {
      field: "createdAt",
      headerName: labels.column.createdAt,
      width: 110,
      renderCell: ({ value }) => (
        <ExpenseValueCell empty={dateCell(value) === null} text={formatAccountingDate(dateCell(value), locale)} />
      ),
    },
    {
      field: "actions",
      headerName: labels.column.actions,
      width: 80,
      sortable: false,
      align: "center",
      headerAlign: "center",
      renderCell: ({ row }) => (
        <ExpenseRowActionsMenu
          row={row}
          labels={labels}
          canManageExpenses={canManageExpenses}
          onOpenForm={args.onOpenForm}
          onOpenDelete={args.onOpenDelete}
          onViewSource={args.onViewSource}
        />
      ),
    },
  ];
}

/** Memoized column set for the expenses grid, rebuilt only when an input changes. */
export function useExpensesColumns(args: ExpensesColumnArgs): GridColDef<ExpenseRow>[] {
  const { labels, locale, canManageExpenses, onOpenForm, onOpenDelete, onViewSource } = args;
  return useMemo<GridColDef<ExpenseRow>[]>(
    () => buildExpensesColumns({ labels, locale, canManageExpenses, onOpenForm, onOpenDelete, onViewSource }),
    [labels, locale, canManageExpenses, onOpenForm, onOpenDelete, onViewSource]
  );
}
