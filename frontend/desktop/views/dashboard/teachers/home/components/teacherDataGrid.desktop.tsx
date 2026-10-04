"use client";

import { buildServerPaginationOptions } from "@/frontend/common/components/ui/filter/listPaginationOptions";
import type { TeacherDirectoryQuery_teacherDirectory_rows as TeacherDirectoryRow } from "@/frontend/common/graphql/generated/gql/graphql";
import { DesktopAppDataGrid } from "@/frontend/desktop/components/ui";
import { buildTeacherDirectoryColumns } from "@/frontend/desktop/views/dashboard/teachers/home/components/teacherDataGrid.columns";
import type { TeachersDirectoryLabels } from "@/shared/locale/types/dashboard/teachers/directory";

interface TeacherDataGridProps {
  readonly rows: readonly TeacherDirectoryRow[];
  readonly labels: TeachersDirectoryLabels;
  readonly loading?: boolean;
  readonly page?: number;
  readonly pageSize?: number;
  readonly totalCount?: number;
  readonly onPageChange?: (page: number) => void;
}

export function TeacherDataGrid({
  rows,
  labels,
  loading,
  page = 0,
  pageSize = 10,
  totalCount,
  onPageChange,
}: Readonly<TeacherDataGridProps>) {
  const columns = buildTeacherDirectoryColumns({ labels, page, pageSize });

  const isServerPagination = totalCount !== undefined && onPageChange !== undefined;

  return (
    <DesktopAppDataGrid<TeacherDirectoryRow>
      rows={rows}
      columns={columns}
      rowHeight={72}
      loading={loading}
      emptyMessage={labels.emptyMessage}
      disableRowSelectionOnClick
      getRowId={row => row.id ?? ""}
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
    />
  );
}
