"use client";

import { Box, Typography } from "@mui/material";
import type { GridColDef } from "@mui/x-data-grid";
import { useMemo } from "react";
import { formatDate } from "@/frontend/common/components/intl/dateFormat";
import { buildServerPaginationOptions } from "@/frontend/common/components/ui/filter/listPaginationOptions";
import type { CreditReason } from "@/frontend/common/graphql/generated/gql/graphql";
import type { StudentCreditTransactionRow } from "@/frontend/common/views/dashboard/student/credits/types/studentCreditsTypes";
import type { StudentCreditsViewModel } from "@/frontend/common/views/dashboard/student/credits/useStudentCreditsViewModel";
import { DesktopAppDataGrid } from "@/frontend/desktop/components/ui";
import type { AppLocale } from "@/shared/locale";

interface StudentCreditsDataGridProps {
  readonly rows: readonly StudentCreditTransactionRow[];
  readonly totalCount: number;
  readonly page: number;
  readonly pageSize: number;
  readonly locale: AppLocale;
  readonly labels: StudentCreditsViewModel["labels"];
  readonly loading: boolean;
  readonly reasonLabel: (reason: CreditReason | null) => string;
  readonly onPageChange: (page: number) => void;
  readonly onPageSizeChange: (pageSize: number) => void;
}

export function StudentCreditsDataGrid({
  rows,
  totalCount,
  page,
  pageSize,
  locale,
  labels,
  loading,
  reasonLabel,
  onPageChange,
  onPageSizeChange,
}: Readonly<StudentCreditsDataGridProps>) {
  const columns = useMemo<GridColDef<StudentCreditTransactionRow>[]>(
    () => [
      {
        field: "createdAt",
        headerName: labels.dateColumn,
        flex: 1,
        minWidth: 140,
        renderCell: ({ row }) => (
          <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.onSurface })}>
            {row.createdAt ? formatDate(row.createdAt, locale) : "—"}
          </Typography>
        ),
      },
      {
        field: "reason",
        headerName: labels.typeColumn,
        flex: 1,
        minWidth: 120,
        renderCell: ({ row }) => (
          <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
            {reasonLabel(row.reason)}
          </Typography>
        ),
      },
      {
        field: "changeAmount",
        headerName: labels.amountColumn,
        width: 120,
        align: "right",
        headerAlign: "right",
        renderCell: ({ row }) => {
          const positive = row.changeAmount >= 0;
          const sign = positive ? "+" : "";
          return (
            <Typography
              variant="bodyMd"
              sx={theme => ({
                fontWeight: 700,
                color: positive ? theme.palette.success.main : theme.palette.error.main,
              })}
            >
              {sign}
              {row.changeAmount}
            </Typography>
          );
        },
      },
      {
        field: "notes",
        headerName: labels.notesColumn,
        flex: 1.2,
        minWidth: 160,
        renderCell: ({ row }) => (
          <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
            {row.notes ?? "—"}
          </Typography>
        ),
      },
    ],
    [labels, locale, reasonLabel]
  );

  return (
    <Box sx={{ width: "100%" }}>
      <DesktopAppDataGrid
        rows={[...rows]}
        columns={columns}
        getRowId={row => row.id}
        loading={loading}
        emptyMessage={labels.noTransactions}
        autoHeight
        paginationOptions={buildServerPaginationOptions({
          page,
          pageSize,
          totalCount,
          onPageChange,
          onPageSizeChange,
          pageSizeOptions: [10, 25, 50],
        })}
        ariaLabel={labels.transactionHistory}
      />
    </Box>
  );
}
