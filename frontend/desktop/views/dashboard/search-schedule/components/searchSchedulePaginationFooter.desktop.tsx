"use client";

import { Box } from "@mui/material";
import { PaginationControls } from "@/frontend/common/components/ui/filter/PaginationControls";
import type { SearchSchedulePageInfo } from "@/frontend/common/views/dashboard/search-schedule/useSearchScheduleViewModel";

interface SearchSchedulePaginationFooterDesktopProps {
  readonly pageInfo: SearchSchedulePageInfo;
  readonly teacherCount: number;
  readonly onPageChange: (page: number) => void;
}

export function SearchSchedulePaginationFooterDesktop({
  pageInfo,
  teacherCount,
  onPageChange,
}: Readonly<SearchSchedulePaginationFooterDesktopProps>) {
  const total = pageInfo.total ?? 0;
  if (total <= 0) {
    return null;
  }

  return (
    <Box
      component="footer"
      sx={theme => ({
        position: "sticky",
        bottom: 0,
        marginTop: "auto",
        flexShrink: 0,
        borderTop: `1px solid ${theme.palette.border.light}`,
        backgroundColor: theme.palette.background.default,
        boxShadow: theme.palette.shadow.card,
      })}
    >
      <PaginationControls
        page={(pageInfo.currentPage ?? 1) - 1}
        pageCount={pageInfo.lastPage ?? 1}
        rowCount={total}
        pageSize={pageInfo.perPage ?? teacherCount}
        onPageChange={onPageChange}
      />
    </Box>
  );
}
