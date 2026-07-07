"use client";

import { Box } from "@mui/material";
import { PaginationControls } from "@/frontend/components/ui/PaginationControls";
import type { SearchSchedulePageInfo } from "./SearchScheduleView";

interface SearchSchedulePaginationFooterProps {
  readonly pageInfo: SearchSchedulePageInfo;
  readonly teacherCount: number;
  readonly onPageChange: (page: number) => void;
}

export function SearchSchedulePaginationFooter({
  pageInfo,
  teacherCount,
  onPageChange,
}: Readonly<SearchSchedulePaginationFooterProps>) {
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
        mx: { xs: -2, md: 0 },
        px: { xs: 2, md: 0 },
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
