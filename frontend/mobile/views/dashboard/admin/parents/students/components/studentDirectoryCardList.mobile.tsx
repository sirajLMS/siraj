"use client";

import { Box, CircularProgress } from "@mui/material";
import type { ListPaginationOptions } from "@/frontend/common/components/ui/filter/listPaginationOptions";
import type {
  StudentDirectoryCardListLabels,
  StudentDirectoryRowExtended,
} from "@/frontend/common/views/dashboard/admin/parents/students/types";
import { MobileListPagination } from "@/frontend/mobile/components/ui";
import { StudentDirectoryCardBase } from "@/frontend/mobile/views/dashboard/admin/parents/students/components/studentDirectoryCardBase.mobile";

interface StudentDirectoryCardListProps {
  readonly rows: readonly StudentDirectoryRowExtended[];
  readonly labels: StudentDirectoryCardListLabels;
  readonly onViewProfile: (id: string) => void;
  readonly paginationOptions: ListPaginationOptions;
  readonly loading?: boolean;
}

export function StudentDirectoryCardList({
  rows,
  labels,
  onViewProfile,
  paginationOptions,
  loading = false,
}: Readonly<StudentDirectoryCardListProps>) {
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
      <MobileListPagination paginationOptions={paginationOptions} />
    </Box>
  );
}
