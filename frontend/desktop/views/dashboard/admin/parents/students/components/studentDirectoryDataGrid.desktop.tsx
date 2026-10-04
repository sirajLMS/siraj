"use client";

import type { GridRowParams } from "@mui/x-data-grid";
import { useMemo } from "react";
import { buildServerPaginationOptions } from "@/frontend/common/components/ui/filter/listPaginationOptions";
import type {
  StudentDirectoryDataGridLabels,
  StudentDirectoryRowExtended,
} from "@/frontend/common/views/dashboard/admin/parents/students/types";
import { DesktopAppDataGrid } from "@/frontend/desktop/components/ui";
import { buildStudentDirectoryColumns } from "@/frontend/desktop/views/dashboard/admin/parents/students/components/studentDirectoryDataGrid.columns";

interface StudentDirectoryDataGridProps {
  readonly rows: readonly StudentDirectoryRowExtended[];
  readonly labels: StudentDirectoryDataGridLabels;
  readonly page?: number;
  readonly pageSize?: number;
  readonly totalCount?: number;
  readonly onPageChange?: (page: number) => void;
  readonly onViewProfile: (id: string) => void;
  readonly onViewHistory: (id: string) => void;
  readonly loading?: boolean;
}

export function StudentDirectoryDataGrid({
  rows,
  labels,
  page = 0,
  pageSize = 10,
  totalCount,
  onPageChange,
  onViewProfile,
  onViewHistory,
  loading = false,
}: Readonly<StudentDirectoryDataGridProps>) {
  const columns = useMemo(
    () => buildStudentDirectoryColumns({ labels, onViewProfile, onViewHistory }),
    [labels, onViewHistory, onViewProfile]
  );

  const isServerPagination = totalCount !== undefined && onPageChange !== undefined;

  return (
    <DesktopAppDataGrid<StudentDirectoryRowExtended>
      rows={rows}
      columns={columns}
      getRowId={row => row.id ?? ""}
      loading={loading}
      autoHeight
      ariaLabel="student-directory-table"
      emptyMessage={labels.noEntries}
      paginationOptions={
        isServerPagination
          ? buildServerPaginationOptions({
              page,
              pageSize,
              totalCount,
              onPageChange,
              pageSizeOptions: [pageSize],
            })
          : { mode: "client" }
      }
      onRowClick={(params: GridRowParams<StudentDirectoryRowExtended>) => {
        onViewProfile(params.row.id ?? "");
      }}
      getRowClassName={({ row }) => (row.isDeactivated ? "student-row-deactivated" : "")}
      sx={{
        "& .student-row-deactivated": { opacity: 0.8 },
        "& .MuiDataGrid-row": { cursor: "pointer" },
      }}
    />
  );
}
