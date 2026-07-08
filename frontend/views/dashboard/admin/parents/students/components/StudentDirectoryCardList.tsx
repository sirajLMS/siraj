"use client";

import { Box, CircularProgress } from "@mui/material";
import { PaginationControls } from "@/frontend/components/ui";
import type { StudentDirectoryCardListLabels, StudentDirectoryRowExtended } from "../types";
import { StudentDirectoryCard } from "./StudentDirectoryCard";

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
}: StudentDirectoryCardListProps) {
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
        <StudentDirectoryCard key={row.id} row={row} labels={labels} onViewProfile={onViewProfile} />
      ))}
      {onPageChange && totalCount !== undefined ? (
        <PaginationControls
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
