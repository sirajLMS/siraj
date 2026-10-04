"use client";

import { Box, Stack } from "@mui/material";
import type { GridColDef } from "@mui/x-data-grid";
import { useMemo } from "react";
import {
  dateCell,
  formatAccountingDate,
  formatAccountingMoney,
} from "@/frontend/common/views/dashboard/accounting/accountingFormatters";
import {
  ExpenseSourceCell,
  ExpenseTypeCell,
} from "@/frontend/common/views/dashboard/accounting/profit-loss/ExpensesTab.cells";
import type { ProfitLossExpenseRow } from "@/frontend/common/views/dashboard/accounting/profit-loss/useProfitLossViewModel";
import type { ExpensesLabels } from "@/shared/locale/types/dashboard/accounting/expenses";
import type { ProfitLossLabels } from "@/shared/locale/types/dashboard/accounting/profit-loss";

interface ExpensesColumnArgs {
  readonly labels: ProfitLossLabels;
  readonly typeLabels: ExpensesLabels;
  readonly sourceLabels: ExpensesLabels["source"];
  readonly locale: string;
  readonly onOpenCarryover: (sourceEntityId: string) => void;
}

function buildExpensesColumns(args: ExpensesColumnArgs): GridColDef<ProfitLossExpenseRow>[] {
  const { labels, typeLabels, sourceLabels, locale, onOpenCarryover } = args;
  return [
    {
      field: "paymentDate",
      headerName: labels.column.paymentDate,
      width: 140,
      valueGetter: (_value, row) => formatAccountingDate(dateCell(row.paymentDate), locale),
    },
    {
      field: "type",
      headerName: labels.column.type,
      width: 140,
      sortable: false,
      renderCell: ({ row }) => <ExpenseTypeCell type={row.type} typeLabels={typeLabels} empty="—" />,
    },
    {
      field: "title",
      headerName: labels.column.title,
      flex: 1,
      minWidth: 180,
      valueGetter: (_value, row) => row.title ?? "—",
    },
    {
      field: "teacherName",
      headerName: labels.column.teacher,
      flex: 1,
      minWidth: 150,
      sortable: false,
      valueGetter: (_value, row) => row.teacherName ?? "—",
    },
    {
      field: "expenseValue",
      headerName: labels.column.value,
      width: 150,
      align: "right",
      headerAlign: "right",
      renderCell: ({ row }) => (
        <Stack direction="row" sx={{ alignItems: "baseline", gap: 0.5 }}>
          <Box component="span" sx={{ fontWeight: 600 }}>
            {formatAccountingMoney(row.expenseValue)}
          </Box>
          {row.expenseCurrency !== null ? (
            <Box component="span" sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
              {row.expenseCurrency}
            </Box>
          ) : null}
        </Stack>
      ),
    },
    {
      field: "sourceEntity",
      headerName: labels.column.source,
      width: 170,
      sortable: false,
      renderCell: ({ row }) => (
        <ExpenseSourceCell row={row} sourceLabels={sourceLabels} onOpenCarryover={onOpenCarryover} />
      ),
    },
    {
      field: "note",
      headerName: typeLabels.column.note,
      sortable: false,
      flex: 1,
      minWidth: 140,
      valueGetter: (_value, row) => row.note ?? "—",
    },
  ];
}

/** Memoized column set, rebuilt only when an input changes. */
export function useExpensesColumns(args: ExpensesColumnArgs): GridColDef<ProfitLossExpenseRow>[] {
  const { labels, typeLabels, sourceLabels, locale, onOpenCarryover } = args;
  return useMemo(
    () => buildExpensesColumns({ labels, typeLabels, sourceLabels, locale, onOpenCarryover }),
    [labels, typeLabels, sourceLabels, locale, onOpenCarryover]
  );
}
