"use client";

import { Box } from "@mui/material";
import type { GridColDef } from "@mui/x-data-grid";
import { useMemo } from "react";
import { buildServerPaginationOptions } from "@/frontend/common/components/ui/filter/listPaginationOptions";
import type { CreditReason } from "@/frontend/common/graphql/generated/gql/graphql";
import type { StudentCreditTransactionRow } from "@/frontend/common/views/dashboard/student/credits/types/studentCreditsTypes";
import type { StudentCreditsViewModel } from "@/frontend/common/views/dashboard/student/credits/useStudentCreditsViewModel";
import { DesktopAppDataGrid } from "@/frontend/desktop/components/ui";
import { buildStudentCreditColumns } from "@/frontend/desktop/views/dashboard/student/credits/components/studentCreditsDataGrid.columns";
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
    () => buildStudentCreditColumns({ labels, locale, reasonLabel }),
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
