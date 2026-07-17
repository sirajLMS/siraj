"use client";

import { Box, CircularProgress } from "@mui/material";
import type {
  StudentDirectoryCardListLabels,
  StudentDirectoryRowExtended,
} from "@/frontend/common/views/dashboard/admin/parents/students/types";
import { MobilePaginationControls } from "@/frontend/mobile/components/ui";
import { StudentDirectoryCardBase } from "@/frontend/mobile/views/dashboard/admin/parents/students/components/studentDirectoryCardBase.mobile";

interface StudentDirectoryCardListProps {
  readonly rows: readonly StudentDirectoryRowExtended[];
  readonly labels: StudentDirectoryCardListLabels;
  readonly onViewProfile: (id: string) => void;
  readonly page?: number;
  readonly pageSize?: number;
  readonly totalCount?: number;
  readonly onPageChange?: (page: number) => void;
  readonly loading?: boolean;
}

export function StudentDirectoryCardList({
  rows,
  labels,
  onViewProfile,
  page = 0,
  pageSize = 10,
  totalCount,
  onPageChange,
  loading = false,
}: Readonly<StudentDirectoryCardListProps>) {
  const pageCount = totalCount !== undefined && pageSize > 0 ? Math.ceil(totalCount / pageSize) : 0;

  if (loading && rows.length === 0) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      {rows.map(row => (
        <StudentDirectoryCardBase key={row.id} row={row} labels={labels} onViewProfile={onViewProfile} />
      ))}
      {onPageChange && totalCount !== undefined ? (
        <MobilePaginationControls
          page={page}
          pageCount={pageCount}
          rowCount={totalCount}
          pageSize={pageSize}
          onPageChange={onPageChange}
        />
      ) : null}
    </Box>
  );
}
